import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';

const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

const ForgotPasswordModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [step, setStep] = useState(1); // 1: email, 2: code + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Función para validar email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para enviar código de recuperación
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuario/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        Alert.alert(
          'Código enviado',
          'Se ha enviado un código de recuperación a tu correo electrónico'
        );
        startResendCooldown();
      } else {
        Alert.alert('Error', data.error || 'No se pudo enviar el código de recuperación');
      }
    } catch (error) {
      console.error('Error sending recovery code:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar al servidor. Verifica tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para reenviar código
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuario/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Código reenviado', 'Se ha enviado un nuevo código a tu correo');
        startResendCooldown();
      } else {
        Alert.alert('Error', data.error || 'No se pudo reenviar el código');
      }
    } catch (error) {
      console.error('Error resending code:', error);
      Alert.alert('Error de conexión', 'No se pudo reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el cooldown del reenvío
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Función para resetear contraseña
  const handleResetPassword = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    if (!newPassword) {
      Alert.alert('Error', 'Por favor ingresa la nueva contraseña');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuario/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Contraseña restablecida',
          'Tu contraseña ha sido restablecida exitosamente',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo restablecer la contraseña');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar al servidor. Verifica tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar modal y resetear estado
  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResendCooldown(0);
    onClose();
  };

  // Función para ir atrás
  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>
                  {step === 1 ? 'Recuperar Contraseña' : 'Restablecer Contraseña'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {step === 1 ? (
                  // Step 1: Email input
                  <>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail-outline" size={48} color={colors.primary} />
                    </View>
                    
                    <Text style={styles.subtitle}>
                      Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña
                    </Text>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Correo electrónico"
                        placeholderTextColor={colors.textLight}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        editable={!loading}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                      onPress={handleSendCode}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>Enviar Código</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  // Step 2: Code and new password
                  <>
                    <View style={styles.iconContainer}>
                      <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
                    </View>
                    
                    <Text style={styles.subtitle}>
                      Ingresa el código que enviamos a {email} y tu nueva contraseña
                    </Text>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Código de verificación"
                        placeholderTextColor={colors.textLight}
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Nueva contraseña"
                        placeholderTextColor={colors.textLight}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons
                          name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Confirmar nueva contraseña"
                        placeholderTextColor={colors.textLight}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                      onPress={handleResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>Restablecer Contraseña</Text>
                      )}
                    </TouchableOpacity>

                    {/* Resend code button */}
                    <TouchableOpacity
                      style={[styles.resendButton, resendCooldown > 0 && styles.resendButtonDisabled]}
                      onPress={handleResendCode}
                      disabled={resendCooldown > 0 || loading}
                    >
                      <Text style={[styles.resendButtonText, resendCooldown > 0 && styles.resendButtonTextDisabled]}>
                        {resendCooldown > 0 
                          ? `Reenviar código en ${resendCooldown}s` 
                          : 'Reenviar código'
                        }
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = ({ colors }) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 24,
    minHeight: 500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

export default ForgotPasswordModal;