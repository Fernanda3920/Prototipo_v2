// services/firebaseService.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  getDocs,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDHMfAMvNcE5plC79ztJ1q6RtuwrB3D1qU",
  authDomain: "facisalud-afced.firebaseapp.com",
  projectId: "facisalud-afced",
  storageBucket: "facisalud-afced.firebasestorage.app",
  messagingSenderId: "367350759159",
  appId: "1:367350759159:web:5812800b3fd1e9da639df2",
  measurementId: "G-FY5YTMQJ3L"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

export const ensureUserIsAuthenticated = async () => {
    if (auth.currentUser) {
        return auth.currentUser.uid;
    }
    
    try {
        const userCredential = await signInAnonymously(auth);
        console.log("✅ Autenticación anónima exitosa. UID generado.");
        return userCredential.user.uid;
    } catch (error) {
        console.error("❌ Error en autenticación:", error);
        throw new Error("No se pudo autenticar al usuario para acceder al servidor.");
    }
};

// ============================================
// FUNCIONES DE NOTAS (RegistrosDiarios)
// ============================================

/**
 * Guarda una nota sincronizada en Firestore.
 */
export const syncNoteToFirestore = async (userId, texto, fechaLocal) => {
    if (!userId) {
        throw new Error("El ID de usuario es requerido para guardar en Firestore.");
    }

    try {
        const docRef = await addDoc(
            collection(db, 'Usuarios', userId, 'RegistrosDiarios'),
            {
                texto: texto,
                fechaLocal: fechaLocal,
                fechaServidor: serverTimestamp(),
                fuente: 'SQLite-Sync',
            }
        );
        console.log("✅ Nota sincronizada con Firebase, ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("❌ Error al sincronizar nota:", error);
        throw error;
    }
};

/**
 * Elimina una nota de Firestore.
 */
export const deleteNoteFromFirestore = async (userId, firebaseId) => {
    if (!userId || !firebaseId) {
        throw new Error("Se requiere userId y firebaseId para eliminar.");
    }

    try {
        const noteRef = doc(db, 'Usuarios', userId, 'RegistrosDiarios', firebaseId);
        await deleteDoc(noteRef);
        console.log("✅ Nota eliminada de Firebase. ID:", firebaseId);
    } catch (error) {
        console.error("❌ Error al eliminar nota:", error);
        throw error;
    }
};

// ============================================
// FUNCIONES DE MEDICAMENTOS
// ============================================

/**
 * Guarda un medicamento en Firestore
 * @param {string} userId - UID del usuario
 * @param {object} medicationData - Datos del medicamento
 * @returns {Promise<string>} ID del documento creado
 */
export const saveMedicationToFirestore = async (userId, medicationData) => {
    if (!userId) {
        throw new Error("El ID de usuario es requerido.");
    }

    try {
        const docRef = await addDoc(
            collection(db, 'Usuarios', userId, 'Medicamentos'),
            {
                nombre: medicationData.nombre,
                dosis: medicationData.dosis || '',
                notas: medicationData.notas || '',
                hora: medicationData.hora,
                frecuencia: medicationData.frecuencia,
                horasPersonalizadas: medicationData.horasPersonalizadas || null,
                activo: medicationData.activo,
                fechaInicio: medicationData.fechaInicio,
                fechaServidor: serverTimestamp(),
                createdAt: new Date().toISOString()
            }
        );
        console.log("✅ Medicamento guardado en Firebase, ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("❌ Error al guardar medicamento en Firebase:", error);
        throw error;
    }
};

/**
 * Actualiza el estado de un medicamento (activo/inactivo)
 */
export const updateMedicationStatusInFirestore = async (userId, firebaseId, isActive) => {
    if (!userId || !firebaseId) {
        throw new Error("Se requiere userId y firebaseId.");
    }

    try {
        const medRef = doc(db, 'Usuarios', userId, 'Medicamentos', firebaseId);
        await updateDoc(medRef, {
            activo: isActive,
            updatedAt: serverTimestamp()
        });
        console.log("✅ Estado de medicamento actualizado en Firebase");
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
        throw error;
    }
};

/**
 * Elimina un medicamento de Firestore
 */
export const deleteMedicationFromFirestore = async (userId, firebaseId) => {
    if (!userId || !firebaseId) {
        throw new Error("Se requiere userId y firebaseId para eliminar.");
    }

    try {
        const medRef = doc(db, 'Usuarios', userId, 'Medicamentos', firebaseId);
        await deleteDoc(medRef);
        console.log("✅ Medicamento eliminado de Firebase. ID:", firebaseId);
    } catch (error) {
        console.error("❌ Error al eliminar medicamento:", error);
        throw error;
    }
};

/**
 * Obtiene todos los medicamentos de un usuario
 */
export const getMedicationsFromFirestore = async (userId) => {
    if (!userId) {
        throw new Error("El ID de usuario es requerido.");
    }

    try {
        const medicationsRef = collection(db, 'Usuarios', userId, 'Medicamentos');
        const querySnapshot = await getDocs(medicationsRef);
        
        const medications = [];
        querySnapshot.forEach((doc) => {
            medications.push({
                firebaseId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${medications.length} medicamentos cargados de Firebase`);
        return medications;
    } catch (error) {
        console.error("❌ Error al cargar medicamentos:", error);
        throw error;
    }
};

// ============================================
// FUNCIONES DE TOMAS DE MEDICAMENTOS
// ============================================

/**
 * Guarda el registro de una toma de medicamento
 */
export const saveMedicationIntakeToFirestore = async (userId, intakeData) => {
    if (!userId) {
        throw new Error("El ID de usuario es requerido.");
    }

    try {
        const docRef = await addDoc(
            collection(db, 'Usuarios', userId, 'TomasMedicamentos'),
            {
                medicamentoId: intakeData.medicamentoId,
                medicamentoNombre: intakeData.medicamentoNombre,
                fecha: intakeData.fecha,
                horaProgramada: intakeData.horaProgramada,
                horaTomada: intakeData.horaTomada || null,
                tomado: intakeData.tomado,
                fechaServidor: serverTimestamp(),
                createdAt: new Date().toISOString()
            }
        );
        console.log("✅ Toma de medicamento guardada en Firebase, ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("❌ Error al guardar toma en Firebase:", error);
        throw error;
    }
};

/**
 * Actualiza el estado de una toma (tomado/no tomado)
 */
export const updateMedicationIntakeInFirestore = async (userId, firebaseId, taken, timeTaken = null) => {
    if (!userId || !firebaseId) {
        throw new Error("Se requiere userId y firebaseId.");
    }

    try {
        const intakeRef = doc(db, 'Usuarios', userId, 'TomasMedicamentos', firebaseId);
        await updateDoc(intakeRef, {
            tomado: taken,
            horaTomada: timeTaken,
            updatedAt: serverTimestamp()
        });
        console.log("✅ Estado de toma actualizado en Firebase");
    } catch (error) {
        console.error("❌ Error al actualizar toma:", error);
        throw error;
    }
};

// Exportar auth y db
export { auth, db };