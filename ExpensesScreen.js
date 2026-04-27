import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';

export default function ExpensesScreen() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // Cargar historial de gastos y calcular el total
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tempExpenses = [];
      let total = 0;
      const currentMonth = new Date().getMonth(); 

      snapshot.forEach((doc) => {
        const data = doc.data();
        tempExpenses.push({ id: doc.id, ...data });
        
        const expenseDate = new Date(data.date);
        if (expenseDate.getMonth() === currentMonth) {
          total += parseFloat(data.amount);
        }
      });

      // Ordenar gastos del más reciente al más antiguo
      tempExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(tempExpenses);
      setMonthlyTotal(total);
    });

    return () => unsubscribe();
  }, []);

  // Agregar nuevo gasto
  const handleAddExpense = async () => {
    if (!name || !amount || !category) {
      Alert.alert("Error", "Llena todos los campos.");
      return;
    }

    try {
      await addDoc(collection(db, 'expenses'), {
        userId: auth.currentUser.uid,
        name: name,
        amount: parseFloat(amount),
        category: category,
        date: new Date().toISOString()
      });

      setName(''); setAmount(''); setCategory('');
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar.");
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Cerrar Sesión" onPress={() => signOut(auth)} color="#d9534f" />
      
      <Text style={styles.totalText}>Total del Mes: ${monthlyTotal.toFixed(2)}</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre del gasto" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Monto" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Categoría" value={category} onChangeText={setCategory} />
        <Button title="Agregar Gasto" onPress={handleAddExpense} />
      </View>

      <Text style={styles.subtitle}>Historial</Text>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseName}>{item.name} ({item.category})</Text>
            <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', marginTop: 40 },
  totalText: { fontSize: 24, fontWeight: 'bold', color: '#28a745', textAlign: 'center', marginVertical: 20 },
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  expenseItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  expenseName: { fontSize: 16, fontWeight: '500' },
  expenseAmount: { fontSize: 16, color: '#d9534f', fontWeight: 'bold' }
});