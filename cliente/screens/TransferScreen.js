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
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransferScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  
  // Estados principales
  const [transactionType, setTransactionType] = useState('transfer');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [fee, setFee] = useState('');
  
  // Estados de modales
  const [showModal, setShowModal] = useState({ type: '', visible: false });
  const [isLoading, setIsLoading] = useState(false);
  
  // Datos
  const [userAccounts, setUserAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  const transactionTypes = [
    { id: 'transfer', title: t('transfer.types.transfer'), subtitle: t('transfer.types.transferSubtitle'), icon: 'swap-horizontal' },
    { id: 'payment', title: t('transfer.types.payment'), subtitle: t('transfer.types.paymentSubtitle'), icon: 'arrow-up-circle' },
    { id: 'receive', title: t('transfer.types.receive'), subtitle: t('transfer.types.receiveSubtitle'), icon: 'arrow-down-circle' }
  ];

  useEffect(() => {
    loadUserData();
    loadCategories();
  }, []);

  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return JSON.parse(atob(base64));
    } catch (error) {
      return null;
    }
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error(t('transfer.errors.noToken'));
      
      const decodedToken = decodeToken(token);
      if (!decodedToken?.id_usuario) throw new Error(t('transfer.errors.invalidToken'));
      
      setCurrentUser(decodedToken);
      await loadUserAccounts(decodedToken.id_usuario, token);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(t('common.error'), t('transfer.errors.loadUserData'));
    }
  };

  const loadUserAccounts = async (userId, token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/usuario/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserAccounts(data.cuentas || []);
      } else {
        throw new Error(t('transfer.errors.loadAccounts'));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setUserAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const decodedToken = decodeToken(token);

      const response = await fetch(`${API_BASE_URL}/api/transferencia/categorias/${decodedToken.id_usuario}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const validateTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t('common.error'), t('transfer.errors.invalidAmount'));
      return false;
    }

    const validations = {
      transfer: () => fromAccount && toAccount && fromAccount !== toAccount,
      payment: () => fromAccount && recipientName && selectedCategory,
      receive: () => toAccount && recipientName
    };

    if (!validations[transactionType]()) {
      Alert.alert(t('common.error'), t('transfer.errors.completeFields'));
      return false;
    }

    // Verificar saldo para transferencias y pagos
    if (transactionType !== 'receive' && fromAccount) {
      const account = userAccounts.find(a => a.id_cuenta === fromAccount);
      const total = parseFloat(amount) + parseFloat(fee || 0);
      if (total > parseFloat(account?.saldo || 0)) {
        Alert.alert(t('common.error'), t('transfer.errors.insufficientFunds'));
        return false;
      }
    }

    return true;
  };

  const processTransaction = async () => {
    if (!validateTransaction()) return;

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const endpoints = {
        transfer: '/api/transferencia',
        payment: '/api/transferencia/pago-tercero',
        receive: '/api/transferencia/recibir-dinero'
      };

      const payloads = {
        transfer: {
          datosTransferencia: {
            monto: parseFloat(amount),
            concepto: description || null,
            id_cuenta_origen: fromAccount,
            id_cuenta_destino: toAccount,
            id_usuario: currentUser.id_usuario,
            comision: parseFloat(fee) || 0
          }
        },
        payment: {
          datosPago: {
            monto: parseFloat(amount),
            concepto: description || null,
            id_cuenta_origen: fromAccount,
            id_usuario: currentUser.id_usuario,
            destinatario: { nombre: recipientName },
            id_categoria: selectedCategory,
            comision: parseFloat(fee) || 0
          }
        },
        receive: {
          datosRecepcion: {
            monto: parseFloat(amount),
            concepto: description || null,
            id_cuenta_destino: toAccount,
            id_usuario: currentUser.id_usuario,
            remitente: { nombre: recipientName }
          }
        }
      };

      console.log('Enviando a:', `${API_BASE_URL}${endpoints[transactionType]}`);
      console.log('Payload:', JSON.stringify(payloads[transactionType], null, 2));

      const response = await fetch(`${API_BASE_URL}${endpoints[transactionType]}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloads[transactionType]),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // Verificar si la respuesta es JSON válido
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(t('transfer.errors.invalidResponse', { 
          status: response.status, 
          response: responseText.substring(0, 200) 
        }));
      }

      if (response.ok) {
        Alert.alert(t('common.success'), t('transfer.success.message'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(result.error || t('transfer.errors.serverError', { status: response.status }));
      }
    } catch (error) {
      console.error('Transaction error:', error);
      Alert.alert(t('common.error'), error.message || t('transfer.errors.transactionFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (type) => setShowModal({ type, visible: true });
  const closeModal = () => setShowModal({ type: '', visible: false });

  const selectOption = (value) => {
    const { type } = showModal;
    if (type === 'fromAccount') setFromAccount(value);
    else if (type === 'toAccount') setToAccount(value);
    else if (type === 'category') setSelectedCategory(value);
    closeModal();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('transfer.newTransaction')}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('transfer.transactionType')}</Text>
      <View style={styles.typeGrid}>
        {transactionTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeCard, transactionType === type.id && styles.typeCardActive]}
            onPress={() => {
              setTransactionType(type.id);
              // Reset form
              setFromAccount('');
              setToAccount('');
              setSelectedCategory('');
              setRecipientName('');
            }}
          >
            <Ionicons
              name={type.icon}
              size={24}
              color={transactionType === type.id ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.typeTitle, transactionType === type.id && styles.typeTitleActive]}>
              {type.title}
            </Text>
            <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAccountSelector = (title, value, onPress) => {
    const account = userAccounts.find(a => a.id_cuenta === value);
    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{title} *</Text>
        <TouchableOpacity style={styles.selector} onPress={onPress}>
          <Text style={[styles.selectorText, !account && styles.placeholder]}>
            {account ? `${account.descripcion} - ${formatCurrency(account.saldo)}` : t('transfer.selectAccount')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategorySelector = () => {
    if (transactionType !== 'payment') return null;
    const category = categories.find(c => c.id_categoria === selectedCategory);
    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('transfer.category')} *</Text>
        <TouchableOpacity style={styles.selector} onPress={() => openModal('category')}>
          <Text style={[styles.selectorText, !category && styles.placeholder]}>
            {category ? category.descripcion : t('transfer.selectCategory')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTextInput = (label, value, onChangeText, placeholder, keyboardType = 'default', required = false) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label} {required && '*'}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderModal = () => {
    const { type, visible } = showModal;
    if (!visible) return null;

    let options = [];
    let title = '';

    if (type === 'fromAccount' || type === 'toAccount') {
      options = userAccounts.filter(a => 
        type === 'toAccount' && transactionType === 'transfer' ? a.id_cuenta !== fromAccount : true
      );
      title = type === 'fromAccount' ? t('transfer.originAccount') : t('transfer.destinationAccount');
    } else if (type === 'category') {
      options = categories;
      title = t('transfer.category');
    }

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.map((option) => {
                const isAccount = option.id_cuenta !== undefined;
                const id = isAccount ? option.id_cuenta : option.id_categoria;
                const text = isAccount ? 
                  `${option.descripcion} - ${formatCurrency(option.saldo)}` : 
                  option.descripcion;

                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.modalOption}
                    onPress={() => selectOption(id)}
                  >
                    <Text style={styles.modalOptionText}>{text}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && userAccounts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      {/* Header comentado como en tu original */}
      {/* {renderHeader()} */}
      
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderTypeSelector()}
          
          {/* Cuenta de origen */}
          {(transactionType === 'transfer' || transactionType === 'payment') && 
            renderAccountSelector(t('transfer.originAccount'), fromAccount, () => openModal('fromAccount'))
          }
          
          {/* Cuenta de destino */}
          {(transactionType === 'transfer' || transactionType === 'receive') && 
            renderAccountSelector(t('transfer.destinationAccount'), toAccount, () => openModal('toAccount'))
          }
          
          {/* Destinatario/Remitente */}
          {transactionType !== 'transfer' && 
            renderTextInput(
              transactionType === 'payment' ? t('transfer.recipient') : t('transfer.sender'),
              recipientName,
              setRecipientName,
              t('transfer.fullName'),
              'default',
              true
            )
          }
          
          {/* Categoría */}
          {renderCategorySelector()}
          
          {/* Monto */}
          {renderTextInput(t('transfer.amount'), amount, setAmount, '0.00', 'decimal-pad', true)}
          
          {/* Comisión */}
          {(transactionType === 'transfer' || transactionType === 'payment') && 
            renderTextInput(t('transfer.commission'), fee, setFee, '0.00', 'decimal-pad')
          }
          
          {/* Concepto */}
          {renderTextInput(t('transfer.concept'), description, setDescription, t('transfer.optionalDescription'))}
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={processTransaction}
            disabled={isLoading}
          >
            {isLoading && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
            <Text style={styles.buttonText}>
              {isLoading ? t('transfer.processing') : 
               transactionType === 'transfer' ? t('transfer.transferButton') :
               transactionType === 'payment' ? t('transfer.payButton') : t('transfer.registerButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {renderModal()}
    </View>
  );
};

const createStyles = ({ colors }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
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
  },
  typeCardActive: {
    borderColor: colors.primary,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  typeTitleActive: {
    color: colors.primary,
  },
  typeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    backgroundColor: colors.surface,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textLight,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: colors.textLight,
  },
  buttonText: {
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
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default TransferScreen;