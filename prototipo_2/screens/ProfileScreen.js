// En: screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native'; // Añadido Alert
import { getUserProfile } from '../services/firebaseService'; // Importa la función
import { auth } from '../services/firebaseService'; // Para el botón de cerrar sesión

export default function ProfileScreen({ navigation }) { // Asegúrate de recibir navigation
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✨ Usamos useEffect con un listener de 'focus' para recargar
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProfile(); // Llama a fetchProfile cada vez que la pantalla obtiene foco
        });

        fetchProfile(); // Carga inicial al montar

        return unsubscribe; // Limpia el listener al desmontar
    }, [navigation]); // Dependencia: navigation

    // Función para obtener el perfil (separada para reutilizarla)
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const userProfile = await getUserProfile(); // Obtiene el perfil del usuario actual
            setProfile(userProfile);
        } catch (err) {
            setError('Error al cargar el perfil.');
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        auth.signOut()
            .then(() => {
                console.log('Usuario deslogueado');
                // El listener en App.js/Navigator se encargará de la navegación a Login
            })
            .catch((err) => {
                console.error("Error al cerrar sesión:", err);
                Alert.alert('Error', 'No se pudo cerrar sesión.');
            });
    };

    // --- Pantalla de Carga ---
    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#3498db"/></View>;
    }

    // --- Pantalla de Error ---
    if (error) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
    }

    // --- Pantalla si NO hay perfil ---
    if (!profile) {
        return (
            <View style={styles.centered}>
                <Text style={styles.messageText}>No se encontró información del perfil.</Text>
                {/* Botón para ir a completar el perfil */}
                <View style={styles.buttonSpacing}>
                   <Button title="Completar Perfil Ahora" onPress={() => navigation.navigate('CompleteProfile')} />
                </View>
                <View style={styles.buttonSpacing}>
                   <Button title="Cerrar Sesión" onPress={handleLogout} color="#e53e3e" />
                </View>
            </View>
        );
    }

    // --- Pantalla si SÍ hay perfil ---
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mi Perfil</Text>

            {/* Muestra la información del perfil */}
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Correo:</Text>
                {/* Intenta obtener el email del perfil o del auth actual */}
                <Text style={styles.value}>{profile.email || auth.currentUser?.email || 'No disponible'}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Género:</Text>
                <Text style={styles.value}>{profile.gender || 'N/A'}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Año de Nacimiento:</Text>
                <Text style={styles.value}>{profile.birthYear || 'N/A'}</Text>
            </View>
             <View style={styles.infoContainer}>
                <Text style={styles.label}>Edad:</Text>
                {/* Muestra la edad guardada o la calcula si falta */}
                <Text style={styles.value}>{profile.age ? `${profile.age} años` : (profile.birthYear ? `${calculateAge(profile.birthYear.toString())} años` : 'N/A')}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Escolaridad:</Text>
                <Text style={styles.value}>{profile.education || 'N/A'}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>País de Origen:</Text>
                <Text style={styles.value}>{profile.country || 'N/A'}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>Años en BC:</Text>
                {/* Comprueba si el valor existe antes de mostrarlo */}
                <Text style={styles.value}>{profile.yearsInBC !== undefined ? profile.yearsInBC : 'N/A'}</Text>
            </View>

            {/* ✨ Botón para Editar Perfil ✨ */}
            <View style={styles.editButton}>
                <Button
                    title="Editar Perfil"
                    onPress={() => navigation.navigate('EditProfile', { profileData: profile })} // Navega a EditProfile y pasa los datos actuales
                />
            </View>

            {/* Botón para Cerrar Sesión */}
             <View style={styles.logoutButton}>
                <Button title="Cerrar Sesión" onPress={handleLogout} color="#e53e3e" />
             </View>
        </View>
    );
}

// Función auxiliar (puedes moverla a utils si prefieres)
const calculateAge = (year) => {
    if (!year || isNaN(year) || year.length !== 4) return '';
    const currentYear = new Date().getFullYear();
    return (currentYear - parseInt(year)).toString();
};

// --- Estilos --- (Ajustados ligeramente)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25, // Un poco más de padding
        backgroundColor: '#f9f9f9',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 26, // Un poco más grande
        fontWeight: 'bold',
        marginBottom: 35, // Más margen
        textAlign: 'center',
        color: '#333',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Alinea verticalmente
        marginBottom: 18, // Un poco más de espacio
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 16,
        fontWeight: '600', // Un poco más grueso
        color: '#555',
        flex: 1, // Permite que ocupe espacio
    },
    value: {
        fontSize: 16,
        color: '#333',
        flex: 1.5, // Le da más espacio al valor
        textAlign: 'right', // Alinea el valor a la derecha
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center'
    },
    messageText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#444',
    },
    buttonSpacing: { // Estilo para separar botones en la vista 'sin perfil'
        width: '80%',
        marginVertical: 10,
    },
    editButton: { // Estilo para el botón de editar
        marginTop: 30,
        marginBottom: 15,
    },
    logoutButton: {
        marginTop: 15, // Menos espacio si ya hay botón de editar
    },
});