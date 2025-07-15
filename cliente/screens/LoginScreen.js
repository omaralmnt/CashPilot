import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';

// Configuración del backend
const API_BASE_URL = 'http://10.0.2.229:4000'; // Cambia esta IP por la de tu servidor
// Si estás usando localhost en el emulador de Android, usa: http://10.0.2.2:4000
// Si estás usando el simulador de iOS o Expo Go, usa la IP de tu máquina

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
    checkBiometricSupport();
    checkStoredCredentials();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.log('Error checking biometric support:', error);
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
      
      console.log('Biometric debug:', { supportedTypes, hasHardware, isEnrolled });
      
      if (!hasHardware) {
        Alert.alert('No disponible', 'Tu dispositivo no soporta autenticación biométrica');
        return;
      }
      
      if (!isEnrolled) {
        Alert.alert('No configurado', 'No tienes configurada la autenticación biométrica en tu dispositivo');
        return;
      }

      // Configuración simplificada para Expo Go
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar para acceder',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar código',
        requireConfirmation: false,
        disableDeviceFallback: false, // Permite fallback a código si Face ID falla
      });

      console.log('Authentication result:', result);

      if (result.success) {
        // Si hay warning sobre Face ID en Expo Go, simplemente continuar
        if (result.warning) {
          console.log('Face ID warning (normal en Expo Go):', result.warning);
        }
        
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          navigation.replace('MainTabs');
        } else {
          Alert.alert('Error', 'No hay usuario registrado para autenticación biométrica');
        }
      } else if (result.error) {
        console.log('Biometric error details:', result.error);
        
        // Manejar diferentes tipos de errores
        if (result.error === 'UserCancel') {
          // Usuario canceló - no hacer nada
          return;
        } else if (result.error === 'UserFallback') {
          // Usuario eligió usar código - esto es normal
          Alert.alert('Info', 'Usaste el código de acceso como alternativa');
          return;
        } else if (result.error === 'BiometricUnavailable') {
          Alert.alert('No disponible', 'La autenticación biométrica no está disponible. Usa el código de acceso.');
        } else if (result.error === 'NotEnrolled') {
          Alert.alert('No configurado', 'La autenticación biométrica no está configurada.');
        } else {
          // Para cualquier otro error, permitir usar código
          Alert.alert('Info', 'Face ID no disponible, puedes usar el código de acceso');
        }
      }
    } catch (error) {
      console.log('Biometric catch error:', error);
      Alert.alert('Info', 'Usa el código de acceso para continuar');
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

  // Nueva función para hacer login con el backend
  const handleLogin = async () => {
    if (!validateInput()) return;

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuario/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso - guardar token y datos del usuario
        const userData = {
          token: data.token,
          username: username.trim(),
          loginTime: new Date().toISOString(),
        };

        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Activar biométrico automáticamente para futuros logins
        setHasStoredCredentials(true);
        
        Alert.alert(
          'Éxito', 
          'Inicio de sesión exitoso',
          [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
        );
      } else {
        // Error en las credenciales
        Alert.alert('Error', data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      Alert.alert(
        'Error de conexión', 
        'No se pudo conectar al servidor. Verifica tu conexión a internet y que el servidor esté funcionando.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función de registro (mantener la lógica local por ahora)
  const handleRegister = async () => {
    if (!validateInput()) return;

    setLoading(true);
    
    try {
      // Simulación de delay
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
      
      userList.push(newUser);
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
                    Usar autenticación biométrica
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  actionSection: {
    gap: 16,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#667eea',
    gap: 8,
  },
  biometricButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;