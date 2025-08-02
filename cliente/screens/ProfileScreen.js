import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  useColorScheme,
  Appearance,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Para forzar re-renders
  
  const systemColorScheme = useColorScheme();
  
  // Función mejorada para detectar el tema del sistema
  const getSystemTheme = () => {
    // Método 1: useColorScheme
    const hookTheme = systemColorScheme;
    
    // Método 2: Appearance.getColorScheme (más confiable)
    const appearanceTheme = Appearance.getColorScheme();
    
    console.log('🔍 Hook theme:', hookTheme);
    console.log('🔍 Appearance theme:', appearanceTheme);
    
    // Priorizar Appearance.getColorScheme si está disponible
    const detectedTheme = appearanceTheme || hookTheme || 'light';
    
    console.log('🎯 Tema final detectado:', detectedTheme);
    return detectedTheme;
  };
  
  // Determinar el tema actual basado en la configuración
  const getCurrentTheme = () => {
    console.log('🎨 themeMode:', themeMode);
    
    if (themeMode === 'system') {
      const systemTheme = getSystemTheme();
      const result = systemTheme === 'dark' ? 'dark' : 'light';
      console.log('🎨 Tema resultante del sistema:', result);
      return result;
    }
    
    console.log('🎨 Tema manual:', themeMode);
    return themeMode;
  };
  
  const currentTheme = getCurrentTheme();
  const isDark = currentTheme === 'dark';

  useEffect(() => {
    loadUserInfo();
    loadThemePreference();

    // Función para manejar cambios de tema
    const handleThemeChange = ({ colorScheme }) => {
      console.log('🔄 Tema del sistema cambió a:', colorScheme);
      console.log('🔄 Appearance.getColorScheme():', Appearance.getColorScheme());
      
      // Forzar re-render si estamos en modo sistema
      if (themeMode === 'system') {
        setForceUpdate(prev => prev + 1);
      }
    };

    // Listener para detectar cambios de tema del sistema
    const subscription = Appearance.addChangeListener(handleThemeChange);

    // Log inicial del estado del sistema
    console.log('📱 Tema inicial del sistema (Appearance):', Appearance.getColorScheme());
    console.log('📱 Tema inicial del sistema (Hook):', systemColorScheme);
    console.log('📱 Platform:', Platform.OS, Platform.Version);

    return () => {
      console.log('🧹 Limpiando listener de tema');
      subscription?.remove();
    };
  }, []);

  // Re-ejecutar cuando cambie el themeMode o forceUpdate
  useEffect(() => {
    console.log('⚙️ ThemeMode o forceUpdate cambió:', themeMode, forceUpdate);
  }, [themeMode, forceUpdate]);

  const loadUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        // Decodificar el JWT para obtener la información del usuario
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserName(payload.nombre || 'Usuario');
        setUserId(payload.id_usuario || '');
      }
    } catch (error) {
      console.log('❌ Error loading user info:', error);
      setUserName('Usuario');
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        console.log('📱 Tema guardado encontrado:', savedTheme);
        setThemeMode(savedTheme);
      } else {
        console.log('📱 No hay tema guardado, usando sistema por defecto');
      }
    } catch (error) {
      console.log('❌ Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (theme) => {
    try {
      await AsyncStorage.setItem('themeMode', theme);
      setThemeMode(theme);
      console.log('💾 Tema guardado:', theme);
    } catch (error) {
      console.log('❌ Error saving theme preference:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userToken', 'currentUser']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.log('❌ Error al cerrar sesión:', error);
            }
          }
        }
      ]
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getThemeDisplayName = (theme) => {
    const names = {
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema'
    };
    return names[theme] || 'Sistema';
  };

  const getThemeIcon = (theme) => {
    const icons = {
      light: 'sunny-outline',
      dark: 'moon-outline',
      system: 'phone-portrait-outline'
    };
    return icons[theme] || 'phone-portrait-outline';
  };

  const styles = getStyles(isDark);

  const ThemeModal = () => (
    <Modal
      visible={showThemeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Tema</Text>
            <TouchableOpacity 
              onPress={() => setShowThemeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#2C3E50'} />
            </TouchableOpacity>
          </View>
          
          {['light', 'dark', 'system'].map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.themeOption,
                themeMode === theme && styles.selectedThemeOption
              ]}
              onPress={() => {
                saveThemePreference(theme);
                setShowThemeModal(false);
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons 
                  name={getThemeIcon(theme)} 
                  size={24} 
                  color={themeMode === theme ? '#667eea' : (isDark ? '#FFFFFF' : '#2C3E50')} 
                />
                <View style={styles.themeOptionText}>
                  <Text style={[
                    styles.themeOptionTitle,
                    themeMode === theme && styles.selectedThemeText
                  ]}>
                    Modo {getThemeDisplayName(theme)}
                  </Text>
                  <Text style={styles.themeOptionDescription}>
                    {theme === 'light' && 'Interfaz clara para mejor visibilidad diurna'}
                    {theme === 'dark' && 'Interfaz oscura para reducir fatiga visual'}
                    {theme === 'system' && 'Sigue la configuración del sistema automáticamente'}
                  </Text>
                </View>
              </View>
              {themeMode === theme && (
                <Ionicons name="checkmark" size={20} color="#667eea" />
              )}
            </TouchableOpacity>
          ))}
          
          {/* Información de depuración (solo durante desarrollo) */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Hook: {systemColorScheme} | Appearance: {Appearance.getColorScheme()}
              </Text>
              <Text style={styles.debugText}>
                Modo: {themeMode} | Actual: {currentTheme} | Platform: {Platform.OS}
              </Text>
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => {
                  console.log('🔄 Forzando actualización...');
                  setForceUpdate(prev => prev + 1);
                }}
              >
                <Text style={styles.debugButtonText}>Forzar Actualización</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#1a1a1a" : "#667eea"} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        {/* Indicador visual del tema actual (solo en desarrollo) */}
        {__DEV__ && (
          <Text style={styles.themeIndicator}>
            {currentTheme === 'dark' ? '🌙' : '☀️'} {currentTheme}
          </Text>
        )}
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(userName)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userSubtitle}>Miembro de CashPilot</Text>
        <Text style={styles.userInfo}>Gestiona tus finanzas de manera inteligente</Text>
      </View>

      {/* Theme Selection */}
      <View style={styles.themeSection}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <TouchableOpacity 
          style={styles.themeSelector}
          onPress={() => setShowThemeModal(true)}
        >
          <View style={styles.themeSelectorLeft}>
            <Ionicons 
              name={getThemeIcon(themeMode)} 
              size={24} 
              color={isDark ? '#FFFFFF' : '#667eea'} 
            />
            <View style={styles.themeSelectorText}>
              <Text style={styles.themeSelectorTitle}>Tema</Text>
              <Text style={styles.themeSelectorSubtitle}>
                {getThemeDisplayName(themeMode)}
                {themeMode === 'system' && ` (${currentTheme === 'dark' ? 'Oscuro' : 'Claro'} - ${Appearance.getColorScheme() || 'null'})`}
              </Text>
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDark ? '#FFFFFF' : '#7F8C8D'} 
          />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="wallet-outline" size={24} color="#667eea" />
          <Text style={styles.statLabel}>Control Total</Text>
          <Text style={styles.statDescription}>de tus finanzas</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="trending-up-outline" size={24} color="#4ECDC4" />
          <Text style={styles.statLabel}>Crecimiento</Text>
          <Text style={styles.statDescription}>inteligente</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#45B7D1" />
          <Text style={styles.statLabel}>Seguridad</Text>
          <Text style={styles.statDescription}>garantizada</Text>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>CashPilot v2.1.0</Text>
        <Text style={styles.infoDescription}>
          Tu piloto financiero personal que te ayuda a navegar hacia tus metas económicas
        </Text>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <ThemeModal />
    </View>
  );
};

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#F8F9FA',
  },
  header: {
    backgroundColor: isDark ? '#1a1a1a' : '#667eea',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeIndicator: {
    position: 'absolute',
    right: 20,
    color: 'white',
    fontSize: 12,
    opacity: 0.7,
  },
  profileCard: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: isDark ? '#333' : '#E8ECFF',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#2C3E50',
    marginBottom: 5,
    textAlign: 'center',
  },
  userSubtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: isDark ? '#B0B0B0' : '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  themeSection: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#2C3E50',
    marginBottom: 15,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  themeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeSelectorText: {
    marginLeft: 15,
  },
  themeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#2C3E50',
  },
  themeSelectorSubtitle: {
    fontSize: 14,
    color: isDark ? '#B0B0B0' : '#7F8C8D',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  statDescription: {
    fontSize: 12,
    color: isDark ? '#B0B0B0' : '#7F8C8D',
    marginTop: 2,
    textAlign: 'center',
  },
  infoContainer: {
    margin: 20,
    padding: 25,
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: isDark ? '#B0B0B0' : '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutContainer: {
    margin: 20,
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#E0E6ED',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#2C3E50',
  },
  closeButton: {
    padding: 5,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#F0F0F0',
  },
  selectedThemeOption: {
    backgroundColor: isDark ? '#2A2A2A' : '#F8F9FF',
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionText: {
    marginLeft: 15,
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#2C3E50',
  },
  selectedThemeText: {
    color: '#667eea',
  },
  themeOptionDescription: {
    fontSize: 13,
    color: isDark ? '#B0B0B0' : '#7F8C8D',
    marginTop: 2,
  },
  debugInfo: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#333' : '#E0E6ED',
  },
  debugText: {
    fontSize: 11,
    color: isDark ? '#888' : '#999',
    textAlign: 'center',
    marginBottom: 5,
  },
  debugButton: {
    backgroundColor: isDark ? '#333' : '#E0E6ED',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  debugButtonText: {
    fontSize: 12,
    color: isDark ? '#FFF' : '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ProfileScreen;