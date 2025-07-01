// src/firebaseFunctions.js - Fonctions Firebase pour Desktop
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// 📋 Récupérer toutes les soumissions
export const getAllSubmissions = async () => {
  try {
    console.log('📋 Récupération des soumissions...');
    
    const q = query(
      collection(db, 'soumissions'), 
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        ...data,
        // Convertir timestamps en dates lisibles
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });

    console.log(`✅ ${submissions.length} soumissions récupérées`);
    return {
      success: true,
      data: submissions,
      count: submissions.length
    };

  } catch (error) {
    console.error('❌ Erreur récupération:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// 📊 Récupérer soumissions avec statut
export const getSubmissionsByStatus = async (status = 'captured') => {
  try {
    const q = query(
      collection(db, 'soumissions'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
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

    return { success: true, data: submissions };
  } catch (error) {
    console.error('❌ Erreur récupération par statut:', error);
    return { success: false, data: [] };
  }
};

// 🔄 Mettre à jour une soumission (marquer comme traitée)
export const updateSubmissionStatus = async (submissionId, status, calculations = null) => {
  try {
    console.log('🔄 Mise à jour statut:', submissionId, status);
    
    const updateData = {
      status: status,
      updatedAt: serverTimestamp(),
      processedAt: status === 'completed' ? serverTimestamp() : null
    };
    
    // Ajouter les calculs si fournis
    if (calculations) {
      updateData.calculs = calculations;
      updateData.calculatedAt = serverTimestamp();
    }
    
    const submissionRef = doc(db, 'soumissions', submissionId);
    await updateDoc(submissionRef, updateData);

    console.log('✅ Statut mis à jour');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    return { success: false, error: error.message };
  }
};

// 📈 Statistiques des soumissions
export const getSubmissionStats = async () => {
  try {
    const result = await getAllSubmissions();
    
    if (result.success) {
      const submissions = result.data;
      
      const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'captured').length,
        completed: submissions.filter(s => s.status === 'completed').length,
        totalSuperficie: submissions.reduce((sum, sub) => {
          return sum + (sub.toiture?.superficie?.totale || 0);
        }, 0).toFixed(2),
        totalPhotos: submissions.reduce((sum, sub) => {
          return sum + (sub.photoCount || 0);
        }, 0),
        lastWeek: submissions.filter(sub => {
          const date = sub.createdAt;
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date > weekAgo;
        }).length
      };

      return { success: true, data: stats };
    }

    return { success: false, data: null };

  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return { success: false, data: null };
  }
};

// 🔍 Recherche dans les soumissions
export const searchSubmissions = async (searchTerm) => {
  try {
    const result = await getAllSubmissions();
    
    if (result.success) {
      const filtered = result.data.filter(submission => {
        const searchLower = searchTerm.toLowerCase();
        return (
          submission.client?.nom?.toLowerCase().includes(searchLower) ||
          submission.client?.adresse?.toLowerCase().includes(searchLower) ||
          submission.client?.telephone?.includes(searchTerm) ||
          submission.displayName?.toLowerCase().includes(searchLower)
        );
      });

      return { success: true, data: filtered, count: filtered.length };
    }

    return { success: false, data: [], count: 0 };

  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    return { success: false, data: [], count: 0 };
  }
};

// 🔴 Écouter les changements en temps réel (optionnel)
export const subscribeToSubmissions = (callback) => {
  try {
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
      
      callback({ success: true, data: submissions });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erreur subscription:', error);
    callback({ success: false, data: [] });
    return null;
  }
};