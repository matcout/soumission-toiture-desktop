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
export const saveFolderToFirebase = async (folderData, platform = 'mobile') => {
  try {
    console.log('💾 Sauvegarde dossier:', folderData.label, 'depuis', platform);
    
    // NOUVELLE LOGIQUE D'ID PROPRE
    let customId;
    
    // Pour les dossiers spéciaux, utiliser des IDs prédéfinis
    const specialFolders = {
      'Projet 2024': 'projet_2024',
      'Projet 2025': 'projet_2025', 
      'Projet 2026': 'projet_2026',
      'Projet 2023': 'projet_2023',
      'Projet 2022': 'projet_2022',
      'Contrats': 'contrats',
      'Inspections': 'inspections',
      'Réparations': 'reparations',
      'Soumissions': 'soumissions',
      'Terminées': 'terminees',
      'Réalisés': 'realises',
      'En cours': 'en_cours',
      'Annulées': 'annulees'
    };
    
    // Si c'est un dossier spécial, utiliser l'ID prédéfini
    if (specialFolders[folderData.label]) {
      customId = specialFolders[folderData.label];
      
      // Si c'est un sous-dossier, ajouter le préfixe du parent
      if (folderData.parentId) {
        // Nettoyer le parentId pour avoir un préfixe propre
        const parentPrefix = folderData.parentId.replace(/[_\-]/g, '');
        customId = `${parentPrefix}_${customId}`;
      }
    } else {
      // Pour les autres dossiers, créer un ID basé sur le label
      const cleanLabel = folderData.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      
      customId = cleanLabel;
      
      // Si c'est un sous-dossier, ajouter le préfixe du parent
      if (folderData.parentId) {
        const parentPrefix = folderData.parentId.split('_')[0];
        customId = `${parentPrefix}_${cleanLabel}`;
      }
    }
    
    // Vérifier si l'ID existe déjà dans Firebase
    const { getDoc, doc } = await import('firebase/firestore');
    const folderRef = doc(db, 'folders', customId);
    const existingDoc = await getDoc(folderRef);
    
    if (existingDoc.exists()) {
      // Trouver un ID unique en ajoutant un numéro
      let counter = 2;
      let uniqueId = `${customId}_${counter}`;
      
      while (true) {
        const checkRef = doc(db, 'folders', uniqueId);
        const checkDoc = await getDoc(checkRef);
        
        if (!checkDoc.exists()) {
          customId = uniqueId;
          break;
        }
        
        counter++;
        uniqueId = `${customId}_${counter}`;
        
        // Sécurité pour éviter une boucle infinie
        if (counter > 10) {
          // Fallback à l'ancien système si trop de conflits
          customId = `folder_${Date.now()}`;
          break;
        }
      }
    }

    // ✅ NORMALISER L'ICÔNE SELON LA PLATEFORME
    let normalizedIcon;
    if (platform === 'mobile') {
      // Mobile envoie FontAwesome → Sauvegarder en FontAwesome
      normalizedIcon = folderData.icon;
    } else {
      // Desktop envoie Lucide → Convertir en FontAwesome pour cohérence
      normalizedIcon = convertIconDesktopToMobile(folderData.icon);
    }

    const dataToSave = {
      ...folderData,
      id: customId,
      icon: normalizedIcon,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      platform: platform,
      syncedAt: serverTimestamp()
    };

    const docRef = doc(db, 'folders', customId);
    await setDoc(docRef, dataToSave);
    
    console.log('✅ Dossier sauvé avec ID propre:', customId);
    return {
      success: true,
      id: customId,
      message: `Dossier "${folderData.label}" créé avec succès !`
    };

  } catch (error) {
    console.error('❌ Erreur sauvegarde dossier Firebase:', error);
    return {
      success: false,
      error: error.message
    };
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