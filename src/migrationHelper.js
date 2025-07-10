// migrationHelper.js - Version Desktop Simplifiée
// 🔄 Migration douce vers système centralisé sans complexité

import { initializeCentralizedFolders } from './centralizedFolderSystem'
import { getAllFoldersFromFirebase } from './folderSyncFunctions'

// 🚀 FONCTION PRINCIPALE DE MIGRATION SIMPLIFIÉE
export const migrateToFCentralizedSystem = async (platform = 'desktop') => {
  try {
    console.log(`🔄 Migration vers système centralisé (${platform})...`)
    
    // 1️⃣ Initialiser la structure centralisée
    const initResult = await initializeCentralizedFolders(platform)
    
    if (!initResult.success) {
      throw new Error(`Erreur initialisation: ${initResult.error}`)
    }
    
    console.log('✅ Migration desktop réussie !', {
      total: initResult.folders.length,
      première: initResult.isFirstInit ? 'Oui' : 'Non'
    })
    
    return {
      success: true,
      isFirstInstall: initResult.isFirstInit,
      totalFolders: initResult.folders.length,
      systemFolders: initResult.folders.filter(f => f.isSystemFolder).length,
      userFolders: initResult.folders.filter(f => !f.isSystemFolder).length,
      folders: initResult.folders
    }
    
  } catch (error) {
    console.error('❌ Erreur migration:', error)
    return {
      success: false,
      error: error.message,
      folders: []
    }
  }
}

// 🔍 DÉTECTION SIMPLIFIÉE DU SYSTÈME
export const detectCurrentSystem = async () => {
  try {
    const folders = await getAllFoldersFromFirebase()
    
    if (folders.success && folders.data.length > 0) {
      const systemFolders = folders.data.filter(f => f.isSystemFolder)
      
      if (systemFolders.length > 0) {
        return {
          type: 'centralized',
          description: 'Système centralisé opérationnel',
          needsMigration: false
        }
      }
    }
    
    return {
      type: 'fresh',
      description: 'Première installation',
      needsMigration: false,
      isFirstInstall: true
    }
    
  } catch (error) {
    console.error('❌ Erreur détection:', error)
    return {
      type: 'unknown',
      description: 'Impossible de déterminer le type',
      error: error.message
    }
  }
}

console.log('🔄 Helper Migration Desktop Simplifié initialisé')