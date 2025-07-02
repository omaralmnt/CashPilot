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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

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
  
  // Animaciones
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    checkBiometricAvailability();
    checkStoredCredentials();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
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
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar con Face ID',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          Alert.alert(
            'Bienvenido',
            `Hola ${userData.username}!`,
            [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo autenticar con Face ID');
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
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      const user = userList.find(u => u.username === username && u.password === password);
      
      if (user) {
        // Guardar usuario actual
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        
        Alert.alert(
          'Bienvenido',
          `Hola ${user.username}!`,
          [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
        );
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
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = await AsyncStorage.getItem('users');
      const userList = users ? JSON.parse(users) : [];
      
      // Verificar si el usuario ya existe
      const existingUser = userList.find(u => u.username === username);
      if (existingUser) {
        Alert.alert('Error', 'El nombre de usuario ya está en uso');
        setLoading(false);
        return;
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: Date.now().toString(),
        username,
        password,
        createdAt: new Date().toISOString(),
      };
      
      userList.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(userList));
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      
      Alert.alert(
        'Registro exitoso',
        `¡Bienvenido ${username}! Tu cuenta ha sido creada correctamente.`,
        [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.headerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Ionicons name="wallet" size={40} color="white" />
        </View>
        <Text style={styles.appName}>CashPilot</Text>
        <Text style={styles.appSubtitle}>Tu piloto financiero personal</Text>
      </View>
    </Animated.View>
  );

  const renderBiometricButton = () => {
    if (!biometricAvailable || !hasStoredCredentials) return null;

    return (
      <TouchableOpacity
        style={styles.biometricButton}
        onPress={handleBiometricAuth}
      >
        <Ionicons name="finger-print" size={24} color="#667eea" />
        <Text style={styles.biometricButtonText}>Usar Face ID / Touch ID</Text>
      </TouchableOpacity>
    );
  };

  const renderForm = () => (
    <Animated.View 
      style={[
        styles.formContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
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

      <View style={styles.inputContainer}>
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

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={isLogin ? handleLogin : handleRegister}
        disabled={loading}
      >
        {loading ? (
          <Text style={styles.submitButtonText}>Cargando...</Text>
        ) : (
          <Text style={styles.submitButtonText}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </Text>
        )}
      </TouchableOpacity>

      {isLogin && renderBiometricButton()}

      {isLogin && (
        <TouchableOpacity style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderHeader()}
        {renderForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    minHeight: 500,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  toggleButtonTextActive: {
    color: '#2C3E50',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  eyeIcon: {
    padding: 5,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
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
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 10,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
});

export default LoginScreen;