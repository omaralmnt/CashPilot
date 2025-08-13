import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransferScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [transferFee, setTransferFee] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userAccounts, setUserAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  // Cargar datos del usuario y sus cuentas al montar el componente
  useEffect(() => {
    loadUserData();
  }, []);

  const decodeToken = (token) => {
    try {
      // El token JWT tiene 3 partes separadas por puntos: header.payload.signature
      const payload = token.split('.')[1];
      
      // Decodificar base64url a string
      // Primero convertir base64url a base64 estándar
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // Agregar padding si es necesario
      while (base64.length % 4) {
        base64 += '=';
      }
      
      // Decodificar usando atob nativo de JavaScript
      const decodedPayload = atob(base64);
      
      // Parsear el JSON
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const decodedToken = decodeToken(token);
        if (decodedToken && decodedToken.id_usuario) {
          setCurrentUser(decodedToken);
          // Cargar cuentas del usuario después de obtener el ID
          loadUserAccounts(decodedToken.id_usuario);
        } else {
          throw new Error('Token inválido');
        }
      } else {
        throw new Error('No hay token de autenticación');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
  };

  const loadUserAccounts = async (userId) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      console.log('Cargando cuentas para usuario:', userId);
      console.log('API URL:', `${API_BASE_URL}/api/cuenta/cuentas/usuario/${userId}`);

      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/usuario/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Accounts response status:', response.status);

      // Obtener el texto de la respuesta primero
      const responseText = await response.text();
      console.log('Accounts response text:', responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed accounts data:', data);
          
          // El backend devuelve { cuentas: [...], mensaje: "..." }
          // Extraemos solo el array de cuentas
          const accounts = data.cuentas || [];
          console.log('Setting accounts:', accounts);
          setUserAccounts(accounts);
        } catch (parseError) {
          console.error('JSON Parse Error for accounts:', parseError);
          throw new Error('Respuesta del servidor inválida al cargar cuentas');
        }
      } else {
        throw new Error(`Error al cargar las cuentas: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'No se pudieron cargar las cuentas disponibles: ' + error.message);
      // Usar datos de ejemplo en caso de error
      setUserAccounts(getSampleWallets());
    } finally {
      setIsLoading(false);
    }
  };

  // Datos de ejemplo como fallback
  const getSampleWallets = () => [
    {
      id_cuenta: 1,
      nombre_banco: 'BBVA Bancomer',
      descripcion: 'Cuenta Principal',
      tipo_cuenta: 'Cuenta de Débito',
      saldo: '15750.50',
      numero: '****1234',
      codigo_hex: '#004481',
      color: 'Azul',
      positivo: true,
    },
    {
      id_cuenta: 2,
      nombre_banco: 'Banamex',
      descripcion: 'Tarjeta Platino',
      tipo_cuenta: 'Tarjeta de Crédito',
      saldo: '50000.00',
      numero: '****5678',
      codigo_hex: '#E31837',
      color: 'Rojo',
      positivo: true,
    },
  ];

  const formatAmount = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const handleAmountChange = (text) => {
    const formatted = formatAmount(text);
    setAmount(formatted);
  };

  const handleFeeChange = (text) => {
    const formatted = formatAmount(text);
    setTransferFee(formatted);
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getWalletIcon = (tipoParam) => {
    // Mapear los tipos de cuenta a iconos
    const tipo = tipoParam?.toLowerCase() || '';
    
    if (tipo.includes('corriente') || tipo.includes('débito') || tipo.includes('efectivo')) {
      return 'business';
    } else if (tipo.includes('crédito')) {
      return 'card';
    } else if (tipo.includes('ahorros')) {
      return 'wallet';
    } else if (tipo.includes('digital')) {
      return 'phone-portrait';
    } else if (tipo.includes('inversión')) {
      return 'trending-up';
    }
    
    return 'wallet'; // icono por defecto
  };

  const getAvailableBalance = (wallet) => {
    const saldo = parseFloat(wallet.saldo) || 0;
    
    if (wallet.tipo_cuenta?.toLowerCase().includes('crédito')) {
      // Para tarjetas de crédito, mostrar el saldo disponible
      // Si el saldo es el límite disponible, mostrarlo directamente
      return saldo;
    }
    return saldo;
  };

  const validateTransfer = () => {
    if (!fromAccount) {
      Alert.alert('Error', 'Por favor selecciona la cuenta de origen');
      return false;
    }

    if (!toAccount) {
      Alert.alert('Error', 'Por favor selecciona la cuenta de destino');
      return false;
    }

    if (fromAccount === toAccount) {
      Alert.alert('Error', 'Las cuentas de origen y destino deben ser diferentes');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return false;
    }

    const fromWallet = userAccounts.find(w => w.id_cuenta === fromAccount);
    const transferAmount = parseFloat(amount);
    const feeAmount = parseFloat(transferFee) || 0;
    const totalAmount = transferAmount + feeAmount;
    const availableBalance = getAvailableBalance(fromWallet);

    if (totalAmount > availableBalance) {
      Alert.alert(
        'Fondos insuficientes', 
        `El monto a transferir (${formatCurrency(totalAmount)}) supera el saldo disponible (${formatCurrency(availableBalance)})`
      );
      return false;
    }

    return true;
  };

  const processTransfer = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!currentUser || !currentUser.id_usuario) {
        throw new Error('Usuario no autenticado');
      }

      const transferData = {
        datosTransferencia: {
          monto: parseFloat(amount),
          concepto: description.trim() || null,
          id_cuenta_origen: fromAccount,
          id_cuenta_destino: toAccount,
          id_usuario: currentUser.id_usuario,
          comision: parseFloat(transferFee) || 0
        }
      };

      console.log('Enviando transferencia:', transferData);

      const response = await fetch(`${API_BASE_URL}/api/transferencia`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Obtener el texto de la respuesta primero
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let result;
      try {
        // Intentar parsear como JSON
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response was:', responseText);
        throw new Error(`El servidor devolvió una respuesta inválida. Status: ${response.status}`);
      }

      if (response.ok) {
        // Transferencia exitosa
        const fromWallet = userAccounts.find(w => w.id_cuenta === fromAccount);
        const toWallet = userAccounts.find(w => w.id_cuenta === toAccount);
        
        Alert.alert(
          'Transferencia Exitosa',
          `Se han transferido ${formatCurrency(parseFloat(amount))} de ${fromWallet.nombre_banco} a ${toWallet.nombre_banco}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Limpiar formulario
                setAmount('');
                setDescription('');
                setFromAccount('');
                setToAccount('');
                setTransferFee('');
                // Recargar cuentas para actualizar saldos
                loadUserAccounts(currentUser.id_usuario);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        // Error en la transferencia
        console.error('Error response:', result);
        throw new Error(result.error || `Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert(
        'Error en la Transferencia',
        error.message || 'No se pudo completar la transferencia. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = () => {
    if (!validateTransfer()) return;

    const fromWallet = userAccounts.find(w => w.id_cuenta === fromAccount);
    const toWallet = userAccounts.find(w => w.id_cuenta === toAccount);
    const transferAmount = parseFloat(amount);
    const feeAmount = parseFloat(transferFee) || 0;
    const totalAmount = transferAmount + feeAmount;

    Alert.alert(
      'Confirmar Transferencia',
      `¿Confirmas la transferencia de ${formatCurrency(transferAmount)} de ${fromWallet.nombre_banco} a ${toWallet.nombre_banco}?${feeAmount > 0 ? `\n\nComisión: ${formatCurrency(feeAmount)}\nTotal: ${formatCurrency(totalAmount)}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          style: 'default',
          onPress: processTransfer
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Transferencia</Text>
      
      <TouchableOpacity 
        style={styles.helpButton}
        onPress={() => Alert.alert('Ayuda', 'Transfiere dinero entre tus cuentas de forma rápida y segura')}
      >
        <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderAccountSelector = (title, selectedAccount, onPress, accounts = userAccounts) => {
    const selectedWallet = accounts.find(w => w.id_cuenta === selectedAccount);
    
    return (
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>{title} *</Text>
        <TouchableOpacity style={styles.accountSelector} onPress={onPress}>
          {selectedWallet ? (
            <View style={styles.selectedAccountContainer}>
              <View style={[styles.accountIcon, { backgroundColor: (selectedWallet.codigo_hex || '#666666') + '20' }]}>
                <Ionicons
                  name={getWalletIcon(selectedWallet.tipo_cuenta)}
                  size={24}
                  color={selectedWallet.codigo_hex || '#666666'}
                />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{selectedWallet.nombre_banco}</Text>
                <Text style={styles.accountType}>{selectedWallet.tipo_cuenta}</Text>
                <Text style={styles.accountBalance}>
                  Disponible: {formatCurrency(getAvailableBalance(selectedWallet))}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="wallet-outline" size={24} color={colors.textLight} />
              <Text style={styles.selectorPlaceholder}>Seleccionar cuenta</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTransferFlow = () => (
    <View style={styles.transferFlowContainer}>
      <View style={styles.flowStep}>
        <View style={[styles.flowIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="remove-circle" size={20} color="white" />
        </View>
        <Text style={styles.flowLabel}>De</Text>
      </View>
      
      <View style={styles.flowArrow}>
        <Ionicons name="arrow-forward" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.flowStep}>
        <View style={[styles.flowIcon, { backgroundColor: colors.success }]}>
          <Ionicons name="add-circle" size={20} color="white" />
        </View>
        <Text style={styles.flowLabel}>Para</Text>
      </View>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Monto a Transferir *</Text>
      <View style={styles.amountInputContainer}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={handleAmountChange}
          placeholder="0.00"
          placeholderTextColor={colors.textLight}
          keyboardType="decimal-pad"
          maxLength={10}
          editable={!isLoading}
        />
      </View>
      {amount && (
        <Text style={styles.amountPreview}>
          Transferir: {formatCurrency(parseFloat(amount))}
        </Text>
      )}
    </View>
  );

  const renderTransferSummary = () => {
    if (!amount || !fromAccount || !toAccount) return null;

    const transferAmount = parseFloat(amount);
    const feeAmount = parseFloat(transferFee) || 0;
    const totalAmount = transferAmount + feeAmount;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de Transferencia</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monto a transferir</Text>
          <Text style={styles.summaryValue}>{formatCurrency(transferAmount)}</Text>
        </View>
        
        {feeAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comisión</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(feeAmount)}
            </Text>
          </View>
        )}
        
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.summaryTotalLabel}>Total a debitar</Text>
          <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>
    );
  };

  const renderAccountModal = (visible, onClose, selectedId, onSelect, title) => {
    let availableAccounts = userAccounts;
    if (title === 'Cuenta de Destino') {
      availableAccounts = userAccounts.filter(w => w.id_cuenta !== fromAccount);
    } else if (title === 'Cuenta de Origen') {
      availableAccounts = userAccounts.filter(w => w.saldo > 0 || w.tipo === 'credit');
    }

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.accountsList}>
              {availableAccounts.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id_cuenta}
                  style={[
                    styles.accountOption,
                    selectedId === wallet.id_cuenta && styles.accountOptionSelected
                  ]}
                  onPress={() => {
                    onSelect(wallet.id_cuenta);
                    onClose();
                  }}
                >
                  <View style={[styles.accountIcon, { backgroundColor: (wallet.codigo_hex || '#666666') + '20' }]}>
                    <Ionicons
                      name={getWalletIcon(wallet.tipo_cuenta)}
                      size={24}
                      color={wallet.codigo_hex || '#666666'}
                    />
                  </View>
                  <View style={styles.accountOptionDetails}>
                    <Text style={styles.accountOptionName}>{wallet.nombre_banco}</Text>
                    <Text style={styles.accountOptionType}>{wallet.tipo_cuenta}</Text>
                    <Text style={styles.accountOptionBalance}>
                      Disponible: {formatCurrency(getAvailableBalance(wallet))}
                    </Text>
                    {wallet.numero && (
                      <Text style={styles.accountOptionNumber}>****{wallet.numero.slice(-4)}</Text>
                    )}
                  </View>
                  {selectedId === wallet.id_cuenta && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const getFilteredToAccounts = () => {
    return userAccounts.filter(w => w.id_cuenta !== fromAccount);
  };

  if (isLoading && userAccounts.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando cuentas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.background} 
      />
      
      {renderHeader()}
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderTransferFlow()}
          
          {renderAccountSelector(
            'Cuenta de Origen',
            fromAccount,
            () => setShowFromModal(true)
          )}
          
          {renderAccountSelector(
            'Cuenta de Destino',
            toAccount,
            () => setShowToModal(true),
            getFilteredToAccounts()
          )}
          
          {renderAmountInput()}
          
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Comisión (Opcional)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={transferFee}
                onChangeText={handleFeeChange}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                keyboardType="decimal-pad"
                maxLength={10}
                editable={!isLoading}
              />
            </View>
            {transferFee && (
              <Text style={styles.feePreview}>
                Comisión: {formatCurrency(parseFloat(transferFee))}
              </Text>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Concepto (Opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción de la transferencia..."
              placeholderTextColor={colors.textLight}
              maxLength={100}
              multiline
              numberOfLines={2}
              editable={!isLoading}
            />
          </View>
          
          {renderTransferSummary()}
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.transferButton,
              ((!amount || !fromAccount || !toAccount) || isLoading) && styles.transferButtonDisabled
            ]}
            onPress={handleTransfer}
            disabled={!amount || !fromAccount || !toAccount || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="swap-horizontal" size={24} color="white" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.transferButtonText}>
              {isLoading ? 'Procesando...' : 'Transferir'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {renderAccountModal(
        showFromModal,
        () => setShowFromModal(false),
        fromAccount,
        setFromAccount,
        'Cuenta de Origen'
      )}
      
      {renderAccountModal(
        showToModal,
        () => setShowToModal(false),
        toAccount,
        setToAccount,
        'Cuenta de Destino'
      )}
    </View>
  );
};

const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  helpButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  transferFlowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  flowStep: {
    alignItems: 'center',
  },
  flowIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  flowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  flowArrow: {
    marginHorizontal: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    backgroundColor: colors.surface,
  },
  selectedAccountContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.textLight,
    marginLeft: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    color: colors.text,
    paddingVertical: 15,
    fontWeight: '600',
  },
  amountPreview: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  feePreview: {
    fontSize: 14,
    color: colors.warning || colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
    paddingTop: 15,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  transferButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  transferButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  transferButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  accountsList: {
    maxHeight: 400,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  accountOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  accountOptionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  accountOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  accountOptionType: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accountOptionBalance: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 2,
  },
  accountOptionNumber: {
    fontSize: 11,
    color: colors.textLight,
  },
});

export default TransferScreen;