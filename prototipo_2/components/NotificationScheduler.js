// components/NotificationScheduler.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('notasApp.db');

// Configurar cómo se mostrarán las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationScheduler() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    initializeDB();
    requestPermissions();
    loadScheduledNotifications();
  }, []);

  // Inicializar base de datos para notificaciones programadas
  const initializeDB = async () => {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notificaciones_programadas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha TEXT NOT NULL,
          hora TEXT NOT NULL,
          titulo TEXT NOT NULL,
          mensaje TEXT NOT NULL,
          notification_id TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      console.log('✅ Tabla de notificaciones programadas creada');
    } catch (error) {
      console.error('❌ Error al crear tabla:', error);
    }
  };

  // Solicitar permisos
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitas habilitar las notificaciones para usar esta función.');
    }
  };

  // Cargar notificaciones programadas
  const loadScheduledNotifications = async () => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM notificaciones_programadas ORDER BY fecha ASC, hora ASC'
      );
      setScheduledNotifications(result);
      
      // Crear marcas en el calendario
      const marks = {};
      result.forEach(notif => {
        marks[notif.fecha] = { marked: true, dotColor: '#3498db' };
      });
      setMarkedDates(marks);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
    }
  };

  // Programar notificación
  const scheduleNotification = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha');
      return;
    }
    if (!notificationTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }

    try {
      // Crear fecha y hora completa
      const [year, month, day] = selectedDate.split('-');
      const scheduledDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );

      // Verificar que la fecha sea futura
      if (scheduledDate <= new Date()) {
        Alert.alert('Error', 'Debes seleccionar una fecha y hora futura');
        return;
      }

      // Programar la notificación
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationMessage || 'Recordatorio programado',
          sound: true,
          priority: 'high',
        },
        trigger: scheduledDate,
      });

      // Guardar en la base de datos
      const timeString = selectedTime.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });

      await db.runAsync(
        `INSERT INTO notificaciones_programadas 
         (fecha, hora, titulo, mensaje, notification_id, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          selectedDate,
          timeString,
          notificationTitle,
          notificationMessage,
          notificationId,
          new Date().toISOString()
        ]
      );

      Alert.alert(
        '✅ ¡Notificación Programada!',
        `Se enviará el ${selectedDate} a las ${timeString}`
      );

      // Limpiar campos
      setNotificationTitle('');
      setNotificationMessage('');
      setSelectedDate('');
      
      // Recargar lista
      loadScheduledNotifications();
    } catch (error) {
      console.error('❌ Error al programar notificación:', error);
      Alert.alert('Error', 'No se pudo programar la notificación');
    }
  };

  // Cancelar notificación
  const cancelNotification = async (id, notificationId) => {
    Alert.alert(
      'Confirmar',
      '¿Deseas cancelar esta notificación programada?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancelar en el sistema
              await Notifications.cancelScheduledNotificationAsync(notificationId);
              
              // Eliminar de la base de datos
              await db.runAsync(
                'DELETE FROM notificaciones_programadas WHERE id = ?',
                [id]
              );
              
              Alert.alert('✅ Cancelada', 'La notificación ha sido cancelada');
              loadScheduledNotifications();
            } catch (error) {
              console.error('❌ Error al cancelar:', error);
              Alert.alert('Error', 'No se pudo cancelar la notificación');
            }
          }
        }
      ]
    );
  };

  // Manejar cambio de hora
  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 Programador de Notificaciones</Text>

      {/* Calendario */}
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              selected: true,
              selectedColor: '#3498db',
              marked: markedDates[selectedDate]?.marked
            }
          }}
          theme={{
            selectedDayBackgroundColor: '#3498db',
            todayTextColor: '#e74c3c',
            arrowColor: '#3498db',
          }}
          minDate={new Date().toISOString().split('T')[0]}
        />
      </View>

      {selectedDate && (
        <View style={styles.formContainer}>
          <Text style={styles.selectedDateText}>
            📆 Fecha seleccionada: {selectedDate}
          </Text>

          {/* Selector de hora */}
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeButtonText}>
              🕐 Hora: {selectedTime.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onTimeChange}
            />
          )}

          {/* Título */}
          <TextInput
            style={styles.input}
            placeholder="Título de la notificación *"
            value={notificationTitle}
            onChangeText={setNotificationTitle}
            maxLength={50}
          />

          {/* Mensaje */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mensaje (opcional)"
            value={notificationMessage}
            onChangeText={setNotificationMessage}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          {/* Botón programar */}
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={scheduleNotification}
          >
            <Text style={styles.scheduleButtonText}>
              ⏰ Programar Notificación
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de notificaciones programadas */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Notificaciones Programadas ({scheduledNotifications.length})
        </Text>

        {scheduledNotifications.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay notificaciones programadas
          </Text>
        ) : (
          scheduledNotifications.map((item) => (
            <View key={item.id} style={styles.notificationCard}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.titulo}</Text>
                {item.mensaje && (
                  <Text style={styles.notificationMessage}>{item.mensaje}</Text>
                )}
                <Text style={styles.notificationDate}>
                  📅 {item.fecha} a las {item.hora}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => cancelNotification(item.id, item.notification_id)}
              >
                <Text style={styles.cancelButtonText}>❌</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 15,
    textAlign: 'center',
  },
  timeButton: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  scheduleButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    margin: 10,
    marginTop: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  notificationDate: {
    fontSize: 13,
    color: '#3498db',
    fontStyle: 'italic',
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    fontSize: 24,
  },
});