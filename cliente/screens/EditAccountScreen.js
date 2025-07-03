import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const EditAccountScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { account } = route.params || {};

  // Estados para el formulario
  const [accountName, setAccountName] = useState(account?.name || '');
  const [accountType, setAccountType] = useState(account?.type || 'bank');
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || '');
  const [initialBalance, setInitialBalance] = useState(account?.balance?.toString() || '0');
  const [creditLimit, setCreditLimit] = useState(account?.creditLimit?.toString() || '0');
  const [accountColor, setAccountColor] = useState(account?.color || '#3498DB');
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tipos de cuenta disponibles
  const accountTypes = [
    { type: 'bank', name: 'Cuenta Bancaria', icon: 'business' },
    { type: 'credit', name: 'Tarjeta de Crédito', icon: 'card' },
    { type: 'cash', name: 'Efectivo', icon: 'cash' },
    { type: 'digital', name: 'Monedero Digital', icon: 'phone-portrait' },
    { type: 'investment', name: 'Inversiones', icon: 'trending-up' },
  ];

  // Colores disponibles
  const colorOptions = [
    '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6',
    '#1ABC9C', '#E67E22', '#34495E', '#E91E63', '#8E24AA',
    '#607D8B', '#795548', '#FF5722', '#009688', '#4CAF50'
  ];

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getAccountTypeIcon = (type) => {
    const typeData = accountTypes.find(t => t.type === type);
    return typeData ? typeData.icon : 'wallet';
  };

  const getAccountTypeName = (type) => {
    const typeData = accountTypes.find(t => t.type === type);
    return typeData ? typeData.name : 'Cuenta';
  };

  const formatAmount = (text) => {
    // Remover caracteres no numéricos excepto punto y signo menos
    const cleaned = text.replace(/[^0-9.-]/g, '');
    
    // Evitar múltiples puntos
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
  };

  const handleSave = () => {
    if (!accountName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la cuenta');
      return;
    }

    if (accountType === 'credit' && (!creditLimit || parseFloat(creditLimit) <= 0)) {
      Alert.alert('Error', 'Por favor ingresa un límite de crédito válido');
      return;
    }

    const updatedAccount = {
      ...account,
      name: accountName.trim(),
      type: accountType,
      accountNumber: accountNumber.trim(),
      balance: parseFloat(initialBalance) || 0,
      creditLimit: accountType === 'credit' ? (parseFloat(creditLimit) || 0) : undefined,
      color: accountColor,
      isActive: isActive,
      accountType: getAccountTypeName(accountType),
      icon: getAccountTypeIcon(accountType),
    };

    // Aquí normalmente guardarías en tu estado global o API
    console.log('Cuenta actualizada:', updatedAccount);
    
    Alert.alert(
      'Éxito',
      'La cuenta ha sido actualizada correctamente',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer y se eliminarán todas las transacciones asociadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Aquí eliminarías de tu estado global o API
            console.log('Cuenta eliminada:', account.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Editar Cuenta</Text>
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccountPreview = () => (
    <View style={styles.previewContainer}>
      <View style={[styles.previewCard, { borderLeftColor: accountColor }]}>
        <View style={styles.previewHeader}>
          <View style={[styles.previewIcon, { backgroundColor: accountColor + '20' }]}>
            <Ionicons
              name={getAccountTypeIcon(accountType)}
              size={24}
              color={accountColor}
            />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>
              {accountName || 'Nombre de la cuenta'}
            </Text>
            <Text style={styles.previewType}>
              {getAccountTypeName(accountType)}
            </Text>
          </View>
          <Text style={styles.previewBalance}>
            {formatCurrency(parseFloat(initialBalance) || 0)}
          </Text>
        </View>
        {accountType === 'credit' && (
          <View style={styles.previewCreditInfo}>
            <Text style={styles.previewCreditLimit}>
              Límite: {formatCurrency(parseFloat(creditLimit) || 0)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Nombre de la cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre de la cuenta *</Text>
        <TextInput
          style={styles.textInput}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="Ej. BBVA Bancomer"
          placeholderTextColor="#BDC3C7"
          maxLength={50}
        />
      </View>

      {/* Tipo de cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tipo de cuenta</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
          {accountTypes.map((type) => (
            <TouchableOpacity
              key={type.type}
              style={[
                styles.typeOption,
                accountType === type.type && styles.typeOptionActive
              ]}
              onPress={() => setAccountType(type.type)}
            >
              <Ionicons
                name={type.icon}
                size={20}
                color={accountType === type.type ? 'white' : '#7F8C8D'}
              />
              <Text style={[
                styles.typeOptionText,
                accountType === type.type && styles.typeOptionTextActive
              ]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Número de cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {accountType === 'digital' ? 'Email/Usuario' : 'Número de cuenta'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder={accountType === 'digital' ? 'usuario@email.com' : '****1234'}
          placeholderTextColor="#BDC3C7"
          keyboardType={accountType === 'digital' ? 'email-address' : 'default'}
        />
      </View>

      {/* Saldo inicial */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {accountType === 'credit' ? 'Saldo actual' : 'Saldo inicial'}
        </Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={initialBalance}
            onChangeText={(text) => setInitialBalance(formatAmount(text))}
            placeholder="0.00"
            placeholderTextColor="#BDC3C7"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Límite de crédito (solo para tarjetas de crédito) */}
      {accountType === 'credit' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Límite de crédito *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={creditLimit}
              onChangeText={(text) => setCreditLimit(formatAmount(text))}
              placeholder="0.00"
              placeholderTextColor="#BDC3C7"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}

      {/* Color de la cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Color</Text>
        <TouchableOpacity
          style={[styles.colorSelector, { backgroundColor: accountColor }]}
          onPress={() => setShowColorPicker(true)}
        >
          <Ionicons name="color-palette" size={20} color="white" />
          <Text style={styles.colorSelectorText}>Cambiar color</Text>
        </TouchableOpacity>
      </View>

      {/* Estado activo */}
      <View style={styles.inputGroup}>
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.inputLabel}>Cuenta activa</Text>
            <Text style={styles.switchDescription}>
              Las cuentas inactivas no aparecerán en las transacciones
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#E0E0E0', true: '#667eea' }}
            thumbColor={isActive ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Ionicons name="trash" size={20} color="#E74C3C" />
        <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
      </TouchableOpacity>

      {/* Espacio adicional */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderColorPicker = () => (
    <Modal
      visible={showColorPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowColorPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.colorPickerModal}>
          <View style={styles.colorPickerHeader}>
            <Text style={styles.colorPickerTitle}>Seleccionar Color</Text>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
          <View style={styles.colorGrid}>
            {colorOptions.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  accountColor === color && styles.selectedColor
                ]}
                onPress={() => {
                  setAccountColor(color);
                  setShowColorPicker(false);
                }}
              >
                {accountColor === color && (
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      {renderHeader()}
      {renderAccountPreview()}
      {renderForm()}
      {renderColorPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  previewType: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  previewBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  previewCreditInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewCreditLimit: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  inputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 6,
  },
  typeOptionTextActive: {
    color: 'white',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 12,
  },
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  colorSelectorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
    backgroundColor: '#FFE6E6',
  },
  deleteButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    width: '100%',
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#2C3E50',
  },
});

export default EditAccountScreen;