import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';

// Importar el componente TransferScreen para usarlo como modal
import TransferScreen from './TransferScreen';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mes');
  const [userName, setUserName] = useState('Usuario');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para datos reales - inicializados en 0
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [topCategories, setTopCategories] = useState([]);
  
  // Nuevos estados para gastos por categoría
  const [categorizedExpenses, setCategorizedExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  // Colores predefinidos para las categorías (igual que en ExpensesByCategoryScreen)
  const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  useEffect(() => {
    loadUserInfo();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Recargar datos cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadRecentTransactions();
        loadFinancialSummary();
        loadExpensesByCategory(); // Nueva función
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

  const loadUserInfo = async () => {
    try {
      setIsLoadingData(true);
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const decodedToken = decodeToken(token);
        console.log('JWT Payload:', decodedToken);
        
        if (decodedToken && decodedToken.id_usuario) {
          setUserName(decodedToken.nombre || 'Usuario');
          setCurrentUser(decodedToken);
          // Cargar datos adicionales
          await Promise.all([
            loadRecentTransactions(decodedToken.id_usuario),
            loadFinancialSummary(decodedToken.id_usuario),
            loadExpensesByCategory(decodedToken.id_usuario) // Nueva función
          ]);
        } else {
          throw new Error('Token inválido');
        }
      }
    } catch (error) {
      console.log('Error loading user info:', error);
      // No cargar datos de ejemplo, mantener valores en 0
    } finally {
      setIsLoadingData(false);
    }
  };

  // Nueva función para obtener el rango de fechas del mes actual
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate, endDate };
  };

  // Nueva función para cargar gastos por categoría
  const loadExpensesByCategory = async (userId = null) => {
    try {
      setIsLoadingCategories(true);
      const token = await AsyncStorage.getItem('userToken');
      const userIdToUse = userId || currentUser?.id_usuario;
      
      if (!userIdToUse) {
        throw new Error('Usuario no identificado');
      }

      console.log('Cargando gastos por categoría para usuario:', userIdToUse);
      
      const response = await fetch(`${API_BASE_URL}/api/transferencia/usuario/${userIdToUse}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transfersData = data.data || [];
        
        // Filtrar solo los gastos (payments) del mes actual
        const { startDate, endDate } = getDateRange();
        const expenseData = transfersData
          .filter(transfer => {
            const isExpense = transfer.tipo_transaccion === 'payment';
            const transferDate = new Date(transfer.fecha_hora);
            const isInRange = transferDate >= startDate && transferDate <= endDate;
            return isExpense && isInRange;
          })
          .map(transfer => ({
            id: transfer.id_transferencia,
            monto: parseFloat(transfer.monto),
            fecha: transfer.fecha_hora,
            categoria: transfer.categoria_descripcion || 'Sin categoría',
            concepto: transfer.concepto || 'Sin concepto',
            destinatario: transfer.nombre_destinatario,
            comision: parseFloat(transfer.comision || 0)
          }));

        processExpensesByCategory(expenseData);
      } else {
        throw new Error(`Error al cargar los gastos: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading expenses by category:', error);
      // En caso de error, usar datos de ejemplo o mantener vacío
      const sampleExpenses = getSampleExpenses();
      processExpensesByCategory(sampleExpenses);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Función auxiliar para datos de ejemplo
  const getSampleExpenses = () => [
    { id: 1, monto: 1200, fecha: new Date().toISOString(), categoria: 'Alimentación', concepto: 'Supermercado', destinatario: 'Walmart', comision: 0 },
    { id: 2, monto: 800, fecha: new Date().toISOString(), categoria: 'Transporte', concepto: 'Gasolina', destinatario: 'Petrobras', comision: 0 },
    { id: 3, monto: 450, fecha: new Date().toISOString(), categoria: 'Entretenimiento', concepto: 'Cine', destinatario: 'Cinepolis', comision: 0 },
    { id: 4, monto: 2000, fecha: new Date().toISOString(), categoria: 'Servicios', concepto: 'Internet', destinatario: 'Claro', comision: 0 },
    { id: 5, monto: 650, fecha: new Date().toISOString(), categoria: 'Alimentación', concepto: 'Restaurante', destinatario: 'McDonald\'s', comision: 0 },
  ];

  // Nueva función para procesar gastos por categoría
  const processExpensesByCategory = (expenseData) => {
    const categoryTotals = {};
    let total = 0;

    expenseData.forEach(expense => {
      const category = expense.categoria;
      const amount = expense.monto + expense.comision;
      
      if (categoryTotals[category]) {
        categoryTotals[category].total += amount;
        categoryTotals[category].count += 1;
        categoryTotals[category].expenses.push(expense);
      } else {
        categoryTotals[category] = {
          name: category,
          total: amount,
          count: 1,
          expenses: [expense],
          color: categoryColors[Object.keys(categoryTotals).length % categoryColors.length],
          icon: getCategoryIcon(category)
        };
      }
      total += amount;
    });

    // Convertir a array y ordenar por monto
    const categorizedData = Object.values(categoryTotals)
      .map(category => ({
        ...category,
        percentage: total > 0 ? (category.total / total * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Solo mostrar las top 5 categorías en el home

    setCategorizedExpenses(categorizedData);
    setTotalExpenses(total);
    
    // Actualizar monthlyExpenses para coherencia
    setMonthlyExpenses(total);
  };

  // Nueva función para obtener íconos por categoría
  const getCategoryIcon = (categoryName) => {
    const categoryIcons = {
      'Alimentación': 'restaurant',
      'Transporte': 'car',
      'Entretenimiento': 'film',
      'Servicios': 'wifi',
      'Salud': 'medical',
      'Educación': 'school',
      'Ropa': 'shirt',
      'Hogar': 'home',
      'Otros': 'ellipsis-horizontal',
      'Sin categoría': 'help-circle'
    };
    
    return categoryIcons[categoryName] || 'card';
  };

  const loadRecentTransactions = async (userId = null) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userIdToUse = userId || currentUser?.id_usuario;
      
      if (!userIdToUse) {
        throw new Error('Usuario no identificado');
      }

      console.log('Cargando transacciones recientes para usuario:', userIdToUse);
      
      const response = await fetch(`${API_BASE_URL}/api/transferencia/usuario/${userIdToUse}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Transactions response status:', response.status);

      const responseText = await response.text();
      console.log('Transactions response text:', responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed transactions data:', data);
          
          const transfersData = data.data || [];
          
          // Mapear los datos del backend al formato que espera el frontend
          const mappedTransactions = transfersData.map(transfer => ({
            id: transfer.id_transferencia,
            title: getTransactionTitle(transfer),
            amount: getTransactionAmount(transfer),
            category: transfer.categoria_descripcion || getTransactionCategory(transfer),
            date: formatTransactionDate(transfer.fecha_hora),
            time: formatTransactionTime(transfer.fecha_hora),
            wallet: {
              name: getTransactionWallet(transfer).name,
              color: getTransactionWallet(transfer).color
            },
            categoryIcon: getTransactionIcon(transfer),
            categoryColor: getTransactionColor(transfer),
            tipo_transaccion: transfer.tipo_transaccion,
            concepto: transfer.concepto,
            estado: transfer.estado
          }));
          
          // Ordenar por fecha (más recientes primero) y tomar solo los últimos 4
          const sortedTransactions = mappedTransactions
            .sort((a, b) => new Date(b.fecha_hora || 0) - new Date(a.fecha_hora || 0))
            .slice(0, 4);
          
          setRecentTransactions(sortedTransactions);
        } catch (parseError) {
          console.error('JSON Parse Error for transactions:', parseError);
          throw new Error('Respuesta del servidor inválida al cargar transacciones');
        }
      } else {
        throw new Error(`Error al cargar las transacciones: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Mantener array vacío en caso de error
      setRecentTransactions([]);
    }
  };

  const loadFinancialSummary = async (userId = null) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userIdToUse = userId || currentUser?.id_usuario;
      
      if (!userIdToUse) {
        throw new Error('Usuario no identificado');
      }

      console.log('Cargando resumen financiero para usuario:', userIdToUse);
      
      // Aquí puedes hacer llamadas a endpoints específicos para obtener:
      // - Balance total
      // - Ingresos del mes
      // - Gastos del mes (se actualiza desde processExpensesByCategory)
      
      // Por ahora, mantener algunos valores en 0 hasta que implementes los endpoints
      setBalance(0);
      setMonthlyIncome(0);
      // monthlyExpenses se actualiza desde processExpensesByCategory
      
    } catch (error) {
      console.error('Error loading financial summary:', error);
      // Mantener valores en 0 en caso de error
      setBalance(0);
      setMonthlyIncome(0);
      // No resetear monthlyExpenses aquí para mantener los datos de categorías
    }
  };

  // Funciones auxiliares para mapear datos (sin cambios)
  const getTransactionTitle = (transfer) => {
    switch (transfer.tipo_transaccion) {
      case 'receive':
        return `Recibido de ${transfer.nombre_destinatario || 'Externo'}`;
      case 'payment':
        return `Enviado a ${transfer.nombre_destinatario}`;
      case 'transfer':
        return 'Transferencia interna';
      default:
        return transfer.concepto || 'Transacción';
    }
  };

  const getTransactionAmount = (transfer) => {
    const amount = parseFloat(transfer.monto);
    switch (transfer.tipo_transaccion) {
      case 'receive':
        return amount; // Positivo para dinero recibido
      case 'payment':
        return -amount; // Negativo para dinero enviado
      case 'transfer':
        return -amount; // Negativo para transferencias internas
      default:
        return -amount;
    }
  };

  const getTransactionCategory = (transfer) => {
    switch (transfer.tipo_transaccion) {
      case 'receive':
        return 'Ingreso';
      case 'payment':
        return 'Pago';
      case 'transfer':
        return 'Transferencia';
      default:
        return 'Transacción';
    }
  };

  const getTransactionWallet = (transfer) => {
    const sourceWallet = {
      name: transfer.banco_origen || 'Cuenta origen',
      color: '#004481'
    };
    
    const destWallet = {
      name: transfer.banco_destino || 'Cuenta destino',
      color: '#E31837'
    };

    return transfer.tipo_transaccion === 'receive' ? destWallet : sourceWallet;
  };

  const getTransactionIcon = (transfer) => {
    switch (transfer.tipo_transaccion) {
      case 'receive':
        return 'arrow-down';
      case 'payment':
        return 'arrow-up';
      case 'transfer':
        return 'swap-horizontal';
      default:
        return 'card';
    }
  };

  const getTransactionColor = (transfer) => {
    switch (transfer.tipo_transaccion) {
      case 'receive':
        return colors.success;
      case 'payment':
        return colors.error;
      case 'transfer':
        return colors.warning || '#FFA500';
      default:
        return colors.primary;
    }
  };

  const formatTransactionDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} días`;
    
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatTransactionTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserInfo().finally(() => setRefreshing(false));
  }, [currentUser]);

  const quickActions = [
    { 
      id: 'new_transfer', 
      title: 'Nueva\nTransferencia', 
      icon: 'add-circle', 
      color: colors.primary 
    },
    { 
      id: 'add_account', 
      title: 'Nueva\nCuenta', 
      icon: 'wallet', 
      color: colors.success 
    },
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
      case 'new_transfer':
        setShowTransferModal(true);
        break;
      case 'add_account':
        navigation.navigate('AddWallet');
        break;
      case 'view_transfers':
        navigation.navigate('Transferencias');
        break;
      default:
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
    }
  };

  const handleTransferComplete = () => {
    setShowTransferModal(false);
    loadRecentTransactions();
    loadFinancialSummary();
    loadExpensesByCategory(); // Recargar categorías después de una transferencia
    Alert.alert('Éxito', 'Transferencia realizada correctamente');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
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
            <Ionicons name="trending-up" size={20} color={colors.success} />
          </View>
          <View>
            <Text style={styles.incomeExpenseLabel}>Ingresos</Text>
            <Text style={[styles.incomeExpenseAmount, { color: colors.success }]}>
              +{formatCurrency(monthlyIncome)}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.incomeExpenseItem}>
          <View style={styles.incomeExpenseIcon}>
            <Ionicons name="trending-down" size={20} color={colors.error} />
          </View>
          <View>
            <Text style={styles.incomeExpenseLabel}>Gastos</Text>
            <Text style={[styles.incomeExpenseAmount, { color: colors.error }]}>
              -{formatCurrency(monthlyExpenses)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

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
      
      {isLoadingData && recentTransactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando transacciones...</Text>
        </View>
      ) : recentTransactions.length === 0 ? (
        <View style={styles.emptyTransactions}>
          <Ionicons name="swap-horizontal-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyTransactionsText}>No hay transacciones recientes</Text>
          <TouchableOpacity 
            style={styles.emptyTransactionsButton}
            onPress={() => setShowTransferModal(true)}
          >
            <Text style={styles.emptyTransactionsButtonText}>Realizar primera transferencia</Text>
          </TouchableOpacity>
        </View>
      ) : (
        recentTransactions.map((transaction) => (
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
                  { color: transaction.amount > 0 ? colors.success : colors.error }
                ]}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.transactionTime}>{transaction.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  // Renderizar las categorías de gastos actualizadas
  const renderTopCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gastos por Categoría</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExpensesByCategory')}>
          <Text style={styles.seeAllText}>Ver más</Text>
        </TouchableOpacity>
      </View>
      
      {isLoadingCategories ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando categorías...</Text>
        </View>
      ) : categorizedExpenses.length === 0 ? (
        <View style={styles.emptyCategories}>
          <Ionicons name="pie-chart-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyCategoriesText}>No hay gastos por categoría aún</Text>
          <Text style={styles.emptyCategoriesSubtext}>
            Realiza algunas transacciones para ver tu análisis de gastos
          </Text>
        </View>
      ) : (
        <>
          {/* Resumen de gastos del mes */}
          <View style={styles.expensesSummary}>
            <Text style={styles.expensesSummaryAmount}>
              {formatCurrency(totalExpenses)}
            </Text>
            <Text style={styles.expensesSummaryLabel}>gastados este mes</Text>
          </View>
          
          {/* Lista de categorías */}
          {categorizedExpenses.map((category) => (
            <TouchableOpacity 
              key={category.name} 
              style={styles.categoryCard}
              onPress={() => navigation.navigate('ExpensesByCategory')}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>
                    {category.count} transacción{category.count !== 1 ? 'es' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.total)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
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
        
        <View style={styles.modalContent}>
          <TransferScreen 
            onTransferComplete={handleTransferComplete}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.background} 
      />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Descomenta si quieres mostrar el balance card */}
        {/* {renderBalanceCard()} */}
        {renderQuickActions()}
        {renderRecentTransactions()}
        {renderTopCategories()}
      </ScrollView>

      {renderTransferModal()}
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  currentDate: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
    elevation: 8,
    shadowColor: colors.shadow,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
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
    color: colors.text,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyTransactionsButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyTransactionsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCategoriesText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCategoriesSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Nuevos estilos para el resumen de gastos
  expensesSummary: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expensesSummaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 4,
  },
  expensesSummaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
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
    color: colors.text,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.textLight,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textLight,
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
    color: colors.textLight,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
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

export default HomeScreen;