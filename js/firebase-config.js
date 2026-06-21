// ============================================
// CONFIGURACIÓN DE FIREBASE - Parroquia Santa Alicia
// ============================================

// Importaciones de Firebase SDK (versión 10.8.0)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyALTnlvpx8r-6Puz9mtSzVgrxZAdhJaWyc",
    authDomain: "parroquia-santa-alicia.firebaseapp.com",
    projectId: "parroquia-santa-alicia",
    storageBucket: "parroquia-santa-alicia.firebasestorage.app",
    messagingSenderId: "575790148517",
    appId: "1:575790148517:web:ea47b3ab4da813635f564c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore (base de datos)
const db = getFirestore(app);

// Exportar instancia y métodos de Firestore
export { 
    db, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
};

// Log de inicialización
console.log('🔥 Firebase inicializado correctamente');
console.log('📊 Base de datos Firestore conectada al proyecto:', firebaseConfig.projectId);