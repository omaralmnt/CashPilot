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

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [transactionType, setTransactionType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Datos de wallets/cuentas (en una app real, esto vendría de un contexto o API)
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

  const categories = {
    gasto: [
      { name: 'Alimentación', icon: 'restaurant', color: '#FF6B6B' },
      { name: 'Transporte', icon: 'car', color: '#F7DC6F' },
      { name: 'Entretenimiento', icon: 'musical-notes', color: '#45B7D1' },
      { name: 'Salud', icon: 'medical', color: '#FF8A80' },
      { name: 'Hogar', icon: 'home', color: '#A8E6CF' },
      { name: 'Educación', icon: 'school', color: '#DDA0DD' },
      { name: 'Ropa', icon: 'shirt', color: '#F0E68C' },
      { name: 'Otros', icon: 'ellipsis-horizontal', color: '#95A5A6' },
    ],
    ingreso: [
      { name: 'Trabajo', icon: 'briefcase', color: '#4ECDC4' },
      { name: 'Freelance', icon: 'laptop', color: '#B39DDB' },
      { name: 'Familia', icon: 'people', color: '#FFCC80' },
      { name: 'Inversiones', icon: 'trending-up', color: '#90EE90' },
      { name: 'Ventas', icon: 'storefront', color: '#FFB6C1' },
      { name: 'Otros', icon: 'ellipsis-horizontal', color: '#95A5A6' },
    ]
  };

  const formatCurrency = (amount) => {
    return `${Math.abs(amount).toLocaleString('es-MX', { 
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

  const formatAmount = (text) => {
    // Remover caracteres no numéricos excepto punto
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos
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

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la transacción');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('Error', 'Por favor selecciona una categoría');
      return;
    }

    if (!selectedWallet) {
      Alert.alert('Error', 'Por favor selecciona una cuenta');
      return;
    }

    const selectedWalletData = wallets.find(w => w.id === selectedWallet);

    const newTransaction = {
      id: Date.now(),
      title: title.trim(),
      amount: transactionType === 'gasto' ? -parseFloat(amount) : parseFloat(amount),
      category: selectedCategory,
      walletId: selectedWallet,
      walletName: selectedWalletData.name,
      date: date,
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      type: transactionType,
      description: description.trim() || 'Sin descripción',
    };

    // Aquí podrías guardar la transacción en tu estado global o base de datos
    console.log('Nueva transacción:', newTransaction);
    
    Alert.alert(
      'Éxito', 
      'Transacción guardada correctamente',
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
      
      <Text style={styles.headerTitle}>Nueva Transacción</Text>
      
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Ionicons name="checkmark" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderTransactionTypeSelector = () => (
    <View style={styles.typeContainer}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          transactionType === 'gasto' && styles.typeButtonActiveExpense
        ]}
        onPress={() => {
          setTransactionType('gasto');
          setSelectedCategory('');
          setSelectedWallet(''); // Reset wallet when changing type
        }}
      >
        <Ionicons 
          name="remove-circle" 
          size={24} 
          color={transactionType === 'gasto' ? 'white' : colors.error} 
        />
        <Text style={[
          styles.typeButtonText,
          transactionType === 'gasto' && styles.typeButtonTextActive
        ]}>
          Gasto
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeButton,
          transactionType === 'ingreso' && styles.typeButtonActiveIncome
        ]}
        onPress={() => {
          setTransactionType('ingreso');
          setSelectedCategory('');
          setSelectedWallet(''); // Reset wallet when changing type
        }}
      >
        <Ionicons 
          name="add-circle" 
          size={24} 
          color={transactionType === 'ingreso' ? 'white' : colors.success} 
        />
        <Text style={[
          styles.typeButtonText,
          transactionType === 'ingreso' && styles.typeButtonTextActive
        ]}>
          Ingreso
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountInput = () => (
    <View style={styles.amountContainer}>
      <Text style={styles.amountLabel}>Monto</Text>
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
          {transactionType === 'gasto' ? '-' : '+'}$
          {parseFloat(amount || 0).toLocaleString('es-MX', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </Text>
      )}
    </View>
  );

  const renderFormFields = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cuenta *</Text>
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowWalletModal(true)}
        >
          {selectedWallet ? (
            <View style={styles.selectedCategoryContainer}>
              <View style={[
                styles.categoryIcon,
                { backgroundColor: wallets.find(w => w.id === selectedWallet)?.color + '20' }
              ]}>
                <Ionicons
                  name={getWalletIcon(wallets.find(w => w.id === selectedWallet)?.type)}
                  size={20}
                  color={wallets.find(w => w.id === selectedWallet)?.color}
                />
              </View>
              <View style={styles.walletTextContainer}>
                <Text style={styles.selectedCategoryText}>
                  {wallets.find(w => w.id === selectedWallet)?.name}
                </Text>
                <Text style={styles.walletBalance}>
                  Saldo: {formatCurrency(wallets.find(w => w.id === selectedWallet)?.balance || 0)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.categorySelectorPlaceholder}>Seleccionar cuenta</Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Título *</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Supermercado Soriana"
          placeholderTextColor={colors.textLight}
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Categoría *</Text>
        <TouchableOpacity
          style={styles.categorySelector}
          onPress={() => setShowCategoryModal(true)}
        >
          {selectedCategory ? (
            <View style={styles.selectedCategoryContainer}>
              <View style={[
                styles.categoryIcon,
                { backgroundColor: categories[transactionType].find(cat => cat.name === selectedCategory)?.color + '20' }
              ]}>
                <Ionicons
                  name={categories[transactionType].find(cat => cat.name === selectedCategory)?.icon}
                  size={20}
                  color={categories[transactionType].find(cat => cat.name === selectedCategory)?.color}
                />
              </View>
              <Text style={styles.selectedCategoryText}>{selectedCategory}</Text>
            </View>
          ) : (
            <Text style={styles.categorySelectorPlaceholder}>Seleccionar categoría</Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descripción</Text>
        <TextInput
          style={[styles.textInput, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descripción opcional..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={3}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Fecha</Text>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.dateText}>
            {new Date(date).toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Categorías para {transactionType === 'gasto' ? 'Gastos' : 'Ingresos'}
            </Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.categoriesGrid}>
            {categories[transactionType].map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.name && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setSelectedCategory(category.name);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color + '20' }
                ]}>
                  <Ionicons
                    name={category.icon}
                    size={24}
                    color={category.color}
                  />
                </View>
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory === category.name && styles.categoryOptionTextSelected
                ]}>
                  {category.name}
                </Text>
                {selectedCategory === category.name && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderWalletModal = () => (
    <Modal
      visible={showWalletModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowWalletModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cuenta</Text>
            <TouchableOpacity onPress={() => setShowWalletModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.walletsGrid}>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  styles.walletOption,
                  selectedWallet === wallet.id && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setSelectedWallet(wallet.id);
                  setShowWalletModal(false);
                }}
              >
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: wallet.color + '20' }
                ]}>
                  <Ionicons
                    name={getWalletIcon(wallet.type)}
                    size={24}
                    color={wallet.color}
                  />
                </View>
                <View style={styles.walletOptionInfo}>
                  <Text style={[
                    styles.walletOptionName,
                    selectedWallet === wallet.id && styles.categoryOptionTextSelected
                  ]}>
                    {wallet.name}
                  </Text>
                  <Text style={styles.walletOptionType}>
                    {wallet.accountType}
                  </Text>
                  <Text style={[
                    styles.walletOptionBalance,
                    { 
                      color: wallet.balance >= 0 ? colors.success : colors.error
                    }
                  ]}>
                    Saldo: {wallet.balance >= 0 ? '' : '-'}{formatCurrency(wallet.balance)}
                  </Text>
                  {wallet.accountNumber && (
                    <Text style={styles.walletOptionNumber}>{wallet.accountNumber}</Text>
                  )}
                </View>
                {selectedWallet === wallet.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.background} 
      />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderTransactionTypeSelector()}
        {renderAmountInput()}
        {renderFormFields()}
      </ScrollView>
      
      {renderCategoryModal()}
      {renderWalletModal()}
    </KeyboardAvoidingView>
  );
};

const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 25,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  typeButtonActiveExpense: {
    backgroundColor: colors.error,
  },
  typeButtonActiveIncome: {
    backgroundColor: colors.success,
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  amountContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  amountLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 5,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  amountPreview: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  categorySelectorPlaceholder: {
    fontSize: 16,
    color: colors.textLight,
  },
  dateContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 10,
    textTransform: 'capitalize',
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoriesGrid: {
    flex: 1,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  categoryOptionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  walletTextContainer: {
    flex: 1,
  },
  walletBalance: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  walletsGrid: {
    flex: 1,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  walletOptionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  walletOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  walletOptionType: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  walletOptionBalance: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  walletOptionNumber: {
    fontSize: 12,
    color: colors.textLight,
  },
});

export default AddTransactionScreen;