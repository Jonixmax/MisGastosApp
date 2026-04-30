import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';
// Importamos la librería nativa que instalamos
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// 🔥 LA SOLUCIÓN: Configuración de Google AFUERA del componente 🔥
// Esto asegura que se inicialice de inmediato al leer el archivo.
GoogleSignin.configure({
  webClientId: '108751069881-t8dj11l74j2o0p471j4ugo6ucik10fjl.apps.googleusercontent.com', 
});

export default function LoginScreen() {
  // Cambiamos React.useState por useState directamente, ya que lo importamos arriba
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert("Error", "Correo o contraseña incorrectos");
    }
  };

// FUNCIÓN MÁGICA ACTUALIZADA: Iniciar sesión nativa con Google
  const handleGoogleLogin = async () => {
    try {
      // 1. Verificamos que el celular tenga los servicios de Google
      await GoogleSignin.hasPlayServices();
      
      // 2. Pedimos a Google que inicie sesión
      const userInfo = await GoogleSignin.signIn();
      console.log("Respuesta cruda de Google:", JSON.stringify(userInfo)); 
      
      // 3. Extraemos el idToken (Soporte para versiones nuevas y viejas de la librería)
      let idToken = null;
      if (userInfo.idToken) {
        idToken = userInfo.idToken; // Para versiones v10 o inferiores
      } else if (userInfo.data && userInfo.data.idToken) {
        idToken = userInfo.data.idToken; // Para la versión v11+
      }

      // Si por alguna razón no hay token, detenemos el proceso
      if (!idToken) {
        Alert.alert("Error", "Google no devolvió el idToken.");
        return;
      }

      // 4. Transformamos el token de Google en una credencial que Firebase entienda
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // 5. Iniciamos sesión en Firebase
      const result = await signInWithCredential(auth, googleCredential);
      
      // ¡Celebración!
      console.log("¡Éxito! Usuario logueado:", result.user.email);
      Alert.alert("¡Éxito total!", "Iniciaste sesión con Google 🚀");

    } catch (error) {
      console.error("Error atrapado:", error);
      Alert.alert("Error de Google", error.message || "No se pudo completar el inicio de sesión");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Gastos 💰</Text>
      <TextInput style={styles.input} placeholder="Correo" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      
      <Button title="Entrar" onPress={handleLogin} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Registrarse" onPress={() => createUserWithEmailAndPassword(auth, email, password)} color="#28a745" />

      <Text style={styles.or}>--- o ---</Text>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleButtonText}>Continuar con Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, marginBottom: 15, borderRadius: 10 },
  or: { textAlign: 'center', marginVertical: 20, color: '#888' },
  googleButton: { backgroundColor: '#4285F4', padding: 15, borderRadius: 10, alignItems: 'center' },
  googleButtonText: { color: '#FFFFFF', fontWeight: 'bold' } // <-- Corregí "#white" a "#FFFFFF"
});