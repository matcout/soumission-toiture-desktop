// App.jsx - Fix pour préserver le scroll lors d'ouverture du menu contextuel
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { Building2, Calculator, Home, Plus, Folder, Clock, CheckCircle2, FileText, RefreshCw, ChevronRight, Trash2, Eye, MoreVertical, FolderPlus } from 'lucide-react'
import { subscribeToSubmissions, createAssignment, updateSubmissionStatus, deleteSubmissionFromFirebase, updateSubmissionInFirebase } from './firebaseFunctions'
import { testFirebaseConnection } from './firebase'
import { initializeCentralizedFolders, getAllCentralizedFolders, applyFolderFilter } from './centralizedFolderSystem'
import { subscribeToFolders, convertIconMobileToDesktop, saveFolderToFirebase, updateFolderInFirebase, deleteFolderFromFirebase } from './folderSyncFunctions'
import CalculatorView from './CalculatorView'
import AssignmentModal from './AssignmentModal'
import FolderManagementModal from './FolderManagementModal'
import { useNotifications, NotificationContainer } from './NotificationSystem'
import SubmissionViewer from './SubmissionViewer'


// Icônes disponibles avec mapping mobile → desktop
const ICON_COMPONENTS = {
  'FileText': FileText,
  'Clock': Clock,
  'CheckCircle2': CheckCircle2,
  'Folder': Folder,
  'FolderOpen': Folder,
  'Wrench': Calculator,
  'Settings': Calculator,
  'BarChart3': Calculator,
  'Calendar': Clock,
  'User': FileText,
  'Users': FileText,
  'Tag': FileText,
  'Tags': FileText,
  'Building2': Building2,
  'Calculator': Calculator,
  'Eye': Eye,
  'Edit2': FileText,
  'Trash2': Trash2,
  'Plus': Plus,
  'FolderPlus': FolderPlus
}

