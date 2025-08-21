import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const EditProfileModal = ({ visible, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  // Obtener API URL desde app.json
  const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://localhost:4000';

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    correo: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para mostrar/ocultar contraseñas
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');

  // Cargar información del usuario cuando se abre el modal
  useEffect(() => {
    if (visible) {
      loadUserInfo();
    }
  }, [visible]);

  const loadUserInfo = async () => {
    setIsLoading(true);
    try {
      // Obtener token y extraer ID del usuario
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error(t('editProfile.errors.tokenNotFound'));
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userIdFromToken = payload.id_usuario;
      
      if (!userIdFromToken) {
        throw new Error(t('editProfile.errors.invalidToken'));
      }

      setUserId(userIdFromToken);

      // Consultar información completa del usuario desde la BD
      console.log('🔍 Consultando información del usuario desde la BD...');
      console.log('🌐 API URL:', API_URL);
      
      const response = await fetch(`${API_URL}/api/usuario/users/${userIdFromToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      
      console.log('✅ Información del usuario obtenida:', userData);

      // Actualizar formulario con los datos de la BD
      setFormData(prev => ({
        ...prev,
        nombre: userData.nombre || '',
        username: userData.username || '',
        correo: userData.correo || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error) {
      console.log('❌ Error loading user info:', error);
      
      // Manejar errores específicos del servidor
      let errorMessage = t('editProfile.errors.loadProfileFailed');
      
      if (error.message.includes('401')) {
        errorMessage = t('editProfile.errors.sessionExpired');
      } else if (error.message.includes('403')) {
        errorMessage = t('editProfile.errors.noPermissions');
      } else if (error.message.includes('404')) {
        errorMessage = t('editProfile.errors.userNotFound');
      } else if (error.message.includes('Network')) {
        errorMessage = t('editProfile.errors.connectionError');
      }
      
      // En caso de error, usar fallback con datos del token (limitados)
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.id_usuario || '');
          setFormData(prev => ({
            ...prev,
            nombre: payload.nombre || '',
            username: '',  // No disponible en token
            correo: '',    // No disponible en token
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          
          Alert.alert(
            t('common.warning'), 
            `${errorMessage} ${t('editProfile.errors.basicDataOnly')}`,
            [{ text: t('common.understood') }]
          );
        }
      } catch (fallbackError) {
        console.log('❌ Error en fallback:', fallbackError);
        Alert.alert(t('common.error'), errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    // Validar campos obligatorios
    if (!formData.nombre.trim()) {
      Alert.alert(t('common.error'), t('editProfile.validation.nameRequired'));
      return false;
    }

    if (!formData.username.trim()) {
      Alert.alert(t('common.error'), t('editProfile.validation.usernameRequired'));
      return false;
    }

    // Validar email si se proporciona
    if (formData.correo && !isValidEmail(formData.correo)) {
      Alert.alert(t('common.error'), t('editProfile.validation.invalidEmail'));
      return false;
    }

    // Si se quiere cambiar la contraseña
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        Alert.alert(t('common.error'), t('editProfile.validation.currentPasswordRequired'));
        return false;
      }

      if (formData.newPassword.length < 6) {
        Alert.alert(t('common.error'), t('editProfile.validation.passwordMinLength'));
        return false;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        Alert.alert(t('common.error'), t('editProfile.validation.passwordsNoMatch'));
        return false;
      }
    }

    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Preparar datos para enviar al backend
      const updateData = {
        id_usuario: userId,
        nombre: formData.nombre.trim(),
        username: formData.username.trim(),
        correo: formData.correo.trim(),
        changePassword: !!formData.newPassword,
      };

      // Si se va a cambiar la contraseña
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      console.log('📤 Datos a enviar al backend:', updateData);
      console.log('🌐 API URL:', API_URL);

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/usuario/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const updatedUser = await response.json();
      console.log('✅ Perfil actualizado:', updatedUser);

      // Si el servidor devuelve un nuevo token, actualizarlo en AsyncStorage
      if (updatedUser.nuevoToken) {
        await AsyncStorage.setItem('userToken', updatedUser.nuevoToken);
        console.log('🔄 Token actualizado en AsyncStorage');
      }

      Alert.alert(
        t('common.success'),
        updatedUser.mensaje || t('editProfile.success.profileUpdated'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Limpiar campos de contraseña
              setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              }));
              
              // Llamar callback de éxito si existe
              if (onSuccess) {
                // Usar los datos del usuario actualizado desde el servidor
                onSuccess({
                  nombre: updatedUser.usuario?.nombre || updateData.nombre,
                  username: updatedUser.usuario?.username || updateData.username,
                  correo: updatedUser.usuario?.correo || updateData.correo,
                  tokenActualizado: !!updatedUser.nuevoToken
                });
              }
              
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.log('❌ Error updating profile:', error);
      
      // Mostrar el mensaje de error específico del servidor si está disponible
      const errorMessage = error.message.includes('Error') 
        ? error.message 
        : t('editProfile.errors.updateProfileGeneric');
        
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleClose = () => {
    // Limpiar campos de contraseña al cerrar
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('editProfile.title')}</Text>
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Loading State */}
            {isLoading && (
              <View style={styles.loadingSection}>
                <Ionicons name="refresh" size={24} color={colors.primary} />
                <Text style={styles.loadingText}>{t('editProfile.loading.profileInfo')}</Text>
              </View>
            )}

            {/* Información Personal */}
            <View style={[styles.formSection, isLoading && styles.formSectionDisabled]}>
              <Text style={styles.sectionTitle}>{t('editProfile.sections.personalInfo')}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('editProfile.fields.fullName')} *</Text>
                <TextInput
                  style={[styles.textInput, isLoading && styles.textInputDisabled]}
                  value={formData.nombre}
                  onChangeText={(text) => handleInputChange('nombre', text)}
                  placeholder={t('editProfile.placeholders.fullName')}
                  placeholderTextColor={colors.textLight}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('editProfile.fields.username')} *</Text>
                <TextInput
                  style={[styles.textInput, isLoading && styles.textInputDisabled]}
                  value={formData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                  placeholder={t('editProfile.placeholders.username')}
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('editProfile.fields.email')}</Text>
                <TextInput
                  style={[styles.textInput, isLoading && styles.textInputDisabled]}
                  value={formData.correo}
                  onChangeText={(text) => handleInputChange('correo', text)}
                  placeholder={t('editProfile.placeholders.email')}
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Cambiar Contraseña */}
            <View style={[styles.formSection, isLoading && styles.formSectionDisabled]}>
              <Text style={styles.sectionTitle}>{t('editProfile.sections.changePassword')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('editProfile.sections.passwordInstructions')}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('editProfile.fields.currentPassword')}</Text>
                <View style={[styles.passwordContainer, isLoading && styles.textInputDisabled]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.currentPassword}
                    onChangeText={(text) => handleInputChange('currentPassword', text)}
                    placeholder={t('editProfile.placeholders.currentPassword')}
                    placeholderTextColor={colors.textLight}
                    secureTextEntry={!showPasswords.current}
                    returnKeyType="next"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('current')}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPasswords.current ? "eye-off" : "eye"} 
                      size={20} 
                      color={isLoading ? colors.textLight : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('editProfile.fields.newPassword')}</Text>
                <View style={[styles.passwordContainer, isLoading && styles.textInputDisabled]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.newPassword}
                    onChangeText={(text) => handleInputChange('newPassword', text)}
                    placeholder={t('editProfile.placeholders.newPassword')}
                    placeholderTextColor={colors.textLight}
                    secureTextEntry={!showPasswords.new}
                    returnKeyType="next"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('new')}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPasswords.new ? "eye-off" : "eye"} 
                      size={20} 
                      color={isLoading ? colors.textLight : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('editProfile.fields.confirmPassword')}</Text>
                <View style={[styles.passwordContainer, isLoading && styles.textInputDisabled]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    placeholder={t('editProfile.placeholders.confirmPassword')}
                    placeholderTextColor={colors.textLight}
                    secureTextEntry={!showPasswords.confirm}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveProfile}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('confirm')}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPasswords.confirm ? "eye-off" : "eye"} 
                      size={20} 
                      color={isLoading ? colors.textLight : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Información adicional */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={styles.infoText}>
                {t('editProfile.info.requiredFields')}
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, (isLoading) && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.saveButtonText}>{t('editProfile.loading.saving')}</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.saveButtonText}>{t('editProfile.actions.saveChanges')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '92%',
    flex: 1,
    marginTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 50,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
    fontWeight: '500',
  },
  formSectionDisabled: {
    opacity: 0.6,
  },
  textInputDisabled: {
    opacity: 0.7,
    backgroundColor: colors.surfaceSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default EditProfileModal;