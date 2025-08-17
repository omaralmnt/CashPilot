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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

const EditAccountScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { account } = route.params; // Recibe la cuenta a editar
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedTipoCuenta, setSelectedTipoCuenta] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [notes, setNotes] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTipoCuentaModal, setShowTipoCuentaModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para datos de la API
  const [bancos, setBancos] = useState([]);
  const [tiposCuenta, setTiposCuenta] = useState([]);
  const [colores, setColores] = useState([]);

  // ID del usuario autenticado desde AsyncStorage
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getUserIdAndLoadData();
  }, []);

  const getUserIdAndLoadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('currentUser');
      
      if (token) {
        // Decodificar el JWT para obtener el payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userIdFromToken = payload.id_usuario || payload.id || payload.userId || payload.user_id;
        
        if (userIdFromToken) {
          setUserId(userIdFromToken);
          await loadInitialData();
          populateAccountData();
        } else {
          Alert.alert('Error', 'No se pudo obtener la información del usuario del token');
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', 'Token de usuario no encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error decoding JWT:', error);
      Alert.alert('Error', 'Error al procesar el token de usuario');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([
        fetchBancos(),
        fetchTiposCuenta(),
        fetchColores()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
    }
  };

  const populateAccountData = () => {
    if (!account) return;

    // Llenar los campos con los datos de la cuenta existente
    setAccountName(account.name || '');
    setInitialBalance(account.balance?.toString() || '0');
    setAccountNumber(account.accountNumber || '');
    setNotes(account.note || '');
  };

  const fetchBancos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuenta/bancos`);
      if (response.ok) {
        const data = await response.json();
        setBancos(data.bancos || []);
        
        // Seleccionar el banco actual si existe
        if (account?.bankName) {
          const currentBank = (data.bancos || []).find(banco => 
            banco.descripcion === account.bankName
          );
          if (currentBank) {
            setSelectedBank(currentBank);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bancos:', error);
    }
  };

  const fetchTiposCuenta = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuenta/tipos-cuenta`);
      if (response.ok) {
        const data = await response.json();
        setTiposCuenta(data.tipos || []);
        
        // Seleccionar el tipo de cuenta actual si existe
        if (account?.accountType) {
          const currentType = (data.tipos || []).find(tipo => 
            tipo.descripcion === account.accountType
          );
          if (currentType) {
            setSelectedTipoCuenta(currentType);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tipos cuenta:', error);
    }
  };

  const fetchColores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuenta/colores`);
      if (response.ok) {
        const data = await response.json();
        setColores(data.colores || []);
        
        // Seleccionar el color actual si existe
        if (account?.color) {
          const currentColor = (data.colores || []).find(color => 
            color.codigo_hex === account.color
          );
          if (currentColor) {
            setSelectedColor(currentColor);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching colores:', error);
    }
  };

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

  const validateForm = () => {
    if (!accountName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la cuenta');
      return false;
    }

    if (!selectedTipoCuenta) {
      Alert.alert('Error', 'Por favor selecciona el tipo de cuenta');
      return false;
    }

    if (!selectedBank) {
      Alert.alert('Error', 'Por favor selecciona el banco');
      return false;
    }

    if (!selectedColor) {
      Alert.alert('Error', 'Por favor selecciona un color para la cuenta');
      return false;
    }

    if (!initialBalance || parseFloat(initialBalance) < 0) {
      Alert.alert('Error', 'Por favor ingresa un saldo inicial válido');
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    if (!userId || !account?.id) {
      Alert.alert('Error', 'No se pudo obtener la información necesaria para actualizar la cuenta');
      return;
    }

    setSaving(true);
    try {
      const cuentaData = {
        descripcion: accountName.trim(),
        numero: accountNumber.trim() || null,
        saldo: parseFloat(initialBalance) || 0,
        nota: notes.trim() || null,
        id_banco: selectedBank.id_banco,
        id_tipo_cuenta: selectedTipoCuenta.id_tipo_cuenta,
        id_color: selectedColor.id_color,
        id_usuario: userId
      };

      console.log('Updating account with data:', cuentaData);
      console.log('Account ID:', account.id);
      console.log('API URL:', `${API_BASE_URL}/api/cuenta/cuentas/${account.id}`);

      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cuentaData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Verificar el tipo de contenido de la respuesta
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (response.ok) {
        // Verificar si la respuesta es JSON
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('Success response:', data);
          Alert.alert(
            'Éxito', 
            'Cuenta actualizada correctamente',
            [{ 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }]
          );
        } else {
          // Si no es JSON, leer como texto para ver qué devuelve
          const textResponse = await response.text();
          console.log('Non-JSON success response:', textResponse);
          Alert.alert(
            'Éxito', 
            'Cuenta actualizada correctamente',
            [{ 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }]
          );
        }
      } else {
        // Error response - leer como texto primero
        const textResponse = await response.text();
        console.log('Error response text:', textResponse);
        
        let errorMessage = 'Error al actualizar la cuenta';
        
        try {
          // Intentar parsear como JSON si es posible
          const errorData = JSON.parse(textResponse);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // Si no es JSON válido, usar el texto directamente
          console.log('Could not parse error response as JSON:', parseError);
          errorMessage = `Error del servidor (${response.status}): ${textResponse.substring(0, 200)}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating account:', error);
      
      let userMessage = 'No se pudo actualizar la cuenta. Por favor, intenta de nuevo.';
      
      if (error.message.includes('JSON Parse error')) {
        userMessage = 'Error de comunicación con el servidor. Verifica tu conexión.';
      } else if (error.message.includes('Network request failed')) {
        userMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message.includes('fetch')) {
        userMessage = 'Error de red. Verifica que el servidor esté disponible.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      Alert.alert('Error', userMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!account?.id) {
      Alert.alert('Error', 'No se pudo obtener el ID de la cuenta');
      return;
    }

    try {
      setSaving(true);
      
      console.log('Deleting account ID:', account.id);
      console.log('Delete URL:', `${API_BASE_URL}/api/cuenta/cuentas/${account.id}`);
      
      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/${account.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        Alert.alert(
          'Cuenta Eliminada', 
          'La cuenta ha sido eliminada correctamente',
          [{ 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        // Error response - leer como texto primero
        const textResponse = await response.text();
        console.log('Delete error response:', textResponse);
        
        let errorMessage = 'Error al eliminar la cuenta';
        
        try {
          const errorData = JSON.parse(textResponse);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.log('Could not parse delete error response as JSON:', parseError);
          errorMessage = `Error del servidor (${response.status}): ${textResponse.substring(0, 200)}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      
      let userMessage = 'No se pudo eliminar la cuenta. Por favor, intenta de nuevo.';
      
      if (error.message.includes('JSON Parse error')) {
        userMessage = 'Error de comunicación con el servidor. Verifica tu conexión.';
      } else if (error.message.includes('Network request failed')) {
        userMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      Alert.alert('Error', userMessage);
    } finally {
      setSaving(false);
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
      
      <Text style={styles.headerTitle}>Editar Cuenta</Text>
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={saving}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTipoCuentaSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Tipo de Cuenta *</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowTipoCuentaModal(true)}
      >
        <Text style={selectedTipoCuenta ? styles.selectedText : styles.selectorPlaceholder}>
          {selectedTipoCuenta?.descripcion || 'Seleccionar tipo de cuenta'}
        </Text>
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

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Banco *</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowBankModal(true)}
        >
          <Text style={selectedBank ? styles.selectedText : styles.selectorPlaceholder}>
            {selectedBank?.descripcion || 'Seleccionar banco'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Número de Cuenta</Text>
        <TextInput
          style={styles.textInput}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="****1234"
          placeholderTextColor={colors.textLight}
        />
      </View>
    </>
  );

  const renderAmountInputs = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Saldo Actual *</Text>
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
  );

  const renderColorSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>Color de la Cuenta *</Text>
      <TouchableOpacity
        style={styles.colorSelector}
        onPress={() => setShowColorModal(true)}
      >
        <View style={[
          styles.colorPreview, 
          { backgroundColor: selectedColor?.codigo_hex || colors.primary }
        ]} />
        <Text style={styles.colorText}>
          {selectedColor?.descripcion || 'Seleccionar color'}
        </Text>
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

  const renderTipoCuentaModal = () => (
    <Modal visible={showTipoCuentaModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tipo de Cuenta</Text>
            <TouchableOpacity onPress={() => setShowTipoCuentaModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {tiposCuenta.map((tipo) => (
              <TouchableOpacity
                key={tipo.id_tipo_cuenta}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedTipoCuenta(tipo);
                  setShowTipoCuentaModal(false);
                }}
              >
                <Text style={styles.bankOptionText}>{tipo.descripcion}</Text>
                {selectedTipoCuenta?.id_tipo_cuenta === tipo.id_tipo_cuenta && (
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
            {bancos.map((banco) => (
              <TouchableOpacity
                key={banco.id_banco}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedBank(banco);
                  setShowBankModal(false);
                }}
              >
                <Text style={styles.bankOptionText}>{banco.descripcion}</Text>
                {selectedBank?.id_banco === banco.id_banco && (
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
            {colores.map((color) => (
              <TouchableOpacity
                key={color.id_color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.codigo_hex },
                  selectedColor?.id_color === color.id_color && styles.selectedColorOption
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setShowColorModal(false);
                }}
              >
                {selectedColor?.id_color === color.id_color && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading || !userId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar 
          barStyle={colors.statusBarStyle} 
          backgroundColor={colors.background} 
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {!userId ? 'Cargando usuario...' : 'Cargando datos de la cuenta...'}
        </Text>
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
          {renderTipoCuentaSelector()}
          {renderBasicInfo()}
          {renderAmountInputs()}
          {renderColorSelector()}
          {renderNotes()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {renderTipoCuentaModal()}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
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
  selectedText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
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

export default EditAccountScreen;