import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mes');
  const [userName, setUserName] = useState('Usuario');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserInfo();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  const loadUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserName(payload.nombre || 'Usuario');
      }
    } catch (error) {
      console.log('Error loading user info:', error);
    }
  };

  // Datos de ejemplo mejorados
  const balance = 67850.75;
  const monthlyIncome = 48500.00;
  const monthlyExpenses = 32180.30;
  const savingsGoal = 15000.00;
  const currentSavings = 8750.50;
  
  const recentTransactions = [
    { 
      id: 1, 
      title: 'Supermercado Nacional', 
      amount: -2850.50, 
      category: 'Alimentación', 
      date: 'Hoy', 
      time: '14:30',
      wallet: { name: 'BBVA Bancomer', color: '#004481' },
      categoryIcon: 'restaurant',
      categoryColor: '#FF6B6B' 
    },
    { 
      id: 2, 
      title: 'Salario Julio', 
      amount: 45000.00, 
      category: 'Trabajo', 
      date: 'Ayer', 
      time: '09:00',
      wallet: { name: 'Santander', color: '#EC0000' },
      categoryIcon: 'briefcase',
      categoryColor: '#4ECDC4' 
    },
    { 
      id: 3, 
      title: 'Netflix Premium', 
      amount: -499.00, 
      category: 'Entretenimiento', 
      date: '2 jul', 
      time: '10:15',
      wallet: { name: 'Banamex', color: '#E31837' },
      categoryIcon: 'musical-notes',
      categoryColor: '#45B7D1' 
    },
    { 
      id: 4, 
      title: 'Gasolina Shell', 
      amount: -1250.00, 
      category: 'Transporte', 
      date: '1 jul', 
      time: '08:45',
      wallet: { name: 'Efectivo', color: '#27AE60' },
      categoryIcon: 'car',
      categoryColor: '#F7DC6F' 
    },
  ];

  const topCategories = [
    { name: 'Alimentación', spent: 8450.30, budget: 12000, color: '#FF6B6B', icon: 'restaurant' },
    { name: 'Transporte', spent: 5280.50, budget: 8000, color: '#F7DC6F', icon: 'car' },
    { name: 'Entretenimiento', spent: 2150.20, budget: 4000, color: '#45B7D1', icon: 'musical-notes' },
    { name: 'Salud', spent: 1820.80, budget: 3000, color: '#FF8A80', icon: 'medical' },
  ];

  const quickActions = [
    { id: 'add_transaction', title: 'Nueva\nTransacción', icon: 'add-circle', color: '#667eea' },
    { id: 'transfer', title: 'Transferir', icon: 'swap-horizontal', color: '#45B7D1' },
    { id: 'add_account', title: 'Nueva\nCuenta', icon: 'wallet', color: '#4ECDC4' },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'add_transaction':
        navigation.navigate('AddTransaction');
        break;
      case 'transfer':
        navigation.navigate('Transferir');
        break;
      case 'add_account':
        navigation.navigate('AddWallet');
        break;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#2C3E50" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.currentDate}>
        {currentTime.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        })}
      </Text>
    </View>
  );

  const renderBalanceCard = () => (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Balance Total</Text>
        <TouchableOpacity 
          style={styles.periodSelector}
          onPress={() => {
            const periods = ['Hoy', 'Esta Semana', 'Este Mes', 'Este Año'];
            const currentIndex = periods.indexOf(selectedPeriod);
            const nextIndex = (currentIndex + 1) % periods.length;
            setSelectedPeriod(periods[nextIndex]);
          }}
        >
          <Text style={styles.periodText}>{selectedPeriod}</Text>
          <Ionicons name="chevron-down" size={16} color="white" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.balanceAmount}>
        {formatCurrency(balance)}
      </Text>
      
      <View style={styles.incomeExpenseRow}>
        <View style={styles.incomeExpenseItem}>
          <View style={styles.incomeExpenseIcon}>
            <Ionicons name="trending-up" size={20} color="#4ECDC4" />
          </View>
          <View>
            <Text style={styles.incomeExpenseLabel}>Ingresos</Text>
            <Text style={[styles.incomeExpenseAmount, { color: '#4ECDC4' }]}>
              +{formatCurrency(monthlyIncome)}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.incomeExpenseItem}>
          <View style={styles.incomeExpenseIcon}>
            <Ionicons name="trending-down" size={20} color="#FF6B6B" />
          </View>
          <View>
            <Text style={styles.incomeExpenseLabel}>Gastos</Text>
            <Text style={[styles.incomeExpenseAmount, { color: '#FF6B6B' }]}>
              -{formatCurrency(monthlyExpenses)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSavingsGoal = () => {
    const progress = (currentSavings / savingsGoal) * 100;
    
    return (
      <View style={styles.savingsCard}>
        <View style={styles.savingsHeader}>
          <Text style={styles.savingsTitle}>Meta de Ahorro</Text>
          <Text style={styles.savingsPercentage}>{Math.round(progress)}%</Text>
        </View>
        
        <Text style={styles.savingsAmount}>
          {formatCurrency(currentSavings)} de {formatCurrency(savingsGoal)}
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progress >= 100 ? '#4ECDC4' : '#667eea'
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionButton, { backgroundColor: action.color }]}
            onPress={() => handleQuickAction(action.id)}
          >
            <Ionicons name={action.icon} size={24} color="white" />
            <Text style={styles.quickActionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transacciones Recientes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Transacciones')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      {recentTransactions.map((transaction) => (
        <TouchableOpacity key={transaction.id} style={styles.transactionCard}>
          <View style={styles.transactionMain}>
            <View style={[styles.transactionIcon, { backgroundColor: transaction.categoryColor + '20' }]}>
              <Ionicons 
                name={transaction.categoryIcon} 
                size={20} 
                color={transaction.categoryColor} 
              />
            </View>
            
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionCategory}>{transaction.category}</Text>
              <View style={styles.transactionMeta}>
                <View style={[styles.walletDot, { backgroundColor: transaction.wallet.color }]} />
                <Text style={styles.transactionWallet}>{transaction.wallet.name}</Text>
                <Text style={styles.transactionDate}> • {transaction.date}</Text>
              </View>
            </View>
            
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.amount > 0 ? '#4ECDC4' : '#FF6B6B' }
              ]}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </Text>
              <Text style={styles.transactionTime}>{transaction.time}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gastos por Categoría</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Presupuestos')}>
          <Text style={styles.seeAllText}>Ver más</Text>
        </TouchableOpacity>
      </View>
      
      {topCategories.map((category) => {
        const percentage = (category.spent / category.budget) * 100;
        
        return (
          <View key={category.name} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                </View>
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryBudget}>
                    {formatCurrency(category.spent)} de {formatCurrency(category.budget)}
                  </Text>
                </View>
              </View>
              
              <Text style={[
                styles.categoryPercentage,
                { color: percentage > 80 ? '#FF6B6B' : '#7F8C8D' }
              ]}>
                {Math.round(percentage)}%
              </Text>
            </View>
            
            <View style={styles.categoryProgressContainer}>
              <View style={styles.categoryProgressBar}>
                <View 
                  style={[
                    styles.categoryProgressFill, 
                    { 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: percentage > 80 ? '#FF6B6B' : category.color
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderBalanceCard()}
        {renderSavingsGoal()}
        {renderQuickActions()}
        {renderRecentTransactions()}
        {renderTopCategories()}
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  currentDate: {
    fontSize: 14,
    color: '#7F8C8D',
    textTransform: 'capitalize',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  balanceCard: {
    margin: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeExpenseIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  incomeExpenseLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 3,
  },
  incomeExpenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
  },
  savingsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  savingsPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  savingsAmount: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
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
  transactionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  transactionMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  transactionWallet: {
    fontSize: 12,
    color: '#95A5A6',
  },
  transactionDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  transactionRight: {
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
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  categoryBudget: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryProgressContainer: {
    width: '100%',
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: '#E8ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default HomeScreen;