// Composant Menu Contextuel en Portail
const ContextMenu = ({ folder, position, onClose, onEdit, onDelete, onAddSubfolder }) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.context-menu-portal')) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!folder) return null

  const menuContent = (
    <div 
      className="context-menu-portal"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999
      }}
    >
      <div className="bg-white border rounded-lg shadow-lg py-1 w-48">
        {folder.level === 0 && (
          <button
            onClick={() => {
              onAddSubfolder(folder)
              onClose()
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter sous-dossier
          </button>
        )}
        <button
          onClick={() => {
            onEdit(folder)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
        >
          <FileText className="w-4 h-4 mr-2" />
          Modifier
        </button>
        <button
          onClick={() => {
            onDelete(folder.id, folder.label)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </button>
      </div>
    </div>
  )

  return ReactDOM.createPortal(menuContent, document.body)
}

function App() {
  // États principaux
  const [submissions, setSubmissions] = useState([])
  const [folders, setFolders] = useState({})
  const [loading, setLoading] = useState(true)
  const [firebaseConnected, setFirebaseConnected] = useState(false)
  
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedFolder, setSelectedFolder] = useState('system_assignments')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ show: false, submission: null })
  const [folderModal, setFolderModal] = useState({ show: false, folder: null, parentFolder: null })
  const [expandedFolders, setExpandedFolders] = useState(['system_project2025']) // Projet 2025 ouvert par défaut
  const [moveModal, setMoveModal] = useState({ show: false, submission: null })
  
  const { notifications, removeNotification, showSuccess, showError } = useNotifications()
  const [currentView, setCurrentView] = useState('dashboard')

  // État pour le menu contextuel avec position - NOUVELLE GESTION
  const [contextMenu, setContextMenu] = useState({ 
    show: false, 
    folder: null, 
    position: { x: 0, y: 0 } 
  })

  // Refs pour gérer le scroll
  const sidebarScrollRef = useRef(null)
  const scrollPositionRef = useRef(0) // NOUVEAU: stocker position scroll
  const [isUpdatingFolders, setIsUpdatingFolders] = useState(false)
  const [pendingFolderUpdate, setPendingFolderUpdate] = useState(null)

  // NOUVELLE FONCTION: Préserver scroll lors d'actions UI
  const preserveScrollPosition = useCallback(() => {
    if (sidebarScrollRef.current) {
      scrollPositionRef.current = sidebarScrollRef.current.scrollTop
    }
  }, [])

  // NOUVELLE FONCTION: Restaurer scroll
  const restoreScrollPosition = useCallback(() => {
    if (sidebarScrollRef.current && scrollPositionRef.current > 0) {
      // Utiliser setTimeout pour s'assurer que le DOM est à jour
      setTimeout(() => {
        if (sidebarScrollRef.current) {
          sidebarScrollRef.current.scrollTop = scrollPositionRef.current
        }
      }, 0)
    }
  }, [])

  // FONCTION AMÉLIORER: Gestion menu contextuel avec préservation scroll
  const handleContextMenu = useCallback((folder, position, level) => {
    // Préserver la position avant d'ouvrir le menu
    preserveScrollPosition()
    
    setContextMenu({
      show: true,
      folder: { ...folder, level },
      position
    })
    
    // Restaurer le scroll après le rendu
    restoreScrollPosition()
  }, [preserveScrollPosition, restoreScrollPosition])

  // FONCTION AMÉLIORER: Fermer menu contextuel
  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, folder: null, position: { x: 0, y: 0 } })
  }, [])

  // Mémoriser la structure des dossiers avec useCallback pour stabilité
  const organizedFolders = useMemo(() => {
    const rootFolders = []
    const folderMap = {}
    
    Object.values(folders).forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] }
    })
    
    Object.values(folderMap).forEach(folder => {
      if (folder.parentId && folderMap[folder.parentId]) {
        folderMap[folder.parentId].children.push(folder)
      } else if (!folder.parentId) {
        rootFolders.push(folder)
      }
    })
    
    rootFolders.sort((a, b) => a.order - b.order)
    Object.values(folderMap).forEach(folder => {
      if (folder.children) {
        folder.children.sort((a, b) => a.order - b.order)
      }
    })
    
    return rootFolders
  }, [folders])

  // Effet pour appliquer les mises à jour en attente AVEC préservation scroll
  useEffect(() => {
    if (!isUpdatingFolders && pendingFolderUpdate) {
      preserveScrollPosition()
      setFolders(pendingFolderUpdate)
      setPendingFolderUpdate(null)
      // Restaurer scroll après mise à jour
      requestAnimationFrame(() => {
        restoreScrollPosition()
      })
    }
  }, [isUpdatingFolders, pendingFolderUpdate, preserveScrollPosition, restoreScrollPosition])

  // Initialisation Firebase et dossiers
  useEffect(() => {
    let unsubscribeSubmissions = null
    let unsubscribeFolders = null

    const initializeApp = async () => {
      console.log('🔥 Initialisation de l\'application...')
      
      try {
        const connected = testFirebaseConnection()
        setFirebaseConnected(connected)
        
        if (connected) {
          const folderResult = await initializeCentralizedFolders('desktop')
          console.log('📁 Dossiers initialisés:', folderResult)
          
        // 🔧 SECTION COMPLÈTE À REMPLACER dans App.jsx
// Trouvez cette partie et remplacez TOUT le bloc unsubscribeFolders

unsubscribeFolders = subscribeToFolders((result) => {
  if (result.success) {
    const foldersMap = {}
    result.data.forEach(folder => {
      const desktopIcon = convertIconMobileToDesktop(folder.icon)
      
// 🎯 CRÉER LE FILTRE CORRECT SELON LE DOSSIER
let filterFunction;

if (folder.label === 'À compléter' || folder.slug === 'pending' || folder.id.includes('pending')) {
  filterFunction = (submissions) => {
    const filtered = submissions.filter(s => s.status === 'captured');
    console.log(`🔍 Filtre "À compléter": ${filtered.length}/${submissions.length} soumissions`);
    return filtered;
  };
} else if (folder.label === 'Aller prendre mesure' || folder.slug === 'assignments') {
  filterFunction = (submissions) => {
    const filtered = submissions.filter(s => s.status === 'assignment');
    console.log(`🔍 Filtre "Assignments": ${filtered.length}/${submissions.length} soumissions`);
    return filtered;
  };
} else if (folder.label === 'Soumissions' || folder.slug === 'completed') {
  filterFunction = (submissions) => {
    const filtered = submissions.filter(s => s.status === 'completed');
    console.log(`🔍 Filtre "Soumissions": ${filtered.length}/${submissions.length} soumissions`);
    return filtered;
  };
} else if (folder.filterConfig) {
  filterFunction = (submissions) => applyFolderFilter(folder, submissions);
} else {
  // 🎯 POUR LES DOSSIERS PERSONNALISÉS - GESTION MULTIPLE IDs
  filterFunction = (submissions) => {
    const filtered = submissions.filter(s => {
      // Correspondances multiples pour compatibilité
      if (s.folderId === folder.id) return true;
      
      // Gestion spéciale pour "Projet 2025"
      if (folder.id === 'projet_2025' && s.folderId === 'projet_2025_soumissions') return true;
      
      // Gestion spéciale pour "Soumissions" 
// Gestion spéciale pour "Soumissions" 
if (folder.label === 'Soumissions' && 
    (s.folderId === 'completed' || s.folderId === 'projet_2025_soumissions' || s.status === 'completed')) return true;
      
      return false;
    });
    
    console.log(`🔍 Filtre "${folder.label}": ${filtered.length}/${submissions.length} soumissions (cherche: ${folder.id})`);
    return filtered;
  };
}
      
      foldersMap[folder.id] = {
        ...folder,
        icon: desktopIcon,
        filter: filterFunction
      }
    })
    
    if (isUpdatingFolders) {
      setPendingFolderUpdate(foldersMap)
    } else {
      // Préserver scroll lors de mise à jour normale
      preserveScrollPosition()
      setFolders(foldersMap)
      restoreScrollPosition()
    }
    
    console.log(`✅ ${result.data.length} dossiers synchronisés`)
  }
})
          
       unsubscribeSubmissions = subscribeToSubmissions((result) => {
  if (result.success) {
    setSubmissions(result.data)
    console.log(`✅ ${result.count} soumissions chargées`)
    
    // 🔧 DEBUG TEMPORAIRE - AJOUTER CES LIGNES
    window.debugSubmissions = result.data;
    
    console.log('🔍 DIAGNOSTIC DÉTAILLÉ');
    console.log('===================');
    console.log(`📊 Total: ${result.data.length}`);
    
    const statusCount = {};
    result.data.forEach(s => {
      statusCount[s.status] = (statusCount[s.status] || 0) + 1;
    });
    console.log('📈 Par status:', statusCount);
    
    const captured = result.data.filter(s => s.status === 'captured');
    console.log(`🎯 ${captured.length} soumissions "captured"`);
captured.forEach((s, i) => {
  console.log(`   ${i+1}. ${s.client?.adresse || s.id} (Status: ${s.status})`);
});

console.log('🔍 ANALYSE DES folderId :');
result.data.forEach((s, i) => {
  console.log(`   ${i+1}. ${s.client?.adresse || s.id} - folderId: "${s.folderId || 'AUCUN'}" - status: ${s.status}`);
});

console.log('🔍 ANALYSE DES DOSSIERS :');
Object.values(folders).forEach(f => {
  console.log(`   📁 ${f.label} (ID: ${f.id}) - Parent: ${f.parentId || 'AUCUN'}`);
});
    
    // Test du filtre "À compléter"
    const pendingFolder = Object.values(folders).find(f => 
      f.label === 'À compléter' || f.id.includes('pending')
    );
    if (pendingFolder && pendingFolder.filter) {
      const filtered = pendingFolder.filter(result.data);
      console.log(`🔍 Filtre "À compléter": ${filtered.length} résultats`);
    } else {
      console.log('❌ Dossier "À compléter" non trouvé ou sans filtre');
    }
  } else {
    console.error('❌ Erreur sync:', result.error)
    showError('Erreur synchronisation', result.error)
  }
})
        } else {
          showError('Firebase déconnecté', 'Mode hors ligne')
        }
      } catch (error) {
        console.error('❌ Erreur initialisation:', error)
        showError('Erreur système', error.message)
      } finally {
        setLoading(false)
      }
    }
    
    initializeApp()

    return () => {
      if (unsubscribeSubmissions) {
        unsubscribeSubmissions()
      }
      if (unsubscribeFolders) {
        unsubscribeFolders()
      }
    }
  }, [isUpdatingFolders, preserveScrollPosition, restoreScrollPosition])

  // Fonction helper pour maintenir le scroll - AMÉLIORÉE
  const withScrollPreservation = async (operation) => {
    preserveScrollPosition()
    setIsUpdatingFolders(true)
    
    try {
      await operation()
      await new Promise(resolve => setTimeout(resolve, 100))
    } finally {
      setIsUpdatingFolders(false)
      // Le scroll sera restauré par useEffect ci-dessus
    }
  }

  const handleSaveFolder = async (folderData) => {
    await withScrollPreservation(async () => {
      try {
        setLoading(true)
        
        if (folderData.id) {
          const result = await updateFolderInFirebase(folderData.id, {
            label: folderData.label,
            icon: folderData.icon,
            color: folderData.color
          }, 'desktop')
          
          if (result.success) {
            showSuccess('Dossier modifié', `"${folderData.label}" a été mis à jour`)
          } else {
            showError('Erreur modification', result.error)
          }
        } else {
          const newFolder = {
            label: folderData.label,
            icon: folderData.icon,
            color: folderData.color,
            order: Object.keys(folders).length,
            level: folderData.parentId ? 1 : 0,
            parentId: folderData.parentId || null,
            isSystemFolder: false,
            isDeletable: true,
            isEditable: true,
            filterConfig: null
          }
          
          const result = await saveFolderToFirebase(newFolder, 'desktop')
          
          if (result.success) {
            showSuccess('Dossier créé', `"${folderData.label}" a été ajouté`)
          } else {
            showError('Erreur création', result.error)
          }
        }
      } catch (error) {
        showError('Erreur', error.message)
      } finally {
        setLoading(false)
        setFolderModal({ show: false, folder: null, parentFolder: null })
      }
    })
  }

  const handleDeleteFolder = async (folderId, folderLabel) => {
    if (folderId === 'system_assignments' || 
        folderId === 'system_pending') {
      showError('Dossier protégé', 'Ce dossier système ne peut pas être supprimé')
      return
    }
    
    if (window.confirm(`Supprimer le dossier "${folderLabel}" ?`)) {
      await withScrollPreservation(async () => {
        try {
          const result = await deleteFolderFromFirebase(folderId)
          if (result.success) {
            showSuccess('Dossier supprimé', `"${folderLabel}" a été supprimé`)
            if (selectedFolder === folderId) {
              setSelectedFolder('system_assignments')
            }
          } else {
            showError('Erreur suppression', result.error)
          }
        } catch (error) {
          showError('Erreur', error.message)
        }
      })
    }
  }

