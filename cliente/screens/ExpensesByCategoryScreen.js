import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, BarChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const ExpensesByCategoryScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [expenses, setExpenses] = useState([]);
  const [categorizedExpenses, setCategorizedExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [chartType, setChartType] = useState('pie'); // 'pie', 'bar'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  // Colores predefinidos para las categorías
  const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadExpenses();
      }
    }, [currentUser, selectedPeriod])
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

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!currentUser?.id_usuario) {
        throw new Error('Usuario no identificado');
      }

      console.log('Cargando gastos para usuario:', currentUser.id_usuario);
      
      const response = await fetch(`${API_BASE_URL}/api/transferencia/usuario/${currentUser.id_usuario}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transfersData = data.data || [];
        
        // Filtrar solo los gastos (payments) y aplicar filtro de fecha
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

        setExpenses(expenseData);
        processExpensesByCategory(expenseData);
      } else {
        throw new Error(`Error al cargar los gastos: ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      // Usar datos de ejemplo en caso de error
      const sampleExpenses = getSampleExpenses();
      setExpenses(sampleExpenses);
      processExpensesByCategory(sampleExpenses);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getSampleExpenses = () => [
    { id: 1, monto: 1200, fecha: new Date().toISOString(), categoria: 'Alimentación', concepto: 'Supermercado', destinatario: 'Walmart', comision: 0 },
    { id: 2, monto: 800, fecha: new Date().toISOString(), categoria: 'Transporte', concepto: 'Gasolina', destinatario: 'Petrobras', comision: 0 },
    { id: 3, monto: 450, fecha: new Date().toISOString(), categoria: 'Entretenimiento', concepto: 'Cine', destinatario: 'Cinepolis', comision: 0 },
    { id: 4, monto: 2000, fecha: new Date().toISOString(), categoria: 'Servicios', concepto: 'Internet', destinatario: 'Claro', comision: 0 },
    { id: 5, monto: 650, fecha: new Date().toISOString(), categoria: 'Alimentación', concepto: 'Restaurante', destinatario: 'McDonald\'s', comision: 0 },
    { id: 6, monto: 300, fecha: new Date().toISOString(), categoria: 'Otros', concepto: 'Farmacia', destinatario: 'Farmacias Carol', comision: 0 },
  ];

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
          color: categoryColors[Object.keys(categoryTotals).length % categoryColors.length]
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
      .sort((a, b) => b.total - a.total);

    setCategorizedExpenses(categorizedData);
    setTotalExpenses(total);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExpenses();
  }, [currentUser, selectedPeriod]);

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('es-MX', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      case 'quarter': return 'Este trimestre';
      case 'year': return 'Este año';
      default: return 'Este mes';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Gastos por Categoría</Text>
      
      <TouchableOpacity 
        style={styles.chartToggleButton}
        onPress={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
      >
        <Ionicons 
          name={chartType === 'pie' ? 'bar-chart' : 'pie-chart'} 
          size={24} 
          color={colors.primary} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      {['week', 'month', 'quarter', 'year'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period === 'week' ? '7D' : 
             period === 'month' ? '1M' : 
             period === 'quarter' ? '3M' : '1A'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Gastado</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalExpenses)}</Text>
        <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Categorías</Text>
        <Text style={styles.summaryAmount}>{categorizedExpenses.length}</Text>
        <Text style={styles.summaryPeriod}>Activas</Text>
      </View>
    </View>
  );

  const renderChart = () => {
    if (categorizedExpenses.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyChartText}>No hay gastos en este período</Text>
        </View>
      );
    }

    const chartData = categorizedExpenses.map(category => ({
      name: category.name,
      population: category.total,
      color: category.color,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));

    if (chartType === 'pie') {
      return (
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: (opacity = 1) => colors.text,
              labelColor: (opacity = 1) => colors.text,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      );
    } else {
      const barData = {
        labels: categorizedExpenses.slice(0, 6).map(cat => cat.name.substring(0, 8)),
        datasets: [{
          data: categorizedExpenses.slice(0, 6).map(cat => cat.total)
        }]
      };

      return (
        <View style={styles.chartContainer}>
          <BarChart
            data={barData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: colors.primary
              }
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      );
    }
  };

  const renderCategoryList = () => (
    <View style={styles.categoryListContainer}>
      <Text style={styles.sectionTitle}>Desglose por Categoría</Text>
      {categorizedExpenses.map((category, index) => (
        <TouchableOpacity
          key={category.name}
          style={styles.categoryItem}
          onPress={() => {
            setSelectedCategory(category);
            setShowCategoryModal(true);
          }}
        >
          <View style={styles.categoryItemLeft}>
            <View 
              style={[styles.categoryColor, { backgroundColor: category.color }]} 
            />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>
                {category.count} transacción{category.count !== 1 ? 'es' : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.categoryItemRight}>
            <Text style={styles.categoryAmount}>
              {formatCurrency(category.total)}
            </Text>
            <Text style={styles.categoryPercentage}>
              {category.percentage.toFixed(1)}%
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowCategoryModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>
            {selectedCategory?.name}
          </Text>
          
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.categoryDetailHeader}>
            <View 
              style={[styles.categoryDetailColor, { backgroundColor: selectedCategory?.color }]} 
            />
            <View style={styles.categoryDetailInfo}>
              <Text style={styles.categoryDetailAmount}>
                {formatCurrency(selectedCategory?.total || 0)}
              </Text>
              <Text style={styles.categoryDetailSubtext}>
                {selectedCategory?.count} transacciones • {selectedCategory?.percentage?.toFixed(1)}% del total
              </Text>
            </View>
          </View>
          
          <Text style={styles.transactionListTitle}>Transacciones</Text>
          
          <FlatList
            data={selectedCategory?.expenses || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionConcepto}>{item.concepto}</Text>
                  <Text style={styles.transactionDestinatario}>
                    {item.destinatario}
                  </Text>
                  <Text style={styles.transactionFecha}>
                    {formatDate(item.fecha)}
                  </Text>
                </View>
                <Text style={styles.transactionMonto}>
                  {formatCurrency(item.monto + item.comision)}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  if (isLoading && categorizedExpenses.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando gastos...</Text>
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
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderPeriodSelector()}
        {renderSummaryCards()}
        {renderChart()}
        {renderCategoryList()}
      </ScrollView>
      
      {renderCategoryModal()}
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
  chartToggleButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
    gap: 12,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  summaryPeriod: {
    fontSize: 11,
    color: colors.textLight,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  emptyChart: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyChartText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 10,
  },
  categoryListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  categoryItemRight: {
    alignItems: 'flex-end',
    marginRight: 8,
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
    paddingHorizontal: 20,
  },
  categoryDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryDetailColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  categoryDetailInfo: {
    flex: 1,
  },
  categoryDetailAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  categoryDetailSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  transactionListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionConcepto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transactionDestinatario: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionFecha: {
    fontSize: 11,
    color: colors.textLight,
  },
  transactionMonto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.error,
  },
});

export default ExpensesByCategoryScreen;