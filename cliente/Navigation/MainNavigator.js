import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Screens - Corregidas las rutas de importación
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import WalletsScreen from '../screens/WalletsScreen';
import AddWalletScreen from '../screens/AddWalletScreen';
import TransferScreen from '../screens/TransferScreen';
import EditAccountScreen from '../screens/EditAccountScreen'; // Nueva pantalla

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator (tus pantallas principales)
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transacciones':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Transferir':
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
              break;
            case 'Cuentas':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'wallet';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 85,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen}
      />
      <Tab.Screen 
        name="Transacciones" 
        component={TransactionsScreen}
      />
      <Tab.Screen 
        name="Transferir" 
        component={TransferScreen}
      />
      <Tab.Screen 
        name="Cuentas" 
        component={WalletsScreen}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator principal (incluye tabs + pantallas modales)
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName='Login'
    >
      {/* Pantalla de Login */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      
      {/* Pantallas principales con tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      
      {/* Pantallas modales/secundarias */}
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      
      <Stack.Screen 
        name="AddWallet" 
        component={AddWalletScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
            <Stack.Screen 
        name="EditAccount" 
        component={EditAccountScreen}
        options={{
          gestureDirection: 'horizontal',
        }}
      />
      
      {/* Aquí puedes agregar más pantallas como:
      <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      */}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tempScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  tempText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
  },
  tempSubtext: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MainNavigator;