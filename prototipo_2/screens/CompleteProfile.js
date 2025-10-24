// En: screens/CompleteProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { updateUserProfile } from '../services/firebaseService'; // Importa la función
import { CountryList } from '../utils/countries'; // Asume que tienes una lista de países

export default function CompleteProfileScreen({ navigation }) {
    const [gender, setGender] = useState(null);
    const [birthYear, setBirthYear] = useState('');
    const [education, setEducation] = useState(null);
    const [country, setCountry] = useState(null);
    const [yearsInBC, setYearsInBC] = useState('');

    const calculateAge = (year) => {
        if (!year || isNaN(year) || year.length !== 4) return '';
        const currentYear = new Date().getFullYear();
        return (currentYear - parseInt(year)).toString();
    };

    const handleSaveProfile = async () => {
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


        const profileData = {
            gender,
            birthYear: parseInt(birthYear),
            age: parseInt(calculateAge(birthYear)),
            education,
            country,
            yearsInBC: parseInt(yearsInBC),
        };

        try {
            await updateUserProfile(profileData);
            Alert.alert('Éxito', 'Perfil completado correctamente.');
            // Navega a la pantalla principal (Home). El listener en App.js/Navigator
            // debería detectar que profileComplete ahora es true.
            // O puedes forzar la navegación si tu estructura lo requiere:
            navigation.replace('Home'); // O el nombre de tu stack principal
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el perfil. Inténtalo de nuevo.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Completa tu Perfil</Text>
            <Text style={styles.subtitle}>Necesitamos algunos datos más.</Text>

            {/* Género */}
            <RNPickerSelect
                placeholder={{ label: 'Selecciona tu género...', value: null }}
                onValueChange={(value) => setGender(value)}
                items={[
                    { label: 'Femenino', value: 'Femenino' },
                    { label: 'Masculino', value: 'Masculino' },
                    { label: 'No binario', value: 'No binario' },
                ]}
                style={pickerSelectStyles}
                value={gender}
            />

            {/* Año de Nacimiento y Edad (calculada) */}
            <TextInput
                style={styles.input}
                placeholder="Año de Nacimiento (YYYY)"
                value={birthYear}
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
                items={[
                    { label: 'Sabe leer y escribir', value: 'Sabe leer y escribir' },
                    { label: 'Primaria', value: 'Primaria' },
                    { label: 'Secundaria', value: 'Secundaria' },
                    { label: 'Preparatoria', value: 'Preparatoria' },
                    { label: 'Licenciatura', value: 'Licenciatura' },
                    { label: 'Posgrado', value: 'Posgrado' },
                ]}
                style={pickerSelectStyles}
                value={education}
            />

            {/* País de Origen */}
             <RNPickerSelect
                placeholder={{ label: 'Selecciona tu país de origen...', value: null }}
                onValueChange={(value) => setCountry(value)}
                items={CountryList.map(c => ({ label: c, value: c }))} // Usa tu lista de países
                style={pickerSelectStyles}
                value={country}
             />

            {/* Años Radicando en BC */}
            <TextInput
                style={styles.input}
                placeholder="Años radicando en BC"
                value={yearsInBC}
                onChangeText={setYearsInBC}
                keyboardType="numeric"
            />

            <View style={styles.buttonContainer}>
                <Button title="Guardar Perfil" onPress={handleSaveProfile} />
            </View>
        </ScrollView>
    );
}

// --- Estilos --- (Puedes personalizarlos)
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
     subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 30,
    },
    input: {
        height: 48,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 20,
    },
     calculatedAge: {
        marginBottom: 16,
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
    }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#fff',
    marginBottom: 16,
  },
   placeholder: {
    color: '#a0aec0', // Color del placeholder
  },
});
