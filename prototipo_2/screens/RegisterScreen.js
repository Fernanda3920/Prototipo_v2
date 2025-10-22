// En: screens/RegisterScreen.js

import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseService';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Éxito. El listener en App.js se encargará de navegar.
      console.log('¡Usuario registrado!', userCredential.user.email);
    } catch (error) {
      let friendlyMessage = "Ocurrió un error.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "Este correo electrónico ya está registrado.";
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = "El formato del correo no es válido.";
      }
      Alert.alert('Error de Registro', friendlyMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Crear una Cuenta</Text>
        
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
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <View style={styles.buttonContainer}>
          <Button title="Registrarme" onPress={handleRegister} />
        </View>

        <View style={styles.linkButton}>
          <Button 
            title="¿Ya tienes cuenta? Inicia Sesión" 
            onPress={() => navigation.navigate('Login')}
            color="#555"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos (puedes moverlos a un archivo separado más tarde)
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