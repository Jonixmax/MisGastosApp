import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from './firebaseConfig';

// Configuración de credenciales para el inicio de sesión con Google
GoogleSignin.configure({
  webClientId: '108751069881-t8dj11l74j2o0p471j4ugo6ucik10fjl.apps.googleusercontent.com', 
});

export default function LoginScreen() {
  // Control de vista: true para Login, false para Registro
  const [isLogin, setIsLogin] = useState(true);

  // Gestión de los inputs del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Autenticación con correo y contraseña en Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor, ingresa tu correo y contraseña.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert("Error", "El formato del correo electrónico no es válido.");
      } else {
        Alert.alert("Error", "Correo o contraseña incorrectos.");
      }
    }
  };

  // Creación de nueva cuenta con validación manual de coincidencia de contraseña
  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Campos vacíos", "Por favor, llena todos los campos para registrarte.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden. Verifícalas e intenta de nuevo.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("¡Bienvenido!", "Tu cuenta ha sido creada exitosamente.");
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert("Error de formato", "Por favor, ingresa un correo válido (ejemplo@correo.com).");
      } else if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Error", "Este correo ya está registrado.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
      } else {
        Alert.alert("Error de registro", "No se pudo crear la cuenta.");
      }
    }
  };

  // Proceso de login con Google: Obtención de token y canje por credencial de Firebase
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      let idToken = null;
      if (userInfo.idToken) {
        idToken = userInfo.idToken; 
      } else if (userInfo.data && userInfo.data.idToken) {
        idToken = userInfo.data.idToken; 
      }

      if (!idToken) {
        Alert.alert("Error", "Google no devolvió el idToken.");
        return;
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);

    } catch (error) {
      console.log(error);
      Alert.alert("Error de Google", "No se pudo iniciar sesión");
    }
  };

  // Resetea los campos al conmutar entre Login y Registro para evitar basura en los estados
  const toggleView = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name={isLogin ? "wallet" : "person-add"} size={60} color="#fff" />
          </View>
          <Text style={styles.title}>{isLogin ? 'Mis Gastos' : 'Crear Cuenta'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Toma el control de tu dinero' : 'Únete y empieza a ahorrar'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Correo electrónico" 
              placeholderTextColor="#999"
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address"
              autoCapitalize="none" 
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña" 
              placeholderTextColor="#999"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
          </View>

          {/* Campo adicional visible solo en el flujo de registro */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Confirmar Contraseña" 
                placeholderTextColor="#999"
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
              />
            </View>
          )}

          {/* El botón principal cambia su acción según el modo isLogin */}
          <TouchableOpacity 
            style={isLogin ? styles.primaryBtn : styles.registerBtn} 
            onPress={isLogin ? handleLogin : handleRegister} 
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>
            <Ionicons name={isLogin ? "arrow-forward-outline" : "person-add-outline"} size={20} color="#fff" />
          </TouchableOpacity>

          {/* Google Sign-In se ofrece únicamente en la vista de acceso */}
          {isLogin && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={20} color="#4285F4" style={{marginRight: 10}} />
                <Text style={styles.googleBtnText}>Ingresar con Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Switcher para cambiar de modo */}
        <TouchableOpacity style={styles.secondaryBtn} onPress={toggleView} activeOpacity={0.6}>
          <Text style={styles.secondaryBtnText}>
            {isLogin ? '¿No tienes cuenta? Crea una gratis' : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  
  headerContainer: { alignItems: 'center', marginBottom: 35 },
  iconCircle: { backgroundColor: '#4285F4', padding: 20, borderRadius: 50, marginBottom: 15, shadowColor: '#4285F4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#2C3E50', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#7F8C8D', fontWeight: '500' },

  card: { backgroundColor: '#fff', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E8ECEF' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#333' },

  primaryBtn: { flexDirection: 'row', backgroundColor: '#34A853', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#34A853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  registerBtn: { flexDirection: 'row', backgroundColor: '#4285F4', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#4285F4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8ECEF' },
  dividerText: { marginHorizontal: 15, color: '#95A5A6', fontSize: 14, fontWeight: '500' },

  googleBtn: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E8ECEF' },
  googleBtnText: { color: '#333', fontSize: 16, fontWeight: '700' },

  secondaryBtn: { marginTop: 30, alignItems: 'center' },
  secondaryBtnText: { color: '#7F8C8D', fontSize: 15, fontWeight: '600' }
});