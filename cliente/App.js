import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './contexts/ThemeContext'; // Ajusta la ruta según tu estructura
import MainNavigator from './Navigation/MainNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}