import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EditAccountScreen = ({ navigation, route }) => {
  // Obtener datos de la cuenta desde route.params o usar datos de ejemplo
  const accountData = route?.params?.account || {
    id: 1,
    name: 'BBVA Bancomer',
    type: 'bank',
    accountType: 'Cuenta de Débito',
    balance: 15750.50,
    accountNumber: '1234567890',
    color: '#004481',
    icon: 'business',
    isActive: true,
    bank: 'BBVA',
    description: 'Cuenta principal de nómina',
    currency: 'MXN',
    includeInTotal: true,
  };

  const [formData, setFormData] = useState({
    name: accountData.name,
    accountNumber: accountData.accountNumber,
    balance: accountData.balance.toString(),
    description: accountData.description || '',
    bank: accountData.bank || '',
    isActive: accountData.isActive,
    includeInTotal: accountData.includeInTotal,
    color: accountData.color,
    type: accountData.type,
    creditLimit: accountData.creditLimit?.toString() || '',
  });

  const [loading, setLoading] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const accountTypes = {
    bank: { name: 'Cuenta Bancaria', icon: 'business' },
    credit: { name: 'Tarjeta de Crédito', icon: 'card' },
    cash: { name: 'Efectivo', icon: 'cash' },
    digital: { name: 'Monedero Digital', icon: 'phone-portrait' },
    investment: { name: 'Inversiones', icon: 'trending-up' },
  };

  const colorOptions = [
    '#004481', '#E31837', '#27AE60', '#EC0000', '#003087',
    '#3498DB', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C',
    '#34495E', '#16A085', '#2ECC71', '#F1C40F', '#E67E22',
  ];

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `$${Math.abs(num).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre de la cuenta es obligatorio');
      return;
    }

    if (!formData.balance.trim()) {
      Alert.alert('Error', 'El saldo es obligatorio');
      return;
    }

    if (formData.type === 'credit' && !formData.creditLimit.trim()) {
      Alert.alert('Error', 'El límite de crédito es obligatorio para tarjetas de crédito');
      return;
    }

    setLoading(true);
    try {
      // Aquí iría tu lógica para guardar los datos
      // Ejemplo: await updateAccount(accountData.id, formData);
      
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Éxito', 'Cuenta actualizada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo actualizar la cuenta');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer y eliminará todas las transacciones asociadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría tu lógica para eliminar la cuenta
            navigation.goBack();
            Alert.alert('Cuenta eliminada', 'La cuenta ha sido eliminada correctamente');
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
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Editar Cuenta</Text>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccountPreview = () => (
    <View style={styles.previewContainer}>
      <View style={[styles.previewCard, { borderLeftColor: formData.color }]}>
        <View style={styles.previewHeader}>
          <View style={[styles.previewIcon, { backgroundColor: formData.color + '20' }]}>
            <Ionicons 
              name={accountTypes[formData.type]?.icon || 'wallet'} 
              size={24} 
              color={formData.color} 
            />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>
              {formData.name || 'Nombre de la cuenta'}
            </Text>
            <Text style={styles.previewType}>
              {accountTypes[formData.type]?.name || 'Tipo de cuenta'}
            </Text>
          </View>
        </View>
        <View style={styles.previewBalance}>
          <Text style={styles.previewBalanceLabel}>Saldo</Text>
          <Text style={styles.previewBalanceAmount}>
            {formatCurrency(formData.balance)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Nombre de la cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre de la cuenta *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          placeholder="Ej. BBVA Nómina"
          placeholderTextColor="#BDC3C7"
        />
      </View>

      {/* Número de cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Número de cuenta</Text>
        <TextInput
          style={styles.textInput}
          value={formData.accountNumber}
          onChangeText={(text) => setFormData({...formData, accountNumber: text})}
          placeholder="1234567890"
          placeholderTextColor="#BDC3C7"
          keyboardType="numeric"
        />
      </View>

      {/* Banco/Institución */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Banco/Institución</Text>
        <TextInput
          style={styles.textInput}
          value={formData.bank}
          onChangeText={(text) => setFormData({...formData, bank: text})}
          placeholder="Ej. BBVA, Banamex, PayPal"
          placeholderTextColor="#BDC3C7"
        />
      </View>

      {/* Saldo actual */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Saldo actual *</Text>
        <View style={styles.balanceInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.balanceInput}
            value={formData.balance}
            onChangeText={(text) => setFormData({...formData, balance: text.replace(/[^0-9.-]/g, '')})}
            placeholder="0.00"
            placeholderTextColor="#BDC3C7"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Límite de crédito (solo para tarjetas de crédito) */}
      {formData.type === 'credit' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Límite de crédito *</Text>
          <View style={styles.balanceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.balanceInput}
              value={formData.creditLimit}
              onChangeText={(text) => setFormData({...formData, creditLimit: text.replace(/[^0-9.-]/g, '')})}
              placeholder="0.00"
              placeholderTextColor="#BDC3C7"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      )}

      {/* Descripción */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descripción</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          placeholder="Descripción opcional de la cuenta"
          placeholderTextColor="#BDC3C7"
          multiline={true}
          numberOfLines={3}
        />
      </View>

      {/* Color de la cuenta */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Color de la cuenta</Text>
        <TouchableOpacity
          style={styles.colorSelector}
          onPress={() => setShowColorModal(true)}
        >
          <View style={[styles.colorPreview, { backgroundColor: formData.color }]} />
          <Text style={styles.colorText}>Seleccionar color</Text>
          <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
        </TouchableOpacity>
      </View>

      {/* Configuraciones */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Configuraciones</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Cuenta activa</Text>
            <Text style={styles.settingDescription}>Mostrar en transacciones</Text>
          </View>
          <Switch
            value={formData.isActive}
            onValueChange={(value) => setFormData({...formData, isActive: value})}
            trackColor={{ false: '#E0E6ED', true: formData.color }}
            thumbColor={formData.isActive ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Incluir en total</Text>
            <Text style={styles.settingDescription}>Incluir en patrimonio total</Text>
          </View>
          <Switch
            value={formData.includeInTotal}
            onValueChange={(value) => setFormData({...formData, includeInTotal: value})}
            trackColor={{ false: '#E0E6ED', true: formData.color }}
            thumbColor={formData.includeInTotal ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  const renderColorModal = () => (
    <Modal
      visible={showColorModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowColorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.colorModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Color</Text>
            <TouchableOpacity onPress={() => setShowColorModal(false)}>
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
                  formData.color === color && styles.selectedColorOption
                ]}
                onPress={() => {
                  setFormData({...formData, color});
                  setShowColorModal(false);
                }}
              >
                {formData.color === color && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDangerZone = () => (
    <View style={styles.dangerZone}>
      <Text style={styles.dangerTitle}>Zona de peligro</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Ionicons name="trash" size={20} color="#E74C3C" />
        <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
      </TouchableOpacity>
      <Text style={styles.dangerNote}>
        Esta acción eliminará la cuenta y todas sus transacciones permanentemente.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={formData.color} />
      
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {renderAccountPreview()}
          {renderForm()}
          {renderDangerZone()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {renderColorModal()}
    </SafeAreaView>
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
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 16,
    borderLeftWidth: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  previewType: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  previewBalance: {
    alignItems: 'center',
  },
  previewBalanceLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  previewBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginRight: 8,
  },
  balanceInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 14,
    minHeight: 50,
  },
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorText: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  settingsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  dangerZone: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
    marginLeft: 8,
  },
  dangerNote: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EditAccountScreen;