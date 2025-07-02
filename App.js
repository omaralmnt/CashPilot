import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import MainNavigator from './Navigation/MainNavigator';
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <MainNavigator />
    </NavigationContainer>
  );
}