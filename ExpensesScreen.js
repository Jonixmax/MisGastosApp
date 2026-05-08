import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { auth, db } from './firebaseConfig';

// Constantes para las categorías y meses
const CATEGORIES = ['Comida', 'Transporte', 'Casa', 'Ocio', 'Salud', 'Otros'];
const MONTHS = ['Todos', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/**
 * Retorna el nombre del icono de Ionicons según la categoría.
 * @param {string} category - Categoría del gasto.
 * @returns {string} Nombre del glifo.
 */
const getCategoryIcon = (category) => {
  switch (category) {
    case 'Comida': return 'fast-food';
    case 'Transporte': return 'bus';
    case 'Casa': return 'home';
    case 'Ocio': return 'game-controller';
    case 'Salud': return 'medkit';
    default: return 'cart';
  }
};

export default function ExpensesScreen() {
  // Datos del usuario autenticado
  const user = auth.currentUser;
  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Usuario');

  // Estado del formulario
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estado de los datos de Firestore
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado de los filtros y visibilidad
  const [filterCategory, setFilterCategory] = useState('Todos');
  const currentMonthIndex = new Date().getMonth() + 1;
  const [filterMonth, setFilterMonth] = useState(MONTHS[currentMonthIndex]);
  const [showForm, setShowForm] = useState(false);

  /**
   * Suscripción en tiempo real a la colección de gastos filtrada por el UID del usuario.
   */
  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'gastos'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesList = [];
      snapshot.forEach((doc) => {
        expensesList.push({ id: doc.id, ...doc.data() });
      });

      // Ordenar localmente por fecha descendente para evitar la creación de índices compuestos en Firebase
      expensesList.sort((a, b) => {
        const dateA = a.date ? a.date.toMillis() : 0;
        const dateB = b.date ? b.date.toMillis() : 0;
        return dateB - dateA;
      });

      setExpenses(expensesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  /**
     * Elimina un documento de la colección 'gastos' soportando web y móvil.
     * @param {string} id - ID del documento en Firestore.
     */
  const handleDeleteExpense = async (id) => {
    // Si estamos en localhost/web usamos la alerta estándar de los navegadores
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.");
      if (isConfirmed) {
        try {
          await deleteDoc(doc(db, 'gastos', id));
        } catch (error) {
          console.error("Error deleting expense:", error);
          window.alert("No se pudo eliminar el gasto.");
        }
      }
    } else {
      // Si estamos en un celular, usamos la alerta nativa de React Native
      Alert.alert(
        "Eliminar Gasto",
        "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteDoc(doc(db, 'gastos', id));
              } catch (error) {
                console.error("Error deleting expense:", error);
                Alert.alert("Error", "No se pudo eliminar el gasto.");
              }
            }
          }
        ]
      );
    }
  };

  /**
   * Cierra la sesión del usuario tanto en Firebase como en el cliente de Google.
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
    }
  };

  /**
   * Manejador para la selección de fecha en el componente nativo.
   */
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  /**
   * Valida y guarda un nuevo gasto en Firestore.
   */
  const handleAddExpense = async () => {
    if (!auth.currentUser || !auth.currentUser.uid) {
      Alert.alert("Sesión perdida", "No se detecta un usuario activo.");
      return;
    }
    if (!name || !amount || !category) {
      Alert.alert("Campos incompletos", "Por favor ingresa el nombre, monto y selecciona una categoría.");
      return;
    }

    try {
      await addDoc(collection(db, 'gastos'), {
        userId: auth.currentUser.uid,
        name: name,
        amount: parseFloat(amount),
        category: category,
        date: expenseDate,
      });

      // Limpiar el formulario y ocultarlo
      setName('');
      setAmount('');
      setCategory('');
      setExpenseDate(new Date());
      setShowForm(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert("Error", "Hubo un problema al guardar el gasto.");
    }
  };

  /**
   * Renderizador para cada elemento de la lista de gastos.
   */
  const renderExpenseItem = ({ item }) => {
    const fechaGasto = item.date ? item.date.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';

    return (
      <View style={styles.expenseCard}>
        <View style={[styles.expenseInfoRow, { flex: 1 }]}>
          <View style={styles.iconContainer}>
            <Ionicons name={getCategoryIcon(item.category)} size={22} color="#4285F4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.expenseName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.expenseCategory}>{item.category} • {fechaGasto}</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteExpense(item.id)}
            style={styles.deleteBtn}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={20} color="#EA4335" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Aplicar filtros de categoría y mes sobre la lista total de gastos
  const filteredExpenses = expenses.filter(expense => {
    const matchCategory = filterCategory === 'Todos' || expense.category === filterCategory;

    let matchMonth = true;
    if (filterMonth !== 'Todos') {
      const targetMonthIndex = MONTHS.indexOf(filterMonth) - 1;
      if (expense.date) {
        const expenseDateObj = expense.date.toDate();
        matchMonth = expenseDateObj.getMonth() === targetMonthIndex;
      }
    }

    return matchCategory && matchMonth;
  });

  // Sumatoria total de los montos filtrados
  const dynamicTotal = filteredExpenses.reduce((suma, gasto) => suma + gasto.amount, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.greetingText}>Bienvenido de vuelta,</Text>
                <Text style={styles.userName}>{displayName} 👋</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={28} color="#EA4335" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalCard}>
              <Ionicons name="wallet-outline" size={40} color="rgba(255,255,255,0.8)" style={styles.walletIcon} />
              <Text style={styles.totalTitle}>
                Total {filterMonth !== 'Todos' ? `en ${filterMonth}` : 'Global'}
              </Text>
              <Text style={styles.totalAmount}>${dynamicTotal.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.accordionBtn}
              onPress={() => setShowForm(!showForm)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add-circle" size={24} color="#4285F4" style={{ marginRight: 10 }} />
                <Text style={styles.accordionBtnText}>
                  {showForm ? 'Ocultar Formulario' : 'Agregar Nuevo Gasto'}
                </Text>
              </View>
              <Ionicons name={showForm ? "chevron-up" : "chevron-down"} size={24} color="#4285F4" />
            </TouchableOpacity>

            {showForm && (
              <View style={styles.formContainer}>
                <View style={styles.formRow}>
                  <TextInput style={[styles.input, { flex: 2 }]} placeholder="¿Qué compraste?" placeholderTextColor="#999" value={name} onChangeText={setName} />
                  <TextInput style={[styles.input, { flex: 1, marginLeft: 10 }]} placeholder="$ Monto" placeholderTextColor="#999" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                </View>

                <Text style={styles.label}>Fecha del gasto</Text>
                {Platform.OS === 'web' ? (
                  /* --- CALENDARIO PARA WEB (LOCALHOST) --- */
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={expenseDate.toISOString().split("T")[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Añadimos T12:00:00 para evitar que el cambio de zona horaria atrase un día
                        setExpenseDate(new Date(e.target.value + "T12:00:00"));
                      }
                    }}
                    style={{
                      padding: '15px',
                      borderRadius: '12px',
                      border: '1px solid #E8ECEF',
                      marginBottom: '20px',
                      fontSize: '15px',
                      color: '#333',
                      backgroundColor: '#F8F9FA',
                      width: '100%',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  /* --- CALENDARIO PARA CELULARES (ANDROID/IOS) --- */
                  <>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                      <Ionicons name="calendar-outline" size={20} color="#555" style={{ marginRight: 10 }} />
                      <Text style={styles.dateText}>
                        {expenseDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={expenseDate}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                      />
                    )}
                  </>
                )}

                <Text style={styles.label}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.8}
                      style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Ionicons name={getCategoryIcon(cat)} size={16} color={category === cat ? "#fff" : "#555"} style={{ marginRight: 5 }} />
                      <Text style={[styles.categoryBtnText, category === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Guardar Gasto</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Movimientos</Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {MONTHS.map((mes) => (
                  <TouchableOpacity
                    key={`mes-${mes}`}
                    style={[styles.filterBtn, filterMonth === mes && styles.filterBtnActive]}
                    onPress={() => setFilterMonth(mes)}
                  >
                    <Text style={[styles.filterBtnText, filterMonth === mes && styles.filterBtnTextActive]}>{mes}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginBottom: 15 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterBtn, filterCategory === 'Todos' && styles.filterBtnActive]}
                  onPress={() => setFilterCategory('Todos')}
                >
                  <Text style={[styles.filterBtnText, filterCategory === 'Todos' && styles.filterBtnTextActive]}>Todas las Categorías</Text>
                </TouchableOpacity>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={`filter-${cat}`}
                    style={[styles.filterBtn, filterCategory === cat && styles.filterBtnActive]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.filterBtnText, filterCategory === cat && styles.filterBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#4285F4" style={{ marginTop: 30 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay gastos registrados aquí</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // CONTENEDORES GLOBALES Y ESTADOS
  // ==========================================
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 40, backgroundColor: '#F4F6F9' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#BDC3C7', fontSize: 16, fontWeight: '600', marginTop: 15 },

  // ==========================================
  // ENCABEZADO (HEADER)
  // ==========================================
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greetingText: { fontSize: 14, color: '#888', marginBottom: 2 },
  userName: { fontSize: 22, color: '#2C3E50', fontWeight: '800' },
  logoutIconBtn: { padding: 8, backgroundColor: '#FFEBEA', borderRadius: 12 },

  // ==========================================
  // TARJETA DE TOTAL (HERO CARD)
  // ==========================================
  totalCard: { backgroundColor: '#4285F4', padding: 25, borderRadius: 20, marginBottom: 20, position: 'relative', overflow: 'hidden', shadowColor: '#4285F4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  walletIcon: { position: 'absolute', right: -10, top: -10, opacity: 0.2, transform: [{ scale: 3 }] },
  totalTitle: { color: '#E8F0FE', fontSize: 14, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { color: 'white', fontSize: 42, fontWeight: '900' },

  // ==========================================
  // FORMULARIO Y ACORDEÓN
  // ==========================================
  accordionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  accordionBtnText: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },

  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  formRow: { flexDirection: 'row', marginBottom: 15 },
  input: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, fontSize: 16, color: '#333' },
  label: { fontSize: 13, color: '#7F8C8D', marginBottom: 10, fontWeight: '700', textTransform: 'uppercase' },

  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E8ECEF' },
  dateText: { fontSize: 15, color: '#333', textTransform: 'capitalize' },

  categoryScroll: { flexDirection: 'row', marginBottom: 20 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10 },
  categoryBtnActive: { backgroundColor: '#34A853', shadowColor: '#34A853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  categoryBtnText: { color: '#555', fontWeight: '700', fontSize: 14 },
  categoryBtnTextActive: { color: '#fff' },

  saveBtn: { flexDirection: 'row', backgroundColor: '#2C3E50', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // ==========================================
  // FILTROS E HISTORIAL
  // ==========================================
  historyHeader: { marginBottom: 15 },
  historyTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50' },

  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  filterBtnActive: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
  filterBtnText: { fontSize: 13, color: '#7F8C8D', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff', fontWeight: '800' },

  // ==========================================
  // TARJETAS DE GASTOS (LIST ITEM)
  // ==========================================
  expenseCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  expenseInfoRow: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  iconContainer: { backgroundColor: '#E8F0FE', padding: 12, borderRadius: 12, marginRight: 15 },
  expenseName: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 4 },
  expenseCategory: { fontSize: 13, color: '#95A5A6', fontWeight: '500' },

  actionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minWidth: 90 },
  expenseAmount: { fontSize: 18, fontWeight: '900', color: '#E74C3C' },
  deleteBtn: { marginLeft: 12, padding: 4, backgroundColor: '#FFEBEA', borderRadius: 8 },
});