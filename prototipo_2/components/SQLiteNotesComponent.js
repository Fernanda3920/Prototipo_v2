import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { ensureUserIsAuthenticated, syncNoteToFirestore, deleteNoteFromFirestore } from '../services/firebaseService'; 
import * as SQLite from 'expo-sqlite';
import { componentStyles as styles, modalStyles } from '../styles/SQLLiteNotesStyles';

// Abrimos/creamos la base de datos
const db = SQLite.openDatabaseSync('notasApp.db');

// --- Componente de Modal de Alerta Personalizado ---
const CustomModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Aceptar' }) => {
    if (!visible) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={modalStyles.centeredView}>
                <View style={modalStyles.modalView}>
                    <Text style={modalStyles.modalTitle}>{title}</Text>
                    <Text style={modalStyles.modalText}>{message}</Text>
                    <View style={modalStyles.buttonContainer}>
                        {onCancel && (
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonCancel]}
                                onPress={onCancel}
                            >
                                <Text style={modalStyles.textStyle}>Cancelar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.buttonConfirm]}
                            onPress={onConfirm}
                        >
                            <Text style={modalStyles.textStyle}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function SQLiteNotesComponent() {
  const [nota, setNota] = useState('');
  const [notas, setNotas] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Estados para el modal personalizado
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({});

  // Inicializar la base de datos al montar el componente
  useEffect(() => {
    inicializarDB();
    cargarNotas();
  }, []);

  // Función para mostrar el modal
  const showModal = (title, message, onConfirm, onCancel = null, confirmText = 'Aceptar') => {
    setModalData({ title, message, onConfirm, onCancel, confirmText });
    setModalVisible(true);
  };
  
  const hideModal = () => setModalVisible(false);

  // Crear la tabla si no existe (AHORA CON FIREBASE_ID)
  const inicializarDB = async () => {
    try {
      // Primero intentamos agregar la columna si la tabla ya existe
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          texto TEXT NOT NULL,
          fecha TEXT NOT NULL,
          firebase_id TEXT
        );
      `);
      
      // Si la tabla ya existía sin firebase_id, la agregamos
      try {
        await db.execAsync(`
          ALTER TABLE notas ADD COLUMN firebase_id TEXT;
        `);
        console.log('✅ Columna firebase_id agregada');
      } catch (alterError) {
        // Si falla es porque ya existe la columna, no pasa nada
        console.log('ℹ️ Columna firebase_id ya existe');
      }
      
      console.log('✅ Base de datos SQLite inicializada');
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

  // Guardar una nueva nota y SINCRONIZAR
  const guardarNota = async () => {
    if (nota.trim() === '') {
      showModal('Atención', 'Por favor escribe algo antes de guardar', hideModal);
      return;
    }

    const notaTexto = nota.trim();
    const fechaActual = new Date().toLocaleString('es-MX');
    let localId = null;

    // 1. Guardar en SQLite (La parte que funciona offline)
    try {
      const result = await db.runAsync(
        'INSERT INTO notas (texto, fecha, firebase_id) VALUES (?, ?, ?)',
        [notaTexto, fechaActual, null] // firebase_id empieza como null
      );
      
      localId = result.lastInsertRowId; // Guardamos el ID local
      
      setNota(''); // Limpiar el campo
      cargarNotas(); // Recargar la lista
      
      showModal('✅ Éxito', 'Nota guardada localmente. Iniciando sincronización a la nube...', hideModal);

      // 2. SINCRONIZAR A FIREBASE (Lógica de servidor)
      setIsSyncing(true);
      const userId = await ensureUserIsAuthenticated();
      const firebaseDocId = await syncNoteToFirestore(userId, notaTexto, fechaActual);

      // 3. ACTUALIZAR SQLite CON EL ID DE FIREBASE
      if (firebaseDocId && localId) {
        await db.runAsync(
          'UPDATE notas SET firebase_id = ? WHERE id = ?',
          [firebaseDocId, localId]
        );
        console.log(`✅ Firebase ID (${firebaseDocId}) vinculado a nota local (${localId})`);
        cargarNotas(); // Recargar para mostrar el firebase_id
      }

      showModal('✅ Éxito Total', 'Nota guardada y sincronizada correctamente con Firebase!', hideModal);

    } catch (error) {
      console.error('❌ Error en el proceso de guardar/sincronizar:', error);
      
      if (error.message.includes("autenticar")) {
           showModal('⚠️ Error de Servidor', 'La nota se guardó localmente, pero falló la conexión al servidor (Firebase). Revisa tu internet o autenticación.', hideModal);
      } else {
           showModal('❌ Error Local', 'No se pudo guardar la nota ni localmente ni en la nube. Revisa los logs de SQLite.', hideModal);
      }
      
    } finally {
        setIsSyncing(false);
    }
  };

  // Eliminar una nota (AHORA TAMBIÉN DE FIREBASE)
  const eliminarNota = async (id, firebaseId) => {
    showModal(
        'Confirmar',
        '¿Estás seguro de eliminar esta nota? Se eliminará localmente y de la nube.',
        async () => {
            hideModal();
            try {
              // 1. Eliminar de SQLite
              await db.runAsync('DELETE FROM notas WHERE id = ?', [id]);
              
              // 2. Eliminar de Firebase SI existe firebaseId
              if (firebaseId) {
                const userId = await ensureUserIsAuthenticated();
                await deleteNoteFromFirestore(userId, firebaseId);
                console.log(`✅ Nota eliminada de Firebase: ${firebaseId}`);
              } else {
                console.log('⚠️ Esta nota no tiene firebase_id, solo se eliminó localmente');
              }
              
              cargarNotas();
              showModal('✅ Eliminada', 'La nota ha sido eliminada completamente.', hideModal);
              
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              showModal('❌ Error', 'Hubo un problema al eliminar la nota. Revisa tu conexión.', hideModal);
            }
        },
        hideModal,
        'Eliminar'
    );
  };

  // Renderizar cada nota
  const renderNota = ({ item }) => (
    <View style={styles.notaCard}>
      <View style={styles.notaContent}>
        <Text style={styles.notaTexto}>{item.texto}</Text>
        <Text style={styles.notaFecha}>{item.fecha}</Text>
        {/* Indicador visual de si está sincronizada */}
        {item.firebase_id ? (
          <Text style={styles.notaSyncStatus}>☁️ Sincronizada</Text>
        ) : (
          <Text style={styles.notaSyncStatusPending}>📴 Solo local</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.btnEliminar}
        onPress={() => eliminarNota(item.id, item.firebase_id)}
      >
        <Text style={styles.btnEliminarTexto}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomModal 
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        onConfirm={modalData.onConfirm}
        onCancel={modalData.onCancel}
        confirmText={modalData.confirmText}
      />
      
      <Text style={styles.titulo}>📝 Mis Notas (SQLite + Firebase Sync)</Text>
      
      {/* Input para nueva nota */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu nota aquí..."
          value={nota}
          onChangeText={setNota}
          multiline
        />
        <TouchableOpacity 
            style={[styles.btnGuardar, isSyncing && styles.btnGuardarDisabled]} 
            onPress={guardarNota}
            disabled={isSyncing}
        >
          <Text style={styles.btnTexto}>{isSyncing ? '☁️ Sincronizando...' : '💾 Guardar y Sincronizar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de notas */}
      <Text style={styles.subtitulo}>
        Notas guardadas localmente: {notas.length}
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