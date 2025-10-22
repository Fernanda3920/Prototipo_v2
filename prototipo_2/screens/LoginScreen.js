// En: screens/LoginScreen.js

import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseService'; // Importa tu 'auth'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Campos vacíos', 'Por favor, introduce tu correo y contraseña.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Éxito. El listener en App.js se encargará de navegar.
      console.log('¡Usuario logueado!', userCredential.user.email);
    } catch (error) {
      // Manejar errores
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
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

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

// Usamos los mismos estilos de RegisterScreen para consistencia
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
  buttonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  linkButton: {
    marginTop: 10,
  }
});