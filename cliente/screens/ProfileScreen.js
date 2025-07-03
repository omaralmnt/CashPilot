import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

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
      console.log('Error loading user info:', error);
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
              console.log('Error al cerrar sesión:', error);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'white',
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
    borderColor: '#E8ECFF',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
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
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
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
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  statDescription: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
    textAlign: 'center',
  },
  infoContainer: {
    margin: 20,
    padding: 25,
    backgroundColor: 'white',
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
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: '#7F8C8D',
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
    backgroundColor: 'white',
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
});

export default ProfileScreen;