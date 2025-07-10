// App.jsx - Version corrigée et fonctionnelle
import React, { useState, useEffect } from 'react'
import { Building2, Calculator, Home, Plus, Folder, Clock, CheckCircle2, FileText, RefreshCw, ChevronRight, Trash2, Eye, MoreVertical, FolderPlus } from 'lucide-react'
import { subscribeToSubmissions, createAssignment, updateSubmissionStatus, deleteSubmissionFromFirebase } from './firebaseFunctions'
import { testFirebaseConnection } from './firebase'
import { initializeCentralizedFolders, getAllCentralizedFolders, applyFolderFilter } from './centralizedFolderSystem'
import { subscribeToFolders, convertIconMobileToDesktop, saveFolderToFirebase, updateFolderInFirebase, deleteFolderFromFirebase } from './folderSyncFunctions'
import CalculatorView from './CalculatorView'
import AssignmentModal from './AssignmentModal'
import FolderManagementModal from './FolderManagementModal'
import { useNotifications, NotificationContainer } from './NotificationSystem'

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
  const [expandedFolders, setExpandedFolders] = useState([])
  const [showFolderMenu, setShowFolderMenu] = useState(null)
  
  const { notifications, removeNotification, showSuccess, showError } = useNotifications()

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
          // Initialiser les dossiers centralisés
          const folderResult = await initializeCentralizedFolders('desktop')
          console.log('📁 Dossiers initialisés:', folderResult)
          
          // S'abonner aux changements de dossiers
          unsubscribeFolders = subscribeToFolders((result) => {
            if (result.success) {
              const foldersMap = {}
              result.data.forEach(folder => {
                // Convertir l'icône mobile vers desktop
                const desktopIcon = convertIconMobileToDesktop(folder.icon)
                foldersMap[folder.id] = {
                  ...folder,
                  icon: desktopIcon,
                  filter: folder.filterConfig 
                    ? (submissions) => applyFolderFilter(folder, submissions)
                    : (submissions) => []
                }
              })
              setFolders(foldersMap)
              console.log(`✅ ${result.data.length} dossiers synchronisés`)
            }
          })
          
          // S'abonner aux soumissions
          unsubscribeSubmissions = subscribeToSubmissions((result) => {
            if (result.success) {
              setSubmissions(result.data)
              console.log(`✅ ${result.count} soumissions chargées`)
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
  }, [])

  // Gérer la création/modification de dossier
  const handleSaveFolder = async (folderData) => {
    try {
      setLoading(true)
      
      if (folderData.id) {
        // Modification
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
        // Création
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
  }

  // Supprimer un dossier
  const handleDeleteFolder = async (folderId, folderLabel) => {
    // Protéger seulement les 3 dossiers essentiels
    if (folderId === 'system_assignments' || 
        folderId === 'system_pending' || 
        folderId === 'system_completed') {
      showError('Dossier protégé', 'Ce dossier système ne peut pas être supprimé')
      return
    }
    
    if (window.confirm(`Supprimer le dossier "${folderLabel}" ?`)) {
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

  // Gérer le calcul
  const handleCalculateSubmission = (submission) => {
    const prefilledData = {
      superficie: submission.toiture?.superficie?.totale || 0,
      parapets: submission.toiture?.superficie?.parapets || 0,
      nbMax: submission.materiaux?.nbMax || 0,
      nbEvents: submission.materiaux?.nbEvents || 0,
      nbDrains: submission.materiaux?.nbDrains || 0,
    }
    
    setSelectedSubmission({ ...submission, prefilledData })
    setActiveView('calculator')
  }

  // Sauvegarder le calcul
  const handleSaveCalculation = async (calculationData) => {
    if (selectedSubmission) {
      try {
        const result = await updateSubmissionStatus(
          selectedSubmission.id, 
          'completed', 
          { calculs: calculationData.results }
        )
        
        if (result.success) {
          showSuccess('Calcul terminé !', 'Déplacé vers Soumissions Terminées')
          setActiveView('dashboard')
          setSelectedFolder('system_completed')
          setSelectedSubmission(null)
        } else {
          showError('Erreur sauvegarde', result.error)
        }
      } catch (error) {
        showError('Erreur', error.message)
      }
    }
  }

  // Supprimer une soumission
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

        <div className="flex space-x-2">
          <button className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100">
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

  // Fonctions helper
  const getFolderCount = (folder) => {
    return folder.filter ? folder.filter(submissions).length : 0
  }

  const renderFolder = (folder, level = 0) => {
    const Icon = ICON_COMPONENTS[folder.icon] || Folder
    const count = getFolderCount(folder)
    const isSelected = selectedFolder === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expandedFolders.includes(folder.id)
    
    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center justify-between py-2.5 px-3 text-sm rounded-lg ${
            isSelected
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <button
            onClick={() => {
              setSelectedFolder(folder.id)
              setActiveView('dashboard')
            }}
            className="flex-1 flex items-center text-left"
          >
            <Icon className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: folder.color }} />
            <span className="truncate">{folder.label}</span>
          </button>
          
          <div className="flex items-center space-x-1">
            {count > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                {count}
              </span>
            )}
            
            {/* Menu contextuel pour tous les dossiers sauf les 3 essentiels */}
            {folder.id !== 'system_assignments' && 
             folder.id !== 'system_pending' && 
             folder.id !== 'system_completed' && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFolderMenu(showFolderMenu === folder.id ? null : folder.id)
                  }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                
                {showFolderMenu === folder.id && (
                  <>
                    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-20 py-1 w-48">
                      {level === 0 && (
                        <button
                          onClick={() => {
                            setFolderModal({ show: true, folder: null, parentFolder: folder })
                            setShowFolderMenu(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter sous-dossier
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setFolderModal({ show: true, folder: folder, parentFolder: null })
                          setShowFolderMenu(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteFolder(folder.id, folder.label)
                          setShowFolderMenu(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </button>
                    </div>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFolderMenu(null)} />
                  </>
                )}
              </div>
            )}
            
            {/* Chevron pour dossiers avec enfants */}
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
        
        {/* Rendu des sous-dossiers */}
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map(childFolder => renderFolder(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Organiser les dossiers en hiérarchie
  const organizedFolders = () => {
    const rootFolders = []
    const folderMap = {}
    
    // Créer une map de tous les dossiers
    Object.values(folders).forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] }
    })
    
    // Organiser en hiérarchie
    Object.values(folderMap).forEach(folder => {
      if (folder.parentId && folderMap[folder.parentId]) {
        folderMap[folder.parentId].children.push(folder)
      } else if (!folder.parentId) {
        rootFolders.push(folder)
      }
    })
    
    // Trier par ordre
    rootFolders.sort((a, b) => a.order - b.order)
    Object.values(folderMap).forEach(folder => {
      if (folder.children) {
        folder.children.sort((a, b) => a.order - b.order)
      }
    })
    
    return rootFolders
  }

  // Sidebar
  const Sidebar = () => (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Soumission Toiture</h1>
            <p className="text-xs text-gray-500">Desktop v2</p>
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

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase">Dossiers</h3>
          <button
            onClick={() => setFolderModal({ show: true, folder: null, parentFolder: null })}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Créer un dossier"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1">
          {organizedFolders().map(folder => renderFolder(folder, 0))}
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

  // Contenu principal
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

    if (activeView === 'calculator') {
      return (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                Retour aux dossiers
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Calculateur FastNstick 2025</h1>
            </div>
            <CalculatorView 
              prefilledData={selectedSubmission?.prefilledData}
              onSaveCalculation={handleSaveCalculation}
            />
          </div>
        </div>
      )
    }

    // Dashboard
    const currentFolder = folders[selectedFolder]
    const currentSubmissions = currentFolder?.filter 
      ? currentFolder.filter(submissions)
      : []

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
                  Créer un assignment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <MainContent />

      {/* Modals */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSubmit={handleSubmitAssignment}
      />

      <FolderManagementModal
        isOpen={folderModal.show}
        onClose={() => setFolderModal({ show: false, folder: null, parentFolder: null })}
        onSave={handleSaveFolder}
        folder={folderModal.folder}
        parentFolder={folderModal.parentFolder}
      />

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Supprimer "{deleteModal.submission?.address}" ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, submission: null })}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteSubmission}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

export default App