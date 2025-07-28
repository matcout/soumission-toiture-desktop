// App.jsx - Fix pour préserver le scroll lors d'ouverture du menu contextuel
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { Building2, Calculator, Home, Plus, Folder, Clock, CheckCircle2, FileText, RefreshCw, ChevronRight, Trash2, Eye, MoreVertical, FolderPlus, Camera, PanelLeftClose, User, MapPin, ExternalLink, ArrowLeft, Edit3, Save } from 'lucide-react'
import { subscribeToSubmissions, createAssignment, updateSubmissionStatus, deleteSubmissionFromFirebase, updateSubmissionInFirebase } from './firebaseFunctions'
import { testFirebaseConnection } from './firebase'
import { initializeCentralizedFolders, getAllCentralizedFolders, applyFolderFilter } from './centralizedFolderSystem'
import { subscribeToFolders, convertIconMobileToDesktop, saveFolderToFirebase, updateFolderInFirebase, deleteFolderFromFirebase } from './folderSyncFunctions'
import CalculatorView from './CalculatorView'
import AssignmentModal from './AssignmentModal'
import FolderManagementModal from './FolderManagementModal'
import { useNotifications, NotificationContainer } from './NotificationSystem'
import SubmissionViewer from './SubmissionViewer'
import CustomCalendar from './CustomCalendar'


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
  
 const [activeView, setActiveView] = useState('calendar')
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null)
  
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ show: false, submission: null })
  const [folderModal, setFolderModal] = useState({ show: false, folder: null, parentFolder: null })
  const [expandedFolders, setExpandedFolders] = useState(['system_project2025']) // Projet 2025 ouvert par défaut
  const [moveModal, setMoveModal] = useState({ show: false, submission: null })

  // NOUVEAUX ÉTATS pour le layout 3 colonnes
  const [menuWidth, setMenuWidth] = useState(22) // Menu: 22%
  const [listWidth, setListWidth] = useState(35) // Liste: 35%
  const [detailWidth, setDetailWidth] = useState(43) // Détails: 43%
  const [menuCollapsed, setMenuCollapsed] = useState(false)

    const [submissionContextMenu, setSubmissionContextMenu] = useState({ 
    show: false, 
    submission: null, 
    position: { x: 0, y: 0 } 
  })
  
  const { notifications, removeNotification, showSuccess, showError } = useNotifications()
  const [currentView, setCurrentView] = useState('dashboard')

const [isEditingNotes, setIsEditingNotes] = useState(false)
const [editedNotes, setEditedNotes] = useState('')
const [isSavingNotes, setIsSavingNotes] = useState(false)

  // État pour le menu contextuel avec position - NOUVELLE GESTION
  const [contextMenu, setContextMenu] = useState({ 
    show: false, 
    folder: null, 
    position: { x: 0, y: 0 } 
  })

  // Composant Menu Contextuel pour Soumissions
