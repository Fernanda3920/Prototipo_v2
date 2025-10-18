// screens/NotificationsScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import NotificationButton from '../components/NotificationButton';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Pruebas de Notificaciones
          </Text>
          
          <Text style={styles.instructionText}>
            Presiona cualquier botón para programar una notificación.
            El sistema te avisará después del tiempo configurado.
          </Text>

          {/* EJEMPLO 1: Notificación de Éxito */}
          <NotificationButton
            title="Disparar Notificación de Éxito"
            notificationTitle="✅ Proceso Finalizado"
            notificationBody="Tu tarea se completó con éxito. ¡Reutilizando componentes!"
            delaySeconds={1}
            color="#27ae60"
          />

          {/* EJEMPLO 2: Recordatorio de Tarea */}
          <NotificationButton
            title="Programar Recordatorio (20s)"
            notificationTitle="⏰ ¡Recordatorio!"
            notificationBody="¡No olvides revisar tu lista de pendientes!"
            delaySeconds={20}
            color="#e67e22"
          />

          {/* EJEMPLO 3: Notificación de Prueba Rápida */}
          <NotificationButton
            title="Notificación Inmediata (1s)"
            notificationTitle="🚨 Alerta de Prueba"
            notificationBody="Este es un mensaje de prueba rápida."
            delaySeconds={1}
            color="#c0392b"
          />

          {/* EJEMPLO 4: Notificación Personalizada */}
          <NotificationButton
            title="Mensaje Personalizado (5s)"
            notificationTitle="💬 Hola"
            notificationBody="Esta es una notificación totalmente personalizada."
            delaySeconds={5}
            color="#9b59b6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    color: '#34495e',
    textAlign: 'center',
  },
  instructionText: {
    marginBottom: 30,
    fontSize: 15,
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 24,
  },
});