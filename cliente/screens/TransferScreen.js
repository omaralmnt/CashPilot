import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext'; // Ajusta la ruta según tu estructura

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
  const [transferFee, setTransferFee] = useState(0);

  // Datos de ejemplo de cuentas disponibles
  const wallets = [
    {
      id: 1,
      name: 'BBVA Bancomer',
      type: 'bank',
      accountType: 'Cuenta de Débito',
      balance: 15750.50,
      accountNumber: '****1234',
      color: '#004481',
      icon: 'business',
    },
    {
      id: 2,
      name: 'Banamex Platino',
      type: 'credit',
      accountType: 'Tarjeta de Crédito',
      balance: -3250.00,
      creditLimit: 50000,
      accountNumber: '****5678',
      color: '#E31837',
      icon: 'card',
    },
    {
      id: 3,
      name: 'Efectivo',
      type: 'cash',
      accountType: 'Dinero en Efectivo',
      balance: 850.00,
      accountNumber: '',
      color: '#27AE60',
      icon: 'cash',
    },
    {
      id: 4,
      name: 'Santander Débito',
      type: 'bank',
      accountType: 'Cuenta de Débito',
      balance: 8420.75,
      accountNumber: '****9012',
      color: '#EC0000',
      icon: 'business',
    },
    {
      id: 5,
      name: 'PayPal',
      type: 'digital',
      accountType: 'Monedero Digital',
      balance: 2150.30,
      accountNumber: 'usuario@email.com',
      color: '#003087',
      icon: 'phone-portrait',
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
    
    // Calcular comisión basada en el tipo de transferencia
    const amountValue = parseFloat(formatted) || 0;
    const fromWallet = wallets.find(w => w.id === fromAccount);
    const toWallet = wallets.find(w => w.id === toAccount);
    
    if (fromWallet && toWallet && amountValue > 0) {
      // Diferentes comisiones según el tipo de transferencia
      let fee = 0;
      if (fromWallet.type === 'bank' && toWallet.type === 'digital') {
        fee = amountValue * 0.02; // 2% para banco a digital
      } else if (fromWallet.type === 'digital' && toWallet.type === 'bank') {
        fee = amountValue * 0.015; // 1.5% para digital a banco
      } else if (fromWallet.type !== toWallet.type) {
        fee = amountValue * 0.01; // 1% para diferentes tipos
      }
      setTransferFee(fee);
    } else {
      setTransferFee(0);
    }
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getWalletIcon = (type) => {
    const iconMap = {
      bank: 'business',
      credit: 'card',
      cash: 'cash',
      digital: 'phone-portrait',
      investment: 'trending-up',
    };
    return iconMap[type] || 'wallet';
  };

  const getAvailableBalance = (wallet) => {
    if (wallet.type === 'credit') {
      return wallet.creditLimit + wallet.balance; // Para crédito, balance disponible
    }
    return wallet.balance;
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

    const fromWallet = wallets.find(w => w.id === fromAccount);
    const transferAmount = parseFloat(amount);
    const totalAmount = transferAmount + transferFee;
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

  const handleTransfer = () => {
    if (!validateTransfer()) return;

    const fromWallet = wallets.find(w => w.id === fromAccount);
    const toWallet = wallets.find(w => w.id === toAccount);
    const transferAmount = parseFloat(amount);
    const totalAmount = transferAmount + transferFee;

    Alert.alert(
      'Confirmar Transferencia',
      `¿Confirmas la transferencia de ${formatCurrency(transferAmount)} de ${fromWallet.name} a ${toWallet.name}?${transferFee > 0 ? `\n\nComisión: ${formatCurrency(transferFee)}\nTotal: ${formatCurrency(totalAmount)}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          style: 'default',
          onPress: () => {
            // Aquí se procesaría la transferencia
            console.log('Transferencia procesada:', {
              from: fromWallet,
              to: toWallet,
              amount: transferAmount,
              fee: transferFee,
              description: description.trim(),
              timestamp: new Date().toISOString()
            });

            Alert.alert(
              'Transferencia Exitosa',
              `Se han transferido ${formatCurrency(transferAmount)} de ${fromWallet.name} a ${toWallet.name}`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
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

  const renderAccountSelector = (title, selectedAccount, onPress, accounts = wallets) => {
    const selectedWallet = accounts.find(w => w.id === selectedAccount);
    
    return (
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>{title} *</Text>
        <TouchableOpacity style={styles.accountSelector} onPress={onPress}>
          {selectedWallet ? (
            <View style={styles.selectedAccountContainer}>
              <View style={[styles.accountIcon, { backgroundColor: selectedWallet.color + '20' }]}>
                <Ionicons
                  name={getWalletIcon(selectedWallet.type)}
                  size={24}
                  color={selectedWallet.color}
                />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{selectedWallet.name}</Text>
                <Text style={styles.accountType}>{selectedWallet.accountType}</Text>
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
    const totalAmount = transferAmount + transferFee;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de Transferencia</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monto a transferir</Text>
          <Text style={styles.summaryValue}>{formatCurrency(transferAmount)}</Text>
        </View>
        
        {transferFee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comisión</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(transferFee)}
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
    // Filtrar cuentas según el contexto
    let availableAccounts = wallets;
    if (title === 'Cuenta de Destino') {
      availableAccounts = wallets.filter(w => w.id !== fromAccount);
    } else if (title === 'Cuenta de Origen') {
      availableAccounts = wallets.filter(w => w.balance > 0 || w.type === 'credit');
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
                  key={wallet.id}
                  style={[
                    styles.accountOption,
                    selectedId === wallet.id && styles.accountOptionSelected
                  ]}
                  onPress={() => {
                    onSelect(wallet.id);
                    onClose();
                  }}
                >
                  <View style={[styles.accountIcon, { backgroundColor: wallet.color + '20' }]}>
                    <Ionicons
                      name={getWalletIcon(wallet.type)}
                      size={24}
                      color={wallet.color}
                    />
                  </View>
                  <View style={styles.accountOptionDetails}>
                    <Text style={styles.accountOptionName}>{wallet.name}</Text>
                    <Text style={styles.accountOptionType}>{wallet.accountType}</Text>
                    <Text style={styles.accountOptionBalance}>
                      Disponible: {formatCurrency(getAvailableBalance(wallet))}
                    </Text>
                    {wallet.accountNumber && (
                      <Text style={styles.accountOptionNumber}>{wallet.accountNumber}</Text>
                    )}
                  </View>
                  {selectedId === wallet.id && (
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
    return wallets.filter(w => w.id !== fromAccount);
  };

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
            />
          </View>
          
          {renderTransferSummary()}
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.transferButton,
              (!amount || !fromAccount || !toAccount) && styles.transferButtonDisabled
            ]}
            onPress={handleTransfer}
            disabled={!amount || !fromAccount || !toAccount}
          >
            <Ionicons name="swap-horizontal" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.transferButtonText}>Transferir</Text>
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