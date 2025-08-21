import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const CategoriasPersonalizadasScreen = ({ navigation }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [descripcionEdit, setDescripcionEdit] = useState('');
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [userId, setUserId] = useState('');

  // Usar el contexto de tema y traducción
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const API_BASE_URL = Constants.expoConfig?.extra?.API_URL;

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      loadCategorias();
    }
  }, [userId]);

  const loadUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id_usuario || '');
      }
    } catch (error) {
      console.log('❌ Error loading user info:', error);
    }
  };

  const loadCategorias = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token || !userId) return;

      const response = await fetch(`${API_BASE_URL}/api/transferencia/categorias-personalizadas/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCategorias(data.data || []);
      } else {
        console.log('❌ Error al cargar categorías:', data.error);
        Alert.alert(t('common.error'), data.error || t('customCategories.errors.loadCategoriesFailed'));
      }
    } catch (error) {
      console.log('❌ Error de red:', error);
      Alert.alert(t('common.error'), t('customCategories.errors.connectionError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategorias();
  };

  const handleCrearCategoria = async () => {
    if (!nuevaDescripcion.trim()) {
      Alert.alert(t('common.error'), t('customCategories.validation.descriptionRequired'));
      return;
    }

    setCreando(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/transferencia/categorias-personalizadas/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descripcion: nuevaDescripcion.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(t('common.success'), t('customCategories.success.categoryCreated'));
        setNuevaDescripcion('');
        setCurrentView('list');
        loadCategorias();
      } else {
        Alert.alert(t('common.error'), data.error || t('customCategories.errors.createCategoryFailed'));
      }
    } catch (error) {
      console.log('❌ Error al crear categoría:', error);
      Alert.alert(t('common.error'), t('customCategories.errors.connectionRetry'));
    } finally {
      setCreando(false);
    }
  };

  const handleEditarCategoria = async () => {
    if (!descripcionEdit.trim()) {
      Alert.alert(t('common.error'), t('customCategories.validation.descriptionRequired'));
      return;
    }

    setEditando(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/transferencia/categorias-personalizadas/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_categoria: selectedCategoria.id_categoria,
          descripcion: descripcionEdit.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(t('common.success'), t('customCategories.success.categoryUpdated'));
        setCurrentView('list');
        setSelectedCategoria(null);
        setDescripcionEdit('');
        loadCategorias();
      } else {
        Alert.alert(t('common.error'), data.error || t('customCategories.errors.updateCategoryFailed'));
      }
    } catch (error) {
      console.log('❌ Error al editar categoría:', error);
      Alert.alert(t('common.error'), t('customCategories.errors.connectionRetry'));
    } finally {
      setEditando(false);
    }
  };

  const handleEliminarCategoria = (categoria) => {
    Alert.alert(
      t('customCategories.delete.title'),
      t('customCategories.delete.message', { categoryName: categoria.descripcion }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('customCategories.delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              
              const response = await fetch(`${API_BASE_URL}/api/transferencia/categorias-personalizadas/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id_categoria: categoria.id_categoria,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert(t('common.success'), t('customCategories.success.categoryDeleted'));
                loadCategorias();
              } else {
                Alert.alert(t('common.error'), data.error || t('customCategories.errors.deleteCategoryFailed'));
              }
            } catch (error) {
              console.log('❌ Error al eliminar categoría:', error);
              Alert.alert(t('common.error'), t('customCategories.errors.connectionRetry'));
            }
          }
        }
      ]
    );
  };

  const openEditView = (categoria) => {
    setSelectedCategoria(categoria);
    setDescripcionEdit(categoria.descripcion);
    setCurrentView('edit');
  };

  const openCreateView = () => {
    setNuevaDescripcion('');
    setCurrentView('create');
  };

  const goBackToList = () => {
    setCurrentView('list');
    setSelectedCategoria(null);
    setNuevaDescripcion('');
    setDescripcionEdit('');
  };

  // Vista de Crear Categoría
  if (currentView === 'create') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar 
          barStyle={colors.statusBarStyle} 
          backgroundColor={colors.statusBarBackground} 
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={goBackToList}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customCategories.views.newCategory')}</Text>
          <View style={styles.addButton} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.formContainer}>
          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formIconContainer}>
              <Ionicons name="add-circle" size={48} color={colors.primary} />
            </View>
            
            <Text style={styles.formTitle}>{t('customCategories.create.title')}</Text>
            <Text style={styles.formDescription}>
              {t('customCategories.create.description')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('customCategories.fields.categoryDescription')}</Text>
              <TextInput
                style={styles.textInput}
                value={nuevaDescripcion}
                onChangeText={setNuevaDescripcion}
                placeholder={t('customCategories.placeholders.categoryDescription')}
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
                autoFocus={false}
                returnKeyType="done"
                onSubmitEditing={handleCrearCategoria}
              />
              <Text style={styles.charCount}>
                {t('customCategories.charCount', { current: nuevaDescripcion.length, max: 100 })}
              </Text>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={goBackToList}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleCrearCategoria}
                disabled={creando || !nuevaDescripcion.trim()}
              >
                {creando ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>{t('customCategories.actions.create')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Vista de Editar Categoría
  if (currentView === 'edit') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar 
          barStyle={colors.statusBarStyle} 
          backgroundColor={colors.statusBarBackground} 
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={goBackToList}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customCategories.views.editCategory')}</Text>
          <View style={styles.addButton} />
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.formContainer}>
          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formIconContainer}>
              <Ionicons name="pencil" size={48} color={colors.info} />
            </View>
            
            <Text style={styles.formTitle}>{t('customCategories.edit.title')}</Text>
            <Text style={styles.formDescription}>
              {t('customCategories.edit.description')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('customCategories.fields.categoryDescription')}</Text>
              <TextInput
                style={styles.textInput}
                value={descripcionEdit}
                onChangeText={setDescripcionEdit}
                placeholder={t('customCategories.placeholders.categoryDescriptionEdit')}
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
                autoFocus={false}
                returnKeyType="done"
                onSubmitEditing={handleEditarCategoria}
              />
              <Text style={styles.charCount}>
                {t('customCategories.charCount', { current: descripcionEdit.length, max: 100 })}
              </Text>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={goBackToList}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleEditarCategoria}
                disabled={editando || !descripcionEdit.trim()}
              >
                {editando ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>{t('customCategories.actions.save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Vista Principal (Lista)
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar 
          barStyle={colors.statusBarStyle} 
          backgroundColor={colors.statusBarBackground} 
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('customCategories.loading.categories')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={colors.statusBarStyle} 
        backgroundColor={colors.statusBarBackground} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customCategories.title')}</Text>
        <TouchableOpacity 
          onPress={openCreateView}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="pricetags-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.infoTitle}>{t('customCategories.info.title')}</Text>
          <Text style={styles.infoDescription}>
            {t('customCategories.info.description')}
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {t('customCategories.info.statsText', { 
                count: categorias.length,
                categoryText: categorias.length === 1 
                  ? t('customCategories.info.categorySingular')
                  : t('customCategories.info.categoryPlural'),
                createdText: categorias.length === 1 
                  ? t('customCategories.info.createdSingular')
                  : t('customCategories.info.createdPlural')
              })}
            </Text>
          </View>
        </View>

        {/* Categorías List */}
        {categorias.length > 0 ? (
          <View style={styles.categoriasSection}>
            <Text style={styles.sectionTitle}>{t('customCategories.sections.yourCategories')}</Text>
            {categorias.map((categoria, index) => (
              <View key={categoria.id_categoria} style={styles.categoriaItem}>
                <View style={styles.categoriaLeft}>
                  <View style={styles.categoriaIcon}>
                    <Ionicons name="pricetag" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.categoriaText}>
                    <Text style={styles.categoriaTitle}>{categoria.descripcion}</Text>
                    <Text style={styles.categoriaSubtitle}>
                      {t('customCategories.categoryItem.subtitle', { number: index + 1 })}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoriaActions}>
                  <TouchableOpacity 
                    style={styles.actionIcon}
                    onPress={() => openEditView(categoria)}
                  >
                    <Ionicons name="pencil" size={18} color={colors.info} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionIcon}
                    onPress={() => handleEliminarCategoria(categoria)}
                  >
                    <Ionicons name="trash" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('customCategories.empty.title')}</Text>
            <Text style={styles.emptyDescription}>
              {t('customCategories.empty.description')}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={openCreateView}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyButtonText}>{t('customCategories.empty.buttonText')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={openCreateView}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>{t('customCategories.quickActions.newCategory')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionItem}
            onPress={onRefresh}
          >
            <Ionicons name="refresh-outline" size={24} color={colors.success} />
            <Text style={styles.quickActionText}>{t('customCategories.quickActions.refresh')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Función para crear estilos
const createStyles = ({ colors, isDark }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.statusBarBackground,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 12,
  },
  formIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  formDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    minHeight: 50,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  formActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    gap: 8,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    margin: 20,
    padding: 25,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 8,
  },
  infoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  statsRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  categoriasSection: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  categoriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  categoriaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoriaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  categoriaText: {
    flex: 1,
  },
  categoriaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoriaSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoriaActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 5,
  },
  emptyState: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
  },
  quickActionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
});

export default CategoriasPersonalizadasScreen;