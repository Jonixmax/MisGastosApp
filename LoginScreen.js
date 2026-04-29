import React, { useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebaseConfig';
// Importamos la librería nativa que instalamos
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Configuración inicial de Google (Esto se corre una sola vez)
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '108751069881-t8dj11l74j2o0p471j4ugo6ucik10fjl.apps.googleusercontent.com', // AHORA TE DIGO DÓNDE SACAR ESTO
    });
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert("Error", "Correo o contraseña incorrectos");
    }
  };

  // FUNCIÓN MÁGICA: Iniciar sesión nativa con Google
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(auth, googleCredential);
    } catch (error) {
      console.log(error);
      Alert.alert("Error de Google", "No se pudo iniciar sesión");
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
  googleButtonText: { color: '#white', fontWeight: 'bold' }
});