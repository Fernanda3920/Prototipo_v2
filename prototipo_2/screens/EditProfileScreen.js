// En: screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { updateUserProfile } from '../services/firebaseService'; // Reutilizamos la misma función
import { CountryList } from '../utils/countries';

// Recibimos 'route' además de 'navigation' para acceder a los parámetros
export default function EditProfileScreen({ route, navigation }) {
    // Obtenemos los datos pasados desde ProfileScreen
    const { profileData } = route.params;

    // ✨ Inicializamos los estados con los datos existentes ✨
    const [gender, setGender] = useState(profileData?.gender || null);
    const [birthYear, setBirthYear] = useState(profileData?.birthYear?.toString() || '');
    const [education, setEducation] = useState(profileData?.education || null);
    const [country, setCountry] = useState(profileData?.country || null);
    const [yearsInBC, setYearsInBC] = useState(profileData?.yearsInBC?.toString() || '');

    const calculateAge = (year) => {
        // ... (misma función que antes)
         if (!year || isNaN(year) || year.length !== 4) return '';
        const currentYear = new Date().getFullYear();
        return (currentYear - parseInt(year)).toString();
    };

    const handleUpdateProfile = async () => {
        // ... (Mismas validaciones que en CompleteProfileScreen) ...
         if (!gender || !birthYear || !education || !country || !yearsInBC) {
            Alert.alert('Campos incompletos', 'Por favor, rellena toda la información.');
            return;
        }
        if (isNaN(birthYear) || birthYear.length !== 4 || parseInt(birthYear) < 1900 || parseInt(birthYear) > new Date().getFullYear()) {
             Alert.alert('Año inválido', 'Introduce un año de nacimiento válido (4 dígitos).');
             return;
        }
         if (isNaN(yearsInBC) || parseInt(yearsInBC) < 0) {
             Alert.alert('Años inválidos', 'Introduce un número válido para los años en BC.');
             return;
        }

        const updatedProfileData = {
            gender,
            birthYear: parseInt(birthYear),
            age: parseInt(calculateAge(birthYear)),
            education,
            country,
            yearsInBC: parseInt(yearsInBC),
            // Asegúrate de que profileComplete siga siendo true o no lo incluyas para que merge lo conserve
        };

        try {
            // Llamamos a la misma función de actualización
            await updateUserProfile(updatedProfileData);
            Alert.alert('Éxito', 'Perfil actualizado correctamente.');
            // ✨ Navegamos HACIA ATRÁS a la pantalla de Perfil ✨
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil. Inténtalo de nuevo.');
            console.error("Error updating profile:", error);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Editar Perfil</Text>

            {/* Género */}
            <RNPickerSelect
                placeholder={{ label: 'Selecciona tu género...', value: null }}
                onValueChange={(value) => setGender(value)}
                items={[ /* Mismas opciones */
                    { label: 'Femenino', value: 'Femenino' },
                    { label: 'Masculino', value: 'Masculino' },
                    { label: 'No binario', value: 'No binario' },
                ]}
                style={pickerSelectStyles}
                value={gender} // El valor inicial viene del estado pre-cargado
            />

            {/* Año de Nacimiento */}
            <TextInput
                style={styles.input}
                placeholder="Año de Nacimiento (YYYY)"
                value={birthYear} // Valor inicial
                onChangeText={setBirthYear}
                keyboardType="numeric"
                maxLength={4}
            />
             {birthYear.length === 4 && !isNaN(birthYear) && (
                 <Text style={styles.calculatedAge}>Edad calculada: {calculateAge(birthYear)} años</Text>
            )}

            {/* Escolaridad */}
            <RNPickerSelect
                placeholder={{ label: 'Selecciona tu escolaridad...', value: null }}
                onValueChange={(value) => setEducation(value)}
                items={[ /* Mismas opciones */
                    { label: 'Sabe leer y escribir', value: 'Sabe leer y escribir' },
                    { label: 'Primaria', value: 'Primaria' },
                    { label: 'Secundaria', value: 'Secundaria' },
                    { label: 'Preparatoria', value: 'Preparatoria' },
                    { label: 'Licenciatura', value: 'Licenciatura' },
                    { label: 'Posgrado', value: 'Posgrado' },
                ]}
                style={pickerSelectStyles}
                value={education} // Valor inicial
            />

            {/* País de Origen */}
             <RNPickerSelect
                placeholder={{ label: 'Selecciona tu país de origen...', value: null }}
                onValueChange={(value) => setCountry(value)}
                items={CountryList.map(c => ({ label: c, value: c }))}
                style={pickerSelectStyles}
                value={country} // Valor inicial
             />

            {/* Años Radicando en BC */}
            <TextInput
                style={styles.input}
                placeholder="Años radicando en BC"
                value={yearsInBC} // Valor inicial
                onChangeText={setYearsInBC}
                keyboardType="numeric"
            />

            <View style={styles.buttonContainer}>
                {/* Cambia el título del botón */}
                <Button title="Actualizar Perfil" onPress={handleUpdateProfile} />
            </View>
        </ScrollView>
    );
}

// --- Estilos --- (Puedes usar los mismos que CompleteProfileScreen o ajustarlos)
const styles = StyleSheet.create({
    container: { /* ... Mismos estilos ... */ },
    title: { /* ... Mismos estilos ... */ },
    subtitle: { /* ... Mismos estilos ... */ },
    input: { /* ... Mismos estilos ... */ },
    buttonContainer: { /* ... Mismos estilos ... */ },
    calculatedAge: { /* ... Mismos estilos ... */ }
});

const pickerSelectStyles = StyleSheet.create({ /* ... Mismos estilos ... */ });