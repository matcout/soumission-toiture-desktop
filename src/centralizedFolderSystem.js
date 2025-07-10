// centralizedFolderSystem.js - Version simplifiée pour desktop
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Configuration des dossiers système
const SYSTEM_FOLDERS = {
  system_assignments: {
    id: 'system_assignments',
    label: 'Aller prendre mesure',
    icon: 'clipboard-list',
    color: '#3b82f6',
    order: 0,
    isSystemFolder: true,
    isDeletable: false,
    isEditable: true,
    filterConfig: {
      type: 'status',
      value: 'assignment',
      logic: 'equals'
    }
  },
  system_pending: {
    id: 'system_pending',
    label: 'À compléter',
    icon: 'clock',
    color: '#f59e0b',
    order: 1,
    isSystemFolder: true,
    isDeletable: false,
    isEditable: true,
    filterConfig: {
      type: 'status',
      value: 'captured',
      logic: 'equals'
    }
  },
  system_completed: {
    id: 'system_completed',
    label: 'Terminées',
    icon: 'check-circle',
    color: '#10b981',
    order: 2,
    isSystemFolder: true,
    isDeletable: false,
    isEditable: true,
    filterConfig: {
      type: 'status',
      value: 'completed',
      logic: 'equals'
    }
  },
  system_project2025: {
    id: 'system_project2025',
    label: 'Projet 2025',
    icon: 'folder-open',
    color: '#059669',
    order: 3,
    isSystemFolder: true,
    isDeletable: false,
    isEditable: true,
    isExpandable: true
  }
};

// Initialiser le système centralisé
export const initializeCentralizedFolders = async (platform = 'desktop') => {
  try {
    console.log(`🔥 Initialisation système centralisé ${platform}...`);
    
    // Récupérer tous les dossiers depuis Firebase
    const folders = await getAllCentralizedFolders();
    
    // Si aucun dossier, créer la structure par défaut
    if (folders.length === 0) {
      console.log('📁 Création structure système...');
      for (const [id, folder] of Object.entries(SYSTEM_FOLDERS)) {
        await createSystemFolder(folder, platform);
      }
      // Récupérer à nouveau après création
      const newFolders = await getAllCentralizedFolders();
      return {
        success: true,
        folders: newFolders,
        isFirstInit: true
      };
    }
    
    return {
      success: true,
      folders: folders,
      isFirstInit: false
    };
    
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    // Retourner les dossiers par défaut en cas d'erreur
    return {
      success: true,
      folders: Object.values(SYSTEM_FOLDERS),
      isFirstInit: true,
      offline: true
    };
  }
};

// Créer un dossier système
const createSystemFolder = async (folderData, platform) => {
  try {
    const docRef = doc(db, 'folders', folderData.id);
    await setDoc(docRef, {
      ...folderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      platform: platform
    });
    console.log(`✅ Dossier créé: ${folderData.label}`);
  } catch (error) {
    console.error(`❌ Erreur création dossier ${folderData.label}:`, error);
  }
};

// Récupérer tous les dossiers
export const getAllCentralizedFolders = async () => {
  try {
    const q = query(
      collection(db, 'folders'),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const folders = [];
    
    querySnapshot.forEach((doc) => {
      folders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return folders;
    
  } catch (error) {
    console.error('❌ Erreur récupération dossiers:', error);
    // Retourner les dossiers par défaut
    return Object.values(SYSTEM_FOLDERS);
  }
};

// Appliquer les filtres
export const applyFolderFilter = (folder, submissions) => {
  if (!folder.filterConfig || !submissions) {
    return [];
  }
  
  const { filterConfig } = folder;
  
  if (filterConfig.type === 'status') {
    return submissions.filter(s => s.status === filterConfig.value);
  }
  
  return [];
};

export default {
  initializeCentralizedFolders,
  getAllCentralizedFolders,
  applyFolderFilter,
  SYSTEM_FOLDERS
};