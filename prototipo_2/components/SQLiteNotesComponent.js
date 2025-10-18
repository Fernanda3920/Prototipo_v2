// components/SQLiteNotesComponent.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';
import * as SQLite from 'expo-sqlite';

// Abrimos/creamos la base de datos
const db = SQLite.openDatabaseSync('notasApp.db');

export default function SQLiteNotesComponent() {
  const [nota, setNota] = useState('');
  const [notas, setNotas] = useState([]);

  // Inicializar la base de datos al montar el componente
  useEffect(() => {
    inicializarDB();
    cargarNotas();
  }, []);

  // Crear la tabla si no existe
  const inicializarDB = async () => {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          texto TEXT NOT NULL,
          fecha TEXT NOT NULL
        );
      `);
      console.log('✅ Base de datos inicializada');
    } catch (error) {
      console.error('❌ Error al inicializar DB:', error);
    }
  };

  // Cargar todas las notas
  const cargarNotas = async () => {
    try {
      const resultado = await db.getAllAsync('SELECT * FROM notas ORDER BY id DESC');
      setNotas(resultado);
    } catch (error) {
      console.error('❌ Error al cargar notas:', error);
    }
  };

  // Guardar una nueva nota
  const guardarNota = async () => {
    if (nota.trim() === '') {
      Alert.alert('Atención', 'Por favor escribe algo antes de guardar');
      return;
    }

    try {
      const fechaActual = new Date().toLocaleString('es-MX');
      await db.runAsync(
        'INSERT INTO notas (texto, fecha) VALUES (?, ?)',
        [nota, fechaActual]
      );
      
      setNota(''); // Limpiar el campo
      cargarNotas(); // Recargar la lista
      Alert.alert('✅ Éxito', 'Nota guardada correctamente');
    } catch (error) {
      console.error('❌ Error al guardar nota:', error);
      Alert.alert('Error', 'No se pudo guardar la nota');
    }
  };

  // Eliminar una nota
  const eliminarNota = async (id) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM notas WHERE id = ?', [id]);
              cargarNotas();
              Alert.alert('✅ Eliminada', 'La nota ha sido eliminada');
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
            }
          }
        }
      ]
    );
  };

  // Renderizar cada nota
  const renderNota = ({ item }) => (
    <View style={styles.notaCard}>
      <View style={styles.notaContent}>
        <Text style={styles.notaTexto}>{item.texto}</Text>
        <Text style={styles.notaFecha}>{item.fecha}</Text>
      </View>
      <TouchableOpacity
        style={styles.btnEliminar}
        onPress={() => eliminarNota(item.id)}
      >
        <Text style={styles.btnEliminarTexto}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📝 Mis Notas (SQLite)</Text>
      
      {/* Input para nueva nota */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu nota aquí..."
          value={nota}
          onChangeText={setNota}
          multiline
        />
        <TouchableOpacity style={styles.btnGuardar} onPress={guardarNota}>
          <Text style={styles.btnTexto}>💾 Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de notas */}
      <Text style={styles.subtitulo}>
        Notas guardadas: {notas.length}
      </Text>
      
      <FlatList
        data={notas}
        renderItem={renderNota}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.textoVacio}>
            No hay notas aún. ¡Escribe tu primera nota! ✍️
          </Text>
        }
        style={styles.lista}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    marginVertical: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  btnGuardar: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 10,
    fontWeight: '600',
  },
  lista: {
    maxHeight: 400,
  },
  notaCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  notaContent: {
    flex: 1,
  },
  notaTexto: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
  },
  notaFecha: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  btnEliminar: {
    padding: 10,
  },
  btnEliminarTexto: {
    fontSize: 24,
  },
  textoVacio: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 30,
  },
});