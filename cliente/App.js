import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './contexts/ThemeContext';
import MainNavigator from './Navigation/MainNavigator';
import i18n from './i18n';

export default function App() {
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
        await i18n.changeLanguage(savedLanguage);
      } else {
        // Si no hay idioma guardado, usar español por defecto
        await i18n.changeLanguage('es');
      }
    } catch (error) {
      console.log('Error loading saved language:', error);
      // Fallback en caso de error
      await i18n.changeLanguage('es');
    } finally {
      setIsLanguageLoaded(true);
    }
  };

  // Esperar a que se cargue el idioma antes de mostrar la app
  if (!isLanguageLoaded) {
    return null; // O un splash screen si prefieres
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <NavigationContainer>
          <MainNavigator />
          <StatusBar />
        </NavigationContainer>
      </ThemeProvider>
    </I18nextProvider>
  );
}