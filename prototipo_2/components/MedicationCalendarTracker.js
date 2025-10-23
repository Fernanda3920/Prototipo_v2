// components/MedicationCalendarTracker.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('notasApp.db');

export default function MedicationCalendarTracker() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [markedDates, setMarkedDates] = useState({});
  const [todayMedications, setTodayMedications] = useState([]);
  const [medicationRecords, setMedicationRecords] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adherencePercentage, setAdherencePercentage] = useState(0);

  useEffect(() => {
    initializeDB();
    loadData();
  }, []);

  useEffect(() => {
    loadMedicationsForDate(selectedDate);
  }, [selectedDate]);

  const initializeDB = async () => {
    try {
      // Tabla para registrar las tomas de medicamentos
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tomas_medicamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          medicamento_id INTEGER NOT NULL,
          medicamento_nombre TEXT NOT NULL,
          fecha TEXT NOT NULL,
          hora_programada TEXT NOT NULL,
          hora_tomada TEXT,
          tomado INTEGER DEFAULT 0,
          notas TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id)
        );
      `);
      
      // Índice para búsquedas rápidas por fecha
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_tomas_fecha 
        ON tomas_medicamentos(fecha);
      `);
      
      console.log('✅ Tabla de tomas de medicamentos creada');
    } catch (error) {
      console.error('❌ Error al crear tabla:', error);
    }
  };

  const loadData = async () => {
    await generateMedicationRecords();
    await loadCalendarMarks();
    await calculateAdherence();
  };

  // Generar registros de medicamentos para los próximos 30 días
  const generateMedicationRecords = async () => {
    try {
      // Obtener todos los medicamentos activos
      const medications = await db.getAllAsync(
        'SELECT * FROM medicamentos WHERE activo = 1'
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const med of medications) {
        const intervalSeconds = getIntervalFromFrequency(med.frecuencia, med.horas_personalizadas);
        const intervalDays = intervalSeconds / (24 * 60 * 60);
        
        // Generar registros para los próximos 30 días
        for (let day = 0; day <= 30; day++) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + day);
          const dateString = currentDate.toISOString().split('T')[0];

          // Calcular cuántas tomas hay en este día según la frecuencia
          let dosesPerDay = 1;
          if (med.frecuencia === 'every8') dosesPerDay = 3;
          else if (med.frecuencia === 'every12') dosesPerDay = 2;
          else if (med.frecuencia === 'custom' && med.horas_personalizadas < 24) {
            dosesPerDay = Math.floor(24 / med.horas_personalizadas);
          }

          // Verificar si ya existe el registro
          const existing = await db.getAllAsync(
            'SELECT * FROM tomas_medicamentos WHERE medicamento_id = ? AND fecha = ?',
            [med.id, dateString]
          );

          if (existing.length === 0) {
            // Crear registros para cada toma del día
            for (let dose = 0; dose < dosesPerDay; dose++) {
              const [hours, minutes] = med.hora.split(':');
              const doseTime = new Date(currentDate);
              doseTime.setHours(parseInt(hours), parseInt(minutes), 0);
              
              // Ajustar hora según la dosis del día
              if (med.frecuencia === 'every8') {
                doseTime.setHours(doseTime.getHours() + (dose * 8));
              } else if (med.frecuencia === 'every12') {
                doseTime.setHours(doseTime.getHours() + (dose * 12));
              } else if (med.frecuencia === 'custom' && dosesPerDay > 1) {
                doseTime.setHours(doseTime.getHours() + (dose * med.horas_personalizadas));
              }

              const timeString = doseTime.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
              });

              await db.runAsync(
                `INSERT INTO tomas_medicamentos 
                 (medicamento_id, medicamento_nombre, fecha, hora_programada, tomado, createdAt)
                 VALUES (?, ?, ?, ?, 0, ?)`,
                [med.id, med.nombre, dateString, timeString, new Date().toISOString()]
              );
            }
          }
        }
      }

      console.log('✅ Registros de medicamentos generados');
    } catch (error) {
      console.error('❌ Error al generar registros:', error);
    }
  };

  const loadCalendarMarks = async () => {
    try {
      const records = await db.getAllAsync(`
        SELECT 
          fecha,
          COUNT(*) as total,
          SUM(tomado) as tomados
        FROM tomas_medicamentos
        GROUP BY fecha
      `);

      const marks = {};
      records.forEach(record => {
        const allTaken = record.tomados === record.total;
        const someTaken = record.tomados > 0 && record.tomados < record.total;
        
        marks[record.fecha] = {
          marked: true,
          dotColor: allTaken ? '#27ae60' : someTaken ? '#f39c12' : '#e74c3c',
          customStyles: {
            container: {
              backgroundColor: allTaken ? '#d5f4e6' : someTaken ? '#fef5e7' : '#fadbd8',
              borderRadius: 16,
            },
            text: {
              color: '#2c3e50',
              fontWeight: 'bold',
            }
          }
        };
      });

      setMarkedDates(marks);
    } catch (error) {
      console.error('❌ Error al cargar marcas:', error);
    }
  };

  const loadMedicationsForDate = async (date) => {
    try {
      const records = await db.getAllAsync(
        'SELECT * FROM tomas_medicamentos WHERE fecha = ? ORDER BY hora_programada ASC',
        [date]
      );
      setTodayMedications(records);
    } catch (error) {
      console.error('❌ Error al cargar medicamentos del día:', error);
    }
  };

  const markAsTaken = async (recordId, medicationName) => {
    try {
      const now = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });

      await db.runAsync(
        'UPDATE tomas_medicamentos SET tomado = 1, hora_tomada = ? WHERE id = ?',
        [now, recordId]
      );

      Alert.alert('✅ Registrado', `${medicationName} marcado como tomado`);
      
      await loadMedicationsForDate(selectedDate);
      await loadCalendarMarks();
      await calculateAdherence();
    } catch (error) {
      console.error('❌ Error al marcar como tomado:', error);
    }
  };

  const markAsNotTaken = async (recordId, medicationName) => {
    try {
      await db.runAsync(
        'UPDATE tomas_medicamentos SET tomado = 0, hora_tomada = NULL WHERE id = ?',
        [recordId]
      );

      Alert.alert('↩️ Desmarcado', `${medicationName} marcado como no tomado`);
      
      await loadMedicationsForDate(selectedDate);
      await loadCalendarMarks();
      await calculateAdherence();
    } catch (error) {
      console.error('❌ Error al desmarcar:', error);
    }
  };

  const calculateAdherence = async () => {
    try {
      // Calcular adherencia de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];

      const stats = await db.getAllAsync(`
        SELECT 
          COUNT(*) as total,
          SUM(tomado) as tomados
        FROM tomas_medicamentos
        WHERE fecha >= ? AND fecha <= ?
      `, [dateString, getTodayString()]);

      if (stats[0].total > 0) {
        const percentage = Math.round((stats[0].tomados / stats[0].total) * 100);
        setAdherencePercentage(percentage);
      }
    } catch (error) {
      console.error('❌ Error al calcular adherencia:', error);
    }
  };

  const getIntervalFromFrequency = (freq, customHours) => {
    switch (freq) {
      case 'daily': return 24 * 60 * 60;
      case 'every12': return 12 * 60 * 60;
      case 'every8': return 8 * 60 * 60;
      case 'weekly': return 7 * 24 * 60 * 60;
      case 'monthly': return 30 * 24 * 60 * 60;
      case 'custom': return customHours * 60 * 60;
      default: return 24 * 60 * 60;
    }
  };

  const getAdherenceColor = () => {
    if (adherencePercentage >= 90) return '#27ae60';
    if (adherencePercentage >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const getAdherenceText = () => {
    if (adherencePercentage >= 95) return '¡Excelente adherencia!';
    if (adherencePercentage >= 80) return 'Buena adherencia';
    if (adherencePercentage >= 70) return 'Adherencia moderada';
    return 'Necesitas mejorar la adherencia';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Seguimiento de Tratamiento</Text>

      {/* Tarjeta de Adherencia */}
      <View style={styles.adherenceCard}>
        <Text style={styles.adherenceTitle}>Adherencia al Tratamiento</Text>
        <Text style={[styles.adherencePercentage, { color: getAdherenceColor() }]}>
          {adherencePercentage}%
        </Text>
        <Text style={styles.adherenceSubtitle}>{getAdherenceText()}</Text>
        <Text style={styles.adherenceNote}>Últimos 30 días</Text>
      </View>

      {/* Leyenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
          <Text style={styles.legendText}>Completo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f39c12' }]} />
          <Text style={styles.legendText}>Parcial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>Pendiente</Text>
        </View>
      </View>

      {/* Calendario */}
      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              ...markedDates[selectedDate],
              selected: true,
              selectedColor: '#3498db',
            }
          }}
          theme={{
            selectedDayBackgroundColor: '#3498db',
            todayTextColor: '#e74c3c',
            arrowColor: '#3498db',
            monthTextColor: '#2c3e50',
            textMonthFontWeight: 'bold',
          }}
          markingType={'custom'}
        />
      </View>

      {/* Lista de medicamentos del día seleccionado */}
      <View style={styles.dailyListContainer}>
        <Text style={styles.dailyListTitle}>
          📅 Medicamentos para {formatDate(selectedDate)}
        </Text>

        {todayMedications.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay medicamentos programados para este día
          </Text>
        ) : (
          todayMedications.map((med) => (
            <View key={med.id} style={[
              styles.medicationItem,
              med.tomado === 1 && styles.medicationItemTaken
            ]}>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationNameText}>
                  💊 {med.medicamento_nombre}
                </Text>
                <Text style={styles.medicationTimeText}>
                  🕐 Hora programada: {med.hora_programada}
                </Text>
                {med.tomado === 1 && med.hora_tomada && (
                  <Text style={styles.medicationTakenTime}>
                    ✅ Tomado a las: {med.hora_tomada}
                  </Text>
                )}
              </View>

              {med.tomado === 0 ? (
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={() => markAsTaken(med.id, med.medicamento_nombre)}
                >
                  <Text style={styles.checkButtonText}>✓ Marcar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.uncheckButton}
                  onPress={() => markAsNotTaken(med.id, med.medicamento_nombre)}
                >
                  <Text style={styles.uncheckButtonText}>↩ Desmarcar</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Botón de estadísticas detalladas */}
      <TouchableOpacity
        style={styles.statsButton}
        onPress={() => setShowDetailsModal(true)}
      >
        <Text style={styles.statsButtonText}>📈 Ver Estadísticas Detalladas</Text>
      </TouchableOpacity>

      {/* Modal de Estadísticas */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 Estadísticas Detalladas</Text>
            <Text style={styles.modalText}>
              Adherencia general: {adherencePercentage}%
            </Text>
            <Text style={styles.modalInfo}>
              Esta función se expandirá con más detalles próximamente
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Funciones auxiliares
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-MX', options);
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
  adherenceCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adherenceTitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  adherencePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  adherenceSubtitle: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '600',
    marginTop: 5,
  },
  adherenceNote: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
    fontStyle: 'italic',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyListContainer: {
    margin: 15,
  },
  dailyListTitle: {
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
  medicationItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  medicationItemTaken: {
    borderLeftColor: '#27ae60',
    opacity: 0.8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  medicationTimeText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  medicationTakenTime: {
    fontSize: 13,
    color: '#27ae60',
    marginTop: 3,
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  checkButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  uncheckButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  uncheckButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  statsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginVertical: 10,
  },
  modalInfo: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});