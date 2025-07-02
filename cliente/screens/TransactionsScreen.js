import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TransactionsScreen = () => {
  const navigation = useNavigation(); // Usa el hook de navegación
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Datos de ejemplo ampliados
  const allTransactions = [
    { id: 1, title: 'Supermercado Soriana', amount: -85.50, category: 'Alimentación', date: '2024-01-15', time: '14:30', type: 'gasto', description: 'Compras semanales' },
    { id: 2, title: 'Salario Enero', amount: 15000.00, category: 'Trabajo', date: '2024-01-15', time: '09:00', type: 'ingreso', description: 'Pago mensual' },
    { id: 3, title: 'Netflix Suscripción', amount: -199.00, category: 'Entretenimiento', date: '2024-01-14', time: '10:15', type: 'gasto', description: 'Plan premium mensual' },
    { id: 4, title: 'Gasolina Pemex', amount: -450.00, category: 'Transporte', date: '2024-01-14', time: '08:45', type: 'gasto', description: 'Tanque lleno' },
    { id: 5, title: 'Freelance Web', amount: 2500.00, category: 'Freelance', date: '2024-01-13', time: '16:20', type: 'ingreso', description: 'Proyecto completado' },
    { id: 6, title: 'Farmacia Guadalajara', amount: -125.80, category: 'Salud', date: '2024-01-13', time: '12:10', type: 'gasto', description: 'Medicamentos' },
    { id: 7, title: 'Coppel Muebles', amount: -1200.00, category: 'Hogar', date: '2024-01-12', time: '15:45', type: 'gasto', description: 'Mesa de comedor' },
    { id: 8, title: 'Spotify Premium', amount: -99.00, category: 'Entretenimiento', date: '2024-01-12', time: '11:30', type: 'gasto', description: 'Suscripción mensual' },
    { id: 9, title: 'Uber Eats', amount: -180.50, category: 'Alimentación', date: '2024-01-11', time: '20:15', type: 'gasto', description: 'Cena italiana' },
    { id: 10, title: 'Transferencia Mamá', amount: 500.00, category: 'Familia', date: '2024-01-11', time: '14:00', type: 'ingreso', description: 'Ayuda familiar' },
  ];

  const categories = ['Todos', 'Alimentación', 'Transporte', 'Entretenimiento', 'Trabajo', 'Salud', 'Hogar', 'Freelance', 'Familia'];
  const filterTypes = ['Todos', 'Ingresos', 'Gastos'];

  // Filtrar transacciones
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchText.toLowerCase());
    
    if (selectedFilter === 'Todos') return matchesSearch;
    if (selectedFilter === 'Ingresos') return matchesSearch && transaction.type === 'ingreso';
    if (selectedFilter === 'Gastos') return matchesSearch && transaction.type === 'gasto';
    return matchesSearch && transaction.category === selectedFilter;
  });

  // Agrupar por fecha
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Alimentación': 'restaurant',
      'Transporte': 'car',
      'Entretenimiento': 'musical-notes',
      'Trabajo': 'briefcase',
      'Salud': 'medical',
      'Hogar': 'home',
      'Freelance': 'laptop',
      'Familia': 'people',
    };
    return icons[category] || 'cash';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Alimentación': '#FF6B6B',
      'Transporte': '#F7DC6F',
      'Entretenimiento': '#45B7D1',
      'Trabajo': '#4ECDC4',
      'Salud': '#FF8A80',
      'Hogar': '#A8E6CF',
      'Freelance': '#B39DDB',
      'Familia': '#FFCC80',
    };
    return colors[category] || '#95A5A6';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Transacciones</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTransaction')} // Cambia esta línea
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transacciones..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#7F8C8D"
        />
      </View>
      
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons name="filter" size={20} color="#667eea" />
      </TouchableOpacity>
    </View>
  );

  const renderFilterChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterChipsContainer}
      contentContainerStyle={styles.filterChipsContent}
    >
      {['Todos', 'Ingresos', 'Gastos', ...categories.slice(1)].map((filter) => (
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
  );

  const renderTransaction = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
        <Ionicons 
          name={getCategoryIcon(item.category)} 
          size={20} 
          color={getCategoryColor(item.category)} 
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
      </View>
      
      <View style={styles.transactionAmountContainer}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'ingreso' ? '#4ECDC4' : '#FF6B6B' }
        ]}>
          {item.type === 'ingreso' ? '+' : '-'}${Math.abs(item.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.transactionTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroupedTransactions = () => {
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));
    
    return (
      <ScrollView style={styles.transactionsContainer} showsVerticalScrollIndicator={false}>
        {sortedDates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateGroupTitle}>{formatDate(date)}</Text>
            
            {groupedTransactions[date].map((transaction) => (
              <View key={transaction.id}>
                {renderTransaction({ item: transaction })}
              </View>
            ))}
            
            <View style={styles.dateGroupSummary}>
              <Text style={styles.dateGroupSummaryText}>
                {groupedTransactions[date].length} transacción{groupedTransactions[date].length !== 1 ? 'es' : ''}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSectionTitle}>Tipo</Text>
          {filterTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.modalOption}
              onPress={() => {
                setSelectedFilter(type);
                setShowFilterModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selectedFilter === type && styles.modalOptionTextActive
              ]}>
                {type}
              </Text>
              {selectedFilter === type && (
                <Ionicons name="checkmark" size={20} color="#667eea" />
              )}
            </TouchableOpacity>
          ))}
          
          <Text style={styles.modalSectionTitle}>Categoría</Text>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.modalOption}
              onPress={() => {
                setSelectedFilter(category);
                setShowFilterModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selectedFilter === category && styles.modalOptionTextActive
              ]}>
                {category}
              </Text>
              {selectedFilter === category && (
                <Ionicons name="checkmark" size={20} color="#667eea" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {renderHeader()}
      {renderSearchAndFilters()}
      {renderFilterChips()}
      {renderGroupedTransactions()}
      {renderFilterModal()}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#2C3E50',
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: 'white',
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterChipsContainer: {
    marginBottom: 10,
  },
  filterChipsContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
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
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  transactionDetails: {
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
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  dateGroupSummary: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  dateGroupSummaryText: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
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
    maxHeight: '70%',
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
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  modalOptionTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
});

export default TransactionsScreen;