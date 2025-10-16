import React, { useEffect } from 'react';
import { Button, View, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // Usamos Alert de React Native en lugar del alert() nativo
      Alert.alert('Permiso Denegado', 'Falló la obtención del permiso para notificaciones push.');
      return false; // Retorna false si no hay permiso
    }
    
    return true; // Retorna true si hay permiso
  };

  // Función para programar la notificación (expuesta al exterior)
  const scheduleLocalNotification = async (title, body, seconds = 2) => {
    const hasPermission = await registerForPushNotificationsAsync();

    if (hasPermission) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || "🔔 Recordatorio", 
          body: body || '¡Notificación local disparada!',
          data: { timestamp: new Date().toISOString() }, 
        },
        trigger: { seconds: seconds }, // Muestra la notificación después de 'seconds' segundos
      });
      console.log('Notificación programada con éxito.');
    } else {
      console.log('No se puede programar la notificación: permiso denegado.');
    }
  };

  // Pedir permiso cuando el hook se usa por primera vez en un componente
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Devolvemos la función de notificación
  return { scheduleLocalNotification };
}

export default function NotificationButton({ title, notificationTitle, notificationBody, delaySeconds = 1, color = '#3498db' }) {
    const { scheduleLocalNotification } = useNotifications();
    const handlePress = () => {
        scheduleLocalNotification(
            notificationTitle, 
            notificationBody, 
            delaySeconds
        );
    };

    return (
        <View style={{ marginVertical: 10 }}>
            <Button
                title={title}
                onPress={handlePress}
                color={color}
            />
        </View>
    );
}