const SubmissionContextMenu = ({ submission, position, onClose, onDelete, onMove }) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.submission-context-menu-portal')) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!submission) return null

  const menuContent = (
    <div 
      className="submission-context-menu-portal"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999
      }}
    >
      <div className="bg-white border rounded-lg shadow-lg py-1 w-48">
        <button
          onClick={() => {
            onMove(submission)
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
        >
          <Folder className="w-4 h-4 mr-2" />
          Déplacer vers...
        </button>
        <button
          onClick={() => {
            onDelete(submission)
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


  // Refs pour gérer le scroll
  const sidebarScrollRef = useRef(null)
  const scrollPositionRef = useRef(0) // NOUVEAU: stocker position scroll
  const [isUpdatingFolders, setIsUpdatingFolders] = useState(false)
  const [pendingFolderUpdate, setPendingFolderUpdate] = useState(null)

    // NOUVELLES RÉFÉRENCES pour le redimensionnement
  const containerRef = useRef(null)
  const isResizing = useRef(false)
  const resizeType = useRef(null)

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

   // NOUVELLES FONCTIONS pour le redimensionnement
  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault()
    isResizing.current = true
    resizeType.current = type
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const mouseX = e.clientX - containerRect.left
    const percentage = (mouseX / containerWidth) * 100
    
    if (resizeType.current === 'menu') {
      const newMenuWidth = Math.max(15, Math.min(35, percentage))
      setMenuWidth(newMenuWidth)
      
      const remainingWidth = 100 - newMenuWidth
      const currentTotal = listWidth + detailWidth
      setListWidth((listWidth / currentTotal) * remainingWidth)
      setDetailWidth((detailWidth / currentTotal) * remainingWidth)
      
    } else if (resizeType.current === 'list') {
      const relativeX = mouseX - (containerWidth * menuWidth / 100)
      const availableWidth = containerWidth * (100 - menuWidth) / 100
      const relativePercentage = (relativeX / availableWidth) * (100 - menuWidth)
      
      const newListWidth = Math.max(25, Math.min(65, relativePercentage))
      const newDetailWidth = (100 - menuWidth) - newListWidth
      
      if (newDetailWidth >= 20) {
        setListWidth(newListWidth)
        setDetailWidth(newDetailWidth)
      }
    }
  }, [menuWidth, listWidth, detailWidth])

  const handleMouseUp = useCallback(() => {
    isResizing.current = false
    resizeType.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Fonction pour basculer le menu
  const toggleMenu = () => {
    setMenuCollapsed(!menuCollapsed)
  }

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

const filteredSubmissions = useMemo(() => {
  if (!selectedFolder) return []
  
  const folder = folders[selectedFolder]
  if (!folder) return []
  
  // Utiliser la fonction de filtrage si elle existe
  if (folder.filterFunction) {
    return folder.filterFunction(submissions)
  }
  
  // Sinon, filtrer manuellement selon le label du dossier
  if (folder.label === 'À compléter' || folder.id.includes('pending')) {
    return submissions.filter(s => s.status === 'captured')
  } else if (folder.label === 'Aller prendre mesure' || folder.id.includes('assignments')) {
    return submissions.filter(s => s.status === 'assignment')
  } else if (folder.label === 'Soumissions' || folder.id.includes('completed')) {
    return submissions.filter(s => s.status === 'completed')
  }
  
  // Pour les dossiers personnalisés, utiliser submissionIds
  if (folder.submissionIds && folder.submissionIds.length > 0) {
    return submissions.filter(s => folder.submissionIds.includes(s.id))
  }
  
  return submissions
}, [selectedFolder, folders, submissions])

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

} else if (folder.filterConfig) {
  filterFunction = (submissions) => applyFolderFilter(folder, submissions);
} else {

// 🎯 POUR LES DOSSIERS PERSONNALISÉS - GESTION MULTIPLE IDs
filterFunction = (submissions) => {
  // ✅ LOGIQUE UNIVERSELLE pour dossiers conteneurs (Projet XXXX)
  const isProjectContainer = folder.label?.match(/^Projet \d{4}$/i) || 
                           folder.id?.includes('project') ||
                           folder.id === 'projet_2025' || 
                           folder.id === 'system_project2025';
  
  if (isProjectContainer) {
    console.log(`🔍 Filtre "${folder.label}": 0 soumissions (conteneur projet)`);
    return [];
  }
  
  // ✅ SPÉCIAL : Sous-dossier "Soumissions" récupère toutes les soumissions terminées
if (folder.label === 'Soumissions' && folder.parentId) {
  const filtered = submissions.filter(s => 
    s.status === 'completed' && s.folderId === folder.id  // ✅ CORRECTION: && au lieu de ||
  );
  console.log(`🔍 Filtre "${folder.label}": ${filtered.length}/${submissions.length} soumissions (completed ET folderId)`);
  return filtered;
}
  
  // ✅ FILTRAGE STANDARD pour tous les autres dossiers
  const filtered = submissions.filter(s => s.folderId === folder.id);
  console.log(`🔍 Filtre "${folder.label}": ${filtered.length}/${submissions.length} soumissions (folderId: ${folder.id})`);
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

   useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

useEffect(() => {
  // ✅ TOUJOURS réinitialiser la sélection lors du changement de dossier
  if (selectedFolder) {
    setSelectedSubmission(null)
  }
  
  // ✅ Sélectionner automatiquement la première soumission si disponible
  if (filteredSubmissions.length > 0 && selectedFolder && !selectedSubmission) {
    setSelectedSubmission(filteredSubmissions[0])
  }
}, [filteredSubmissions, selectedFolder])

// 🔥 REMPLACEZ COMPLÈTEMENT ce useEffect par celui-ci :

useEffect(() => {
  // Auto-sélection intelligente quand le dossier ou les soumissions changent
  if (selectedFolder && folders[selectedFolder]) {
    
    if (filteredSubmissions.length > 0) {
      // Vérifier si la note actuellement sélectionnée appartient au dossier actuel
      const currentSubmissionInFolder = filteredSubmissions.find(s => s.id === selectedSubmission?.id);
      
      if (!currentSubmissionInFolder) {
        // La note actuelle n'appartient pas au nouveau dossier, sélectionner la première
        setSelectedSubmission(filteredSubmissions[0]);
        // 🔥 CORRECTION: NE PAS changer currentView, rester en mode dashboard 3 colonnes
        console.log('🎯 Auto-sélection première note du dossier:', filteredSubmissions[0].client?.adresse);
      }
      // Sinon, garder la sélection actuelle si elle appartient au dossier
      
    } else {
      // Aucune note dans ce dossier, déselectionner
      setSelectedSubmission(null);
      console.log('🎯 Aucune note disponible dans ce dossier, désélection');
    }
  }
}, [selectedFolder, filteredSubmissions, selectedSubmission, folders])

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
              <span className="font-medium">Superficie:</span> {Math.round(submission.toiture?.superficie?.totale || 0)} pi²
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
  if (!submissions || !Array.isArray(submissions)) return 0;
  
  // 🔧 CAS SPÉCIAUX : dossiers "Soumissions"
 if (folder.id === 'projet_2025_soumissions') {
    const count = submissions.filter(s => s.folderId === 'projet_2025_soumissions').length;
    console.log(`📊 Count projet_2025_soumissions: ${count}`);
    return count;
    
  } else if (folder.filter) {
    // Dossiers avec filtres normaux
    const count = folder.filter(submissions).length;
    console.log(`📊 Count ${folder.label}: ${count}`);
    return count;
    
  } else {
    // Dossiers personnalisés - compter par folderId
    const count = submissions.filter(s => s.folderId === folder.id).length;
    console.log(`📊 Count folderId ${folder.id}: ${count}`);
    return count;
  }
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
  
  // ✅ RÉINITIALISER la sélection de soumission lors du changement de dossier
  setSelectedSubmission(null)
  setActiveView('dashboard')
  
 // ✅ LOGIQUE UNIVERSELLE pour tous les projets (2025, 2024, 2026, etc.)
const isProjectFolder = folder.label?.match(/^Projet \d{4}$/i) || 
                       folder.id?.includes('project') ||
                       folder.id === 'projet_2025' || 
                       folder.id === 'system_project2025';

if (isProjectFolder) {
  console.log('🎯 Clic sur dossier Projet - Redirection vers Soumissions');
  
  // Chercher le sous-dossier "Soumissions" de ce projet
  const soumissionsFolder = Object.values(folders).find(f => 
    f.parentId === folder.id && 
    (f.label === 'Soumissions' || f.label?.toLowerCase().includes('soumission'))
  );
  
  if (soumissionsFolder) {
    console.log('🎯 Sous-dossier Soumissions trouvé:', soumissionsFolder.id);
    setSelectedFolder(soumissionsFolder.id);
  } else {
    console.log('🎯 Sous-dossier Soumissions non trouvé, sélection normale');
    setSelectedFolder(folder.id);
  }
  
  // Toujours développer le dossier projet
  setExpandedFolders(prev =>
    prev.includes(folder.id) ? prev : [...prev, folder.id]
  );
  
} else {
    // ✅ COMPORTEMENT NORMAL pour les autres dossiers
    setSelectedFolder(folder.id);
    
    // Si c'est un dossier parent, toggle l'expansion
    if (isParentFolder) {
      console.log('🎯 Toggle expansion pour parent folder');
      setExpandedFolders(prev =>
        prev.includes(folder.id)
          ? prev.filter(id => id !== folder.id)
          : [...prev, folder.id]
      );
    }
  }
  
  console.log('🎯 setSelectedFolder appelé');
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
            
           {/* Menu contextuel - EXCLU seulement pour les 2 dossiers système principaux */}
{folder.id !== 'assignments' && 
 folder.id !== 'pending' && 
 folder.id !== 'system_assignments' && 
 folder.id !== 'system_pending' && (
  <button
    onClick={handleMenuClick}
    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded"
    title="Options du dossier"
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

  const Sidebar = ({ toggleMenu }) => (
  <div className="bg-gray-50 flex flex-col h-full">
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
  onClick={() => {
    setActiveView('calendar')  // ✅ CHANGÉ: dashboard → calendar
    setSelectedFolder(null)    // ✅ CHANGÉ: Pas de dossier spécifique
    setSelectedSubmission(null) // ✅ AJOUTÉ: Reset la sélection
  }}
  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg ${
    activeView === 'calendar' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'  // ✅ CHANGÉ: dashboard → calendar
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
  if (!Array.isArray(submissions)) return []
  
  // 🔧 CAS SPÉCIAUX : Les 2 dossiers "Soumissions"
 if (selectedFolder === 'projet_2025_soumissions') {
    // Dossier "Soumissions" CUSTOM (vert foncé)  
    const filtered = submissions.filter(s => s.folderId === 'projet_2025_soumissions');
    console.log(`🔧 Soumissions (projet): ${filtered.length} soumissions`);
    return filtered;
    
  } else if (folder.filter) {
    // Dossiers avec filtres normaux
    const filtered = folder.filter(submissions)
    console.log(`🔍 ${folder.label}: ${filtered.length} soumissions filtrées FOR DISPLAY`)
    return filtered
    
  } else {
    // Fallback - filtre par folderId direct
    const filtered = submissions.filter(s => s.folderId === selectedFolder);
    console.log(`🔍 Fallback "${folder.label}": ${filtered.length} soumissions`);
    return filtered;
  }
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
{currentSubmissions.length > 0 && (
  <div className="mb-6">
    <div className="flex items-center justify-between">
      <div>
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
      
      {/* Bouton + Nouvelle soumission - seulement dans "Aller prendre mesure" */}
      {selectedFolder === 'assignments' && (
        <button
          onClick={() => setShowAssignmentModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle soumission</span>
        </button>
      )}
    </div>
  </div>
)}

// ✅ SECTION OPTIMISÉE pour l'affichage des détails dans la colonne du milieu
// Remplacer la section existante dans App.jsx (lignes ~900-950)

{currentSubmissions.length > 0 ? (
  <div className="space-y-2">
    {currentSubmissions.map((submission) => {
      const superficie = submission.toiture?.superficie?.totale || 0;
      const hasPhotos = submission.photoUrls && submission.photoUrls.length > 0;

      // ✅ NOUVELLE fonction pour formater la date correctement
      const formatDate = (createdAt) => {
        if (!createdAt) return 'N/A';
        
        try {
          // Si c'est un timestamp Firestore
          if (createdAt.seconds) {
            return new Date(createdAt.seconds * 1000).toLocaleDateString('fr-CA', {
              day: '2-digit',
              month: '2-digit', 
              year: '2-digit'
            });
          }
          // Si c'est déjà une date
          if (createdAt instanceof Date) {
            return createdAt.toLocaleDateString('fr-CA', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit' 
            });
          }
          // Si c'est une string de date
          if (typeof createdAt === 'string') {
            return new Date(createdAt).toLocaleDateString('fr-CA', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            });
          }
          return 'N/A';
        } catch (error) {
          console.warn('Erreur formatage date:', error);
          return 'N/A';
        }
      };

      return (
        <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer"
             onClick={() => {
               setSelectedSubmission(submission);
               setCurrentView('viewer');
             }}>
          
          {/* ✅ STRUCTURE OPTIMISÉE - 2 LIGNES AU LIEU DE 3 */}
          <div className="space-y-2">
            
            {/* 🔥 LIGNE 1: Adresse + Nom + Téléphone + Bouton Calculer */}
            <div className="flex items-center justify-between">
              {/* Partie gauche: Adresse */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="font-medium text-gray-900 truncate">
                  {submission.client?.adresse || submission.adresse || 'Adresse non spécifiée'}
                </div>
              </div>
              
              {/* ✅ NOUVEAU: Partie droite: Nom + Téléphone + Actions */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                {/* Nom client */}
                <div className="text-gray-700 text-sm min-w-0 max-w-32 truncate">
                  {submission.client?.nom || 'N/A'}
                </div>
                
                {/* Téléphone */}
                <div className="text-gray-600 text-sm min-w-0 max-w-28 truncate">
                  {submission.client?.telephone || 'N/A'}
                </div>
                
                {/* Bouton Calculer - seulement dans l'onglet "À compléter" */}
                {(selectedFolder === 'pending' || 
                  (selectedFolder && folders[selectedFolder] && 
                   (folders[selectedFolder].label === 'À compléter' || 
                    folders[selectedFolder].id.includes('pending')))) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalculateSubmission(submission);
                    }}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md font-medium transition-colors flex items-center"
                    title="Calculer le prix de cette soumission"
                  >
                    <Calculator className="w-3 h-3 mr-1" />
                    Calculer
                  </button>
                )}
              </div>
            </div>

            {/* 🔥 LIGNE 2: Superficie + Date + Actions */}
            <div className="flex items-center justify-between">
              {/* Superficie */}
              <div className="flex items-center space-x-2">
                <div className="font-semibold text-blue-600 text-sm">
                  {Math.round(superficie)} pi²
                </div>
              </div>
              
              {/* Actions de droite */}
              <div className="flex items-center space-x-2">
                {/* Date de création */}
                <div className="text-gray-500 text-xs">
                  {formatDate(submission.createdAt)}
                </div>
                
                {/* Indicateur photos */}
                {hasPhotos && (
                  <div className="flex items-center text-green-600">
                    <Camera className="w-4 h-4" />
                    <span className="text-xs ml-1">{submission.photoUrls.length}</span>
                  </div>
                )}
                
                {/* Bouton voir */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(submission);
                    setCurrentView('viewer');
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Voir les détails"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Menu contextuel */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSubmissionContextMenu({
                      show: true,
                      submission: submission,
                      position: { 
                        x: rect.left - 150, 
                        y: rect.bottom + 5 
                      }
                    });
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  title="Plus d'options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
) : (
  // GARDER cette partie identique - NE PAS MODIFIER
  // 🆕 CALENDRIER PERSONNALISÉ au lieu de Google Calendar
  <div className="space-y-6">
    {/* 🆕 TON NOUVEAU CALENDRIER PERSONNALISÉ */}
    <CustomCalendar />
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
      <div 
        ref={containerRef}
        className="flex h-screen bg-white overflow-hidden"
        style={{ userSelect: isResizing.current ? 'none' : 'auto' }}
      >
        {/* COLONNE 1: SIDEBAR TOUJOURS VISIBLE */}
        {!menuCollapsed && (
          <>
            <div 
              style={{ width: `${menuCollapsed ? 0 : menuWidth}%` }}
              className="bg-gray-50 border-r border-gray-200"
            >
              <Sidebar toggleMenu={toggleMenu} />
            </div>

            {/* Séparateur redimensionnable pour le menu */}
            <div
              className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors"
              onMouseDown={(e) => handleMouseDown(e, 'menu')}
            />
          </>
        )}

        {/* Bouton pour réafficher le menu quand masqué */}
        {menuCollapsed && (
          <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
            <button
              onClick={toggleMenu}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Afficher le menu"
            >
              <PanelLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* ZONE PRINCIPALE - CALENDRIER OU LAYOUT 3 COLONNES */}
        {activeView === 'calendar' ? (
          // VUE CALENDRIER EN PLEINE LARGEUR (avec sidebar à gauche)
          <div className="flex-1 bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h1 className="text-xl font-bold text-gray-900">Tableau de bord - Calendrier</h1>
            </div>
            <div className="p-6 overflow-y-auto h-[calc(100vh-73px)]">
              <CustomCalendar />
            </div>
          </div>
        ) : activeView === 'calculator' ? (
          // VUE CALCULATEUR EN PLEINE LARGEUR (avec sidebar à gauche)
          <div className="flex-1 bg-gray-50">
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
          
        ) : (
          
          // LAYOUT 3 COLONNES NORMAL (vue dashboard par défaut)
          <>
            {/* COLONNE 2: LISTE DES SOUMISSIONS */}
            <div 
              className="bg-white border-r border-gray-200 flex flex-col"
              style={{ width: `${menuCollapsed ? listWidth * 100 / (100 - menuWidth) : listWidth}%` }}
            >
              {/* Header de la liste */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedFolder && folders[selectedFolder] ? folders[selectedFolder].label : 'Soumissions'}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredSubmissions.length} élément{filteredSubmissions.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Liste des soumissions */}
             <div className="space-y-4 p-4">
  {filteredSubmissions.map(submission => {
    // ✅ NOUVELLE fonction pour corriger la date
    const formatDate = (createdAt) => {
      if (!createdAt) return 'N/A';
      try {
        if (createdAt.seconds) {
          return new Date(createdAt.seconds * 1000).toLocaleDateString('fr-CA', {
            day: '2-digit', month: '2-digit', year: '2-digit'
          });
        }
        if (createdAt instanceof Date) {
          return createdAt.toLocaleDateString('fr-CA', {
            day: '2-digit', month: '2-digit', year: '2-digit'
          });
        }
        if (typeof createdAt === 'string') {
          return new Date(createdAt).toLocaleDateString('fr-CA', {
            day: '2-digit', month: '2-digit', year: '2-digit'
          });
        }
        return 'N/A';
      } catch (error) {
        return 'N/A';
      }
    };

    return (
      <div
        key={submission.id}
        onClick={() => setSelectedSubmission(submission)}
        className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
          selectedSubmission?.id === submission.id 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        {/* ✅ STRUCTURE OPTIMISÉE - 2 lignes au lieu de 3 */}
        <div className="space-y-2">
          


{/* LIGNE 1: Adresse + Nom + Téléphone RAPPROCHÉS + Bouton Calculer */}
<div className="flex items-center">
  
  {/* GROUPE GAUCHE: Adresse + Nom + Téléphone rapprochés */}
  <div className="flex items-center space-x-3 flex-1 min-w-0">
    
    {/* Adresse */}
    <div className="font-medium text-gray-900 truncate max-w-40">
      {submission.client?.adresse || submission.displayName || 'Adresse inconnue'}
    </div>
    
    {/* Nom */}
    <div className="text-gray-700 text-sm truncate max-w-24">
      {submission.client?.nom || 'N/A'}
    </div>
    
    {/* Téléphone */}
    <div className="text-gray-600 text-sm truncate max-w-24">
      {submission.client?.telephone || 'N/A'}
    </div>
  </div>
  
  {/* GROUPE DROITE: Bouton Calculer */}
  <div className="flex items-center space-x-2 flex-shrink-0 ml-auto">
    
    {/* ✅ BOUTON CALCULER - CONDITION CORRIGÉE */}
    {(selectedFolder === 'pending' || 
      selectedFolder === 'system_pending' ||
      (selectedFolder && folders[selectedFolder] && 
       (folders[selectedFolder].label === 'À compléter' || 
        folders[selectedFolder].label?.toLowerCase().includes('compléter') ||
        folders[selectedFolder].id?.includes('pending') ||
        folders[selectedFolder].slug === 'pending'
       )
      )
    ) && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔥 BOUTON CALCULER CLIQUÉ'); // Debug
          handleCalculateSubmission(submission);
        }}
        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md font-medium transition-colors flex items-center"
        title="Calculer le prix de cette soumission"
      >
        <Calculator className="w-3 h-3 mr-1" />
        Calculer
      </button>
    )}
  </div>
</div>

          {/* LIGNE 2: Superficie + Date + Menu */}
          <div className="flex items-center justify-between">
            {/* Superficie */}
            <span className="text-xs text-blue-600 font-semibold">
              {Math.round(submission.toiture?.superficie?.totale || 0)} pi²
            </span>
            
            {/* Date + Menu */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatDate(submission.createdAt)}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setSubmissionContextMenu({
                    show: true,
                    submission: submission,
                    position: { x: rect.left - 150, y: rect.bottom + 5 }
                  });
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
            </div>

                    {/* 🔧 AJOUTER CE SÉPARATEUR ICI - ENTRE les deux colonnes */}
            <div
              className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors"
              onMouseDown={(e) => handleMouseDown(e, 'list')}
            />

            {/* Séparateur redimensionnable pour la liste */}
            <div 
  className="bg-white flex flex-col"
  style={{ width: `${menuCollapsed ? detailWidth * 100 / (100 - menuWidth) : detailWidth}%` }}
>
  {selectedSubmission ? (
    // ✅ CONDITION SPÉCIALE pour "Aller prendre mesure" 
    selectedFolder && folders[selectedFolder]?.label === 'Aller prendre mesure' ? (
      // 🎯 VUE SIMPLIFIÉE POUR ASSIGNMENTS
      <div className="h-full overflow-y-auto p-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {selectedSubmission.client?.adresse || 'Adresse non spécifiée'}
              </h1>
              <p className="text-sm text-gray-500">Informations client</p>
            </div>
          </div>
        </div>

        {/* 👤 INFORMATIONS CLIENT */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-500" />
            Informations client
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Nom :</span>
              <span className="text-sm text-gray-900 font-medium">
                {selectedSubmission.client?.nom || 'Non spécifié'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Téléphone :</span>
              <span className="text-sm text-gray-900">
                {selectedSubmission.client?.telephone || 'Non spécifié'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Email :</span>
              <span className="text-sm text-gray-900">
                {selectedSubmission.client?.courriel || 'Non spécifié'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-600">Adresse :</span>
              <span className="text-sm text-gray-900 text-right max-w-xs">
                {selectedSubmission.client?.adresse || 'Non spécifiée'}
              </span>
            </div>
          </div>
        </div>

        {/* 🗺️ LIEN GOOGLE MAPS */}
        {selectedSubmission.client?.adresse && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-500" />
              Localisation
            </h2>
            
            <button
              onClick={() => {
                const address = selectedSubmission.client.adresse;
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                window.open(googleMapsUrl, '_blank');
              }}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
              <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                Voir sur Google Maps
              </span>
            </button>
          </div>
        )}

  
{/* 📝 NOTES ÉDITABLES */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold flex items-center">
      <FileText className="w-5 h-5 mr-2 text-yellow-500" />
      Notes
    </h2>
    {!isEditingNotes && (
      <button
        onClick={() => {
          console.log('🔧 Bouton Modifier cliqué'); // DEBUG
          setIsEditingNotes(true)
          setEditedNotes(selectedSubmission.notes || '')
        }}
        className="flex items-center space-x-2 px-3 py-1 text-blue-600 hover:text-blue-800 text-sm hover:bg-blue-50 rounded transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        <span>Modifier</span>
      </button>
    )}
  </div>
  
  {isEditingNotes ? (
    <div>
      <textarea
        value={editedNotes}
        onChange={(e) => setEditedNotes(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        rows={4}
        placeholder="Ajoutez vos notes ici..."
        disabled={isSavingNotes}
      />
      
      <div className="flex space-x-3 mt-3">
        <button
          onClick={async () => {
            console.log('🔧 Sauvegarde en cours...'); // DEBUG
            setIsSavingNotes(true)
            try {
              await handleUpdateSubmissionNotes(selectedSubmission.id, { 
                notes: editedNotes.trim() 
              })
              selectedSubmission.notes = editedNotes.trim()
              setIsEditingNotes(false)
              console.log('✅ Notes sauvegardées avec succès'); // DEBUG
            } catch (error) {
              console.error('❌ Erreur sauvegarde:', error)
            } finally {
              setIsSavingNotes(false)
            }
          }}
          disabled={isSavingNotes}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium text-sm ${
            isSavingNotes 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSavingNotes ? 'Sauvegarde...' : 'Sauvegarder'}</span>
        </button>
        
        <button
          onClick={() => {
            setEditedNotes(selectedSubmission.notes || '')
            setIsEditingNotes(false)
          }}
          disabled={isSavingNotes}
          className="px-3 py-1.5 text-gray-700 hover:text-gray-900 text-sm"
        >
          Annuler
        </button>
      </div>
    </div>
  ) : (
    <div className="bg-gray-50 rounded-lg p-4">
      {selectedSubmission.notes ? (
        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
          {selectedSubmission.notes}
        </p>
      ) : (
        <p className="text-gray-500 text-sm italic">
          Aucune note disponible
        </p>
      )}
    </div>
  )}
</div>


      </div>
    ) : (
      // ✅ VUE NORMALE (SubmissionViewer) pour les autres onglets
<div className="h-full overflow-y-auto">
  <SubmissionViewer 
    submission={selectedSubmission} 
    onBack={() => setSelectedSubmission(null)}
    onUpdate={handleUpdateSubmissionNotes}
  />
</div>
    )
  ) : (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">Aucune soumission sélectionnée</h3>
        <p className="text-sm">Sélectionnez une soumission dans la liste pour voir ses détails</p>
      </div>
    </div>
  )}
</div>
          </>
        )}

        {/* Indicateur de redimensionnement */}
        {isResizing.current && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute inset-0 bg-black bg-opacity-5" />
          </div>
        )}

        {/* MENU CONTEXTUEL DOSSIERS */}
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

        {/* MENU CONTEXTUEL SOUMISSIONS */}
        {submissionContextMenu.show && (
          <SubmissionContextMenu
            submission={submissionContextMenu.submission}
            position={submissionContextMenu.position}
            onClose={() => setSubmissionContextMenu({ show: false, submission: null, position: { x: 0, y: 0 } })}
            onDelete={(submission) => {
              setDeleteModal({ 
                show: true, 
                submission: { 
                  ...submission, 
                  address: submission.client?.adresse || submission.adresse || 'Soumission'
                }
              });
              setSubmissionContextMenu({ show: false, submission: null, position: { x: 0, y: 0 } });
            }}
            onMove={(submission) => {
              setMoveModal({ show: true, submission });
              setSubmissionContextMenu({ show: false, submission: null, position: { x: 0, y: 0 } });
            }}
          />
        )}
      </div>
    )}

    {/* MODAL NOUVELLE SOUMISSION */}
    <AssignmentModal
      isOpen={showAssignmentModal}
      onClose={() => setShowAssignmentModal(false)}
      onSubmit={handleSubmitAssignment}
    />

    {/* MODAL GESTION DOSSIERS */}
    <FolderManagementModal
      isOpen={folderModal.show}
      onClose={() => {
        setFolderModal({ show: false, folder: null, parentFolder: null })
      }}
      onSave={handleSaveFolder}
      folder={folderModal.folder}
      parentFolder={folderModal.parentFolder}
    />

    {/* MODAL CONFIRMATION SUPPRESSION */}
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

    {/* MODAL DÉPLACER SOUMISSION */}
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

    {/* NOTIFICATIONS */}
    <NotificationContainer
      notifications={notifications}
      onRemove={removeNotification}
    />
  </>
)
}

export default App