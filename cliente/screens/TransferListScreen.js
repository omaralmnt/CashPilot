import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar el componente TransferScreen para usarlo como modal
import TransferScreen from './TransferScreen';

const TransferListScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'sent', 'received'

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    loadUserData();
  }, []);

  // Recargar transferencias cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadTransfers();
      }
    }, [currentUser])
  );

  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const decodedPayload = atob(base64);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const decodedToken = decodeToken(token);
        if (decodedToken && decodedToken.id_usuario) {
          setCurrentUser(decodedToken);
          loadTransfers(decodedToken.id_usuario);
        } else {
          throw new Error('Token inválido');
        }
      } else {
        throw new Error('No hay token de autenticación');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
  };

  const loadTransfers = async (userId = null) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userIdToUse = userId || currentUser?.id_usuario;
      
      if (!userIdToUse) {
        throw new Error('Usuario no identificado');
      }

      console.log('Cargando transferencias para usuario:', userIdToUse);
      
      const response = await fetch(`${API_BASE_URL}/api/transferencia/usuario/${userIdToUse}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Transfers response status:', response.status);

      const responseText = await response.text();
      console.log('Transfers response text:', responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed transfers data:', data);
          
          // Ordenar transferencias por fecha (más recientes primero)
          const sortedTransfers = (data.transferencias || []).sort((a, b) => 
            new Date(b.fecha_transferencia) - new Date(a.fecha_transferencia)
          );
          
          setTransfers(sortedTransfers);
        } catch (parseError) {
          console.error('JSON Parse Error for transfers:', parseError);
          throw new Error('Respuesta del servidor inválida al cargar transferencias');
        }
      } else {
        throw new Error(`Error al cargar las transferencias: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading transfers:', error);
      Alert.alert('Error', 'No se pudieron cargar las transferencias: ' + error.message);
      // Usar datos de ejemplo en caso de error
      setTransfers(getSampleTransfers());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransfers();
  }, [currentUser]);

  // Datos de ejemplo como fallback
  const getSampleTransfers = () => [
    {
      id_transferencia: 1,
      monto: 1500.00,
      concepto: 'Pago de renta',
      fecha_transferencia: '2024-08-13T10:30:00Z',
      comision: 0.00,
      cuenta_origen: {
        id_cuenta: 1,
        nombre_banco: 'BBVA Bancomer',
        tipo_cuenta: 'Cuenta de Débito',
        numero: '****1234',
        codigo_hex: '#004481'
      },
      cuenta_destino: {
        id_cuenta: 2,
        nombre_banco: 'Banamex',
        tipo_cuenta: 'Cuenta de Ahorros',
        numero: '****5678',
        codigo_hex: '#E31837'
      },
      id_usuario_origen: currentUser?.id_usuario,
      id_usuario_destino: 2
    },
    {
      id_transferencia: 2,
      monto: 500.00,
      concepto: 'Transferencia recibida',
      fecha_transferencia: '2024-08-12T15:45:00Z',
      comision: 5.00,
      cuenta_origen: {
        id_cuenta: 3,
        nombre_banco: 'Santander',
        tipo_cuenta: 'Cuenta de Nómina',
        numero: '****9012',
        codigo_hex: '#EC0000'
      },
      cuenta_destino: {
        id_cuenta: 1,
        nombre_banco: 'BBVA Bancomer',
        tipo_cuenta: 'Cuenta de Débito',
        numero: '****1234',
        codigo_hex: '#004481'
      },
      id_usuario_origen: 3,
      id_usuario_destino: currentUser?.id_usuario
    },
  ];

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoy ${date.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const getWalletIcon = (tipoParam) => {
    const tipo = tipoParam?.toLowerCase() || '';
    
    if (tipo.includes('corriente') || tipo.includes('débito') || tipo.includes('efectivo')) {
      return 'business';
    } else if (tipo.includes('crédito')) {
      return 'card';
    } else if (tipo.includes('ahorros')) {
      return 'wallet';
    } else if (tipo.includes('digital')) {
      return 'phone-portrait';
    } else if (tipo.includes('inversión')) {
      return 'trending-up';
    }
    
    return 'wallet';
  };

  const getTransferType = (transfer) => {
    const isOutgoing = transfer.id_usuario_origen === currentUser?.id_usuario;
    return isOutgoing ? 'sent' : 'received';
  };

  const getFilteredTransfers = () => {
    if (filterType === 'all') return transfers;
    return transfers.filter(transfer => getTransferType(transfer) === filterType);
  };

  const handleTransferPress = (transfer) => {
    Alert.alert(
      'Detalle de Transferencia',
      `Monto: ${formatCurrency(transfer.monto)}\n` +
      `De: ${transfer.cuenta_origen.nombre_banco}\n` +
      `Para: ${transfer.cuenta_destino.nombre_banco}\n` +
      `Fecha: ${formatDate(transfer.fecha_transferencia)}\n` +
      `${transfer.concepto ? `Concepto: ${transfer.concepto}\n` : ''}` +
      `${transfer.comision > 0 ? `Comisión: ${formatCurrency(transfer.comision)}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const handleNewTransfer = () => {
    // Opción 1: Navegar a la pantalla de transferencia
    // navigation.navigate('TransferScreen');
    
    // Opción 2: Abrir como modal
    setShowTransferModal(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Transferencias</Text>
      
      <TouchableOpacity 
        style={styles.newTransferButton}
        onPress={handleNewTransfer}
      >
        <Ionicons name="add" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
        onPress={() => setFilterType('all')}
      >
        <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
          Todas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filterType === 'sent' && styles.filterTabActive]}
        onPress={() => setFilterType('sent')}
      >
        <Text style={[styles.filterTabText, filterType === 'sent' && styles.filterTabTextActive]}>
          Enviadas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filterType === 'received' && styles.filterTabActive]}
        onPress={() => setFilterType('received')}
      >
        <Text style={[styles.filterTabText, filterType === 'received' && styles.filterTabTextActive]}>
          Recibidas
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransferItem = ({ item: transfer }) => {
    const isOutgoing = getTransferType(transfer) === 'sent';
    const account = isOutgoing ? transfer.cuenta_destino : transfer.cuenta_origen;
    
    return (
      <TouchableOpacity
        style={styles.transferItem}
        onPress={() => handleTransferPress(transfer)}
      >
        <View style={styles.transferItemLeft}>
          <View style={[
            styles.transferIcon,
            { backgroundColor: (account.codigo_hex || '#666666') + '20' }
          ]}>
            <Ionicons
              name={isOutgoing ? 'arrow-up' : 'arrow-down'}
              size={20}
              color={isOutgoing ? colors.error : colors.success}
            />
          </View>
          
          <View style={styles.transferDetails}>
            <Text style={styles.transferTitle}>
              {isOutgoing ? 'Enviado a' : 'Recibido de'} {account.nombre_banco}
            </Text>
            <Text style={styles.transferSubtitle}>
              {account.tipo_cuenta} • {account.numero}
            </Text>
            {transfer.concepto && (
              <Text style={styles.transferConcept} numberOfLines={1}>
                {transfer.concepto}
              </Text>
            )}
            <Text style={styles.transferDate}>
              {formatDate(transfer.fecha_transferencia)}
            </Text>
          </View>
        </View>
        
        <View style={styles.transferItemRight}>
          <Text style={[
            styles.transferAmount,
            { color: isOutgoing ? colors.error : colors.success }
          ]}>
            {isOutgoing ? '-' : '+'}{formatCurrency(transfer.monto)}
          </Text>
          {transfer.comision > 0 && (
            <Text style={styles.transferFee}>
              Comisión: {formatCurrency(transfer.comision)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="swap-horizontal-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyStateTitle}>No hay transferencias</Text>
      <Text style={styles.emptyStateSubtitle}>
        {filterType === 'all' 
          ? 'Aún no has realizado ninguna transferencia'
          : filterType === 'sent'
          ? 'No has enviado transferencias'
          : 'No has recibido transferencias'
        }
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleNewTransfer}>
        <Text style={styles.emptyStateButtonText}>Realizar primera transferencia</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleNewTransfer}>
        <View style={styles.quickActionIcon}>
          <Ionicons name="add" size={24} color="white" />
        </View>
        <Text style={styles.quickActionText}>Nueva Transferencia</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
        onPress={() => Alert.alert('Próximamente', 'Función de transferencia programada próximamente')}
      >
        <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>
          Programar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransferModal = () => (
    <Modal
      visible={showTransferModal}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowTransferModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowTransferModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nueva Transferencia</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Aquí puedes incluir el componente TransferScreen o su contenido */}
        {/* Por simplicidad, voy a mostrar un placeholder */}
        <View style={styles.modalContent}>
          <TransferScreen 
            onTransferComplete={() => {
              setShowTransferModal(false);
              loadTransfers(); // Recargar transferencias
            }}
          />
        </View>
      </View>
    </Modal>
  );

  if (isLoading && transfers.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando transferencias...</Text>
      </View>
    );
  }

  const filteredTransfers = getFilteredTransfers();

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.background} 
      />
      
      {renderHeader()}
      {renderQuickActions()}
      {renderFilterTabs()}
      
      {filteredTransfers.length === 0 ? (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          style={styles.content}
          data={filteredTransfers}
          renderItem={renderTransferItem}
          keyExtractor={(item) => item.id_transferencia.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {renderTransferModal()}
    </View>
  );
};

const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  newTransferButton: {
    padding: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  quickActionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickActionIconSecondary: {
    backgroundColor: colors.primaryLight,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  quickActionTextSecondary: {
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transferItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transferIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transferDetails: {
    flex: 1,
  },
  transferTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transferSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transferConcept: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  transferDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  transferItemRight: {
    alignItems: 'flex-end',
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transferFee: {
    fontSize: 11,
    color: colors.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
  },
});

export default TransferListScreen;