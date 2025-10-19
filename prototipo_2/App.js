import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; // 👈 Importar el hook
import NotificationsScreen from './screens/NotificationsScreen';
import NotesScreen from './screens/NotesScreen';
import SchedulerScreen from './screens/SchedulerScreen';

const Tab = createBottomTabNavigator();

// 1. Crear un componente funcional para usar el hook
function MyTabNavigator() {
  const insets = useSafeAreaInsets(); // 👈 Obtener los valores de área segura

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
          // 2. Aplicar el relleno inferior de la barra de navegación del sistema
          paddingBottom: insets.bottom, // 👈 Aplicación dinámica del relleno
          height: 60 + insets.bottom,  // 👈 Ajustar la altura para incluir el relleno
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#3498db',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
  name="Programar"
  component={SchedulerScreen}
  options={{
    tabBarIcon: ({ size }) => (
      <Text style={{ fontSize: size }}>📅</Text>
    ),
    title: '📅 Programar',
  }}
/>
      <Tab.Screen
        name="Notificaciones"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <Text style={{ fontSize: size }}>🔔</Text>
          ),
          title: '🔔 Notificaciones',
        }}
      />
      <Tab.Screen
        name="Notas"
        component={NotesScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <Text style={{ fontSize: size }}>📝</Text>
          ),
          title: '📝 Mis Notas',
        }}
      />
    </Tab.Navigator>
  );
}

// 3. Usar el componente Tab Navigator en el componente principal
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MyTabNavigator /> {/* 👈 Usar el nuevo componente */}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}