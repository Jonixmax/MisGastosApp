import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebaseConfig';
// Importamos íconos que ya vienen incluidos en Expo
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 

export default function ExpensesScreen() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');

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

      tempExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(tempExpenses);
      setMonthlyTotal(total);
    });

    return () => unsubscribe();
  }, []);

  const handleAddExpense = async () => {
    if (!name || !amount || !category) {
      Alert.alert("Aviso", "Por favor llena todos los campos 😅");
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
      Alert.alert("Error", "No se pudo guardar el gasto.");
    }
  };

  const filteredExpenses = expenses.filter(expense => 
    expense.category.toLowerCase().includes(filterCategory.toLowerCase())
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.headerTitle}>Mis Gastos</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      {/* TARJETA DEL TOTAL */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total del Mes</Text>
        <Text style={styles.totalText}>${monthlyTotal.toFixed(2)}</Text>
      </View>

      {/* FORMULARIO */}
      <View style={styles.formCard}>
        <View style={styles.inputRow}>
          <Ionicons name="pricetag-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="¿En qué gastaste?" value={name} onChangeText={setName} />
        </View>
        
        <View style={styles.row}>
          <View style={[styles.inputRow, { flex: 1, marginRight: 10 }]}>
            <MaterialIcons name="attach-money" size={20} color="#6C63FF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </View>
          <View style={[styles.inputRow, { flex: 1 }]}>
            <Ionicons name="folder-open-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Categoría" value={category} onChangeText={setCategory} />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
          <Ionicons name="add-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Agregar Gasto</Text>
        </TouchableOpacity>
      </View>

      {/* FILTRO Y LISTA */}
      <View style={styles.listHeader}>
        <Text style={styles.subtitle}>Historial</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#A0A0A0" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Filtrar..." 
            value={filterCategory} 
            onChangeText={setFilterCategory} 
          />
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <View style={styles.expenseIconContainer}>
              <Ionicons name="receipt-outline" size={24} color="#6C63FF" />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseName}>{item.name}</Text>
              <Text style={styles.expenseCategory}>{item.category}</Text>
            </View>
            <Text style={styles.expenseAmount}>-${item.amount.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={50} color="#D3D3D3" />
            <Text style={styles.emptyText}>Sin gastos por ahora. ¡Ahorrando!</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9', paddingHorizontal: 20, paddingTop: 50 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 16, color: '#888' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#2B2D42' },
  logoutBtn: { backgroundColor: '#FFE5E5', padding: 10, borderRadius: 12 },

  totalCard: { 
    backgroundColor: '#6C63FF', 
    padding: 25, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 20,
    shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 
  },
  totalLabel: { color: '#E0E0FF', fontSize: 16, marginBottom: 5 },
  totalText: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },

  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: { backgroundColor: '#2B2D42', flexDirection: 'row', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  subtitle: { fontSize: 20, fontWeight: 'bold', color: '#2B2D42' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, height: 35, width: 140 },
  searchInput: { flex: 1, marginLeft: 5, fontSize: 14 },

  expenseItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  expenseIconContainer: { backgroundColor: '#F0F0FF', padding: 12, borderRadius: 12, marginRight: 15 },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 16, fontWeight: 'bold', color: '#2B2D42', marginBottom: 4 },
  expenseCategory: { fontSize: 13, color: '#8D99AE', textTransform: 'uppercase', fontWeight: '600' },
  expenseAmount: { fontSize: 18, color: '#EF233C', fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#A0A0A0', marginTop: 10, fontSize: 16 }
});