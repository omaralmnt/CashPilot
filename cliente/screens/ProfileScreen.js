import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+1 (555) 123-4567',
    memberSince: 'Enero 2023',
  });

  const [editForm, setEditForm] = useState({
    name: userInfo.name,
    email: userInfo.email,
    phone: userInfo.phone,
  });

  const accountStats = {
    totalTransactions: 247,
    categoriesUsed: 12,
    savedAmount: 1250.50,
    budgetsCreated: 8,
  };

  const renderProfileHeader = () => (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userInfo.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <TouchableOpacity style={styles.editAvatarButton}>
          <Text style={styles.editAvatarIcon}>📷</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.userName}>{userInfo.name}</Text>
      <Text style={styles.userEmail}>{userInfo.email}</Text>
      <Text style={styles.memberSince}>Miembro desde {userInfo.memberSince}</Text>
      
      <TouchableOpacity 
        style={styles.editProfileButton}
        onPress={() => setEditModalVisible(true)}
      >
        <Text style={styles.editProfileText}>Editar Perfil</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAccountStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Estadísticas de Cuenta</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{accountStats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transacciones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{accountStats.categoriesUsed}</Text>
          <Text style={styles.statLabel}>Categorías</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4ECDC4' }]}>
            ${accountStats.savedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statLabel}>Ahorrado</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{accountStats.budgetsCreated}</Text>
          <Text style={styles.statLabel}>Presupuestos</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#4ECDC4' }]}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>Exportar Datos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#45B7D1' }]}>
          <Text style={styles.quickActionIcon}>🔄</Text>
          <Text style={styles.quickActionText}>Sincronizar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#F7DC6F' }]}>
          <Text style={styles.quickActionIcon}>💾</Text>
          <Text style={styles.quickActionText}>Respaldo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#A8E6CF' }]}>
          <Text style={styles.quickActionIcon}>📱</Text>
          <Text style={styles.quickActionText}>Compartir App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Configuración</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Notificaciones</Text>
          <Text style={styles.settingDescription}>Recibir alertas de presupuesto</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E0E6ED', true: '#667eea' }}
          thumbColor={notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Autenticación Biométrica</Text>
          <Text style={styles.settingDescription}>Usar huella o Face ID</Text>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={setBiometricEnabled}
          trackColor={{ false: '#E0E6ED', true: '#667eea' }}
          thumbColor={biometricEnabled ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Modo Oscuro</Text>
          <Text style={styles.settingDescription}>Cambiar tema de la app</Text>
        </View>
        <Switch
          value={darkModeEnabled}
          onValueChange={setDarkModeEnabled}
          trackColor={{ false: '#E0E6ED', true: '#667eea' }}
          thumbColor={darkModeEnabled ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  const renderMenuOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Más Opciones</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <Text style={styles.menuIcon}>🔒</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Privacidad y Seguridad</Text>
          <Text style={styles.menuDescription}>Gestionar permisos y datos</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <Text style={styles.menuIcon}>❓</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Ayuda y Soporte</Text>
          <Text style={styles.menuDescription}>FAQ y contacto</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <Text style={styles.menuIcon}>📄</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Términos y Condiciones</Text>
          <Text style={styles.menuDescription}>Políticas de uso</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <Text style={styles.menuIcon}>ℹ️</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Acerca de</Text>
          <Text style={styles.menuDescription}>Versión 2.1.0</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDangerZone = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Zona de Peligro</Text>
      
      <TouchableOpacity 
        style={[styles.menuItem, { borderColor: '#FF6B6B', borderWidth: 1 }]}
        onPress={() => Alert.alert(
          'Cerrar Sesión',
          '¿Estás seguro de que quieres cerrar sesión?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar Sesión', style: 'destructive' }
          ]
        )}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: '#FF6B6B20' }]}>
          <Text style={styles.menuIcon}>🚪</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: '#FF6B6B' }]}>Cerrar Sesión</Text>
          <Text style={styles.menuDescription}>Salir de tu cuenta</Text>
        </View>
        <Text style={[styles.menuArrow, { color: '#FF6B6B' }]}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const handleSaveProfile = () => {
    setUserInfo({
      ...userInfo,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    });
    setEditModalVisible(false);
    Alert.alert('Éxito', 'Perfil actualizado correctamente');
  };

  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.name}
              onChangeText={(text) => setEditForm({...editForm, name: text})}
              placeholder="Tu nombre completo"
              placeholderTextColor="#7F8C8D"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.email}
              onChangeText={(text) => setEditForm({...editForm, email: text})}
              placeholder="tu@email.com"
              placeholderTextColor="#7F8C8D"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.phone}
              onChangeText={(text) => setEditForm({...editForm, phone: text})}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#7F8C8D"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setEditForm({
                  name: userInfo.name,
                  email: userInfo.email,
                  phone: userInfo.phone,
                });
                setEditModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderAccountStats()}
        {renderQuickActions()}
        {renderSettings()}
        {renderMenuOptions()}
        {renderDangerZone()}
      </ScrollView>
      
      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    margin: 20,
    marginTop: 50,
    padding: 25,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  editAvatarIcon: {
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 5,
  },
  memberSince: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 20,
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 60) / 2,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  menuArrow: {
    fontSize: 24,
    color: '#7F8C8D',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 25,
    width: width - 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E6ED',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;