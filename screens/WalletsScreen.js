import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const WalletsScreen = () => {
  const navigation = useNavigation();
  const [showAddModal, setShowAddModal] = useState(false);

  // Datos de ejemplo de cuentas/wallets
  const [wallets, setWallets] = useState([
    {
      id: 1,
      name: 'BBVA Bancomer',
      type: 'bank',
      accountType: 'Cuenta de Débito',
      balance: 15750.50,
      accountNumber: '****1234',
      color: '#004481',
      icon: 'card',
      isActive: true,
    },
    {
      id: 2,
      name: 'Banamex Platino',
      type: 'credit',
      accountType: 'Tarjeta de Crédito',
      balance: -3250.00,
      creditLimit: 50000,
      accountNumber: '****5678',
      color: '#E31837',
      icon: 'card',
      isActive: true,
    },
    {
      id: 3,
      name: 'Efectivo',
      type: 'cash',
      accountType: 'Dinero en Efectivo',
      balance: 850.00,
      accountNumber: '',
      color: '#27AE60',
      icon: 'cash',
      isActive: true,
    },
    {
      id: 4,
      name: 'Santander Débito',
      type: 'bank',
      accountType: 'Cuenta de Débito',
      balance: 8420.75,
      accountNumber: '****9012',
      color: '#EC0000',
      icon: 'card',
      isActive: true,
    },
    {
      id: 5,
      name: 'PayPal',
      type: 'digital',
      accountType: 'Monedero Digital',
      balance: 2150.30,
      accountNumber: 'usuario@email.com',
      color: '#003087',
      icon: 'phone-portrait',
      isActive: true,
    },
  ]);

  const accountTypes = [
    { type: 'bank', name: 'Cuenta Bancaria', icon: 'business', color: '#3498DB' },
    { type: 'credit', name: 'Tarjeta de Crédito', icon: 'card', color: '#E74C3C' },
    { type: 'cash', name: 'Efectivo', icon: 'cash', color: '#27AE60' },
    { type: 'digital', name: 'Monedero Digital', icon: 'phone-portrait', color: '#9B59B6' },
    { type: 'investment', name: 'Inversiones', icon: 'trending-up', color: '#F39C12' },
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

  const handleDeleteWallet = (walletId) => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setWallets(wallets.filter(wallet => wallet.id !== walletId));
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Mis Cuentas</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconContainer}>
          <Ionicons name="wallet" size={24} color="#3498DB" />
        </View>
        <Text style={styles.summaryLabel}>Patrimonio Total</Text>
        <Text style={[styles.summaryAmount, { color: getTotalBalance() >= 0 ? '#27AE60' : '#E74C3C' }]}>
          {getTotalBalance() >= 0 ? '+' : ''}{formatCurrency(getTotalBalance())}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#27AE6020' }]}>
            <Ionicons name="trending-up" size={20} color="#27AE60" />
          </View>
          <Text style={styles.summaryLabelSmall}>Activos</Text>
          <Text style={[styles.summaryAmountSmall, { color: '#27AE60' }]}>
            {formatCurrency(getTotalAssets())}
          </Text>
        </View>

        <View style={[styles.summaryCard, styles.summaryCardSmall]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#E74C3C20' }]}>
            <Ionicons name="trending-down" size={20} color="#E74C3C" />
          </View>
          <Text style={styles.summaryLabelSmall}>Deudas</Text>
          <Text style={[styles.summaryAmountSmall, { color: '#E74C3C' }]}>
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
            {wallet.accountNumber && (
              <Text style={styles.walletNumber}>{wallet.accountNumber}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.walletActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={20} color="#7F8C8D" />
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
              ? (wallet.balance < 0 ? '#E74C3C' : '#27AE60')
              : '#2C3E50'
          }
        ]}>
          {wallet.type === 'credit' && wallet.balance < 0 ? '-' : ''}
          {formatCurrency(wallet.balance)}
        </Text>
        
        {wallet.type === 'credit' && (
          <View style={styles.creditInfo}>
            <Text style={styles.creditLabel}>Límite de Crédito</Text>
            <Text style={styles.creditLimit}>{formatCurrency(wallet.creditLimit)}</Text>
            <View style={styles.creditUsageBar}>
              <View 
                style={[
                  styles.creditUsageFill, 
                  { 
                    width: `${Math.abs(wallet.balance) / wallet.creditLimit * 100}%`,
                    backgroundColor: Math.abs(wallet.balance) / wallet.creditLimit > 0.8 ? '#E74C3C' : '#3498DB'
                  }
                ]} 
              />
            </View>
            <Text style={styles.creditUsage}>
              {((Math.abs(wallet.balance) / wallet.creditLimit) * 100).toFixed(1)}% utilizado
            </Text>
          </View>
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
              <Ionicons name="close" size={24} color="#2C3E50" />
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
                  // Aquí navegarías a la pantalla de creación de cuenta
                  // navigation.navigate('AddAccount', { type: accountType.type });
                  Alert.alert('Próximamente', `Agregar ${accountType.name}`);
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
                <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {renderHeader()}
      {renderSummaryCards()}
      
      <ScrollView 
        style={styles.walletsContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.walletsContent}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Cuentas ({wallets.length})</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Ionicons name="swap-vertical" size={16} color="#7F8C8D" />
            <Text style={styles.sortText}>Ordenar</Text>
          </TouchableOpacity>
        </View>

        {wallets.map(renderWalletCard)}

        <TouchableOpacity 
          style={styles.addAccountCard}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={32} color="#667eea" />
          <Text style={styles.addAccountText}>Agregar Nueva Cuenta</Text>
          <Text style={styles.addAccountSubtext}>Banco, tarjeta, efectivo o digital</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderAddAccountModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addButton: {
    backgroundColor: '#667eea',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    backgroundColor: '#3498DB20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  summaryLabelSmall: {
    fontSize: 12,
    color: '#7F8C8D',
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
    color: '#2C3E50',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 5,
  },
  walletCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: '#2C3E50',
    marginBottom: 3,
  },
  walletType: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  walletNumber: {
    fontSize: 12,
    color: '#95A5A6',
  },
  walletActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  walletBalance: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 15,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  creditInfo: {
    marginTop: 10,
  },
  creditLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 3,
  },
  creditLimit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  creditUsageBar: {
    height: 6,
    backgroundColor: '#ECF0F1',
    borderRadius: 3,
    marginBottom: 5,
  },
  creditUsageFill: {
    height: '100%',
    borderRadius: 3,
  },
  creditUsage: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  addAccountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea20',
    borderStyle: 'dashed',
  },
  addAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 10,
    marginBottom: 5,
  },
  addAccountSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
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
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
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
    borderBottomColor: '#F0F0F0',
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
    color: '#2C3E50',
    marginBottom: 2,
  },
  accountTypeDescription: {
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 18,
  },
});

export default WalletsScreen;