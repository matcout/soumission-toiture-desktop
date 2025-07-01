import React, { useState, useEffect } from 'react'
import { Building2, FileText, Calculator, BarChart3, RefreshCw, Clock, CheckCircle2, Eye, Edit3, Wifi, WifiOff } from 'lucide-react'
import { getAllSubmissions, getSubmissionStats, updateSubmissionStatus } from './firebaseFunctions'
import { testFirebaseConnection } from './firebase'
import CalculatorView from './CalculatorView'

// Composant principal de l'application
function App() {
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalSuperficie: '0', totalPhotos: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [firebaseConnected, setFirebaseConnected] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  // Test connexion Firebase au démarrage
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔥 Test connexion Firebase...')
      const connected = testFirebaseConnection()
      setFirebaseConnected(connected)
      
      if (connected) {
        await syncSubmissions()
      } else {
        // Simulation de données si Firebase indisponible
        setTimeout(() => {
          const simulatedData = [
            {
              id: '123_rue_des_erables',
              client: { nom: 'Jean Tremblay', adresse: '123 rue des Érables', telephone: '514-555-0123' },
              toiture: { superficie: { totale: 245.5, parapets: 32.4 } },
              materiaux: { nbFeuilles: 8, nbMax: 12, nbEvents: 4, nbDrains: 2 },
              status: 'captured',
              createdAt: new Date('2025-06-29'),
              photoCount: 4
            }
          ]
          setSubmissions(simulatedData)
          setLoading(false)
        }, 1000)
      }
    }
    
    testConnection()
  }, [])

  // Fonction pour calculer automatiquement une soumission
  const handleCalculateSubmission = (submission) => {
    console.log('🧮 Calcul automatique pour:', submission.id)
    
    // Préparer les données pour le calculateur
    const prefilledData = {
      superficie: submission.toiture?.superficie?.totale || 0,
      parapets: submission.toiture?.superficie?.parapets || 0,
      nbFeuilles: submission.materiaux?.nbFeuilles || 0,
      nbMax: submission.materiaux?.nbMax || 0,
      nbEvents: submission.materiaux?.nbEvents || 0,
      nbDrains: submission.materiaux?.nbDrains || 0,
    }
    
    console.log('📊 Données pré-remplies:', prefilledData)
    
    // Sélectionner la soumission et passer au calculateur
    setSelectedSubmission({ ...submission, prefilledData })
    setActiveTab('calculator')
  }

  // Fonction pour sauvegarder le résultat d'un calcul
  const handleSaveCalculation = async (calculationData) => {
    if (selectedSubmission) {
      console.log('💾 Sauvegarde calcul pour:', selectedSubmission.id)
      
      try {
        // Mettre à jour le statut et ajouter les calculs
        const result = await updateSubmissionStatus(
          selectedSubmission.id, 
          'completed', 
          calculationData.results
        )
        
        if (result.success) {
          console.log('✅ Calcul sauvegardé dans Firebase')
          
          // Mettre à jour la liste locale
          setSubmissions(prev => prev.map(sub => 
            sub.id === selectedSubmission.id 
              ? { ...sub, status: 'completed', calculs: calculationData.results }
              : sub
          ))
          
          // Revenir au dashboard
          setSelectedSubmission(null)
          setActiveTab('dashboard')
          
          // Re-sync les stats
          await syncSubmissions()
          
          alert('✅ Calcul sauvegardé et soumission marquée comme terminée !')
        } else {
          alert('❌ Erreur lors de la sauvegarde')
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde:', error)
        alert('❌ Erreur lors de la sauvegarde')
      }
    } else {
      // Sauvegarde manuelle sans soumission liée
      console.log('💾 Sauvegarde manuelle:', calculationData)
      alert('✅ Calcul sauvegardé localement !')
    }
  }
  const syncSubmissions = async () => {
    try {
      setLoading(true)
      console.log('🔄 Synchronisation Firebase...')
      
      const [submissionsResult, statsResult] = await Promise.all([
        getAllSubmissions(),
        getSubmissionStats()
      ])
      
      if (submissionsResult.success) {
        console.log('📊 DEBUG - Données reçues:', submissionsResult.data)
        
        // DEBUG: Afficher la structure de chaque soumission
        submissionsResult.data.forEach((submission, index) => {
          console.log(`📋 Soumission ${index + 1}:`, {
            id: submission.id,
            status: submission.status,
            client: submission.client,
            superficie: submission.toiture?.superficie,
            createdAt: submission.createdAt
          })
        })
        
        setSubmissions(submissionsResult.data)
        console.log(`✅ ${submissionsResult.count} soumissions synchronisées`)
      }
      
      if (statsResult.success) {
        console.log('📈 DEBUG - Stats:', statsResult.data)
        setStats(statsResult.data)
      }
      
      setLastSync(new Date())
      setFirebaseConnected(true)
      
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      setFirebaseConnected(false)
    } finally {
      setLoading(false)
    }
  }

  // DEBUG: Log des soumissions filtrées
  const pendingSubmissions = submissions.filter(s => {
    const isPending = s.status === 'captured' || !s.status || s.status === undefined
    console.log(`🔍 Soumission ${s.id}: status="${s.status}" -> pending=${isPending}`)
    return isPending
  })
  
  const completedSubmissions = submissions.filter(s => s.status === 'completed')
  
  console.log('📊 Résumé filtrage:', {
    total: submissions.length,
    pending: pendingSubmissions.length,
    completed: completedSubmissions.length
  })

  const formatDate = (date) => {
    if (!date) return 'Date inconnue'
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('fr-CA', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const SubmissionCard = ({ submission, isPending = true }) => (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            {submission.client?.adresse || submission.displayName || 'Adresse inconnue'}
          </h3>
          {submission.client?.nom && (
            <p className="text-gray-600 text-sm">{submission.client.nom}</p>
          )}
          {/* DEBUG: Afficher le statut */}
          <p className="text-xs text-gray-400">ID: {submission.id} | Statut: {submission.status || 'undefined'}</p>
        </div>
        <div className="flex items-center space-x-2">
          {isPending ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              À compléter
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Terminé
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        <div>
          <span className="font-medium">Superficie:</span> {submission.toiture?.superficie?.totale || 0} pi²
        </div>
        <div>
          <span className="font-medium">Photos:</span> {submission.photoCount || 0}
        </div>
        <div>
          <span className="font-medium">Parapets:</span> {submission.toiture?.superficie?.parapets || 0} pi²
        </div>
        <div>
          <span className="font-medium">Créée:</span> {formatDate(submission.createdAt)}
        </div>
      </div>

      {submission.calculs && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-green-800 font-medium">Prix total:</span>
            <span className="text-green-900 font-bold">${submission.calculs.total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100">
          <Eye className="w-4 h-4 mr-1" />
          Voir
        </button>
        {isPending && (
          <button 
            onClick={() => handleCalculateSubmission(submission)}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-toiture-500 border border-transparent rounded-md hover:bg-toiture-600"
          >
            <Calculator className="w-4 h-4 mr-1" />
            Calculer
          </button>
        )}
      </div>
    </div>
  )

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">À compléter</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Superficie totale</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSuperficie} pi²</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Photos totales</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalPhotos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de connexion Firebase */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {firebaseConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700">Connecté au cloud</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700">Mode hors ligne</span>
              </>
            )}
          </div>
          {lastSync && (
            <span className="text-xs text-gray-500">
              Dernière sync: {formatDate(lastSync)}
            </span>
          )}
        </div>
      </div>

      {/* DEBUG: Affichage de toutes les soumissions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">🔍 DEBUG - Toutes les soumissions récupérées:</h3>
        <p className="text-xs text-yellow-700">Total: {submissions.length} | Pending: {pendingSubmissions.length} | Completed: {completedSubmissions.length}</p>
      </div>

      {/* Soumissions à compléter */}
      {pendingSubmissions.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Soumissions à compléter ({pendingSubmissions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} isPending={true} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune soumission en attente</h3>
          <p className="text-gray-600">Toutes vos soumissions sont traitées !</p>
        </div>
      )}

      {/* Soumissions terminées */}
      {completedSubmissions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Soumissions terminées ({completedSubmissions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSubmissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} isPending={false} />
            ))}
          </div>
        </div>
      )}

      {/* Affichage de TOUTES les soumissions si aucune n'est catégorisée */}
      {submissions.length > 0 && pendingSubmissions.length === 0 && completedSubmissions.length === 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Toutes les soumissions ({submissions.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} isPending={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-toiture-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {firebaseConnected ? 'Synchronisation avec le cloud...' : 'Chargement des données...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-toiture-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Soumission Toiture Desktop</h1>
                <p className="text-sm text-gray-600">Gestionnaire de soumissions de toiture</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={syncSubmissions}
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-toiture-700 bg-toiture-50 border border-toiture-200 rounded-md hover:bg-toiture-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Synchroniser
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'calculator', label: 'Calculateur', icon: Calculator },
              { id: 'reports', label: 'Rapports', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-toiture-500 text-toiture-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'calculator' && (
          <CalculatorView 
            prefilledData={selectedSubmission?.prefilledData}
            onSaveCalculation={handleSaveCalculation}
          />
        )}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg border p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Rapports et statistiques</h3>
            <p className="text-gray-600">Génération de rapports - En développement</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App