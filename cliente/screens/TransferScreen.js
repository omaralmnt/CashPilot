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
  
  // Estados principales
  const [transactionType, setTransactionType] = useState('transfer'); // 'transfer', 'payment', 'receive'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [recipientInfo, setRecipientInfo] = useState({
    name: '',
    accountNumber: '',
    bank: '',
    email: '',
    phone: ''
  });
  
  // Estados de modales y UI
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [transactionFee, setTransactionFee] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de datos
  const [userAccounts, setUserAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  // Tipos de transacción
  const transactionTypes = [
    {
      id: 'transfer',
      title: 'Transferencia Interna',
      subtitle: 'Entre mis cuentas',
      icon: 'swap-horizontal',
      color: colors.primary
    },
    {
      id: 'payment',
      title: 'Pago a Tercero',
      subtitle: 'A otra persona',
      icon: 'arrow-up-circle',
      color: colors.warning || '#FF9500'
    },
    {
      id: 'receive',
      title: 'Recibir Dinero',
      subtitle: 'De otra persona',
      icon: 'arrow-down-circle',
      color: colors.success
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const decodedPayload = atob(base64);
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

      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/usuario/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Accounts response status:', response.status);
      const responseText = await response.text();
      console.log('Accounts response text:', responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed accounts data:', data);
          
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
      setUserAccounts(getSampleAccounts());
    } finally {
      setIsLoading(false);
    }
  };

  const getSampleAccounts = () => [
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
    setTransactionFee(formatted);
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getWalletIcon = (tipoParam) => {
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
    
    return 'wallet';
  };

  const getAvailableBalance = (wallet) => {
    const saldo = parseFloat(wallet.saldo) || 0;
    
    if (wallet.tipo_cuenta?.toLowerCase().includes('crédito')) {
      return saldo;
    }
    return saldo;
  };

  const validateTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return false;
    }

    if (transactionType === 'transfer') {
      if (!fromAccount || !toAccount) {
        Alert.alert('Error', 'Por favor selecciona las cuentas de origen y destino');
        return false;
      }
      
      if (fromAccount === toAccount) {
        Alert.alert('Error', 'Las cuentas de origen y destino deben ser diferentes');
        return false;
      }
    } else if (transactionType === 'payment') {
      if (!fromAccount) {
        Alert.alert('Error', 'Por favor selecciona la cuenta de origen');
        return false;
      }
      
      if (!recipientInfo.name || !recipientInfo.accountNumber) {
        Alert.alert('Error', 'Por favor completa la información del destinatario');
        return false;
      }
    } else if (transactionType === 'receive') {
      if (!toAccount) {
        Alert.alert('Error', 'Por favor selecciona la cuenta de destino');
        return false;
      }
      
      if (!recipientInfo.name) {
        Alert.alert('Error', 'Por favor ingresa el nombre de quien envía');
        return false;
      }
    }

    // Validar saldo solo para transferencias y pagos
    if (transactionType !== 'receive' && fromAccount) {
      const fromWallet = userAccounts.find(w => w.id_cuenta === fromAccount);
      const transactionAmount = parseFloat(amount);
      const feeAmount = parseFloat(transactionFee) || 0;
      const totalAmount = transactionAmount + feeAmount;
      const availableBalance = getAvailableBalance(fromWallet);

      if (totalAmount > availableBalance) {
        Alert.alert(
          'Fondos insuficientes', 
          `El monto a ${transactionType === 'transfer' ? 'transferir' : 'pagar'} (${formatCurrency(totalAmount)}) supera el saldo disponible (${formatCurrency(availableBalance)})`
        );
        return false;
      }
    }

    return true;
  };

  const processTransaction = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!currentUser || !currentUser.id_usuario) {
        throw new Error('Usuario no autenticado');
      }

      let transactionData = {};
      let endpoint = '';

      switch (transactionType) {
        case 'transfer':
          endpoint = '/api/transferencia';
          transactionData = {
            datosTransferencia: {
              monto: parseFloat(amount),
              concepto: description.trim() || null,
              id_cuenta_origen: fromAccount,
              id_cuenta_destino: toAccount,
              id_usuario: currentUser.id_usuario,
              comision: parseFloat(transactionFee) || 0
            }
          };
          break;
          
        case 'payment':
          endpoint = '/api/pago-tercero';
          transactionData = {
            datosPago: {
              monto: parseFloat(amount),
              concepto: description.trim() || null,
              id_cuenta_origen: fromAccount,
              id_usuario: currentUser.id_usuario,
              destinatario: {
                nombre: recipientInfo.name,
                numero_cuenta: recipientInfo.accountNumber,
                banco: recipientInfo.bank,
                email: recipientInfo.email,
                telefono: recipientInfo.phone
              },
              comision: parseFloat(transactionFee) || 0
            }
          };
          break;
          
        case 'receive':
          endpoint = '/api/recibir-dinero';
          transactionData = {
            datosRecepcion: {
              monto: parseFloat(amount),
              concepto: description.trim() || null,
              id_cuenta_destino: toAccount,
              id_usuario: currentUser.id_usuario,
              remitente: {
                nombre: recipientInfo.name,
                numero_cuenta: recipientInfo.accountNumber || 'N/A',
                banco: recipientInfo.bank || 'N/A',
                email: recipientInfo.email,
                telefono: recipientInfo.phone
              }
            }
          };
          break;
      }

      console.log('Enviando transacción:', transactionData);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(`El servidor devolvió una respuesta inválida. Status: ${response.status}`);
      }

      if (response.ok) {
        const typeText = {
          transfer: 'Transferencia',
          payment: 'Pago',
          receive: 'Recepción'
        };
        
        Alert.alert(
          `${typeText[transactionType]} Exitosa`,
          getSuccessMessage(),
          [
            { 
              text: 'OK', 
              onPress: () => {
                clearForm();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || `Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Transaction error:', error);
      Alert.alert(
        'Error en la Transacción',
        error.message || 'No se pudo completar la transacción. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessMessage = () => {
    const amountText = formatCurrency(parseFloat(amount));
    
    switch (transactionType) {
      case 'transfer':
        const fromWallet = userAccounts.find(w => w.id_cuenta === fromAccount);
        const toWallet = userAccounts.find(w => w.id_cuenta === toAccount);
        return `Se han transferido ${amountText} de ${fromWallet.nombre_banco} a ${toWallet.nombre_banco}`;
        
      case 'payment':
        const paymentAccount = userAccounts.find(w => w.id_cuenta === fromAccount);
        return `Se ha enviado un pago de ${amountText} desde ${paymentAccount.nombre_banco} a ${recipientInfo.name}`;
        
      case 'receive':
        const receiveAccount = userAccounts.find(w => w.id_cuenta === toAccount);
        return `Se ha registrado una recepción de ${amountText} de ${recipientInfo.name} en ${receiveAccount.nombre_banco}`;
        
      default:
        return `Transacción de ${amountText} completada exitosamente`;
    }
  };

  const clearForm = () => {
    setAmount('');
    setDescription('');
    setFromAccount('');
    setToAccount('');
    setRecipientInfo({
      name: '',
      accountNumber: '',
      bank: '',
      email: '',
      phone: ''
    });
    setTransactionFee('');
  };

  const handleTransaction = () => {
    if (!validateTransaction()) return;

    const confirmMessage = getConfirmMessage();
    
    Alert.alert(
      'Confirmar Transacción',
      confirmMessage,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: processTransaction
        }
      ]
    );
  };

  const getConfirmMessage = () => {
    const amountText = formatCurrency(parseFloat(amount));
    const feeAmount = parseFloat(transactionFee) || 0;
    const totalAmount = parseFloat(amount) + feeAmount;
    
    switch (transactionType) {
      case 'transfer':
        const fromWallet = userAccounts.find(w => w.id_cuenta === fromAccount);
        const toWallet = userAccounts.find(w => w.id_cuenta === toAccount);
        return `¿Confirmas la transferencia de ${amountText} de ${fromWallet.nombre_banco} a ${toWallet.nombre_banco}?${feeAmount > 0 ? `\n\nComisión: ${formatCurrency(feeAmount)}\nTotal: ${formatCurrency(totalAmount)}` : ''}`;
        
      case 'payment':
        const paymentAccount = userAccounts.find(w => w.id_cuenta === fromAccount);
        return `¿Confirmas el pago de ${amountText} desde ${paymentAccount.nombre_banco} a ${recipientInfo.name}?${feeAmount > 0 ? `\n\nComisión: ${formatCurrency(feeAmount)}\nTotal: ${formatCurrency(totalAmount)}` : ''}`;
        
      case 'receive':
        const receiveAccount = userAccounts.find(w => w.id_cuenta === toAccount);
        return `¿Confirmas registrar la recepción de ${amountText} de ${recipientInfo.name} en ${receiveAccount.nombre_banco}?`;
        
      default:
        return `¿Confirmas esta transacción de ${amountText}?`;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Nueva Transacción</Text>
      
      <TouchableOpacity 
        style={styles.helpButton}
        onPress={() => Alert.alert('Ayuda', 'Realiza transferencias, pagos o registra dinero recibido de forma rápida y segura')}
      >
        <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderTransactionTypeSelector = () => (
    <View style={styles.typeContainer}>
      <Text style={styles.sectionTitle}>Tipo de Transacción</Text>
      <View style={styles.typeGrid}>
        {transactionTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              transactionType === type.id && styles.typeCardActive
            ]}
            onPress={() => {
              setTransactionType(type.id);
              // Limpiar campos al cambiar tipo
              setFromAccount('');
              setToAccount('');
              setRecipientInfo({
                name: '',
                accountNumber: '',
                bank: '',
                email: '',
                phone: ''
              });
            }}
          >
            <View style={[
              styles.typeIcon,
              { backgroundColor: type.color + '20' },
              transactionType === type.id && { backgroundColor: type.color }
            ]}>
              <Ionicons
                name={type.icon}
                size={24}
                color={transactionType === type.id ? 'white' : type.color}
              />
            </View>
            <Text style={[
              styles.typeTitle,
              transactionType === type.id && styles.typeTitleActive
            ]}>
              {type.title}
            </Text>
            <Text style={[
              styles.typeSubtitle,
              transactionType === type.id && styles.typeSubtitleActive
            ]}>
              {type.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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

  const renderRecipientInfo = () => {
    if (transactionType === 'transfer') return null;

    return (
      <View style={styles.formGroup}>
        <Text style={styles.sectionTitle}>
          {transactionType === 'payment' ? 'Información del Destinatario' : 'Información del Remitente'}
        </Text>
        
        <View style={styles.recipientCard}>
          <TouchableOpacity
            style={styles.recipientSelector}
            onPress={() => setShowRecipientModal(true)}
          >
            {recipientInfo.name ? (
              <View style={styles.recipientInfo}>
                <View style={styles.recipientIcon}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName}>{recipientInfo.name}</Text>
                  {recipientInfo.accountNumber && (
                    <Text style={styles.recipientAccount}>
                      {recipientInfo.bank && `${recipientInfo.bank} • `}{recipientInfo.accountNumber}
                    </Text>
                  )}
                  {recipientInfo.email && (
                    <Text style={styles.recipientContact}>{recipientInfo.email}</Text>
                  )}
                  {recipientInfo.phone && (
                    <Text style={styles.recipientContact}>{recipientInfo.phone}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="person-add-outline" size={24} color={colors.textLight} />
                <Text style={styles.selectorPlaceholder}>
                  {transactionType === 'payment' ? 'Agregar destinatario' : 'Agregar remitente'}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAmountInput = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Monto *</Text>
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
          Monto: {formatCurrency(parseFloat(amount))}
        </Text>
      )}
    </View>
  );

  const renderTransactionSummary = () => {
    if (!amount || (!fromAccount && !toAccount)) return null;

    const transactionAmount = parseFloat(amount);
    const feeAmount = parseFloat(transactionFee) || 0;
    const totalAmount = transactionAmount + feeAmount;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de Transacción</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monto</Text>
          <Text style={styles.summaryValue}>{formatCurrency(transactionAmount)}</Text>
        </View>
        
        {feeAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comisión</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(feeAmount)}
            </Text>
          </View>
        )}
        
        {transactionType !== 'receive' && (
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total a debitar</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAccountModal = (visible, onClose, selectedId, onSelect, title) => {
    let availableAccounts = userAccounts;
    if (title === 'Cuenta de Destino' && transactionType === 'transfer') {
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

  const renderRecipientModal = () => (
    <Modal visible={showRecipientModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          style={styles.modalContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {transactionType === 'payment' ? 'Información del Destinatario' : 'Información del Remitente'}
            </Text>
            <TouchableOpacity onPress={() => setShowRecipientModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.recipientForm}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Nombre completo *</Text>
              <TextInput
                style={styles.textInput}
                value={recipientInfo.name}
                onChangeText={(text) => setRecipientInfo({...recipientInfo, name: text})}
                placeholder="Nombre de la persona"
                placeholderTextColor={colors.textLight}
                maxLength={100}
              />
            </View>

            {transactionType === 'payment' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Número de cuenta *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={recipientInfo.accountNumber}
                    onChangeText={(text) => setRecipientInfo({...recipientInfo, accountNumber: text})}
                    placeholder="Número de cuenta del destinatario"
                    placeholderTextColor={colors.textLight}
                    maxLength={20}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Banco</Text>
                  <TextInput
                    style={styles.textInput}
                    value={recipientInfo.bank}
                    onChangeText={(text) => setRecipientInfo({...recipientInfo, bank: text})}
                    placeholder="Nombre del banco"
                    placeholderTextColor={colors.textLight}
                    maxLength={50}
                  />
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={recipientInfo.email}
                onChangeText={(text) => setRecipientInfo({...recipientInfo, email: text})}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                maxLength={100}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.textInput}
                value={recipientInfo.phone}
                onChangeText={(text) => setRecipientInfo({...recipientInfo, phone: text})}
                placeholder="+1 (234) 567-8900"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !recipientInfo.name && styles.saveButtonDisabled
              ]}
              onPress={() => setShowRecipientModal(false)}
              disabled={!recipientInfo.name}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

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
          {renderTransactionTypeSelector()}
          
          {/* Cuenta de origen - Solo para transferencias y pagos */}
          {(transactionType === 'transfer' || transactionType === 'payment') && 
            renderAccountSelector(
              'Cuenta de Origen',
              fromAccount,
              () => setShowFromModal(true)
            )
          }
          
          {/* Cuenta de destino - Solo para transferencias y recibir */}
          {(transactionType === 'transfer' || transactionType === 'receive') && 
            renderAccountSelector(
              'Cuenta de Destino',
              toAccount,
              () => setShowToModal(true),
              transactionType === 'transfer' ? getFilteredToAccounts() : userAccounts
            )
          }
          
          {/* Información del destinatario/remitente */}
          {renderRecipientInfo()}
          
          {renderAmountInput()}
          
          {/* Comisión - Solo para transferencias y pagos */}
          {(transactionType === 'transfer' || transactionType === 'payment') && (
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Comisión (Opcional)</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={transactionFee}
                  onChangeText={handleFeeChange}
                  placeholder="0.00"
                  placeholderTextColor={colors.textLight}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>
              {transactionFee && (
                <Text style={styles.feePreview}>
                  Comisión: {formatCurrency(parseFloat(transactionFee))}
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Concepto (Opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción de la transacción..."
              placeholderTextColor={colors.textLight}
              maxLength={100}
              multiline
              numberOfLines={2}
              editable={!isLoading}
            />
          </View>
          
          {renderTransactionSummary()}
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.transactionButton,
              (!amount || (transactionType === 'transfer' && (!fromAccount || !toAccount)) ||
               (transactionType === 'payment' && (!fromAccount || !recipientInfo.name || !recipientInfo.accountNumber)) ||
               (transactionType === 'receive' && (!toAccount || !recipientInfo.name)) ||
               isLoading) && styles.transactionButtonDisabled
            ]}
            onPress={handleTransaction}
            disabled={
              !amount || 
              (transactionType === 'transfer' && (!fromAccount || !toAccount)) ||
              (transactionType === 'payment' && (!fromAccount || !recipientInfo.name || !recipientInfo.accountNumber)) ||
              (transactionType === 'receive' && (!toAccount || !recipientInfo.name)) ||
              isLoading
            }
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons 
                name={transactionTypes.find(t => t.id === transactionType)?.icon || 'checkmark'} 
                size={24} 
                color="white" 
                style={{ marginRight: 8 }} 
              />
            )}
            <Text style={styles.transactionButtonText}>
              {isLoading ? 'Procesando...' : 
               transactionType === 'transfer' ? 'Transferir' :
               transactionType === 'payment' ? 'Pagar' : 'Registrar Recepción'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Modales */}
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
      
      {renderRecipientModal()}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  typeContainer: {
    marginBottom: 25,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight || colors.surface,
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  typeTitleActive: {
    color: colors.primary,
  },
  typeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeSubtitleActive: {
    color: colors.primary,
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
  recipientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  recipientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight || colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  recipientAccount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  recipientContact: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 1,
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
    shadowOpacity: colors.shadowOpacity || 0.1,
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
  transactionButton: {
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
  transactionButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  transactionButtonText: {
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
    maxHeight: '80%',
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
    borderBottomColor: colors.separator || colors.border,
  },
  accountOptionSelected: {
    backgroundColor: colors.primaryLight || colors.border,
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
  recipientForm: {
    padding: 20,
    maxHeight: 500,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransferScreen;