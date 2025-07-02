import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';

const { width } = Dimensions.get('window');

const BudgetScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Mes');
  const [modalVisible, setModalVisible] = useState(false);
  const [budgets, setBudgets] = useState([
    { id: 1, category: 'Alimentación', budgeted: 500, spent: 450.30, color: '#FF6B6B' },
    { id: 2, category: 'Transporte', budgeted: 300, spent: 280.50, color: '#F7DC6F' },
    { id: 3, category: 'Entretenimiento', budgeted: 200, spent: 150.20, color: '#45B7D1' },
    { id: 4, category: 'Salud', budgeted: 150, spent: 75.00, color: '#A8E6CF' },
    { id: 5, category: 'Ropa', budgeted: 250, spent: 320.80, color: '#DDA0DD' },
  ]);

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.budgeted, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remainingBudget = totalBudgeted - totalSpent;

  const getProgressPercentage = (spent, budgeted) => {
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (spent, budgeted) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return '#FF6B6B';
    if (percentage >= 80) return '#F7DC6F';
    return '#4ECDC4';
  };

  const renderBudgetSummary = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryLabel}>Resumen de Presupuesto</Text>
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>{selectedPeriod}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Presupuestado</Text>
          <Text style={[styles.statAmount, { color: '#4ECDC4' }]}>
            ${totalBudgeted.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Gastado</Text>
          <Text style={[styles.statAmount, { color: '#FF6B6B' }]}>
            ${totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Restante</Text>
          <Text style={[styles.statAmount, { color: remainingBudget >= 0 ? '#4ECDC4' : '#FF6B6B' }]}>
            ${Math.abs(remainingBudget).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
      
      <View style={styles.overallProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progreso General</Text>
          <Text style={styles.progressPercentage}>
            {Math.round((totalSpent / totalBudgeted) * 100)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
                backgroundColor: getProgressColor(totalSpent, totalBudgeted)
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: '#667eea' }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.quickActionIcon}>+</Text>
          <Text style={styles.quickActionText}>Nuevo Presupuesto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#45B7D1' }]}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>Ver Análisis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBudgetList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Presupuestos por Categoría</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Editar</Text>
        </TouchableOpacity>
      </View>
      
      {budgets.map((budget) => {
        const progressPercentage = getProgressPercentage(budget.spent, budget.budgeted);
        const progressColor = getProgressColor(budget.spent, budget.budgeted);
        const remaining = budget.budgeted - budget.spent;
        
        return (
          <TouchableOpacity key={budget.id} style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetInfo}>
                <View style={[styles.categoryDot, { backgroundColor: budget.color }]} />
                <Text style={styles.budgetCategory}>{budget.category}</Text>
              </View>
              <View style={styles.budgetAmounts}>
                <Text style={styles.budgetSpent}>
                  ${budget.spent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.budgetTotal}>
                  de ${budget.budgeted.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
            
            <View style={styles.budgetProgress}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: progressColor
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.remainingText, { color: remaining >= 0 ? '#4ECDC4' : '#FF6B6B' }]}>
                {remaining >= 0 ? 'Quedan' : 'Excedido por'} ${Math.abs(remaining).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBudgetTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Consejos de Presupuesto</Text>
      
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Regla 50/30/20</Text>
          <Text style={styles.tipDescription}>
            Destina 50% para necesidades, 30% para deseos y 20% para ahorros
          </Text>
        </View>
      </View>
      
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>📈</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Revisa mensualmente</Text>
          <Text style={styles.tipDescription}>
            Ajusta tus presupuestos basándote en tus patrones de gasto reales
          </Text>
        </View>
      </View>
    </View>
  );

  const renderNewBudgetModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nuevo Presupuesto</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Categoría</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Compras, Viajes..."
              placeholderTextColor="#7F8C8D"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Monto Presupuestado</Text>
            <TextInput
              style={styles.textInput}
              placeholder="$0.00"
              placeholderTextColor="#7F8C8D"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderBudgetSummary()}
        {renderQuickActions()}
        {renderBudgetList()}
        {renderBudgetTips()}
      </ScrollView>
      
      {renderNewBudgetModal()}
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
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
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
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 5,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overallProgress: {
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
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
  budgetItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  budgetSpent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  budgetTotal: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  budgetProgress: {
    marginTop: 5,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'right',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 25,
    width: width - 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E6ED',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BudgetScreen;