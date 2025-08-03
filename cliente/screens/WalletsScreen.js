import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

const WalletsScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  // Cargar cuentas cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      getUserIdAndFetchWallets();
    }, [])
  );

  const getUserIdAndFetchWallets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('currentUser');
      
      if (token) {
        // Decodificar el JWT para obtener el payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userIdFromToken = payload.id_usuario || payload.id || payload.userId || payload.user_id;
        
        if (userIdFromToken) {
          setUserId(userIdFromToken);
          await fetchWalletsForUser(userIdFromToken);
        } else {
          Alert.alert('Error', 'No se pudo obtener la información del usuario del token');
        }
      } else {
        Alert.alert('Error', 'Token de usuario no encontrado');
      }
    } catch (error) {
      console.error('Error decoding JWT:', error);
      Alert.alert('Error', 'Error al procesar el token de usuario');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    if (!userId) {
      await getUserIdAndFetchWallets();
      return;
    }
    await fetchWalletsForUser(userId);
  };

  const fetchWalletsForUser = async (userIdToUse) => {
    try {
      if (!userIdToUse) return;
      
      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/usuario/${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        // Transformar los datos de la API al formato que espera el componente
        const transformedWallets = data.cuentas.map(cuenta => ({
          id: cuenta.id_cuenta,
          name: cuenta.descripcion,
          type: mapAccountType(cuenta.tipo_cuenta),
          accountType: cuenta.tipo_cuenta,
          balance: parseFloat(cuenta.saldo || 0),
          accountNumber: cuenta.numero || '',
          color: cuenta.codigo_hex || getColorFromName(cuenta.color),
          icon: getIconFromType(cuenta.tipo_cuenta),
          isActive: cuenta.positivo,
          bankName: cuenta.nombre_banco,
          note: cuenta.nota,
        }));
        setWallets(transformedWallets);
      } else if (response.status === 404) {
        // No hay cuentas para este usuario
        setWallets([]);
      } else {
        throw new Error('Error al cargar las cuentas');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar las cuentas. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets();
    setRefreshing(false);
  };

  // Función para mapear tipos de cuenta de la base de datos a los tipos del componente
  const mapAccountType = (tipoCuenta) => {
    const typeMapping = {
      'Cuenta de Débito': 'bank',
      'Cuenta de Ahorro': 'bank',
      'Cuenta Corriente': 'bank',
      'Tarjeta de Crédito': 'credit',
      'Línea de Crédito': 'credit',
      'Dinero en Efectivo': 'cash',
      'Efectivo': 'cash',
      'Monedero Digital': 'digital',
      'PayPal': 'digital',
      'Mercado Pago': 'digital',
      'Inversiones': 'investment',
      'Acciones': 'investment',
      'Fondos': 'investment',
    };
    return typeMapping[tipoCuenta] || 'bank';
  };

  // Función para obtener color desde el nombre del color
  const getColorFromName = (colorName) => {
    const colorMapping = {
      'Azul': '#004481',
      'Rojo': '#E31837',
      'Verde': '#27AE60',
      'Morado': '#8E44AD',
      'Naranja': '#F39C12',
      'Rosa': '#E91E63',
      'Cyan': '#1ABC9C',
      'Amarillo': '#F1C40F',
    };
    return colorMapping[colorName] || '#004481';
  };

  // Función para obtener icono basado en el tipo de cuenta
  const getIconFromType = (tipoCuenta) => {
    if (tipoCuenta?.toLowerCase().includes('crédito')) return 'card';
    if (tipoCuenta?.toLowerCase().includes('efectivo')) return 'cash';
    if (tipoCuenta?.toLowerCase().includes('digital') || tipoCuenta?.toLowerCase().includes('paypal')) return 'phone-portrait';
    if (tipoCuenta?.toLowerCase().includes('inversión') || tipoCuenta?.toLowerCase().includes('acciones')) return 'trending-up';
    return 'business';
  };

  const handleDeleteWallet = (walletId) => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteWallet(walletId),
        },
      ]
    );
  };

  const deleteWallet = async (walletId) => {
    try {
      if (!userId) {
        Alert.alert('Error', 'No se pudo obtener la información del usuario');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cuenta/cuentas/${walletId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar la lista local
        setWallets(wallets.filter(wallet => wallet.id !== walletId));
        Alert.alert('Éxito', 'Cuenta eliminada correctamente');
      } else {
        throw new Error('Error al eliminar la cuenta');
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      Alert.alert(
        'Error',
        'No se pudo eliminar la cuenta. Por favor, intenta de nuevo.'
      );
    }
  };

  const accountTypes = [
    { type: 'bank', name: 'Cuenta Bancaria', icon: 'business', color: colors.info },
    { type: 'credit', name: 'Tarjeta de Crédito', icon: 'card', color: colors.error },
    { type: 'cash', name: 'Efectivo', icon: 'cash', color: colors.success },
    { type: 'digital', name: 'Monedero Digital', icon: 'phone-portrait', color: colors.primary },
    { type: 'investment', name: 'Inversiones', icon: 'trending-up', color: colors.warning },
  ];

  const getTotalBalance = () => {
    return wallets.reduce((total, wallet) => {
      if (wallet.type === 'credit') {
        return total + wallet.balance; // Los negativos se suman como deuda
      }
      return total + wallet.balance;
    }, 0);
  };

  const getTotalAssets = () => {
    return wallets
      .filter(wallet => wallet.type !== 'credit')
      .reduce((total, wallet) => total + wallet.balance, 0);
  };

  const getTotalDebt = () => {
    return Math.abs(wallets
      .filter(wallet => wallet.type === 'credit')
      .reduce((total, wallet) => total + wallet.balance, 0));
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getAccountIcon = (type) => {
    const iconMap = {
      bank: 'business',
      credit: 'card',
      cash: 'cash',
      digital: 'phone-portrait',
      investment: 'trending-up',
    };
    return iconMap[type] || 'wallet';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Mis Cuentas</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddWallet')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <Ionicons name="wallet" size={24} color={colors.info} />
        </View>
        <Text style={styles.summaryLabel}>Patrimonio Total</Text>
        <Text style={[styles.summaryAmount, { color: getTotalBalance() >= 0 ? colors.success : colors.error }]}>
          {getTotalBalance() >= 0 ? '+' : ''}{formatCurrency(getTotalBalance())}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
          </View>
          <Text style={styles.summaryLabelSmall}>Activos</Text>
          <Text style={[styles.summaryAmountSmall, { color: colors.success }]}>
            {formatCurrency(getTotalAssets())}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="trending-down" size={20} color={colors.error} />
          </View>
          <Text style={styles.summaryLabelSmall}>Deudas</Text>
          <Text style={[styles.summaryAmountSmall, { color: colors.error }]}>
            {formatCurrency(getTotalDebt())}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderWalletCard = (wallet) => (
    <TouchableOpacity 
      key={wallet.id} 
      style={[styles.walletCard, { borderLeftColor: wallet.color }]}
      onLongPress={() => handleDeleteWallet(wallet.id)}
    >
      <View style={styles.walletHeader}>
        <View style={styles.walletIconContainer}>
          <View style={[styles.walletIcon, { backgroundColor: wallet.color + '20' }]}>
            <Ionicons 
              name={getAccountIcon(wallet.type)} 
              size={24} 
              color={wallet.color} 
            />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletName}>{wallet.name}</Text>
            <Text style={styles.walletType}>{wallet.accountType}</Text>
            {wallet.bankName && (
              <Text style={styles.walletBank}>{wallet.bankName}</Text>
            )}
            {wallet.accountNumber && (
              <Text style={styles.walletNumber}>{wallet.accountNumber}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.walletActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditAccount', { account: wallet })}
          >
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.walletBalance}>
        <Text style={styles.balanceLabel}>
          {wallet.type === 'credit' ? 'Saldo Disponible' : 'Saldo Actual'}
        </Text>
        <Text style={[
          styles.balanceAmount,
          { 
            color: wallet.type === 'credit' 
              ? (wallet.balance < 0 ? colors.error : colors.success)
              : colors.text
          }
        ]}>
          {wallet.type === 'credit' && wallet.balance < 0 ? '-' : ''}
          {formatCurrency(wallet.balance)}
        </Text>
        
        {wallet.note && (
          <Text style={styles.walletNote}>{wallet.note}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAddAccountModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Cuenta</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Selecciona el tipo de cuenta</Text>

          <ScrollView style={styles.accountTypesContainer}>
            {accountTypes.map((accountType) => (
              <TouchableOpacity
                key={accountType.type}
                style={styles.accountTypeOption}
                onPress={() => {
                  setShowAddModal(false);
                  navigation.navigate('AddWallet', { accountType: accountType.type });
                }}
              >
                <View style={[styles.accountTypeIcon, { backgroundColor: accountType.color + '20' }]}>
                  <Ionicons
                    name={accountType.icon}
                    size={24}
                    color={accountType.color}
                  />
                </View>
                <View style={styles.accountTypeInfo}>
                  <Text style={styles.accountTypeName}>{accountType.name}</Text>
                  <Text style={styles.accountTypeDescription}>
                    {accountType.type === 'bank' && 'Cuentas de ahorro, débito o nómina'}
                    {accountType.type === 'credit' && 'Tarjetas de crédito y líneas de crédito'}
                    {accountType.type === 'cash' && 'Dinero en efectivo y monedas'}
                    {accountType.type === 'digital' && 'PayPal, Mercado Pago, billeteras digitales'}
                    {accountType.type === 'investment' && 'Acciones, fondos, criptomonedas'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="wallet-outline" size={80} color={colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No tienes cuentas registradas</Text>
      <Text style={styles.emptySubtitle}>
        Agrega tu primera cuenta para comenzar a gestionar tus finanzas
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddWallet')}
      >
        <Text style={styles.emptyButtonText}>Agregar Primera Cuenta</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading || !userId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {!userId ? 'Obteniendo usuario...' : 'Cargando cuentas...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.background} 
      />
      
      {renderHeader()}
      
      {wallets.length > 0 && renderSummaryCards()}
      
      <ScrollView 
        style={styles.walletsContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.walletsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {wallets.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis Cuentas ({wallets.length})</Text>
              <TouchableOpacity style={styles.sortButton}>
                <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
                <Text style={styles.sortText}>Ordenar</Text>
              </TouchableOpacity>
            </View>

            {wallets.map(renderWalletCard)}
          </>
        )}
      </ScrollView>

      {renderAddAccountModal()}
    </View>
  );
};

const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 4,
  },
  summaryCardSmall: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  summaryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  summaryLabelSmall: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryAmountSmall: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletsContainer: {
    flex: 1,
  },
  walletsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  walletIconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  walletIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 3,
  },
  walletType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  walletBank: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  walletNumber: {
    fontSize: 12,
    color: colors.textLight,
  },
  walletNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 5,
  },
  walletActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  walletBalance: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 20,
  },
  accountTypesContainer: {
    flex: 1,
  },
  accountTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  accountTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  accountTypeInfo: {
    flex: 1,
  },
  accountTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  accountTypeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default WalletsScreen;