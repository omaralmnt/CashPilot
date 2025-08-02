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
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configure WebBrowser for AuthSession
WebBrowser.maybeCompleteAuthSession();

// Configuración del backend
const CLIENT_ID = 'Ov23liFToTnnnJWBxjcg';
const API_BASE_URL = 'http://192.168.137.1:4000'; // Cambia esta IP por la de tu servidor

const LoginScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  // Configuración que funciona inmediatamente - usar la IP actual
  const redirectUri = 'exp://192.168.100.155:8081';

  // DEBUG: Ver qué redirect URI se está usando (solo una vez)
  useEffect(() => {
    console.log('🔍 REDIRECT URI ACTUAL:', redirectUri);
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['read:user', 'user:email'],
      redirectUri: redirectUri,
    },
    {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
    }
  );

  useEffect(() => {
    checkBiometricSupport();
    checkStoredCredentials();
  }, []);

  // Handle GitHub OAuth response
  useEffect(() => {
    // console.log('🔍 RESPONSE OBJETO:', response);
    
    if (response?.type === 'success') {
      // console.log('✅ ÉXITO EN OAUTH - Código recibido:', response.params.code);
      // console.log('🔐 Code verifier disponible:', request?.codeVerifier ? 'Sí' : 'No');
      
      const { code } = response.params;
      const codeVerifier = request?.codeVerifier;
      
      handleGitHubAuthCode(code, codeVerifier);
    } else if (response?.type === 'error') {
      console.error('❌ GitHub OAuth error:', response.error);
      console.error('❌ Error details:', JSON.stringify(response, null, 2));
      Alert.alert('Error', 'Error en la autenticación con GitHub');
      setLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('🚫 Usuario canceló el login');
      Alert.alert('Cancelado', 'El inicio de sesión fue cancelado');
      setLoading(false);
    }
  }, [response, request]);

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

      // console.log('Authentication result:', result);

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

  // Fixed GitHub login function
  const handleGitHubLogin = async () => {
    // console.log('🚀 Iniciando GitHub login...');
    console.log('🔍 CLIENT_ID:', CLIENT_ID);
    console.log('🔍 REDIRECT URI FINAL:', redirectUri);
    
    setLoading(true);
    try {
      // console.log('📱 Llamando a promptAsync...');
      const result = await promptAsync();
      // console.log('📋 Resultado de promptAsync:', result);
    } catch (error) {
      console.error('❌ Error iniciating GitHub login:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión con GitHub. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  // Handle the GitHub authorization code
  const handleGitHubAuthCode = async (code, codeVerifier) => {
    try {
      // console.log('📤 Enviando datos al backend:', {
      //   code: code ? code.substring(0, 10) + '...' : 'No presente',
      //   codeVerifier: codeVerifier ? 'Presente' : 'No presente'
      // });

      // Preparar los datos para enviar
      const requestData = { code };
      
      // Incluir code_verifier solo si está presente
      if (codeVerifier) {
        requestData.code_verifier = codeVerifier;
      }

      // Send the code to your backend to exchange for access token
      const response = await fetch(`${API_BASE_URL}/api/github/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('📥 Respuesta del backend:', {
        success: data.success,
        status: response.status,
        hasUser: !!data.user,
        hasToken: !!data.access_token
      });

      if (response.ok && data.success) {
        // Guardar datos del usuario igual que handleLogin normal
        const userData = {
          token: data.token, // JWT token del backend
          username: data.user.login,
          email: data.user.email,
          name: data.user.name,
          provider: 'github',
          loginTime: new Date().toISOString(),
        };

        // Guardar tanto el JWT como el access token de GitHub
        await AsyncStorage.setItem('userToken', data.token); // JWT token como en handleLogin
        await AsyncStorage.setItem('githubAccessToken', data.access_token); // Access token de GitHub separado
        await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Activar biométrico automáticamente para futuros logins
        setHasStoredCredentials(true);
        
        Alert.alert(
          'Éxito',
          'Inicio de sesión con GitHub exitoso',
          [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
        );
      } else {
        console.error('❌ Error del backend:', data);
        Alert.alert('Error', data.error || 'Error al autenticar con GitHub');
      }
    } catch (error) {
      console.error('❌ Error handling GitHub auth code:', error);
      Alert.alert('Error', 'No se pudo completar la autenticación con GitHub');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "light-content"} 
        backgroundColor={colors.primary} 
      />
      
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
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nombre de usuario"
                  placeholderTextColor={colors.textLight}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textLight}
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
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor={colors.textLight}
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
                      color={colors.textSecondary}
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

              {isLogin && (
                <>
                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>o continúa con</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* GitHub Login Button */}
                  <TouchableOpacity
                    style={[styles.githubButton, loading && styles.submitButtonDisabled]}
                    onPress={handleGitHubLogin}
                    disabled={loading}
                  >
                    <Ionicons name="logo-github" size={24} color="white" />
                    <Text style={styles.githubButtonText}>
                      Continuar con GitHub
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {isLogin && biometricAvailable && hasStoredCredentials && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricAuth}
                >
                  <Ionicons name="finger-print" size={24} color={colors.primary} />
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

const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
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
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
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
  actionSection: {
    gap: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  biometricButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24292e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  githubButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;