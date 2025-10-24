// En: screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity // Necesitamos TouchableOpacity para el icono
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseService'; // Importa tu 'auth'
import Icon from 'react-native-vector-icons/Feather'; // Importa el set de iconos (puedes usar otro)

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✨ Estado para controlar visibilidad

  const handleLogin = async () => {
    // ... (tu lógica de login sin cambios)
    if (email === '' || password === '') {
      Alert.alert('Campos vacíos', 'Por favor, introduce tu correo y contraseña.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('¡Usuario logueado!', userCredential.user.email);
    } catch (error) {
      let friendlyMessage = "Error al iniciar sesión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = "Correo o contraseña incorrectos.";
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = "El formato del correo no es válido.";
      }
      Alert.alert('Error de Login', friendlyMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* --- Input de Contraseña Modificado --- */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword} // Usamos un estilo diferente para ajustar padding
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword} // ✨ Controlado por el estado
          />
          {/* ✨ Botón para mostrar/ocultar */}
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)} // Cambia el estado al presionar
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'} // Cambia el icono según el estado
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>
        {/* --- Fin de Modificación --- */}

        <View style={styles.buttonContainer}>
          <Button title="Ingresar" onPress={handleLogin} />
        </View>

        <View style={styles.linkButton}>
          <Button
            title="¿No tienes cuenta? Regístrate"
            onPress={() => navigation.navigate('Register')}
            color="#555"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
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
  // ✨ Contenedor para el input de contraseña y el icono
  passwordContainer: {
    flexDirection: 'row', // Coloca el input y el icono en la misma fila
    alignItems: 'center', // Centra verticalmente
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    height: 48, // Misma altura que otros inputs
  },
  // ✨ Estilo ajustado para el input de contraseña
  inputPassword: {
    flex: 1, // Ocupa el espacio disponible
    height: '100%', // Ocupa toda la altura del contenedor
    paddingHorizontal: 12,
    fontSize: 16,
    // Quitamos bordes individuales ya que están en el contenedor
  },
  // ✨ Estilo para el botón del icono
  eyeIcon: {
    padding: 12, // Área táctil alrededor del icono
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  linkButton: {
    marginTop: 10,
  }
});