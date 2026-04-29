import { signOut } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from './firebaseConfig';

export default function ExpensesScreen() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  
  // Estado para el filtro de categoría
  const [filterCategory, setFilterCategory] = useState('');

  // Hook de efecto para cargar gastos y calcular el total mensual
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

  // Maneja la adición de un nuevo gasto a Firestore
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

  // Filtra los gastos basándose en el estado filterCategory
  const filteredExpenses = expenses.filter(expense => 
    expense.category.toLowerCase().includes(filterCategory.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Cerrar Sesión" onPress={() => signOut(auth)} color="#d9534f" />
      </View>
      
      <Text style={styles.totalText}>Total del Mes: ${monthlyTotal.toFixed(2)}</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre del gasto" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Monto (ej. 20.50)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Categoría (ej. Comida)" value={category} onChangeText={setCategory} />
        <Button title="Agregar Gasto" onPress={handleAddExpense} color="#007bff" />
      </View>

      <Text style={styles.subtitle}>Historial de Gastos</Text>
      
      {/* Campo de entrada para el filtro de categoría */}
      <TextInput 
        style={styles.filterInput} 
        placeholder="🔍 Filtrar por categoría..." 
        value={filterCategory} 
        onChangeText={setFilterCategory} 
      />

      <FlatList
        data={filteredExpenses} // Usamos la lista filtrada en lugar de la lista completa
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <View>
              <Text style={styles.expenseName}>{item.name}</Text>
              <Text style={styles.expenseCategory}>{item.category}</Text>
            </View>
            <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay gastos para mostrar.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8', marginTop: 40 },
  header: { alignItems: 'flex-end', marginBottom: 10 },
  totalText: { fontSize: 26, fontWeight: 'bold', color: '#28a745', textAlign: 'center', marginBottom: 20 },
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  input: { borderWidth: 1, borderColor: '#e1e5eb', padding: 12, marginBottom: 12, borderRadius: 8, backgroundColor: '#f9fafc' },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  filterInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 20, backgroundColor: '#fff', fontStyle: 'italic' },
  expenseItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#007bff' },
  expenseName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  expenseCategory: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  expenseAmount: { fontSize: 18, color: '#d9534f', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20, fontStyle: 'italic' }
});