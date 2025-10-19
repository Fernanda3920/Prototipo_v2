// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
// Reemplaza estos valores con tu configuración real de Firebase
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

export const ensureUserIsAuthenticated = async () => {
    if (auth.currentUser) {
        return auth.currentUser.uid;
    }
    
    try {
        const userCredential = await signInAnonymously(auth);
        console.log("✅ Autenticación anónima exitosa. UID generado.");
        return userCredential.user.uid;
    } catch (error) {
        console.error("❌ Error en autenticación para guardar datos:", error);
        throw new Error("No se pudo autenticar al usuario para acceder al servidor.");
    }
};

/**
 * Guarda una nota sincronizada en Firestore.
 * @param {string} userId - El UID del usuario de Firebase.
 * @param {string} texto - El contenido de la nota.
 * @param {string} fechaLocal - La fecha y hora local de la nota (de SQLite).
 * @returns {Promise<string>} El ID del documento creado en Firebase
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
                fechaLocal: fechaLocal, // Guardamos la fecha local de SQLite
                fechaServidor: serverTimestamp(), // Fecha de Firestore (más precisa para la facultad)
                fuente: 'SQLite-Sync',
            }
        );
        console.log("✅ Nota sincronizada con Firebase, ID de documento:", docRef.id);
        return docRef.id; // IMPORTANTE: Devuelve el ID del documento
    } catch (error) {
        console.error("❌ Error al sincronizar con Firebase:", error);
        throw error;
    }
};

/**
 * Elimina una nota de Firestore.
 * @param {string} userId - El UID del usuario de Firebase.
 * @param {string} firebaseId - El ID del documento en Firebase.
 * @returns {Promise<void>}
 */
export const deleteNoteFromFirestore = async (userId, firebaseId) => {
    if (!userId) {
        throw new Error("El ID de usuario es requerido para eliminar de Firestore.");
    }
    
    if (!firebaseId) {
        throw new Error("El ID del documento de Firebase es requerido para eliminar.");
    }

    try {
        // Referencia al documento específico
        const noteRef = doc(db, 'Usuarios', userId, 'RegistrosDiarios', firebaseId);
        
        // Eliminar el documento
        await deleteDoc(noteRef);
        
        console.log("✅ Nota eliminada de Firebase. ID:", firebaseId);
    } catch (error) {
        console.error("❌ Error al eliminar nota de Firebase:", error);
        throw error;
    }
};

// Puedes exportar 'auth' y 'db' si necesitas usarlos en otros lugares
export { auth, db };