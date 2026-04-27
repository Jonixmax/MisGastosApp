import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCeIHZW3b9eRDDQERuR-h4QkX1CrX3gt7E",
  authDomain: "gastos-personales-proto.firebaseapp.com",
  projectId: "gastos-personales-proto",
  storageBucket: "gastos-personales-proto.firebasestorage.app",
  messagingSenderId: "108751069881",
  appId: "1:108751069881:web:f0181539ab56135d223168",
  measurementId: "G-Z3TY1GH7EM"
};

// Inicializamos la app y exportamos la base de datos y la autenticación
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);