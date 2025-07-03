import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const TransactionsScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('date');

  // Datos de ejemplo con información de cuentas
  const allTransactions = [
    { 
      id: 1, 
      title: 'Supermercado Nacional', 
      amount: -85.50, 
      category: 'Alimentación', 
      date: '2024-07-02', 
      time: '14:30', 
      type: 'gasto', 
      description: 'Compras semanales',
      wallet: { name: 'BBVA Bancomer', type: 'bank', color: '#004481', accountNumber: '****1234' },
      categoryIcon: 'restaurant',
      categoryColor: '#FF6B6B'
    },
    { 
      id: 2, 
      title: 'Salario Julio', 
      amount: 45000.00, 
      category: 'Trabajo', 
      date: '2024-07-02', 
      time: '09:00', 
      type: 'ingreso', 
      description: 'Pago mensual',
      wallet: { name: 'Santander Débito', type: 'bank', color: '#EC0000', accountNumber: '****9012' },
      categoryIcon: 'briefcase',
      categoryColor: '#4ECDC4'
    },
    { 
      id: 3, 
      title: 'Netflix Premium', 
      amount: -499.00, 
      category: 'Entretenimiento', 
      date: '2024-07-01', 
      time: '10:15', 
      type: 'gasto', 
      description: 'Suscripción mensual',
      wallet: { name: 'Banamex Platino', type: 'credit', color: '#E31837', accountNumber: '****5678' },
      categoryIcon: 'musical-notes',
      categoryColor: '#45B7D1'
    },
    { 
      id: 4, 
      title: 'Gasolina Shell', 
      amount: -1250.00, 
      category: 'Transporte', 
      date: '2024-07-01', 
      time: '08:45', 
      type: 'gasto', 
      description: 'Tanque lleno',
      wallet: { name: 'Efectivo', type: 'cash', color: '#27AE60', accountNumber: '' },
      categoryIcon: 'car',
      categoryColor: '#F7DC6F'
    },
    { 
      id: 5, 
      title: 'Freelance Desarrollo', 
      amount: 8500.00, 
      category: 'Freelance', 
      date: '2024-06-30', 
      time: '16:20', 
      type: 'ingreso', 
      description: 'Proyecto web completado',
      wallet: { name: 'PayPal', type: 'digital', color: '#003087', accountNumber: 'usuario@email.com' },
      categoryIcon: 'laptop',
      categoryColor: '#B39DDB'
    },
    { 
      id: 6, 
      title: 'Farmacia Cruz Verde', 
      amount: -320.80, 
      category: 'Salud', 
      date: '2024-06-30', 
      time: '12:10', 
      type: 'gasto', 
      description: 'Medicamentos',
      wallet: { name: 'BBVA Bancomer', type: 'bank', color: '#004481', accountNumber: '****1234' },
      categoryIcon: 'medical',
      categoryColor: '#FF8A80'
    },
    { 
      id: 7, 
      title: 'Inversión Bitcoin', 
      amount: 12000.00, 
      category: 'Inversiones', 
      date: '2024-06-29', 
      time: '15:45', 
      type: 'ingreso', 
      description: 'Venta de criptomonedas',
      wallet: { name: 'Binance', type: 'digital', color: '#F0B90B', accountNumber: 'trading@email.com' },
      categoryIcon: 'trending-up',
      categoryColor: '#90EE90'
    },
    { 
      id: 8, 
      title: 'Cena Restaurante', 
      amount: -950.00, 
      category: 'Entretenimiento', 
      date: '2024-06-29', 
      time: '20:30', 
      type: 'gasto', 
      description: 'Cena romántica',
      wallet: { name: 'Banamex Platino', type: 'credit', color: '#E31837', accountNumber: '****5678' },
      categoryIcon: 'wine',
      categoryColor: '#45B7D1'
    },
  ];

  const filterOptions = ['Todos', 'Ingresos', 'Gastos', 'Hoy', 'Esta semana', 'Este mes'];
  const sortOptions = [
    { key: 'date', label: 'Fecha' },
    { key: 'amount', label: 'Monto' },
    { key: 'title', label: 'Nombre' },
    { key: 'category', label: 'Categoría' },
  ];

  const getFilteredTransactions = () => {
    let filtered = [...allTransactions];

    // Filtro por búsqueda
    if (searchText) {
      filtered = filtered.filter(transaction =>
        transaction.title.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.wallet.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedFilter === 'Ingresos') {
      filtered = filtered.filter(t => t.type === 'ingreso');
    } else if (selectedFilter === 'Gastos') {
      filtered = filtered.filter(t => t.type === 'gasto');
    } else if (selectedFilter === 'Hoy') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(t => t.date === today);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return Math.abs(b.amount) - Math.abs(a.amount);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default: // date
          return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
      }
    });

    return filtered;
  };

  const groupTransactionsByDate = (transactions) => {
    const groups = {};
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    return groups;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Hoy';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const getWalletIcon = (type) => {
    const iconMap = {
      bank: 'business',
      credit: 'card',
      cash: 'cash',
      digital: 'phone-portrait',
      investment: 'trending-up',
    };
    return iconMap[type] || 'wallet';
  };

  const getDayTotal = (transactions) => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return total;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Transacciones</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transacciones..."
            placeholderTextColor="#BDC3C7"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={20} color="#667eea" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterChipsContainer}
        contentContainerStyle={styles.filterChipsContent}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter && styles.filterChipTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionMain}>
        <View style={styles.transactionLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: item.categoryColor + '20' }]}>
            <Ionicons 
              name={item.categoryIcon} 
              size={20} 
              color={item.categoryColor} 
            />
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'ingreso' ? '#27AE60' : '#E74C3C' }
          ]}>
            {item.type === 'gasto' ? '-' : '+'}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionTime}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.walletInfo}>
        <View style={styles.walletIndicator}>
          <View style={[styles.walletIcon, { backgroundColor: item.wallet.color + '20' }]}>
            <Ionicons 
              name={getWalletIcon(item.wallet.type)} 
              size={14} 
              color={item.wallet.color} 
            />
          </View>
          <Text style={styles.walletName}>{item.wallet.name}</Text>
          {item.wallet.accountNumber && (
            <Text style={styles.walletAccount}>{item.wallet.accountNumber}</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={16} color="#BDC3C7" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDateGroup = (date, transactions) => {
    const dayTotal = getDayTotal(transactions);
    
    return (
      <View key={date} style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>{formatDate(date)}</Text>
          <View style={styles.dateSummary}>
            <Text style={[
              styles.dayTotal,
              { color: dayTotal >= 0 ? '#27AE60' : '#E74C3C' }
            ]}>
              {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
            </Text>
          </View>
        </View>
        
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal visible={showFilterModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterGrid}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  selectedFilter === filter && styles.filterOptionActive
                ]}
                onPress={() => {
                  setSelectedFilter(filter);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilter === filter && styles.filterOptionTextActive
                ]}>
                  {filter}
                </Text>
                {selectedFilter === filter && (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal visible={showSortModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ordenar por</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterGrid}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  sortBy === option.key && styles.filterOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  sortBy === option.key && styles.filterOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const filteredTransactions = getFilteredTransactions();
  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.transactionsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>No hay transacciones</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 'No se encontraron resultados' : 'Comienza agregando tu primera transacción'}
            </Text>
          </View>
        ) : (
          Object.keys(groupedTransactions)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => renderDateGroup(date, groupedTransactions[date]))
        )}
      </ScrollView>
      
      {renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  filterButton: {
    backgroundColor: '#F8F9FA',
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sortButton: {
    backgroundColor: '#F8F9FA',
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipsContainer: {
    marginHorizontal: -20,
  },
  filterChipsContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  filterChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterChipText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dateGroup: {
    marginBottom: 25,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textTransform: 'capitalize',
  },
  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  transactionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#95A5A6',
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  walletIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  walletName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C3E50',
    marginRight: 8,
  },
  walletAccount: {
    fontSize: 12,
    color: '#95A5A6',
  },
  moreButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  filterGrid: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  filterOptionActive: {
    backgroundColor: '#667eea10',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
});

export default TransactionsScreen;