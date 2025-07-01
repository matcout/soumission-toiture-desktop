// src/firebase.js - Configuration Firebase pour Desktop
import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase - Projet soumission-toiture-app
const firebaseConfig = {
  apiKey: "AIzaSyBfhMUamxx6SDmP5LyQ4XTL95ZZU-GAXPU",
  authDomain: "soumission-toiture-app.firebaseapp.com",
  projectId: "soumission-toiture-app",
  storageBucket: "soumission-toiture-app.firebasestorage.app",
  messagingSenderId: "1072331437814",
  appId: "1:1072331437814:web:cebd4b13f9a17f85a09ed7"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Fonctions utilitaires pour la connectivité
export const enableFirebase = async () => {
  try {
    await enableNetwork(db);
    console.log('✅ Firebase Desktop connecté');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion Firebase Desktop:', error);
    return false;
  }
};

export const disableFirebase = async () => {
  try {
    await disableNetwork(db);
    console.log('🔌 Firebase Desktop déconnecté');
  } catch (error) {
    console.error('❌ Erreur déconnexion Firebase:', error);
  }
};

// Test de connexion
export const testFirebaseConnection = () => {
  if (app) {
    console.log('🔥 Firebase Desktop initialisé:', app.name);
    console.log('📊 Projet:', firebaseConfig.projectId);
    return true;
  }
  return false;
};

export default app;