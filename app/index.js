import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
// Configuración de Firebase y componentes de pantalla
import ExpensesScreen from '../ExpensesScreen';
import { auth } from '../firebaseConfig';
import LoginScreen from '../LoginScreen';

export default function App() {
  // Estado para la sesión del usuario y el control de carga inicial
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscripción al observador de persistencia de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Renderizado condicional según el estado de la sesión
  return user ? <ExpensesScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});