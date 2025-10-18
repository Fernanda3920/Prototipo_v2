import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
// ¡IMPORTANTE! Hemos cambiado la ruta de importación para que apunte
import SQLiteNotesComponent from './components/SQLiteNotesComponent';
import NotificationButton from './components/NotificationButton'; 


// --- COMPONENTE PRINCIPAL ---
export default function App() {
  
  return (
    // SafeAreaView y ScrollView ayudan a asegurar que el contenido se vea bien en todos los dispositivos (especialmente iOS)
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Mi Aplicación Modular (JS)
          </Text>
          
          <Text style={styles.instructionText}>
            El botón de notificación ha sido externalizado como un componente reutilizable.
            Ahora solo usamos la etiqueta <Text style={styles.codeText}>&lt;NotificationButton /&gt;</Text>.
          </Text>

          {/* EJEMPLO 1: Notificación de Éxito */}
          <NotificationButton
            title="Disparar Notificación de Éxito"
            notificationTitle="✅ Proceso Finalizado"
            notificationBody="Tu tarea se completó con éxito. ¡Reutilizando componentes!"
            delaySeconds={1}
            color="#27ae60" // Verde
          />

          {/* EJEMPLO 2: Recordatorio de Tarea */}
          <NotificationButton
            title="Programar Recordatorio (5s)"
            notificationTitle="⏰ ¡Recordatorio!"
            notificationBody="¡No olvides revisar tu lista de pendientes!"
            delaySeconds={20}
            color="#e67e22" // Naranja
          />

          {/* EJEMPLO 3: Notificación de Prueba Rápida */}
          <NotificationButton
            title="Notificación Inmediata (1s)"
            notificationTitle="🚨 Alerta de Prueba"
            notificationBody="Este es un mensaje de prueba rápida."
            delaySeconds={1}
            color="#c0392b" // Rojo
          />
          <SQLiteNotesComponent />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
  codeText: {
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#2c3e50',
  }
});
