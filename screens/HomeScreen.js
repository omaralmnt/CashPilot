import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Mes');

  // Datos de ejemplo
  const balance = 2750.50;
  const monthlyIncome = 3500.00;
  const monthlyExpenses = 2180.30;
  
  const recentTransactions = [
    { id: 1, title: 'Supermercado', amount: -85.50, category: 'Alimentación', date: 'Hoy', color: '#FF6B6B' },
    { id: 2, title: 'Salario', amount: 1500.00, category: 'Trabajo', date: 'Ayer', color: '#4ECDC4' },
    { id: 3, title: 'Netflix', amount: -12.99, category: 'Entretenimiento', date: '2 días', color: '#45B7D1' },
    { id: 4, title: 'Gasolina', amount: -45.00, category: 'Transporte', date: '3 días', color: '#F7DC6F' },
  ];

  const categories = [
    { name: 'Alimentación', amount: 450.30, color: '#FF6B6B', percentage: 35 },
    { name: 'Transporte', amount: 280.50, color: '#F7DC6F', percentage: 22 },
    { name: 'Entretenimiento', amount: 150.20, color: '#45B7D1', percentage: 12 },
    { name: 'Otros', amount: 320.80, color: '#A8E6CF', percentage: 25 },
  ];

  const renderBalanceCard = () => (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Balance Total</Text>
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>{selectedPeriod}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.balanceAmount}>${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
      
      <View style={styles.incomeExpenseRow}>
        <View style={styles.incomeExpenseItem}>
          <Text style={styles.incomeExpenseLabel}>Ingresos</Text>
          <Text style={[styles.incomeExpenseAmount, { color: '#4ECDC4' }]}>
            +${monthlyIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.incomeExpenseItem}>
          <Text style={styles.incomeExpenseLabel}>Gastos</Text>
          <Text style={[styles.incomeExpenseAmount, { color: '#FF6B6B' }]}>
            -${monthlyExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#4ECDC4' }]}>
          <Text style={styles.quickActionIcon}>+</Text>
          <Text style={styles.quickActionText}>Agregar Ingreso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#FF6B6B' }]}>
          <Text style={styles.quickActionIcon}>-</Text>
          <Text style={styles.quickActionText}>Agregar Gasto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      
      {recentTransactions.map((transaction) => (
        <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
          <View style={[styles.transactionIcon, { backgroundColor: transaction.color + '20' }]}>
            <Text style={[styles.transactionIconText, { color: transaction.color }]}>
              {transaction.category.charAt(0)}
            </Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>{transaction.title}</Text>
            <Text style={styles.transactionCategory}>{transaction.category} • {transaction.date}</Text>
          </View>
          <Text style={[
            styles.transactionAmount,
            { color: transaction.amount > 0 ? '#4ECDC4' : '#FF6B6B' }
          ]}>
            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gastos por Categoría</Text>
      
      {categories.map((category, index) => (
        <View key={index} style={styles.categoryItem}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <View style={styles.categoryAmount}>
            <Text style={styles.categoryAmountText}>
              ${category.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderBalanceCard()}
        {renderQuickActions()}
        {renderRecentTransactions()}
        {renderCategoryBreakdown()}
      </ScrollView>
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
  balanceCard: {
    margin: 20,
    marginTop: 50,
    padding: 25,
    borderRadius: 20,
    backgroundColor: '#667eea',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  periodSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  periodText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeExpenseItem: {
    flex: 1,
  },
  incomeExpenseLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  incomeExpenseAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  seeAllText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
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
  transactionIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
});

export default HomeScreen;