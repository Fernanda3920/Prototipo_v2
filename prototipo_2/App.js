// En: App.js

import React, { useState, useEffect } from 'react';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Importaciones de Firebase ---
import { auth } from './services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';

// --- Importaciones de Pantallas ---
import NotificationsScreen from './screens/NotificationsScreen';
import NotesScreen from './screens/NotesScreen';
import SchedulerScreen from './screens/SchedulerScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ----------------------------------------------------------------
// 1. TU NAVEGADOR DE TABS (AppStack)
// (Este es tu código original, solo le cambiamos el nombre a AppStack)
// ----------------------------------------------------------------
function AppStack() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: 5,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#3498db' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Programar"
        component={SchedulerScreen}
        options={{
          tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>📅</Text>),
          title: '📅 Programar',
        }}
      />
      <Tab.Screen
        name="Notificaciones"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>🔔</Text>),
          title: '🔔 Notificaciones',
        }}
      />
      <Tab.Screen
        name="Notas"
        component={NotesScreen}
        options={{
          tabBarIcon: ({ size }) => (<Text style={{ fontSize: size }}>📝</Text>),
          title: '📝 Mis Notas',
        }}
      />
    </Tab.Navigator>
  );
}

// ----------------------------------------------------------------
// 2. STACK DE AUTENTICACIÓN (AuthStack)
// ----------------------------------------------------------------
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ----------------------------------------------------------------
// 3. COMPONENTE APP PRINCIPAL (Con la lógica de estado)
// ----------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null); // Almacena el usuario de Firebase
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    // Listener que se ejecuta cuando el estado de auth cambia
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Si es null, el usuario no está logueado
      setLoading(false); // Deja de cargar
    });
    return () => unsubscribe(); // Limpiar el listener
  }, []);

  // Muestra un spinner mientras Firebase verifica la sesión
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* Si 'user' existe, muestra AppStack. Si no, muestra AuthStack. */}
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});