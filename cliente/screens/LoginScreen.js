import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const { height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    checkStoredCredentials();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('Biometric Info:', {
        isAvailable,
        isEnrolled,
        supportedTypes,
        hasStoredCredentials
      });
      
      setBiometricAvailable(isAvailable && isEnrolled);
    } catch (error) {
      console.log('Error checking biometric availability:', error);
    }
  };

  const checkStoredCredentials = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      setHasStoredCredentials(!!storedUser);
    } catch (error) {
      console.log('Error checking stored credentials:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware) {
        Alert.alert('No disponible', 'Tu dispositivo no soporta autenticación biométrica');
        return;
      }
      
      if (!isEnrolled) {
        Alert.alert('No configurado', 'No tienes configurada la autenticación biométrica en tu dispositivo');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar para acceder a CashPilot',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
        requireConfirmation: false,
        disableDeviceFallback: false,
      });

      console.log('Biometric result:', result);

      if (result.success) {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          navigation.replace('MainTabs');
        } else {
          Alert.alert('Error', 'No hay usuario registrado para autenticación biométrica');
        }
      } else if (result.error) {
        console.log('Biometric error:', result.error);
        Alert.alert('Error', `Error de autenticación: ${result.error}`);
      }
    } catch (error) {
      console.log('Biometric catch error:', error);
      Alert.alert('Error', 'No se pudo completar la autenticación biométrica');
    }
  };

  const validateInput = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre de usuario');
      return false;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }

    if (!password) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateInput()) return;

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const user = userList.find(u => u.username === username && u.password === password);
      
      if (user) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        
        // Activar biométrico automáticamente para futuros logins
        setHasStoredCredentials(true);
        
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Error', 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateInput()) return;

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const existingUser = userList.find(u => u.username === username);
      if (existingUser) {
        Alert.alert('Error', 'El nombre de usuario ya está en uso');
        setLoading(false);
        return;
      }
      
      const newUser = {
        id: Date.now().toString(),
        username,
        password,
        createdAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('users', JSON.stringify(userList));
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      
      // Activar biométrico automáticamente para futuros logins
      setHasStoredCredentials(true);
      
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="wallet" size={32} color="white" />
          </View>
          <Text style={styles.appName}>CashPilot</Text>
          <Text style={styles.appSubtitle}>Tu piloto financiero personal</Text>
        </View>
      </View>

      {/* Form Section */}
      <KeyboardAvoidingView 
        style={styles.formSection}
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
          <View style={styles.formContainer}>
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isLogin && styles.toggleButtonActive
                ]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[
                  styles.toggleButtonText,
                  isLogin && styles.toggleButtonTextActive
                ]}>
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isLogin && styles.toggleButtonActive
                ]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[
                  styles.toggleButtonText,
                  !isLogin && styles.toggleButtonTextActive
                ]}>
                  Registrarse
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nombre de usuario"
                  placeholderTextColor="#BDC3C7"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Contraseña"
                  placeholderTextColor="#BDC3C7"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#7F8C8D"
                  />
                </TouchableOpacity>
              </View>

              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor="#BDC3C7"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#7F8C8D"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={isLogin ? handleLogin : handleRegister}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                </Text>
              </TouchableOpacity>

              {isLogin && biometricAvailable && hasStoredCredentials && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricAuth}
                >
                  <Ionicons name="finger-print" size={24} color="#667eea" />
                  <Text style={styles.biometricButtonText}>
                    Usar {Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Huella Digital'}
                  </Text>
                </TouchableOpacity>
              )}

              {isLogin && (
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    padding: 3,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 9,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  toggleButtonTextActive: {
    color: '#2C3E50',
  },
  inputSection: {
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  actionSection: {
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
});

export default LoginScreen;