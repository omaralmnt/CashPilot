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
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

const AddWalletScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  
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
        } else {
          Alert.alert(t('common.error'), t('addWallet.errors.userInfoNotFound'));
          navigation.goBack();
        }
      } else {
        Alert.alert(t('common.error'), t('addWallet.errors.userTokenNotFound'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error decoding JWT:', error);
      Alert.alert(t('common.error'), t('addWallet.errors.tokenProcessError'));
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
      Alert.alert(t('common.error'), t('addWallet.errors.loadInitialData'));
    }
  };

  const fetchBancos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cuenta/bancos`);
      if (response.ok) {
        const data = await response.json();
        setBancos(data.bancos || []);
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
        // Filtrar colores que tengan codigo_hex válido
        const coloresValidos = (data.colores || []).filter(color => 
          color.codigo_hex && color.codigo_hex.trim() !== ''
        );
        setColores(coloresValidos);
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
      Alert.alert(t('common.error'), t('addWallet.validation.accountNameRequired'));
      return false;
    }

    if (!selectedTipoCuenta) {
      Alert.alert(t('common.error'), t('addWallet.validation.accountTypeRequired'));
      return false;
    }

    if (!selectedColor) {
      Alert.alert(t('common.error'), t('addWallet.validation.colorRequired'));
      return false;
    }

    if (!initialBalance || parseFloat(initialBalance) < 0) {
      Alert.alert(t('common.error'), t('addWallet.validation.validBalanceRequired'));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!userId) {
      Alert.alert(t('common.error'), t('addWallet.errors.userInfoNotFound'));
      return;
    }

    setSaving(true);
    try {
      const cuentaData = {
        descripcion: accountName.trim(),
        numero: accountNumber.trim() || null,
        saldo: parseFloat(initialBalance) || 0,
        nota: notes.trim() || null,
        id_banco: selectedBank?.id_banco || 1, // Default banco si no aplica
        id_tipo_cuenta: selectedTipoCuenta.id_tipo_cuenta,
        id_color: selectedColor.id_color,
        id_usuario: userId
      };

      const response = await fetch(`${API_BASE_URL}/api/cuenta/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cuentaData),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          t('common.success'), 
          t('addWallet.success.accountCreated'),
          [{ 
            text: t('common.ok'), 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || t('addWallet.errors.createAccountFailed'));
      }
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('addWallet.errors.createAccountGeneric')
      );
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
      
      <Text style={styles.headerTitle}>{t('addWallet.title')}</Text>
      
      <TouchableOpacity 
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="checkmark" size={24} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTipoCuentaSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{t('addWallet.fields.accountType')} *</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowTipoCuentaModal(true)}
      >
        <Text style={selectedTipoCuenta ? styles.selectedText : styles.selectorPlaceholder}>
          {selectedTipoCuenta?.descripcion || t('addWallet.placeholders.selectAccountType')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>{t('addWallet.fields.accountName')} *</Text>
        <TextInput
          style={styles.textInput}
          value={accountName}
          onChangeText={setAccountName}
          placeholder={t('addWallet.placeholders.accountName')}
          placeholderTextColor={colors.textLight}
          maxLength={50}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>{t('addWallet.fields.bank')}</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowBankModal(true)}
        >
          <Text style={selectedBank ? styles.selectedText : styles.selectorPlaceholder}>
            {selectedBank?.descripcion || t('addWallet.placeholders.selectBank')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>{t('addWallet.fields.accountNumber')}</Text>
        <TextInput
          style={styles.textInput}
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder={t('addWallet.placeholders.accountNumber')}
          placeholderTextColor={colors.textLight}
        />
      </View>
    </>
  );

  const renderAmountInputs = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{t('addWallet.fields.initialBalance')} *</Text>
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
          {t('addWallet.preview.balance')}: ${parseFloat(initialBalance || 0).toLocaleString('es-MX', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </Text>
      )}
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{t('addWallet.fields.accountColor')} *</Text>
      <TouchableOpacity
        style={styles.colorSelector}
        onPress={() => setShowColorModal(true)}
      >
        <View style={[
          styles.colorPreview, 
          { backgroundColor: selectedColor?.codigo_hex || colors.primary }
        ]} />
        <Text style={styles.colorText}>
          {selectedColor?.descripcion || t('addWallet.placeholders.selectColor')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );

  const renderNotes = () => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{t('addWallet.fields.notes')}</Text>
      <TextInput
        style={[styles.textInput, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('addWallet.placeholders.notes')}
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
            <Text style={styles.modalTitle}>{t('addWallet.modals.accountType')}</Text>
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
            <Text style={styles.modalTitle}>{t('addWallet.modals.selectBank')}</Text>
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
            <Text style={styles.modalTitle}>{t('addWallet.modals.selectColor')}</Text>
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
          {!userId ? t('addWallet.loading.user') : t('addWallet.loading.form')}
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

export default AddWalletScreen;