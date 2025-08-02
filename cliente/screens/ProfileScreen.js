import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  Platform,
  Appearance,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext'; // Ajusta la ruta según tu estructura

const ProfileScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  // Usar el contexto de tema
  const {
    themeMode,
    currentTheme,
    isDark,
    colors,
    setThemeMode,
    getThemeDisplayName,
    getThemeIcon,
    forceUpdate,
    setForceUpdate,
  } = useTheme();

  // Crear estilos usando el hook personalizado
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    loadUserInfo();
  }, []);

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
              <Ionicons name="close" size={24} color={colors.text} />
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
                setThemeMode(theme);
                setShowThemeModal(false);
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons 
                  name={getThemeIcon(theme)} 
                  size={24} 
                  color={themeMode === theme ? colors.primary : colors.text} 
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
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          
          {/* Información de depuración (solo durante desarrollo) */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Appearance: {Appearance.getColorScheme()} | Platform: {Platform.OS}
              </Text>
              <Text style={styles.debugText}>
                Modo: {themeMode} | Actual: {currentTheme}
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
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
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

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
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
                color={colors.primary} 
              />
              <View style={styles.themeSelectorText}>
                <Text style={styles.themeSelectorTitle}>Tema</Text>
                <Text style={styles.themeSelectorSubtitle}>
                  {getThemeDisplayName(themeMode)}
                  {themeMode === 'system' && ` (${currentTheme === 'dark' ? 'Oscuro' : 'Claro'})`}
                </Text>
              </View>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.statLabel}>Control Total</Text>
            <Text style={styles.statDescription}>de tus finanzas</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={24} color={colors.success} />
            <Text style={styles.statLabel}>Crecimiento</Text>
            <Text style={styles.statDescription}>inteligente</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} />
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
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ThemeModal />
    </View>
  );
};

// Función para crear estilos que recibe el objeto theme
const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.statusBarBackground,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 8,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  userSubtitle: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: 15,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
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
    color: colors.text,
  },
  themeSelectorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
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
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  statDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  infoContainer: {
    margin: 20,
    padding: 25,
    backgroundColor: colors.surface,
    borderRadius: 15,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutContainer: {
    margin: 20,
    marginBottom: 30, // Espacio extra al final
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // ScrollView styles
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Espacio extra al final del scroll
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    borderBottomColor: colors.separator,
  },
  selectedThemeOption: {
    backgroundColor: colors.surfaceSecondary,
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
    color: colors.text,
  },
  selectedThemeText: {
    color: colors.primary,
  },
  themeOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  debugInfo: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  debugText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 5,
  },
  debugButton: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  debugButtonText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ProfileScreen;