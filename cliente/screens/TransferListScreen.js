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
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar el componente TransferScreen para usarlo como modal
import TransferScreen from './TransferScreen';

const { width } = Dimensions.get('window');

const TransferListScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'sent', 'received', 'internal'
  
  // Estados para filtros avanzados
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [amountFilter, setAmountFilter] = useState('all'); // 'all', 'low', 'medium', 'high', 'custom'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completada', 'pendiente', 'fallida'
  const [bankFilter, setBankFilter] = useState('all'); // 'all' o nombre del banco
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'amount_desc', 'amount_asc'
  
  // Estados para filtros personalizados
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [customAmountRange, setCustomAmountRange] = useState({ min: '', max: '' });

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
          
          const transfersData = data.data || [];
          
          // Mapear los datos del backend al formato que espera el frontend
          const mappedTransfers = transfersData.map(transfer => ({
            id_transferencia: transfer.id_transferencia,
            monto: parseFloat(transfer.monto),
            concepto: transfer.concepto,
            fecha_transferencia: transfer.fecha_hora,
            comision: parseFloat(transfer.comision || 0),
            // Información original del API para clasificar tipos
            tipo_transaccion: transfer.tipo_transaccion, // 'receive', 'payment', 'transfer'
            id_usuario: transfer.id_usuario,
            nombre_destinatario: transfer.nombre_destinatario,
            estado: transfer.estado,
            cuenta_origen: {
              id_cuenta: transfer.id_cuenta_origen,
              nombre_banco: transfer.banco_origen,
              tipo_cuenta: transfer.tipo_cuenta_origen,
              numero: transfer.cuenta_origen_numero ? `****${transfer.cuenta_origen_numero.slice(-4)}` : null,
              descripcion: transfer.cuenta_origen_descripcion,
              codigo_hex: '#004481' // Color por defecto
            },
            cuenta_destino: {
              id_cuenta: transfer.id_cuenta_destino,
              nombre_banco: transfer.banco_destino,
              tipo_cuenta: transfer.tipo_cuenta_destino,
              numero: transfer.cuenta_destino_numero ? `****${transfer.cuenta_destino_numero.slice(-4)}` : null,
              descripcion: transfer.cuenta_destino_descripcion,
              codigo_hex: '#E31837' // Color por defecto
            },
            // Información adicional
            usuario_nombre: transfer.usuario_nombre,
            usuario_destino_nombre: transfer.usuario_destino_nombre,
            categoria_descripcion: transfer.categoria_descripcion
          }));
          
          setTransfers(mappedTransfers);
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
      tipo_transaccion: 'payment',
      estado: 'completada',
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
      nombre_destinatario: 'Juan Pérez',
      id_usuario: currentUser?.id_usuario
    },
    {
      id_transferencia: 2,
      monto: 250.50,
      concepto: 'Compra de comida',
      fecha_transferencia: '2024-08-12T15:45:00Z',
      comision: 5.00,
      tipo_transaccion: 'receive',
      estado: 'completada',
      cuenta_origen: {
        id_cuenta: 3,
        nombre_banco: 'Santander',
        tipo_cuenta: 'Cuenta de Crédito',
        numero: '****9876',
        codigo_hex: '#EC0000'
      },
      cuenta_destino: {
        id_cuenta: 1,
        nombre_banco: 'BBVA Bancomer',
        tipo_cuenta: 'Cuenta de Débito',
        numero: '****1234',
        codigo_hex: '#004481'
      },
      nombre_destinatario: 'María López',
      id_usuario: currentUser?.id_usuario
    }
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

  // FUNCIÓN CORREGIDA para determinar el tipo de transferencia
  const getTransferType = (transfer) => {
    switch (transfer.tipo_transaccion) {
      case 'receive':
        return 'received'; // Dinero recibido de fuente externa
      case 'payment':
        return 'sent'; // Dinero enviado a destinatario externo
      case 'transfer':
        return 'internal'; // Transferencia interna entre cuentas propias
      default:
        return 'sent'; // Fallback
    }
  };

  // Función principal de filtrado
  const getFilteredTransfers = () => {
    let filtered = [...transfers];

    // Filtro por tipo de transferencia
    if (filterType !== 'all') {
      filtered = filtered.filter(transfer => getTransferType(transfer) === filterType);
    }

    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transfer => 
        transfer.concepto?.toLowerCase().includes(query) ||
        transfer.nombre_destinatario?.toLowerCase().includes(query) ||
        transfer.cuenta_origen?.nombre_banco?.toLowerCase().includes(query) ||
        transfer.cuenta_destino?.nombre_banco?.toLowerCase().includes(query) ||
        transfer.categoria_descripcion?.toLowerCase().includes(query)
      );
    }

    // Filtro por fecha
    filtered = filterByDate(filtered);

    // Filtro por monto
    filtered = filterByAmount(filtered);

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transfer => transfer.estado === statusFilter);
    }

    // Filtro por banco
    if (bankFilter !== 'all') {
      filtered = filtered.filter(transfer => 
        transfer.cuenta_origen?.nombre_banco === bankFilter ||
        transfer.cuenta_destino?.nombre_banco === bankFilter
      );
    }

    // Ordenar resultados
    filtered = sortTransfers(filtered);

    return filtered;
  };

  const filterByDate = (transfers) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return transfers.filter(transfer => {
          const transferDate = new Date(transfer.fecha_transferencia);
          const transferDay = new Date(transferDate.getFullYear(), transferDate.getMonth(), transferDate.getDate());
          return transferDay.getTime() === today.getTime();
        });
      
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transfers.filter(transfer => {
          const transferDate = new Date(transfer.fecha_transferencia);
          return transferDate >= weekAgo;
        });
      
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        return transfers.filter(transfer => {
          const transferDate = new Date(transfer.fecha_transferencia);
          return transferDate >= monthAgo;
        });
      
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          return transfers.filter(transfer => {
            const transferDate = new Date(transfer.fecha_transferencia);
            return transferDate >= startDate && transferDate <= endDate;
          });
        }
        return transfers;
      
      default:
        return transfers;
    }
  };

  const filterByAmount = (transfers) => {
    switch (amountFilter) {
      case 'low':
        return transfers.filter(transfer => transfer.monto < 500);
      
      case 'medium':
        return transfers.filter(transfer => transfer.monto >= 500 && transfer.monto <= 2000);
      
      case 'high':
        return transfers.filter(transfer => transfer.monto > 2000);
      
      case 'custom':
        const min = customAmountRange.min ? parseFloat(customAmountRange.min) : 0;
        const max = customAmountRange.max ? parseFloat(customAmountRange.max) : Infinity;
        return transfers.filter(transfer => transfer.monto >= min && transfer.monto <= max);
      
      default:
        return transfers;
    }
  };

  const sortTransfers = (transfers) => {
    switch (sortOrder) {
      case 'oldest':
        return transfers.sort((a, b) => new Date(a.fecha_transferencia) - new Date(b.fecha_transferencia));
      
      case 'amount_desc':
        return transfers.sort((a, b) => b.monto - a.monto);
      
      case 'amount_asc':
        return transfers.sort((a, b) => a.monto - b.monto);
      
      default: // 'newest'
        return transfers.sort((a, b) => new Date(b.fecha_transferencia) - new Date(a.fecha_transferencia));
    }
  };

  // Obtener bancos únicos para el filtro
  const getUniqueBanks = () => {
    const banks = new Set();
    transfers.forEach(transfer => {
      if (transfer.cuenta_origen?.nombre_banco) banks.add(transfer.cuenta_origen.nombre_banco);
      if (transfer.cuenta_destino?.nombre_banco) banks.add(transfer.cuenta_destino.nombre_banco);
    });
    return Array.from(banks).sort();
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setFilterType('all');
    setSearchQuery('');
    setDateFilter('all');
    setAmountFilter('all');
    setStatusFilter('all');
    setBankFilter('all');
    setSortOrder('newest');
    setCustomDateRange({ start: '', end: '' });
    setCustomAmountRange({ min: '', max: '' });
  };

  const handleTransferPress = (transfer) => {
    const transferType = getTransferType(transfer);
    let message = `Monto: ${formatCurrency(transfer.monto)}\n`;
    
    if (transferType === 'internal') {
      message += `De: ${transfer.cuenta_origen.descripcion || transfer.cuenta_origen.nombre_banco}\n`;
      message += `Para: ${transfer.cuenta_destino.descripcion || transfer.cuenta_destino.nombre_banco}\n`;
    } else if (transferType === 'sent') {
      message += `De: ${transfer.cuenta_origen.descripcion || transfer.cuenta_origen.nombre_banco}\n`;
      message += `Para: ${transfer.nombre_destinatario}\n`;
    } else { // received
      message += `De: ${transfer.nombre_destinatario || 'Externo'}\n`;
      message += `Para: ${transfer.cuenta_destino.descripcion || transfer.cuenta_destino.nombre_banco}\n`;
    }
    
    message += `Fecha: ${formatDate(transfer.fecha_transferencia)}\n`;
    
    if (transfer.concepto) {
      message += `Concepto: ${transfer.concepto}\n`;
    }
    
    if (transfer.comision > 0) {
      message += `Comisión: ${formatCurrency(transfer.comision)}\n`;
    }
    
    if (transfer.categoria_descripcion) {
      message += `Categoría: ${transfer.categoria_descripcion}\n`;
    }

    message += `Estado: ${transfer.estado}`;

    Alert.alert('Detalle de Transferencia', message, [{ text: 'OK' }]);
  };

  const handleNewTransfer = () => {
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
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={22} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.newTransferButton}
          onPress={handleNewTransfer}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por concepto, destinatario, banco..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
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

        <TouchableOpacity
          style={[styles.filterTab, filterType === 'internal' && styles.filterTabActive]}
          onPress={() => setFilterType('internal')}
        >
          <Text style={[styles.filterTabText, filterType === 'internal' && styles.filterTabTextActive]}>
            Internas
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderAdvancedFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.advancedFiltersContainer}>
        <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
          
          {/* Filtros de fecha */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Fecha</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'Todas' },
                { key: 'today', label: 'Hoy' },
                { key: 'week', label: 'Última semana' },
                { key: 'month', label: 'Último mes' },
                { key: 'custom', label: 'Personalizado' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterOption, dateFilter === option.key && styles.filterOptionActive]}
                  onPress={() => setDateFilter(option.key)}
                >
                  <Text style={[styles.filterOptionText, dateFilter === option.key && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtros de monto */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Monto</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'low', label: 'Menos de $500' },
                { key: 'medium', label: '$500 - $2,000' },
                { key: 'high', label: 'Más de $2,000' },
                { key: 'custom', label: 'Personalizado' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterOption, amountFilter === option.key && styles.filterOptionActive]}
                  onPress={() => setAmountFilter(option.key)}
                >
                  <Text style={[styles.filterOptionText, amountFilter === option.key && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtros de estado */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Estado</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'completada', label: 'Completada' },
                { key: 'pendiente', label: 'Pendiente' },
                { key: 'fallida', label: 'Fallida' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterOption, statusFilter === option.key && styles.filterOptionActive]}
                  onPress={() => setStatusFilter(option.key)}
                >
                  <Text style={[styles.filterOptionText, statusFilter === option.key && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtro por banco */}
          {getUniqueBanks().length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Banco</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, bankFilter === 'all' && styles.filterOptionActive]}
                  onPress={() => setBankFilter('all')}
                >
                  <Text style={[styles.filterOptionText, bankFilter === 'all' && styles.filterOptionTextActive]}>
                    Todos los bancos
                  </Text>
                </TouchableOpacity>
                {getUniqueBanks().map(bank => (
                  <TouchableOpacity
                    key={bank}
                    style={[styles.filterOption, bankFilter === bank && styles.filterOptionActive]}
                    onPress={() => setBankFilter(bank)}
                  >
                    <Text style={[styles.filterOptionText, bankFilter === bank && styles.filterOptionTextActive]}>
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Ordenamiento */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Ordenar por</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'newest', label: 'Más recientes' },
                { key: 'oldest', label: 'Más antiguas' },
                { key: 'amount_desc', label: 'Mayor monto' },
                { key: 'amount_asc', label: 'Menor monto' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.filterOption, sortOrder === option.key && styles.filterOptionActive]}
                  onPress={() => setSortOrder(option.key)}
                >
                  <Text style={[styles.filterOptionText, sortOrder === option.key && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.applyFiltersButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyFiltersText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderTransferItem = ({ item: transfer }) => {
    const transferType = getTransferType(transfer);
    
    // Determinar qué información mostrar según el tipo de transferencia
    let displayInfo = {};
    let iconName = '';
    let iconColor = '';
    
    switch (transferType) {
      case 'sent':
        displayInfo = {
          title: `Enviado a ${transfer.nombre_destinatario}`,
          subtitle: transfer.cuenta_origen.descripcion || transfer.cuenta_origen.nombre_banco,
          account: transfer.cuenta_origen
        };
        iconName = 'arrow-up';
        iconColor = colors.error;
        break;
      case 'received':
        displayInfo = {
          title: `Recibido de ${transfer.nombre_destinatario || 'Externo'}`,
          subtitle: transfer.cuenta_destino.descripcion || transfer.cuenta_destino.nombre_banco,
          account: transfer.cuenta_destino
        };
        iconName = 'arrow-down';
        iconColor = colors.success;
        break;
      case 'internal':
        displayInfo = {
          title: 'Transferencia interna',
          subtitle: `${transfer.cuenta_origen.descripcion} → ${transfer.cuenta_destino.descripcion}`,
          account: transfer.cuenta_destino
        };
        iconName = 'swap-horizontal';
        iconColor = colors.warning || '#FFA500';
        break;
      default:
        displayInfo = {
          title: 'Transferencia',
          subtitle: 'Información no disponible',
          account: transfer.cuenta_origen || transfer.cuenta_destino
        };
        iconName = 'help';
        iconColor = colors.textLight;
    }
    
    return (
      <TouchableOpacity
        style={styles.transferItem}
        onPress={() => handleTransferPress(transfer)}
      >
        <View style={styles.transferItemLeft}>
          <View style={[
            styles.transferIcon,
            { backgroundColor: (displayInfo.account?.codigo_hex || '#666666') + '20' }
          ]}>
            <Ionicons
              name={iconName}
              size={20}
              color={iconColor}
            />
          </View>
          
          <View style={styles.transferDetails}>
            <Text style={styles.transferTitle}>
              {displayInfo.title}
            </Text>
            <Text style={styles.transferSubtitle}>
              {displayInfo.subtitle}
            </Text>
            {transfer.concepto && (
              <Text style={styles.transferConcept} numberOfLines={1}>
                {transfer.concepto}
              </Text>
            )}
            {transfer.categoria_descripcion && (
              <Text style={styles.transferCategory} numberOfLines={1}>
                {transfer.categoria_descripcion}
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
            { color: transferType === 'received' ? colors.success : 
                     transferType === 'internal' ? (colors.warning || '#FFA500') : colors.error }
          ]}>
            {transferType === 'received' ? '+' : transferType === 'internal' ? '' : '-'}{formatCurrency(transfer.monto)}
          </Text>
          {transfer.comision > 0 && (
            <Text style={styles.transferFee}>
              Comisión: {formatCurrency(transfer.comision)}
            </Text>
          )}
          <Text style={styles.transferStatus}>
            {transfer.estado === 'completada' ? '✓ Completada' : transfer.estado}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="swap-horizontal-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyStateTitle}>No hay transferencias</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? `No se encontraron resultados para "${searchQuery}"`
          : filterType === 'all' 
          ? 'Aún no has realizado ninguna transferencia'
          : filterType === 'sent'
          ? 'No has enviado transferencias'
          : filterType === 'received'
          ? 'No has recibido transferencias'
          : 'No tienes transferencias internas'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyStateButton} onPress={handleNewTransfer}>
          <Text style={styles.emptyStateButtonText}>Realizar primera transferencia</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResultsInfo = () => {
    const filteredCount = getFilteredTransfers().length;
    const totalCount = transfers.length;
    
    if (filteredCount === totalCount) return null;
    
    return (
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsInfoText}>
          Mostrando {filteredCount} de {totalCount} transferencias
        </Text>
        {(searchQuery || dateFilter !== 'all' || amountFilter !== 'all' || statusFilter !== 'all' || bankFilter !== 'all') && (
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearFiltersLink}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
        
        <View style={styles.modalContent}>
          <TransferScreen 
            onTransferComplete={() => {
              setShowTransferModal(false);
              loadTransfers();
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
      {renderSearchBar()}
      {renderFilterTabs()}
      {renderAdvancedFilters()}
      {renderResultsInfo()}
      
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  newTransferButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  filterTabs: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: 'white',
  },
  advancedFiltersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 300,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  resultsInfoText: {
    fontSize: 12,
    color: colors.textLight,
  },
  clearFiltersLink: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
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
  transferCategory: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
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
    marginBottom: 2,
  },
  transferStatus: {
    fontSize: 10,
    color: colors.success,
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