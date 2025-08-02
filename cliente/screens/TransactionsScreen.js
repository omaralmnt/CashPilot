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
import { useTheme, useThemedStyles } from '../contexts/ThemeContext'; // Ajusta la ruta según tu estructura

const { width } = Dimensions.get('window');

const TransactionsScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
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
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transacciones..."
            placeholderTextColor={colors.textLight}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={20} color={colors.primary} />
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
            { color: item.type === 'ingreso' ? colors.success : colors.error }
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
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textLight} />
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
              { color: dayTotal >= 0 ? colors.success : colors.error }
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
              <Ionicons name="close" size={24} color={colors.text} />
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
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
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
              <Ionicons name="close" size={24} color={colors.text} />
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
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
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
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.background} 
      />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.transactionsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
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

const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
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
    backgroundColor: colors.surfaceSecondary,
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
    color: colors.text,
  },
  filterButton: {
    backgroundColor: colors.surfaceSecondary,
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sortButton: {
    backgroundColor: colors.surfaceSecondary,
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
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
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
    color: colors.text,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: colors.textLight,
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
    color: colors.textLight,
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
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
    color: colors.text,
    marginRight: 8,
  },
  walletAccount: {
    fontSize: 12,
    color: colors.textLight,
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
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.surfaceSecondary,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default TransactionsScreen;