const handleUpdateSubmissionNotes = async (submissionId, updateData) => {
  try {
    console.log('🔄 Mise à jour notes soumission:', submissionId, updateData)
    
    const result = await updateSubmissionInFirebase(submissionId, updateData)
    
    if (result.success) {
      console.log('✅ Notes mises à jour avec succès')
      showSuccess('Notes sauvegardées', 'Les modifications ont été enregistrées')
      return true
    } else {
      throw new Error(result.error || 'Erreur de mise à jour')
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour notes:', error)
    showError('Erreur sauvegarde', error.message)
    throw error
  }
}

  // Gérer la création d'assignment
  const handleSubmitAssignment = async (formData) => {
    const assignmentData = {
      client: {
        nom: formData.nom,
        adresse: formData.adresse.trim(),
        telephone: formData.telephone,
        courriel: formData.courriel
      },
      notes: formData.notes || '',
      status: 'assignment'
    }

    try {
      setLoading(true)
      const result = await createAssignment(assignmentData)
      
      if (result.success) {
        setShowAssignmentModal(false)
        showSuccess('Assignment créé !', `"${result.displayName}" est maintenant disponible sur mobile`)
      } else {
        showError('Erreur création', result.error)
      }
    } catch (error) {
      showError('Erreur', error.message)
    } finally {
      setLoading(false)
    }
  }

const handleCalculateSubmission = (submission) => {
  // Passer TOUTE la soumission comme prefilledData pour avoir accès à toutes les données
  const prefilledData = {
    superficie: submission.toiture?.superficie?.toiture || 0,
    parapets: submission.toiture?.superficie?.parapets || 0,
    nbMax: submission.materiaux?.nbMax || 0,
    nbEvents: submission.materiaux?.nbEvents || 0,
    nbDrains: submission.materiaux?.nbDrains || 0,
    nbFeuilles: submission.materiaux?.nbFeuilles || 0,
    // Inclure toutes les données de la soumission pour les puits de lumière et autres
    toiture: submission.toiture,
    materiaux: submission.materiaux,
    client: submission.client,
    options: submission.options,
    notes: submission.notes,
    photos: submission.photos
    
  }
  
  setSelectedSubmission({ ...submission, prefilledData })
  setActiveView('calculator')
}

  const handleBackFromCalculator = () => {
    if (selectedSubmission) {
      // Si on vient d'une soumission spécifique, on retourne au dossier approprié
      const submissionFolder = selectedSubmission.status === 'assignment' ? 'system_assignments' : 
                              selectedSubmission.status === 'captured' ? 'system_pending' : 
                              'projet_2025_soumissions'
      setSelectedFolder(submissionFolder)
    }
    setActiveView('dashboard')
    setSelectedSubmission(null)
  }

  const handleSaveCalculation = async (calculationData) => {
    if (selectedSubmission) {
      try {
        // Trouver le sous-dossier "Soumissions" de "Projet 2025"
        let targetFolderId = null;
        const projet2025 = Object.values(folders).find(f => 
          f.id === 'system_project2025' || f.label === 'Projet 2025'
        );
        
        if (projet2025) {
          // Chercher le sous-dossier "Soumissions"
          const soumissionsFolder = Object.values(folders).find(f => 
            f.parentId === projet2025.id && f.label === 'Soumissions'
          );
          
          if (soumissionsFolder) {
            targetFolderId = soumissionsFolder.id;
          }
        }
        
        const result = await updateSubmissionStatus(
          selectedSubmission.id, 
          'completed', 
          { 
            calculs: calculationData.results,
            folderId: targetFolderId || 'projet_2025_soumissions',
            // Retirer l'ancien folderId pour éviter les doublons
            previousFolderId: selectedSubmission.folderId
          }
        )
        
        if (result.success) {
          showSuccess('Calcul terminé !', 'Déplacé vers Projet 2025 > Soumissions')
          setActiveView('dashboard')
          setSelectedFolder(targetFolderId || 'projet_2025_soumissions')
          setSelectedSubmission(null)
        } else {
          showError('Erreur sauvegarde', result.error)
        }
      } catch (error) {
        showError('Erreur', error.message)
      }
    }
  }

  const confirmDeleteSubmission = async () => {
    const { id } = deleteModal.submission
    
    try {
      const result = await deleteSubmissionFromFirebase(id)
      if (result.success) {
        showSuccess('Suppression réussie', 'Soumission supprimée')
      } else {
        showError('Erreur suppression', result.error)
      }
    } catch (error) {
      showError('Erreur', error.message)
    }
    
    setDeleteModal({ show: false, submission: null })
  }

  const handleMoveSubmission = async (submissionId, newFolderId) => {
    try {
      const result = await updateSubmissionStatus(submissionId, null, { 
        folderId: newFolderId 
      })
      
      if (result.success) {
        showSuccess('Déplacement réussi', 'La soumission a été déplacée')
        setMoveModal({ show: false, submission: null })
      } else {
        showError('Erreur déplacement', result.error)
      }
    } catch (error) {
      showError('Erreur', error.message)
    }
  }

  // Carte de soumission
  const SubmissionCard = ({ submission }) => {
    const [showActions, setShowActions] = useState(false)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">
              {submission.client?.adresse || submission.displayName || 'Adresse inconnue'}
            </h3>
            {submission.client?.nom && (
              <p className="text-sm text-gray-600 mt-1">{submission.client.nom}</p>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <>
                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      setMoveModal({ 
                        show: true, 
                        submission: submission
                      })
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Déplacer
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModal({ 
                        show: true, 
                        submission: { id: submission.id, address: submission.client?.adresse }
                      })
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </button>
                </div>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              </>
            )}
          </div>
        </div>

        {selectedFolder !== 'system_assignments' && (
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
            <div>
              <span className="font-medium">Superficie:</span> {submission.toiture?.superficie?.totale || 0} pi²
            </div>
            <div>
              <span className="font-medium">Photos:</span> {submission.photoCount || 0}
            </div>
          </div>
        )}

        {submission.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
            <p className="text-xs text-blue-700">
              <strong>Notes:</strong> {submission.notes.substring(0, 100)}...
            </p>
          </div>
        )}

     
{submission.photos && submission.photos.length > 0 && (
  <div className="mb-3">
    <p className="text-xs font-medium text-gray-700 mb-3">
      Photos ({submission.photos.length})
    </p>
    <div className="flex gap-2">
      {submission.photos.slice(0, 3).map((photo, index) => {
        const photoUrl = typeof photo === 'string' ? photo : photo.uri || photo.url;
        const isLocalFile = photoUrl && photoUrl.startsWith('file://');
        
        if (isLocalFile) {
          return (
            <div key={index} className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center border border-gray-300">
              <div className="text-center">
                <span className="text-xs text-gray-500">📷</span>
                <span className="text-xs text-gray-400 block">Local</span>
              </div>
            </div>
          );
        }
        
        if (!photoUrl || photoUrl === 'undefined') {
          return (
            <div key={index} className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">❌</span>
            </div>
          );
        }
        
        return (
          <div key={index} className="relative group">
            <img 
              src={photoUrl} 
              alt={`Photo ${index + 1}`}
              className="w-20 h-20 object-cover rounded cursor-pointer ultra-sharp-thumbnail hover:scale-105 transition-transform duration-200"
              onClick={() => window.open(photoUrl, '_blank')}
              loading="lazy"
              decoding="sync"
            />
            {/* ✅ Overlay subtil seulement au hover */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded" />
          </div>
        );
      })}
      
      {submission.photos.length > 3 && (
        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-200">
          +{submission.photos.length - 3}
        </div>
      )}
    </div>
  </div>
)}

        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setSelectedSubmission(submission);
              setCurrentView('viewer');
            }}
            className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
          >
            <Eye className="w-3 h-3 mr-1" />
            Voir
          </button>
          {selectedFolder === 'system_pending' && (
            <button 
              onClick={() => handleCalculateSubmission(submission)}
              className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600"
            >
              <Calculator className="w-3 h-3 mr-1" />
              Calculer
            </button>
          )}
        </div>
      </div>
    )
  }

  const getFolderCount = (folder) => {
    return folder.filter ? folder.filter(submissions).length : 0
  }

  // Composant pour les options de dossier dans la modal de déplacement
  const FolderMoveOption = ({ folder, level, currentFolderId, onSelect }) => {
    const [expanded, setExpanded] = useState(false)
    const hasChildren = folder.children && folder.children.length > 0
    const isCurrentFolder = folder.id === currentFolderId
    const isParentFolder = level === 0 && hasChildren
    const Icon = ICON_COMPONENTS[folder.icon] || Folder
    
    return (
      <div>
        <div 
          className={`flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50 cursor-pointer ${
            isCurrentFolder ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 
            isParentFolder ? 'opacity-60' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          <button
            onClick={() => !isCurrentFolder && !isParentFolder && onSelect(folder.id)}
            className="flex-1 flex items-center text-left"
            disabled={isCurrentFolder || isParentFolder}
          >
            <Icon className="w-4 h-4 mr-2" style={{ color: folder.color }} />
            <span className="text-sm">{folder.label}</span>
            {isCurrentFolder && <span className="text-xs text-gray-500 ml-2">(dossier actuel)</span>}
            {isParentFolder && <span className="text-xs text-gray-500 ml-2">(conteneur)</span>}
          </button>
          
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        
        {hasChildren && expanded && (
          <div>
            {folder.children.map(childFolder => (
              <FolderMoveOption 
                key={childFolder.id} 
                folder={childFolder} 
                level={level + 1}
                currentFolderId={currentFolderId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Composant Folder AMÉLIORÉ avec gestion correcte du menu contextuel
  const FolderItem = React.memo(({ folder, level }) => {
    const Icon = ICON_COMPONENTS[folder.icon] || Folder
    const count = getFolderCount(folder)
    const isSelected = selectedFolder === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expandedFolders.includes(folder.id)
    const isParentFolder = level === 0 && hasChildren // Dossier parent avec enfants
    
    // NOUVELLE FONCTION: Gérer menu avec préservation scroll
    const handleMenuClick = useCallback((e) => {
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      
      // Utiliser la nouvelle fonction qui préserve le scroll
      handleContextMenu(folder, { 
        x: rect.left - 150, 
        y: rect.bottom + 5 
      }, level)
    }, [folder, level, handleContextMenu])
    
    return (
      <div>
        <div
          data-folder-id={folder.id}
          className={`group flex items-center justify-between py-2.5 px-3 text-sm rounded-lg ${
            isSelected && !isParentFolder
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <button
onClick={() => {
  console.log('🎯 CLIC DÉTECTÉ sur:', folder.label, '| ID:', folder.id, '| isParentFolder:', isParentFolder);
  
  // Toujours permettre la sélection
  setSelectedFolder(folder.id)
  setActiveView('dashboard')
  
  console.log('🎯 setSelectedFolder appelé avec:', folder.id);

  // Si c'est un dossier parent, toggle aussi l'expansion
  if (isParentFolder) {
    console.log('🎯 Toggle expansion pour parent folder');
    setExpandedFolders(prev =>
      prev.includes(folder.id)
        ? prev.filter(id => id !== folder.id)
        : [...prev, folder.id]
    )
  }
}}
            className="flex-1 flex items-center text-left"
          >
            <Icon className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: folder.color }} />
            <span className="truncate">{folder.label}</span>
          </button>
          
          <div className="flex items-center space-x-1">
            {count > 0 && !isParentFolder && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                {count}
              </span>
            )}
            
            {/* Menu contextuel seulement pour les dossiers non-système et non-parents */}
            {folder.id !== 'system_assignments' && 
             folder.id !== 'system_pending' && 
             !isParentFolder && (
              <button
                onClick={handleMenuClick}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            )}
            
            {hasChildren && (
              <button
                onClick={() => {
                  setExpandedFolders(prev =>
                    prev.includes(folder.id)
                      ? prev.filter(id => id !== folder.id)
                      : [...prev, folder.id]
                  )
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map(childFolder => (
              <FolderItem key={childFolder.id} folder={childFolder} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  })

  const Sidebar = () => (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Soumission Toiture</h1>
            <p className="text-xs text-gray-500">Toitpro</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="w-full mt-4 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Soumission
        </button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg ${
            activeView === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Home className="w-4 h-4 mr-3" />
          Tableau de bord
        </button>
        
        <button
          onClick={() => {
            setActiveView('calculator')
            setSelectedSubmission(null)
          }}
          className={`w-full mt-2 flex items-center px-3 py-2 text-sm rounded-lg ${
            activeView === 'calculator' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Calculator className="w-4 h-4 mr-3" />
          Calculateur
        </button>
      </div>

      {/* SIDEBAR AVEC REF AMÉLIORÉE */}
      <div 
        key="sidebar-scroll"
        ref={sidebarScrollRef}
        className="flex-1 p-4 overflow-y-auto"
        onScroll={() => {
          // Stocker continuellement la position
          if (sidebarScrollRef.current) {
            scrollPositionRef.current = sidebarScrollRef.current.scrollTop
          }
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Dossiers</h3>
          <button
            onClick={() => {
              preserveScrollPosition()
              setFolderModal({ show: true, folder: null, parentFolder: null })
            }}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Créer un dossier"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1">
          {organizedFolders.map(folder => (
            <FolderItem key={folder.id} folder={folder} level={0} />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600">
              {firebaseConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          <RefreshCw className={`w-3 h-3 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </div>
      </div>
    </div>
  )

  const MainContent = () => {

    
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      )
    }

    const currentFolder = folders[selectedFolder]
    const hasChildren = currentFolder?.children && currentFolder.children.length > 0
    const isParentFolder = currentFolder && hasChildren
    
    // Si c'est un dossier parent, afficher un message spécial
    if (isParentFolder) {
      return (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {React.createElement(ICON_COMPONENTS[currentFolder?.icon] || Folder, {
                  className: "w-6 h-6 mr-3",
                  style: { color: currentFolder?.color }
                })}
                {currentFolder?.label}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Dossier d'organisation • {currentFolder.children.length} sous-dossier{currentFolder.children.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-3">
                Ce dossier sert à organiser vos sous-dossiers
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Les soumissions doivent être placées dans les sous-dossiers. 
                Cliquez sur un sous-dossier dans la barre latérale pour voir son contenu.
              </p>
              
              <div className="mt-8">
                <button
                  onClick={() => {
                    setFolderModal({ show: true, folder: null, parentFolder: currentFolder })
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un sous-dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
   const currentSubmissions = useMemo(() => {
  console.log('🔍 useMemo currentSubmissions calculé', {
    selectedFolder,
    folderExists: !!folders[selectedFolder],
    submissionsCount: submissions.length
  });
  
  if (!selectedFolder || !folders[selectedFolder]) return []
  const folder = folders[selectedFolder]
  if (!folder.filter || !Array.isArray(submissions)) return []
  
  const filtered = folder.filter(submissions)
  console.log(`🔍 ${folder.label}: ${filtered.length} soumissions filtrées FOR DISPLAY`)
  return filtered
}, [selectedFolder, folders, submissions])
console.log('🎯 MainContent rendu:', {
  selectedFolder,
  currentSubmissions: currentSubmissions.length,
  folders: Object.keys(folders).length
});

// Exposer pour tests
window.debugMainContent = {
  selectedFolder,
  currentSubmissions,
  folders
};

    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {React.createElement(ICON_COMPONENTS[currentFolder?.icon] || Folder, {
                className: "w-6 h-6 mr-3",
                style: { color: currentFolder?.color }
              })}
              {currentFolder?.label}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {currentSubmissions.length} soumission{currentSubmissions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {currentSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentSubmissions.map(submission => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-3">
                Aucune soumission dans ce dossier
              </h3>
              {selectedFolder === 'system_assignments' && (
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une nouvelle soumission
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vue calculateur en pleine page
  if (activeView === 'calculator') {
    return (
      <div className="h-screen bg-gray-50">
        {/* Header simple sans sidebar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackFromCalculator}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span className="font-medium">Retour au tableau de bord</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Calculateur Soumission</h1>
                {selectedSubmission && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    Calcul pour: {selectedSubmission.client?.adresse || selectedSubmission.displayName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {firebaseConnected ? 'Synchronisé' : 'Hors ligne'}
              </span>
              <div className="w-px h-4 bg-gray-300" />
              <span className="text-xs text-gray-500">
                Brouillon automatique activé
              </span>
            </div>
          </div>
        </div>

        {/* Calculateur en pleine largeur */}
        <div className="p-8 overflow-y-auto h-[calc(100vh-73px)]">
          <div className="max-w-[1600px] mx-auto">
            <CalculatorView 
              prefilledData={selectedSubmission?.prefilledData}
              onSaveCalculation={handleSaveCalculation}
              onBack={handleBackFromCalculator}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentView === 'viewer' && selectedSubmission ? (
        <SubmissionViewer
          submission={selectedSubmission}
          onBack={() => {
            setCurrentView('dashboard');
            setSelectedSubmission(null);
          }}
          
         onUpdate={handleUpdateSubmissionNotes}
        />
      ) : (
        <div className="flex h-screen bg-white">
          <Sidebar />
          <MainContent />

          {/* Menu contextuel en portail */}
          {contextMenu.show && (
            <ContextMenu
              folder={contextMenu.folder}
              position={contextMenu.position}
              onClose={closeContextMenu}
              onEdit={(folder) => {
                preserveScrollPosition()
                setFolderModal({ show: true, folder, parentFolder: null })
                closeContextMenu()
              }}
              onDelete={handleDeleteFolder}
              onAddSubfolder={(folder) => {
                preserveScrollPosition()
                setFolderModal({ show: true, folder: null, parentFolder: folder })
                closeContextMenu()
              }}
            />
          )}

          {/* Modals */}
          <AssignmentModal
            isOpen={showAssignmentModal}
            onClose={() => setShowAssignmentModal(false)}
            onSubmit={handleSubmitAssignment}
          />

          <FolderManagementModal
            isOpen={folderModal.show}
            onClose={() => {
              setFolderModal({ show: false, folder: null, parentFolder: null })
            }}
            onSave={handleSaveFolder}
            folder={folderModal.folder}
            parentFolder={folderModal.parentFolder}
          />

          {deleteModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer "{deleteModal.submission?.address}" ?
                  Cette action est irréversible.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, submission: null })}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteSubmission}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {moveModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Déplacer vers un autre dossier
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez le dossier de destination pour "{moveModal.submission?.client?.adresse || 'cette soumission'}"
                </p>
                
                <div className="flex-1 overflow-y-auto mb-4 border rounded-lg p-2">
                  {organizedFolders.map(folder => (
                    <FolderMoveOption 
                      key={folder.id} 
                      folder={folder} 
                      level={0}
                      currentFolderId={selectedFolder}
                      onSelect={(folderId) => handleMoveSubmission(moveModal.submission.id, folderId)}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => setMoveModal({ show: false, submission: null })}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <NotificationContainer
            notifications={notifications}
            onRemove={removeNotification}
          />
        </div>
      )}
    </>
  )
}

export default App