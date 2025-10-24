// services/firebaseService.js
import { initializeApp } from 'firebase/app';
// Asegúrate de importar las funciones de Auth que necesitas (signInWithEmailAndPassword, etc.) si las usas aquí
import { getAuth, signInAnonymously, signInWithEmailAndPassword /* Agrega otras si las usas */ } from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc, // Necesario para getUserProfile
    setDoc, // Necesario para updateUserProfile
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDHMfAMvNcE5plC79ztJ1q6RtuwrB3D1qU", // Considera usar variables de entorno para esto
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
// FUNCIONES DE PERFIL DE USUARIO (NUEVA SECCIÓN) ✨
// ============================================

/**
 * Guarda o actualiza la información del perfil del usuario en Firestore.
 * Marca el perfil como completo.
 * @param {object} profileData - Datos del perfil a guardar (género, año, etc.)
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (profileData) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuario no autenticado.");
    }
    try {
        // Apunta a la colección 'userProfiles' y al documento con el UID del usuario
        const userDocRef = doc(db, 'userProfiles', user.uid);
        // Usa setDoc con merge:true para crear el documento si no existe,
        // o actualizarlo si ya existe, sin sobrescribir campos no incluidos.
        await setDoc(userDocRef, {
            ...profileData, // Guarda todos los datos del formulario
            profileComplete: true, // Marca el perfil como completo
            userId: user.uid, // Guarda el UID como referencia
            email: user.email // Guarda el email como referencia
        }, { merge: true }); // La opción merge es importante
        console.log("✅ Perfil de usuario guardado/actualizado en Firestore");
    } catch (error) {
        console.error("❌ Error al guardar perfil en Firestore:", error);
        throw error; // Propaga el error para manejarlo en la pantalla
    }
};

/**
 * Obtiene la información del perfil del usuario desde Firestore.
 * @param {string} [userId] - UID del usuario. Si no se proporciona, usa el usuario actual.
 * @returns {Promise<object|null>} Objeto con los datos del perfil o null si no existe.
 */
export const getUserProfile = async (userId) => {
    // Si no se pasa un userId, intenta obtener el del usuario actual autenticado
    if (!userId) {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado.");
        userId = currentUser.uid;
    }
    try {
        const userDocRef = doc(db, 'userProfiles', userId);
        const docSnap = await getDoc(userDocRef); // Intenta obtener el documento

        if (docSnap.exists()) {
            // Si el documento existe, devuelve sus datos junto con el ID
            console.log("✅ Perfil de usuario encontrado:", userId);
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            // Si el documento no existe
            console.log("ℹ️ No se encontró perfil para el usuario:", userId);
            return null; // Indica que el perfil no existe (o está incompleto)
        }
    } catch (error) {
        console.error("❌ Error al obtener perfil de Firestore:", error);
        throw error; // Propaga el error
    }
};


// ============================================
// FUNCIONES DE NOTAS (RegistrosDiarios)
// ============================================
// (Tu código existente para notas va aquí...)
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
// (Tu código existente para medicamentos va aquí...)
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
// (Tu código existente para tomas va aquí...)
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


// Exportar auth y db para usarlos en otras partes de la app
export { auth, db };