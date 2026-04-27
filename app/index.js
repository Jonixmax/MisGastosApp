import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
// Usamos '../' para salir de la carpeta 'app' y buscar en la carpeta principal
import { auth } from '../firebaseConfig'; 
import LoginScreen from '../LoginScreen';
import ExpensesScreen from '../ExpensesScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase verifica automáticamente si ya hay alguien con sesión iniciada
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false); // Apagamos la animación de carga
    });

    return () => unsubscribe();
  }, []);

  // Mientras Firebase verifica, mostramos un círculo de carga
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Magia de React: Si hay usuario, mostramos Gastos. Si no, mostramos Login.
  return user ? <ExpensesScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});