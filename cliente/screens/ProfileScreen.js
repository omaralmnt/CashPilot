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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import EditProfileModal from './EditProfileModal';

const ProfileScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false); // Nuevo estado
  
  // Hook de traducción
  const { t, i18n } = useTranslation();
  
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
        setUserName(payload.nombre || t('profile.defaultUser'));
        setUserEmail(payload.correo || '');
        setUserUsername(payload.username || '');
        setUserId(payload.id_usuario || '');
      }
    } catch (error) {
      console.log('❌ Error loading user info:', error);
      setUserName(t('profile.defaultUser'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('profile.logout'),
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

  const handleEditProfileSuccess = (updatedData) => {
    // Actualizar la información local cuando se edite el perfil exitosamente
    setUserName(updatedData.nombre);
    setUserEmail(updatedData.correo);
    setUserUsername(updatedData.username);
    
    console.log('🔄 Datos del perfil actualizados localmente:', updatedData);
    
    // Si el token fue actualizado, recargar información completa
    if (updatedData.tokenActualizado) {
      console.log('🔄 Token actualizado, recargando información...');
      loadUserInfo();
    }
  };

  // SOLUCIÓN PRINCIPAL: Cambio de idioma optimizado
  const changeLanguage = async (language) => {
    if (isChangingLanguage) return; // Prevenir múltiples ejecuciones
    
    try {
      setIsChangingLanguage(true);
      
      // Cerrar el modal inmediatamente para una mejor UX
      setShowLanguageModal(false);
      
      // Usar setTimeout para permitir que la UI se actualice
      setTimeout(async () => {
        try {
          console.log('🌐 Cambiando idioma a:', language);
          
          // Cambiar idioma
          await i18n.changeLanguage(language);
          
          // Guardar preferencia
          await AsyncStorage.setItem('selectedLanguage', language);
          
          console.log('✅ Idioma cambiado exitosamente');
          
          // Pequeña pausa adicional para asegurar que el cambio se procese
          setTimeout(() => {
            setIsChangingLanguage(false);
          }, 300);
          
        } catch (error) {
          console.log('❌ Error cambiando idioma:', error);
          setIsChangingLanguage(false);
        }
      }, 100);
      
    } catch (error) {
      console.log('❌ Error en changeLanguage:', error);
      setIsChangingLanguage(false);
    }
  };

  const getLanguageDisplayName = (code) => {
    const languages = {
      es: 'Español',
      en: 'English'
    };
    return languages[code] || code;
  };

  const getLanguageFlag = (code) => {
    const flags = {
      es: '🇪🇸',
      en: '🇺🇸'
    };
    return flags[code] || '🌐';
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
            <Text style={styles.modalTitle}>{t('profile.selectTheme')}</Text>
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
                    {t(`profile.theme.${theme}`)}
                  </Text>
                  <Text style={styles.themeOptionDescription}>
                    {t(`profile.themeDescription.${theme}`)}
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

  // Modal de idioma mejorado con loading state
  const LanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => !isChangingLanguage && setShowLanguageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            <TouchableOpacity 
              onPress={() => !isChangingLanguage && setShowLanguageModal(false)}
              style={[styles.closeButton, isChangingLanguage && { opacity: 0.5 }]}
              disabled={isChangingLanguage}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {isChangingLanguage && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Cambiando idioma...</Text>
            </View>
          )}
          
          {['es', 'en'].map((language) => (
            <TouchableOpacity
              key={language}
              style={[
                styles.themeOption,
                i18n.language === language && styles.selectedThemeOption,
                isChangingLanguage && { opacity: 0.5 }
              ]}
              onPress={() => !isChangingLanguage && changeLanguage(language)}
              disabled={isChangingLanguage}
            >
              <View style={styles.themeOptionLeft}>
                <Text style={styles.languageFlag}>{getLanguageFlag(language)}</Text>
                <View style={styles.themeOptionText}>
                  <Text style={[
                    styles.themeOptionTitle,
                    i18n.language === language && styles.selectedThemeText
                  ]}>
                    {getLanguageDisplayName(language)}
                  </Text>
                  <Text style={styles.themeOptionDescription}>
                    {language === 'es' ? 'Idioma español' : 'English language'}
                  </Text>
                </View>
              </View>
              {i18n.language === language && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  // Overlay de carga cuando se está cambiando el idioma
  const LoadingOverlay = () => (
    isChangingLanguage && (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingOverlayText}>Aplicando cambios...</Text>
        </View>
      </View>
    )
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
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
        scrollEnabled={!isChangingLanguage} // Deshabilitar scroll durante cambio
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(userName)}
              </Text>
            </View>
            {/* Botón de editar perfil en el avatar */}
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => setShowEditModal(true)}
              disabled={isChangingLanguage}
            >
              <Ionicons name="pencil" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userName}</Text>
          {userEmail ? (
            <Text style={styles.userEmail}>{userEmail}</Text>
          ) : null}
          <Text style={styles.userInfo}>{t('profile.subtitle')}</Text>
        </View>

        {/* Options Section */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          
          {/* Edit Profile Option */}
          <TouchableOpacity 
            style={[styles.optionItem, isChangingLanguage && { opacity: 0.5 }]}
            onPress={() => setShowEditModal(true)}
            disabled={isChangingLanguage}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('profile.editProfile')}</Text>
                <Text style={styles.optionSubtitle}>{t('profile.editProfileDescription')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Categorías Personalizadas Option */}
          <TouchableOpacity 
            style={[styles.optionItem, isChangingLanguage && { opacity: 0.5 }]}
            onPress={() => navigation.navigate('CategoriasPersonalizadas')}
            disabled={isChangingLanguage}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="albums-outline" size={24} color={colors.primary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('profile.customCategories')}</Text>
                <Text style={styles.optionSubtitle}>{t('profile.customCategoriesDescription')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Language Selection */}
          <TouchableOpacity 
            style={[styles.optionItem, isChangingLanguage && { opacity: 0.5 }]}
            onPress={() => setShowLanguageModal(true)}
            disabled={isChangingLanguage}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="language-outline" size={24} color={colors.primary} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('profile.language')}</Text>
                <Text style={styles.optionSubtitle}>
                  {getLanguageDisplayName(i18n.language)} {getLanguageFlag(i18n.language)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Theme Selection */}
          <TouchableOpacity 
            style={[styles.optionItem, isChangingLanguage && { opacity: 0.5 }]}
            onPress={() => setShowThemeModal(true)}
            disabled={isChangingLanguage}
          >
            <View style={styles.optionLeft}>
              <Ionicons 
                name={getThemeIcon(themeMode)} 
                size={24} 
                color={colors.primary} 
              />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('profile.theme.title')}</Text>
                <Text style={styles.optionSubtitle}>
                  {t(`profile.theme.${themeMode}`)}
                  {themeMode === 'system' && ` (${currentTheme === 'dark' ? t('profile.theme.dark') : t('profile.theme.light')})`}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.statLabel}>{t('profile.stats.totalControl')}</Text>
            <Text style={styles.statDescription}>{t('profile.stats.finances')}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={24} color={colors.success} />
            <Text style={styles.statLabel}>{t('profile.stats.growth')}</Text>
            <Text style={styles.statDescription}>{t('profile.stats.intelligent')}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} />
            <Text style={styles.statLabel}>{t('profile.stats.security')}</Text>
            <Text style={styles.statDescription}>{t('profile.stats.guaranteed')}</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{t('profile.appInfo.title')}</Text>
          <Text style={styles.infoDescription}>
            {t('profile.appInfo.description')}
          </Text>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={[styles.logoutButton, isChangingLanguage && { opacity: 0.5 }]}
            onPress={handleLogout}
            disabled={isChangingLanguage}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <ThemeModal />
      <LanguageModal />
      <EditProfileModal 
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditProfileSuccess}
      />
      
      {/* Loading Overlay */}
      <LoadingOverlay />
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
    position: 'relative',
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
  editProfileButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
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
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsSection: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionSubtitle: {
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
    marginBottom: 30,
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
  // Modal styles para el ThemeModal y LanguageModal
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
  languageFlag: {
    fontSize: 24,
    marginRight: 0,
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
  // NUEVOS ESTILOS para loading states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingOverlayText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default ProfileScreen;