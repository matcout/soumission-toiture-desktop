// folderSyncFunctions.js - Synchronisation des dossiers simplifiée
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// 🎨 Couleurs disponibles pour les dossiers (cohérence mobile ↔ desktop)
export const AVAILABLE_FOLDER_COLORS = [
  { name: 'blue', label: 'Bleu', hex: '#3b82f6' },
  { name: 'green', label: 'Vert', hex: '#10b981' },
  { name: 'orange', label: 'Orange', hex: '#f59e0b' },
  { name: 'purple', label: 'Violet', hex: '#8b5cf6' },
  { name: 'red', label: 'Rouge', hex: '#ef4444' },
  { name: 'yellow', label: 'Jaune', hex: '#eab308' },
  { name: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { name: 'emerald', label: 'Émeraude', hex: '#059669' },
  { name: 'pink', label: 'Rose', hex: '#ec4899' },
  { name: 'gray', label: 'Gris', hex: '#6b7280' }
];

// 💻 Icônes disponibles pour desktop (Lucide React)
export const AVAILABLE_FOLDER_ICONS_DESKTOP = [
  'Folder',
  'FolderOpen',
  'FileText',
  'Clock',
  'CheckCircle2',
  'Wrench',
  'Search',
  'Home',
  'Settings',
  'BarChart3',
  'Calendar',
  'User',
  'Users',
  'Tag',
  'Tags'
];

// 📱 Icônes disponibles pour mobile (FontAwesome5)
export const AVAILABLE_FOLDER_ICONS_MOBILE = [
  'folder',
  'folder-open', 
  'file-text',
  'clock',
  'check-circle',
  'tools',
  'search',
  'home',
  'cog',
  'chart-bar',
  'calendar',
  'user',
  'users',
  'tag',
  'tags'
];

// Table de correspondance icônes Mobile → Desktop
export const ICON_MAPPING = {
  'folder': 'Folder',
  'folder-open': 'FolderOpen', 
  'file-text': 'FileText',
  'clipboard-list': 'FileText',
  'clock': 'Clock',
  'check-circle': 'CheckCircle2',
  'file-contract': 'FileCheck',
  'tools': 'Wrench',
  'search': 'Search',
  'home': 'Home',
  'cog': 'Settings',
  'chart-bar': 'BarChart3',
  'calendar': 'Calendar',
  'user': 'User',
  'users': 'Users',
  'tag': 'Tag',
  'tags': 'Tags'
};

// Conversion icône mobile → desktop
export const convertIconMobileToDesktop = (mobileIcon) => {
  return ICON_MAPPING[mobileIcon] || 'Folder';
};

// Conversion icône desktop → mobile  
export const convertIconDesktopToMobile = (desktopIcon) => {
  const reverseMapping = Object.fromEntries(
    Object.entries(ICON_MAPPING).map(([mobile, desktop]) => [desktop, mobile])
  );
  return reverseMapping[desktopIcon] || 'folder';
};

// Sauvegarder un dossier
export const saveFolderToFirebase = async (folderData, platform = 'desktop') => {
  try {
    const customId = `folder_${Date.now()}`;
    const normalizedIcon = platform === 'desktop' 
      ? convertIconDesktopToMobile(folderData.icon)
      : folderData.icon;

    const dataToSave = {
      ...folderData,
      id: customId,
      icon: normalizedIcon,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      platform: platform
    };

    const docRef = doc(db, 'folders', customId);
    await setDoc(docRef, dataToSave);
    
    return { success: true, id: customId };
  } catch (error) {
    console.error('❌ Erreur sauvegarde dossier:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour un dossier
export const updateFolderInFirebase = async (folderId, updateData, platform = 'desktop') => {
  try {
    let normalizedData = { ...updateData };
    if (updateData.icon && platform === 'desktop') {
      normalizedData.icon = convertIconDesktopToMobile(updateData.icon);
    }
    
    const folderRef = doc(db, 'folders', folderId);
    await updateDoc(folderRef, {
      ...normalizedData,
      updatedAt: serverTimestamp(),
      lastModifiedBy: platform
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur mise à jour dossier:', error);
    return { success: false, error: error.message };
  }
};

// Supprimer un dossier
export const deleteFolderFromFirebase = async (folderId) => {
  try {
    const docRef = doc(db, 'folders', folderId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression dossier:', error);
    return { success: false, error: error.message };
  }
};

// Écouter les changements de dossiers
export const subscribeToFolders = (callback) => {
  try {
    const q = query(
      collection(db, 'folders'),
      orderBy('createdAt', 'desc')  // Changé de 'order' à 'createdAt' car 'order' n'existe peut-être pas
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const folders = [];
      querySnapshot.forEach((doc) => {
        folders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      callback({ success: true, data: folders });
    }, (error) => {
      console.error('❌ Erreur écoute dossiers:', error);
      callback({ success: false, error: error.message, data: [] });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erreur abonnement dossiers:', error);
    return null;
  }
};

export default {
  convertIconMobileToDesktop,
  convertIconDesktopToMobile,
  saveFolderToFirebase,
  updateFolderInFirebase,
  deleteFolderFromFirebase,
  subscribeToFolders,
  ICON_MAPPING,
  AVAILABLE_FOLDER_COLORS,
  AVAILABLE_FOLDER_ICONS_DESKTOP,
  AVAILABLE_FOLDER_ICONS_MOBILE
};