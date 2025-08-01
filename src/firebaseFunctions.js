// firebaseFunctions.js - Desktop Version avec IDs uniques
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// 🆕 Fonction pour générer un ID vraiment unique
const generateUniqueId = (prefix = 'submission') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8); // 6 caractères aléatoires
  return `${prefix}_${timestamp}_${random}`;
};

// Écouter les soumissions en temps réel
export const subscribeToSubmissions = (callback) => {
  try {
    console.log('🔄 Abonnement aux soumissions...');
    
    const q = query(
      collection(db, 'soumissions'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const submissions = [];
      const seenIds = new Set(); // Pour éviter les doublons
      
      querySnapshot.forEach((doc) => {
        // Vérifier si on a déjà vu cet ID
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          const data = doc.data();
          submissions.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }
      });
      
      console.log(`✅ ${submissions.length} soumissions uniques synchronisées`);
      callback({
        success: true,
        data: submissions,
        count: submissions.length
      });
    }, (error) => {
      console.error('❌ Erreur sync soumissions:', error);
      callback({
        success: false,
        error: error.message,
        data: []
      });
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Erreur abonnement:', error);
    return null;
  }
};

// Créer un assignment
export const createAssignment = async (assignmentData) => {
  try {
    console.log('📱 Création assignment...');
    
    const addressClean = assignmentData.client?.adresse
      ?.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20) || 'assignment';
    
    const customId = generateUniqueId(`assignment_${addressClean}`);
    
    const dataToSave = {
      ...assignmentData,
      // ✅ SUPPRIMÉ : status: 'assignment',
      folderId: 'assignments', // ✅ Directement dans le bon dossier
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      platform: 'desktop',
      displayName: assignmentData.client?.adresse
    };

    const docRef = doc(db, 'soumissions', customId);
    await setDoc(docRef, dataToSave);
    
    console.log('✅ Assignment créé avec ID unique:', customId);
    return {
      success: true,
      id: customId,
      displayName: assignmentData.client?.adresse
    };

  } catch (error) {
    console.error('❌ Erreur création assignment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


// Mettre à jour le statut d'une soumission
export const updateSubmissionStatus = async (submissionId, newFolderId, additionalData = {}) => {
  try {
    console.log('✏️ Mise à jour soumission:', submissionId);
    
    const updateData = {
      updatedAt: serverTimestamp(),
      lastModifiedBy: 'desktop',
      ...additionalData
    };
    
    // ✅ SIMPLE : Juste mettre à jour le folderId
    if (newFolderId) {
      updateData.folderId = newFolderId;
    }

    const submissionRef = doc(db, 'soumissions', submissionId);
    await updateDoc(submissionRef, updateData);

    console.log('✅ Soumission mise à jour');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur mise à jour soumission:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Mettre à jour une soumission complète
export const updateSubmissionInFirebase = async (submissionId, submissionData) => {
  try {
    console.log('📝 Mise à jour complète soumission:', submissionId);
    
    const updateData = {
      ...submissionData,
      updatedAt: serverTimestamp(),
      lastModifiedBy: 'desktop'
    };

    const submissionRef = doc(db, 'soumissions', submissionId);
    await updateDoc(submissionRef, updateData);

    console.log('✅ Soumission mise à jour complètement');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur mise à jour soumission:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Supprimer une soumission
export const deleteSubmissionFromFirebase = async (submissionId) => {
  try {
    console.log('🗑️ Suppression soumission:', submissionId);
    
    const docRef = doc(db, 'soumissions', submissionId);
    await deleteDoc(docRef);
    
    console.log('✅ Soumission supprimée');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return { success: false, error: error.message };
  }
};

// 🗂️ FONCTIONS DOSSIERS (SYNCHRONISATION)

// Écouter les changements de dossiers en temps réel
export const subscribeToFolders = (callback) => {
  try {
    console.log('🔄 Abonnement aux dossiers temps réel...');
    
    const q = query(
      collection(db, 'folders'),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const folders = [];
      const seenIds = new Set(); // Pour éviter les doublons
      
      querySnapshot.forEach((doc) => {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          const data = doc.data();
          folders.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        }
      });
      
      console.log(`🔄 Sync dossiers temps réel: ${folders.length} dossiers uniques`);
      callback({
        success: true,
        data: folders,
        count: folders.length
      });
    }, (error) => {
      console.error('❌ Erreur écoute dossiers temps réel:', error);
      callback({
        success: false,
        error: error.message,
        data: []
      });
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Erreur abonnement dossiers:', error);
    return null;
  }
};

// Sauvegarder un dossier dans Firebase
export const saveFolderToFirebase = async (folderData, platform = 'desktop') => {
  try {
    console.log('💾 Sauvegarde dossier:', folderData.label, 'depuis', platform);
    
    // Utiliser la nouvelle fonction pour ID unique
    const folderPrefix = folderData.label
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
    
    const customId = generateUniqueId(`folder_${folderPrefix}`);

    const dataToSave = {
      ...folderData,
      id: customId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      platform: platform,
      syncedAt: serverTimestamp()
    };

    const docRef = doc(db, 'folders', customId);
    await setDoc(docRef, dataToSave);
    
    console.log('✅ Dossier sauvé avec ID unique:', customId);
    return {
      success: true,
      id: customId,
      message: `Dossier "${folderData.label}" synchronisé !`
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
    console.log('✏️ Mise à jour dossier:', folderId, 'depuis', platform);
    
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp(),
      lastModifiedBy: platform,
      syncedAt: serverTimestamp()
    };

    const folderRef = doc(db, 'folders', folderId);
    await updateDoc(folderRef, updatePayload);

    console.log('✅ Dossier mis à jour');
    return {
      success: true,
      message: 'Dossier mis à jour et synchronisé'
    };

  } catch (error) {
    console.error('❌ Erreur mise à jour dossier:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Supprimer un dossier
export const deleteFolderFromFirebase = async (folderId) => {
  try {
    console.log('🗑️ Suppression dossier Firebase:', folderId);
    
    const docRef = doc(db, 'folders', folderId);
    await deleteDoc(docRef);
    
    console.log('✅ Dossier supprimé de Firebase');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur suppression dossier Firebase:', error);
    return { success: false, error: error.message };
  }
};

export default {
  subscribeToSubmissions,
  createAssignment,
  updateSubmissionStatus,
  updateSubmissionInFirebase,
  deleteSubmissionFromFirebase,
  subscribeToFolders,
  saveFolderToFirebase,
  updateFolderInFirebase,
  deleteFolderFromFirebase
};