import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal, // Usaremos Modal para la alerta/confirmación
} from 'react-native';
// Importamos el servicio de Firebase que creamos
import { ensureUserIsAuthenticated, syncNoteToFirestore } from '../services/firebaseService'; 
import * as SQLite from 'expo-sqlite';

// Abrimos/creamos la base de datos
const db = SQLite.openDatabaseSync('notasApp.db');

// --- Componente de Modal de Alerta Personalizado (Reemplazo de Alert.alert) ---
const CustomModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Aceptar' }) => {
    if (!visible) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel} // Para manejar el botón de atrás en Android
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
  const [isSyncing, setIsSyncing] = useState(false); // Nuevo estado para la sincronización
  
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

    // 1. Guardar en SQLite (La parte que funciona offline)
    try {
      await db.runAsync(
        'INSERT INTO notas (texto, fecha) VALUES (?, ?)',
        [notaTexto, fechaActual]
      );
      
      setNota(''); // Limpiar el campo
      cargarNotas(); // Recargar la lista
      
      showModal('✅ Éxito', 'Nota guardada localmente. Iniciando sincronización a la nube...', hideModal);

      // 2. SINCRONIZAR A FIREBASE (Lógica de servidor)
      setIsSyncing(true);
      const userId = await ensureUserIsAuthenticated(); // Asegura tener un UID
      await syncNoteToFirestore(userId, notaTexto, fechaActual);

      showModal('✅ Éxito Total', 'Nota guardada y sincronizada correctamente con Firebase!', hideModal);

    } catch (error) {
      // Si falla SQLite o Firebase
      console.error('❌ Error en el proceso de guardar/sincronizar:', error);
      
      // Mostrar al usuario qué falló. Es CRÍTICO que el usuario sepa si la copia de seguridad falló.
      if (error.message.includes("autenticar")) {
           showModal('⚠️ Error de Servidor', 'La nota se guardó localmente, pero falló la conexión al servidor (Firebase). Revisa tu internet o autenticación.', hideModal);
      } else {
           showModal('❌ Error Local', 'No se pudo guardar la nota ni localmente ni en la nube. Revisa los logs de SQLite.', hideModal);
      }
      
    } finally {
        setIsSyncing(false);
    }
  };

  // Eliminar una nota
  const eliminarNota = async (id) => {
    showModal(
        'Confirmar',
        '¿Estás seguro de eliminar esta nota? (Solo se eliminará localmente)',
        async () => {
            hideModal(); // Ocultar el modal antes de la operación
            try {
              await db.runAsync('DELETE FROM notas WHERE id = ?', [id]);
              cargarNotas();
              showModal('✅ Eliminada', 'La nota ha sido eliminada localmente.', hideModal);
              // NOTA: Para eliminar de Firebase, necesitarías guardar el ID de Firestore en SQLite 
              // y luego llamar a una función para eliminar el registro de la nube. 
              // Por simplicidad de la copia, solo eliminamos localmente.
            } catch (error) {
              console.error('❌ Error al eliminar:', error);
              showModal('❌ Error Local', 'No se pudo eliminar la nota.', hideModal);
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
      {/* El Custom Modal debe ir primero en el render */}
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

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  input: {
    minHeight: 80,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  btnGuardar: {
    backgroundColor: '#059669', // Verde para guardar
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnGuardarDisabled: {
    backgroundColor: '#9ca3af', // Gris si está sincronizando
  },
  btnTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lista: {
    marginTop: 10,
  },
  notaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#3b82f6', // Borde azul
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.0,
    elevation: 1,
  },
  notaContent: {
    flex: 1,
    paddingRight: 10,
  },
  notaTexto: {
    fontSize: 16,
    marginBottom: 5,
    color: '#1f2937',
  },
  notaFecha: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  btnEliminar: {
    backgroundColor: '#ef4444', // Rojo para eliminar
    padding: 8,
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEliminarTexto: {
    fontSize: 18,
  },
  textoVacio: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#6b7280',
  },
});

const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Fondo semitransparente
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 25,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalText: {
        marginBottom: 20,
        textAlign: "center",
        fontSize: 16,
        color: '#4b5563',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    button: {
        borderRadius: 8,
        padding: 10,
        elevation: 2,
        minWidth: 100,
        marginHorizontal: 5,
    },
    buttonConfirm: {
        backgroundColor: "#3b82f6", // Azul
    },
    buttonCancel: {
        backgroundColor: "#9ca3af", // Gris
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    }
});
