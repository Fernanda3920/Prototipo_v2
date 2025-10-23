// components/MedicationScheduler.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Switch
} from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SQLite from 'expo-sqlite';
import { 
  ensureUserIsAuthenticated, 
  saveMedicationToFirestore,
  updateMedicationStatusInFirestore,
  deleteMedicationFromFirestore 
} from '../services/firebaseService';

const db = SQLite.openDatabaseSync('notasApp.db');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: 'high',
  }),
});

export default function MedicationScheduler() {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [customHours, setCustomHours] = useState('24');
  const [medications, setMedications] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    initializeDB();
    requestPermissions();
    loadMedications();
  }, []);

  const initializeDB = async () => {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS medicamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          dosis TEXT,
          notas TEXT,
          hora TEXT NOT NULL,
          frecuencia TEXT NOT NULL,
          horas_personalizadas INTEGER,
          activo INTEGER DEFAULT 1,
          notification_ids TEXT,
          firebase_id TEXT,
          fecha_inicio TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      
      // Agregar columna firebase_id si no existe
      try {
        await db.execAsync(`ALTER TABLE medicamentos ADD COLUMN firebase_id TEXT;`);
        console.log('✅ Columna firebase_id agregada');
      } catch (alterError) {
        console.log('ℹ️ Columna firebase_id ya existe');
      }
      
      console.log('✅ Tabla de medicamentos creada');
    } catch (error) {
      console.error('❌ Error al crear tabla:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitas habilitar las notificaciones para recibir recordatorios.');
    }
  };

  const loadMedications = async () => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM medicamentos ORDER BY hora ASC'
      );
      setMedications(result);
    } catch (error) {
      console.error('❌ Error al cargar medicamentos:', error);
    }
  };

  const getFrequencyInSeconds = () => {
    switch (frequency) {
      case 'daily': return 24 * 60 * 60;
      case 'every12': return 12 * 60 * 60;
      case 'every8': return 8 * 60 * 60;
      case 'weekly': return 7 * 24 * 60 * 60;
      case 'monthly': return 30 * 24 * 60 * 60;
      case 'custom': return parseInt(customHours) * 60 * 60;
      default: return 24 * 60 * 60;
    }
  };

  const scheduleMedicationNotifications = async (medName, medDosage, firstTime) => {
    const notificationIds = [];
    const intervalSeconds = getFrequencyInSeconds();
    const numberOfNotifications = Math.min(90, Math.ceil((30 * 24 * 60 * 60) / intervalSeconds));

    try {
      for (let i = 0; i < numberOfNotifications; i++) {
        const triggerDate = new Date(firstTime.getTime() + (i * intervalSeconds * 1000));
        
        if (triggerDate > new Date()) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `💊 Recordatorio: ${medName}`,
              body: medDosage ? `Tomar ${medDosage}` : 'Es hora de tu medicamento',
              sound: true,
              priority: 'high',
              data: { medicationName: medName },
            },
            trigger: triggerDate,
          });
          notificationIds.push(notificationId);
        }
      }
      
      console.log(`✅ ${notificationIds.length} notificaciones programadas para ${medName}`);
      return notificationIds;
    } catch (error) {
      console.error('❌ Error al programar notificaciones:', error);
      throw error;
    }
  };

  const saveMedication = async () => {
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del medicamento');
      return;
    }

    let localId = null;
    const timeString = startTime.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const horasPersonalizadas = frequency === 'custom' ? parseInt(customHours) : null;
    const fechaInicio = new Date().toISOString();

    try {
      setIsSyncing(true);

      // 1. Programar notificaciones locales
      const notificationIds = await scheduleMedicationNotifications(
        medicationName,
        dosage,
        startTime
      );

      // 2. Guardar en SQLite (local)
      const result = await db.runAsync(
        `INSERT INTO medicamentos 
         (nombre, dosis, notas, hora, frecuencia, horas_personalizadas, activo, notification_ids, firebase_id, fecha_inicio, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medicationName,
          dosage,
          notes,
          timeString,
          frequency,
          horasPersonalizadas,
          1,
          JSON.stringify(notificationIds),
          null, // firebase_id empieza como null
          fechaInicio,
          new Date().toISOString()
        ]
      );

      localId = result.lastInsertRowId;

      // 3. Sincronizar con Firebase
      try {
        const userId = await ensureUserIsAuthenticated();
        const firebaseId = await saveMedicationToFirestore(userId, {
          nombre: medicationName,
          dosis: dosage,
          notas: notes,
          hora: timeString,
          frecuencia: frequency,
          horasPersonalizadas: horasPersonalizadas,
          activo: true,
          fechaInicio: fechaInicio
        });

        // 4. Actualizar SQLite con el firebase_id
        if (firebaseId && localId) {
          await db.runAsync(
            'UPDATE medicamentos SET firebase_id = ? WHERE id = ?',
            [firebaseId, localId]
          );
          console.log(`✅ Firebase ID (${firebaseId}) vinculado a medicamento local (${localId})`);
        }

        const frequencyText = getFrequencyText();
        Alert.alert(
          '✅ Medicamento Guardado',
          `${medicationName} programado ${frequencyText}\nPrimera toma: ${timeString}\n\n☁️ Sincronizado con la nube`
        );
      } catch (firebaseError) {
        console.error('⚠️ Error en Firebase:', firebaseError);
        Alert.alert(
          '⚠️ Guardado Local',
          `${medicationName} guardado localmente.\nNo se pudo sincronizar con la nube. Verifica tu conexión.`
        );
      }

      // Limpiar campos
      setMedicationName('');
      setDosage('');
      setNotes('');
      setStartTime(new Date());
      
      loadMedications();
    } catch (error) {
      console.error('❌ Error al guardar medicamento:', error);
      Alert.alert('Error', 'No se pudo guardar el medicamento');
    } finally {
      setIsSyncing(false);
    }
  };

  const getFrequencyText = () => {
    switch (frequency) {
      case 'daily': return 'cada 24 horas';
      case 'every12': return 'cada 12 horas';
      case 'every8': return 'cada 8 horas';
      case 'weekly': return 'cada semana';
      case 'monthly': return 'cada mes';
      case 'custom': return `cada ${customHours} horas`;
      default: return 'diario';
    }
  };

  const toggleMedication = async (id, currentStatus, notificationIdsStr, firebaseId) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      if (newStatus === 0) {
        // Cancelar notificaciones locales
        const notificationIds = JSON.parse(notificationIdsStr);
        for (const notifId of notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        }
        Alert.alert('⏸️ Pausado', 'Las notificaciones han sido pausadas');
      } else {
        Alert.alert('ℹ️ Reactivar', 'Para reactivar, elimina y crea nuevamente el medicamento con el horario actualizado');
        return;
      }

      // Actualizar SQLite
      await db.runAsync(
        'UPDATE medicamentos SET activo = ? WHERE id = ?',
        [newStatus, id]
      );

      // Actualizar Firebase si existe firebaseId
      if (firebaseId) {
        try {
          const userId = await ensureUserIsAuthenticated();
          await updateMedicationStatusInFirestore(userId, firebaseId, newStatus === 1);
          console.log('✅ Estado actualizado en Firebase');
        } catch (firebaseError) {
          console.error('⚠️ Error al actualizar en Firebase:', firebaseError);
        }
      }
      
      loadMedications();
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
    }
  };

  const deleteMedication = async (id, notificationIdsStr, firebaseId) => {
    Alert.alert(
      'Confirmar',
      '¿Deseas eliminar este medicamento y todas sus notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Cancelar notificaciones locales
              const notificationIds = JSON.parse(notificationIdsStr);
              for (const notifId of notificationIds) {
                await Notifications.cancelScheduledNotificationAsync(notifId);
              }
              
              // 2. Eliminar de SQLite
              await db.runAsync('DELETE FROM medicamentos WHERE id = ?', [id]);
              
              // 3. Eliminar de Firebase si existe firebaseId
              if (firebaseId) {
                try {
                  const userId = await ensureUserIsAuthenticated();
                  await deleteMedicationFromFirestore(userId, firebaseId);
                  console.log('✅ Medicamento eliminado de Firebase');
                } catch (firebaseError) {
                  console.error('⚠️ Error al eliminar de Firebase:', firebaseError);
                }
              }
              
              Alert.alert('✅ Eliminado', 'Medicamento y notificaciones eliminadas');
              loadMedications();
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
            }
          }
        }
      ]
    );
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💊 Control de Medicamentos</Text>
      <Text style={styles.subtitle}>Programa tus medicamentos y horarios</Text>

      {/* FORMULARIO PARA AGREGAR MEDICAMENTOS */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>➕ Agregar Nuevo Medicamento</Text>
        
        <Text style={styles.label}>Medicamento *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Biktarvy, Truvada, etc."
          value={medicationName}
          onChangeText={setMedicationName}
          maxLength={50}
          editable={!isSyncing}
        />

        <Text style={styles.label}>Dosis</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 1 tableta, 2 cápsulas"
          value={dosage}
          onChangeText={setDosage}
          maxLength={50}
          editable={!isSyncing}
        />

        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Instrucciones especiales..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          maxLength={200}
          editable={!isSyncing}
        />

        <Text style={styles.label}>Primera toma</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
          disabled={isSyncing}
        >
          <Text style={styles.timeButtonText}>
            🕐 {startTime.toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.frequencyContainer}>
          {[
            { value: 'every8', label: 'Cada 8h' },
            { value: 'every12', label: 'Cada 12h' },
            { value: 'daily', label: 'Cada 24h' },
            { value: 'weekly', label: 'Semanal' },
            { value: 'monthly', label: 'Mensual' },
            { value: 'custom', label: 'Personalizado' },
          ].map((freq) => (
            <TouchableOpacity
              key={freq.value}
              style={[
                styles.frequencyButton,
                frequency === freq.value && styles.frequencyButtonSelected
              ]}
              onPress={() => setFrequency(freq.value)}
              disabled={isSyncing}
            >
              <Text style={[
                styles.frequencyButtonText,
                frequency === freq.value && styles.frequencyButtonTextSelected
              ]}>
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequency === 'custom' && (
          <View style={styles.customFrequencyContainer}>
            <Text style={styles.label}>Cada cuántas horas:</Text>
            <TextInput
              style={styles.customInput}
              placeholder="24"
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="numeric"
              maxLength={3}
              editable={!isSyncing}
            />
            <Text style={styles.customLabel}>horas</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, isSyncing && styles.saveButtonDisabled]}
          onPress={saveMedication}
          disabled={isSyncing}
        >
          <Text style={styles.saveButtonText}>
            {isSyncing ? '☁️ Guardando y Sincronizando...' : '💾 Guardar Medicamento'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE MEDICAMENTOS GUARDADOS */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          📋 Mis Medicamentos ({medications.length})
        </Text>

        {medications.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay medicamentos registrados.{'\n'}Agrega tu primer medicamento arriba.
          </Text>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={[
              styles.medicationCard,
              med.activo === 0 && styles.medicationCardInactive
            ]}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationTitleContainer}>
                  <Text style={styles.medicationName}>💊 {med.nombre}</Text>
                  {med.firebase_id && (
                    <Text style={styles.syncBadge}>☁️</Text>
                  )}
                </View>
                <Switch
                  value={med.activo === 1}
                  onValueChange={() => toggleMedication(med.id, med.activo, med.notification_ids, med.firebase_id)}
                  trackColor={{ false: '#767577', true: '#3498db' }}
                  thumbColor={med.activo === 1 ? '#fff' : '#f4f3f4'}
                />
              </View>
              
              {med.dosis && (
                <Text style={styles.medicationDosage}>📋 Dosis: {med.dosis}</Text>
              )}
              
              <Text style={styles.medicationSchedule}>
                🕐 A las {med.hora} - {getFrequencyTextFromDB(med.frecuencia, med.horas_personalizadas)}
              </Text>
              
              {med.notas && (
                <Text style={styles.medicationNotes}>📝 {med.notas}</Text>
              )}
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteMedication(med.id, med.notification_ids, med.firebase_id)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getFrequencyTextFromDB = (freq, customHours) => {
  switch (freq) {
    case 'daily': return 'Cada 24 horas';
    case 'every12': return 'Cada 12 horas';
    case 'every8': return 'Cada 8 horas';
    case 'weekly': return 'Cada semana';
    case 'monthly': return 'Cada mes';
    case 'custom': return `Cada ${customHours} horas`;
    default: return 'Diario';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#7f8c8d',
    fontStyle: 'italic',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timeButton: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  frequencyButton: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  frequencyButtonTextSelected: {
    color: 'white',
  },
  customFrequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  customInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  customLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
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
    lineHeight: 24,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#27ae60',
  },
  medicationCardInactive: {
    opacity: 0.6,
    borderLeftColor: '#95a5a6',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  syncBadge: {
    fontSize: 16,
    color: '#3498db',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  medicationSchedule: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 5,
  },
  medicationNotes: {
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 5,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});