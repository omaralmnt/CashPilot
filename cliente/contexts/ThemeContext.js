import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crear el contexto
const ThemeContext = createContext();

// Definir los temas
export const themes = {
  light: {
    // Colores principales
    primary: '#667eea',
    primaryLight: '#E8ECFF',
    primaryDark: '#5a67d8',
    
    // Backgrounds
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F7FA',
    
    // Textos
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    textLight: '#B0B0B0',
    
    // Estados
    success: '#4ECDC4',
    warning: '#F39C12',
    error: '#FF6B6B',
    info: '#45B7D1',
    
    // Bordes y separadores
    border: '#E0E6ED',
    separator: '#F0F0F0',
    
    // Sombras
    shadow: '#000000',
    shadowOpacity: 0.1,
    
    // Status bar
    statusBarStyle: 'dark-content',
    statusBarBackground: '#667eea',
  },
  dark: {
    // Colores principales
    primary: '#667eea',
    primaryLight: '#2A2A2A',
    primaryDark: '#5a67d8',
    
    // Backgrounds
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSecondary: '#2A2A2A',
    
    // Textos
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textLight: '#888888',
    
    // Estados
    success: '#4ECDC4',
    warning: '#F39C12',
    error: '#FF6B6B',
    info: '#45B7D1',
    
    // Bordes y separadores
    border: '#333333',
    separator: '#333333',
    
    // Sombras
    shadow: '#000000',
    shadowOpacity: 0.3,
    
    // Status bar
    statusBarStyle: 'light-content',
    statusBarBackground: '#1a1a1a',
  }
};

// Provider del contexto
export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [forceUpdate, setForceUpdate] = useState(0);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  // Función para obtener el tema del sistema
  const getSystemTheme = () => {
    const appearanceTheme = Appearance.getColorScheme();
    // console.log('🔍 Sistema detectado:', appearanceTheme);
    return appearanceTheme === 'dark' ? 'dark' : 'light';
  };

  // Determinar el tema actual
  const getCurrentTheme = () => {
    if (themeMode === 'system') {
      return getSystemTheme();
    }
    return themeMode;
  };

  const currentTheme = getCurrentTheme();
  const isDark = currentTheme === 'dark';
  const colors = themes[currentTheme];

  // Cargar preferencia de tema guardada
  useEffect(() => {
    loadThemePreference();

    // Listener para cambios del tema del sistema
    const handleThemeChange = ({ colorScheme }) => {
      // console.log('🔄 Tema del sistema cambió a:', colorScheme);
      setSystemColorScheme(colorScheme);
      
      if (themeMode === 'system') {
        setForceUpdate(prev => prev + 1);
      }
    };

    const subscription = Appearance.addChangeListener(handleThemeChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        // console.log('📱 Tema guardado encontrado:', savedTheme);
        setThemeMode(savedTheme);
      } else {
        // console.log('📱 No hay tema guardado, usando sistema por defecto');
      }
    } catch (error) {
      newFunction(error);
    }

    function newFunction(error) {
      // console.log('❌ Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (theme) => {
    try {
      await AsyncStorage.setItem('themeMode', theme);
      setThemeMode(theme);
      console.log('💾 Tema guardado:', theme);
    } catch (error) {
      console.log('❌ Error saving theme preference:', error);
    }
  };

  const getThemeDisplayName = (theme) => {
    const names = {
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema'
    };
    return names[theme] || 'Sistema';
  };

  const getThemeIcon = (theme) => {
    const icons = {
      light: 'sunny-outline',
      dark: 'moon-outline',
      system: 'phone-portrait-outline'
    };
    return icons[theme] || 'phone-portrait-outline';
  };

  // Función para crear estilos con tema dinámico
  const createThemedStyles = (styleFunction) => {
    return styleFunction({ colors, isDark, currentTheme });
  };

  const value = {
    // Estado del tema
    themeMode,
    currentTheme,
    isDark,
    colors,
    systemColorScheme,
    
    // Funciones
    setThemeMode: saveThemePreference,
    getThemeDisplayName,
    getThemeIcon,
    createThemedStyles,
    
    // Para debugging
    forceUpdate,
    setForceUpdate,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar el tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook para crear estilos con tema
export const useThemedStyles = (styleFunction) => {
  const { colors, isDark, currentTheme } = useTheme();
  return styleFunction({ colors, isDark, currentTheme });
};