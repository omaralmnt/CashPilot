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

const AddWalletScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [accountType, setAccountType] = useState('');
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors.primary);
  const [notes, setNotes] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  // Tipos de cuenta disponibles
  const accountTypes = [
    { 
      type: 'bank', 
      name: 'Cuenta Bancaria', 
      icon: 'business', 
      color: '#3498DB',
      description: 'Cuenta de débito, ahorro o nómina'
    },
    { 
      type: 'credit', 
      name: 'Tarjeta de Crédito', 
      icon: 'card', 
      color: '#E74C3C',
      description: 'Tarjeta de crédito o línea de crédito'
    },
    { 
      type: 'cash', 
      name: 'Efectivo', 
      icon: 'cash', 
      color: '#27AE60',
      description: 'Dinero en efectivo y monedas'
    },
    { 
      type: 'digital', 
      name: 'Monedero Digital', 
      icon: 'phone-portrait', 
      color: '#9B59B6',
      description: 'PayPal, Mercado Pago, etc.'
    },
    { 
      type: 'investment', 
      name: 'Inversiones', 
      icon: 'trending-up', 
      color: '#F39C12',
      description: 'Acciones, fondos, criptomonedas'
    },
  ];

  // Bancos populares en República Dominicana
  const banks = [
    'Banco Popular Dominicano',
    'Banco de Reservas',
    'Banco BHD León',
    'Banco Santander',
    'Banco Múltiple López de Haro',
    'Banco Promerica',
    'Banco Caribe',
    'Scotiabank',
    'Citibank',
    'Banco del Progreso',
    'Asociación Popular de Ahorros y Préstamos',
    'Otro'
  ];

  // Colores disponibles para las cuentas
  const themeColors = [
    colors.primary, colors.success, colors.error, colors.info, colors.warning,
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b',
    '#38ef7d', '#fad961', '#f76b1c', '#fa709a', '#fee140',
    '#e94c6f', '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const formatAmount = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const handleBalanceChange = (text) => {
    const formatted = formatAmount(text);
    setInitialBalance(formatted);
  };

  const handleCreditLimitChange = (text) => {
    const formatted = formatAmount(text);
    setCreditLimit(formatted);
  };

  const getSelectedAccountType = () => {
    return accountTypes.find(type => type.type === accountType);
  };

  const validateForm = () => {
    if (!accountType) {
      Alert.alert('Error', 'Por favor selecciona un tipo de cuenta');
      return false;
    }

    if (!accountName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la cuenta');
      return false;
    }

    if (accountType === 'bank' && !bankName) {
      Alert.alert('Error', 'Por favor selecciona el banco');
      return false;
    }

    if (accountType === 'credit') {
      if (!creditLimit || parseFloat(creditLimit) <= 0) {
        Alert.alert('Error', 'Por favor ingresa un límite de crédito válido');
        return false;
      }
    } else {
      if (!initialBalance || parseFloat(initialBalance) < 0) {
        Alert.alert('Error', 'Por favor ingresa un saldo inicial válido');
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const selectedTypeData = getSelectedAccountType();
    
    const newWallet = {
      id: Date.now(),
      name: accountName.trim(),
      type: accountType,
      accountType: selectedTypeData.name,
      balance: accountType === 'credit' ? 0 : parseFloat(initialBalance),
      creditLimit: accountType === 'credit' ? parseFloat(creditLimit) : null,
      accountNumber: accountNumber.trim(),
      bankName: bankName,
      color: selectedColor,
      icon: selectedTypeData.icon,
      notes: notes.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    console.log('Nueva cuenta:', newWallet);
    
    Alert.alert(
      'Éxito', 
      'Cuenta agregada correctamente',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
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
      
      <Text style={styles.headerTitle}>Agregar Cuenta</Text>
      
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Ionicons name="checkmark" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderAccountTypeSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Tipo de Cuenta *</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowTypeModal(true)}
      >
        {accountType ? (
          <View style={styles.selectedContainer}>
            <View style={[styles.typeIcon, { backgroundColor: getSelectedAccountType()?.color + '20' }]}>
              <Ionicons
                name={getSelectedAccountType()?.icon}
                size={20}
                color={getSelectedAccountType()?.color}
              />
            </View>
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedText}>{getSelectedAccountType()?.name}</Text>
              <Text style={styles.selectedDescription}>{getSelectedAccountType()?.description}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.selectorPlaceholder}>Seleccionar tipo de cuenta</Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Nombre de la Cuenta *</Text>
        <TextInput
          style={styles.textInput}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Ej. Mi Cuenta de Ahorros"
          placeholderTextColor={colors.textLight}
          maxLength={50}
        />
      </View>

      {accountType === 'bank' && (
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Banco *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowBankModal(true)}
          >
            <Text style={bankName ? styles.selectedText : styles.selectorPlaceholder}>
              {bankName || 'Seleccionar banco'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>
          {accountType === 'digital' ? 'Email/Usuario' : 'Número de Cuenta'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder={
            accountType === 'digital' 
              ? "usuario@email.com" 
              : accountType === 'cash' 
                ? "No aplica" 
                : "****1234"
          }
          placeholderTextColor={colors.textLight}
          keyboardType={accountType === 'digital' ? 'email-address' : 'default'}
          editable={accountType !== 'cash'}
        />
      </View>
    </>
  );

  const renderAmountInputs = () => (
    <>
      {accountType === 'credit' ? (
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Límite de Crédito *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={creditLimit}
              onChangeText={handleCreditLimitChange}
              placeholder="50,000.00"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          {creditLimit && (
            <Text style={styles.amountPreview}>
              Límite: ${parseFloat(creditLimit || 0).toLocaleString('es-MX', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Saldo Inicial *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={initialBalance}
              onChangeText={handleBalanceChange}
              placeholder="0.00"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          {initialBalance && (
            <Text style={styles.amountPreview}>
              Saldo: ${parseFloat(initialBalance || 0).toLocaleString('es-MX', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </Text>
          )}
        </View>
      )}
    </>
  );

  const renderColorSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Color de la Cuenta</Text>
      <TouchableOpacity
        style={styles.colorSelector}
        onPress={() => setShowColorModal(true)}
      >
        <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
        <Text style={styles.colorText}>Personalizar color</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderNotes = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Notas (Opcional)</Text>
      <TextInput
        style={[styles.textInput, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Información adicional sobre esta cuenta..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        maxLength={200}
      />
    </View>
  );

  // Modales
  const renderTypeModal = () => (
    <Modal visible={showTypeModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tipo de Cuenta</Text>
            <TouchableOpacity onPress={() => setShowTypeModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={styles.modalOption}
                onPress={() => {
                  setAccountType(type.type);
                  setSelectedColor(type.color);
                  setShowTypeModal(false);
                  // Reset specific fields when changing type
                  setBankName('');
                  setAccountNumber('');
                  setInitialBalance('');
                  setCreditLimit('');
                }}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon} size={24} color={type.color} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{type.name}</Text>
                  <Text style={styles.optionDescription}>{type.description}</Text>
                </View>
                {accountType === type.type && (
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBankModal = () => (
    <Modal visible={showBankModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Banco</Text>
            <TouchableOpacity onPress={() => setShowBankModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {banks.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={styles.modalOption}
                onPress={() => {
                  setBankName(bank);
                  setShowBankModal(false);
                }}
              >
                <Text style={styles.bankOptionText}>{bank}</Text>
                {bankName === bank && (
                  <Ionicons name="checkmark" size={20} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderColorModal = () => (
    <Modal visible={showColorModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Color</Text>
            <TouchableOpacity onPress={() => setShowColorModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.colorGrid}>
            {themeColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColorOption
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setShowColorModal(false);
                }}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

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
          {renderAccountTypeSelector()}
          
          {accountType && (
            <>
              {renderBasicInfo()}
              {renderAmountInputs()}
              {renderColorSelector()}
              {renderNotes()}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {renderTypeModal()}
      {renderBankModal()}
      {renderColorModal()}
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    backgroundColor: colors.surface,
  },
  selectorPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: colors.textLight,
  },
  selectedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  selectedText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
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
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    backgroundColor: colors.surface,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
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
  modalList: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bankOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: colors.text,
  },
});

export default AddWalletScreen;