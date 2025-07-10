// firebaseFunctions.js - Desktop Version
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
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        submissions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      console.log(`✅ ${submissions.length} soumissions synchronisées`);
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
    console.log('📝 Création assignment...');
    
    const addressClean = assignmentData.client?.adresse
      ?.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30) || 'assignment';
    
    const customId = `assignment_${addressClean}_${Date.now()}`;
    
    const dataToSave = {
      ...assignmentData,
      status: 'assignment',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      platform: 'desktop',
      displayName: assignmentData.client?.adresse
    };

    const docRef = doc(db, 'soumissions', customId);
    await setDoc(docRef, dataToSave);
    
    console.log('✅ Assignment créé:', customId);
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
export const updateSubmissionStatus = async (submissionId, newStatus, additionalData = {}) => {
  try {
    console.log('📝 Mise à jour soumission:', submissionId);
    
    const updateData = {
      updatedAt: serverTimestamp(),
      lastModifiedBy: 'desktop',
      ...additionalData
    };
    
    if (newStatus) {
      updateData.status = newStatus;
    }

    const submissionRef = doc(db, 'soumissions', submissionId);
    await updateDoc(submissionRef, updateData);

    console.log('✅ Soumission mise à jour');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur mise à jour:', error);
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

export default {
  subscribeToSubmissions,
  createAssignment,
  updateSubmissionStatus,
  deleteSubmissionFromFirebase
};