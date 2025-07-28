import React, { useState } from 'react'
import { 
  ArrowLeft, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Edit3,
  Save,
  XCircle
} from 'lucide-react'

const SubmissionViewer = ({ submission, onBack, onUpdate }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState(submission.notes || '')
  const [isSaving, setIsSaving] = useState(false)

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Date inconnue'
    const d = new Date(date)
    return d.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Navigate photos
  const navigatePhoto = (direction) => {
    if (!submission.photos || submission.photos.length === 0) return
    
    if (direction === 'prev') {
      setSelectedPhotoIndex(prev => 
        prev > 0 ? prev - 1 : submission.photos.length - 1
      )
    } else {
      setSelectedPhotoIndex(prev => 
        prev < submission.photos.length - 1 ? prev + 1 : 0
      )
    }
  }

  // Ouvrir Google Maps
  const openGoogleMaps = (address) => {
    if (!address || !address.trim()) {
      alert('Aucune adresse disponible')
      return
    }
    
    const encodedAddress = encodeURIComponent(address.trim())
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    
    if (window.electron && window.electron.openExternal) {
      window.electron.openExternal(mapsUrl)
    } else {
      window.open(mapsUrl, '_blank')
    }
  }

  const handleSaveNotes = async () => {
    if (!onUpdate) {
      alert('Fonction de mise à jour non disponible')
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(submission.id, { notes: editedNotes.trim() })
      submission.notes = editedNotes.trim()
      setIsEditingNotes(false)
      console.log('✅ Notes sauvegardées')
    } catch (error) {
      console.error('❌ Erreur sauvegarde notes:', error)
      alert('Erreur lors de la sauvegarde des notes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedNotes(submission.notes || '')
    setIsEditingNotes(false)
  }

  const handleStartEdit = () => {
    setEditedNotes(submission.notes || '')
    setIsEditingNotes(true)
  }

  // Calculer superficie totale
  const getSuperficieTotale = () => {
    return Math.round(submission.toiture?.superficie?.totale || 0)
  }

  // Calculer les quantités de matériaux nécessaires
  const calculateMaterialQuantities = () => {
    const superficie = submission.toiture?.superficie?.toiture || 0
    const parapets = submission.toiture?.superficie?.parapets || 0
    const superficieTotale = superficie + parapets
    
    return {
      fastNStick: Math.ceil((superficie / 140) * 1.1),
      armourCool: Math.ceil(((superficie + parapets) / 78) * 1.1),
      securePan: Math.ceil((superficie / 32) * 1.1),
      armourBond: Math.ceil((parapets / 98) * 1.15),
      tp180ff: Math.ceil(superficieTotale / 1500) // 1 rouleau par 1500 pi²
    }
  }

  const materialQuantities = calculateMaterialQuantities()
  
  // Vérifier si des puits de lumière ont été entrés
  const hasPuitsLumiere = submission.toiture?.puitsLumiere && 
    submission.toiture.puitsLumiere.length > 0 && 
    submission.toiture.puitsLumiere.some(puit => puit.length > 0 || puit.width > 0)

  return (
    <div className="min-h-screen bg-white p-6 lg:p-8">
      {/* Header simple */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span>📄 Imprimer</span>
          </button>
        </div>
        
        <span className="text-sm text-gray-500">
          {formatDate(submission.createdAt || submission.date)}
        </span>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto">
        {/* Adresse en titre principal */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {submission.client?.adresse || submission.displayName || 'Adresse inconnue'}
          </h1>
          {submission.client?.adresse && (
            <button
              onClick={() => openGoogleMaps(submission.client.adresse)}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <span>Voir sur Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grille d'informations essentielles - PLUS COMPACTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          {/* Informations client */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Client</h2>
            <div className="space-y-1 text-gray-700">
              <p className="text-sm"><strong>Nom:</strong> {submission.client?.nom || 'Non spécifié'}</p>
              <p className="text-sm"><strong>Téléphone:</strong> {submission.client?.telephone || 'Non spécifié'}</p>
              <p className="text-sm"><strong>Courriel:</strong> {submission.client?.courriel || 'Non spécifié'}</p>
            </div>
          </div>

          {/* Superficie */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Superficie</h2>
            <div className="space-y-1 text-gray-700">
              <p className="text-2xl font-bold text-blue-600">
                {getSuperficieTotale().toFixed(2)} pi²
              </p>
              {submission.toiture?.superficie && (
                <>
                  <p className="text-sm">Toiture: {Math.round(submission.toiture.superficie.toiture || 0)} pi²</p>
                  <p className="text-sm">Parapets: {Math.round(submission.toiture.superficie.parapets || 0)} pi²</p>
                </>
              )}
              {/* Afficher puits de lumière SEULEMENT si des valeurs sont entrées */}
              {hasPuitsLumiere && (
                <>
                  <div className="mt-4 font-medium">Puits de lumière:</div>
                  {submission.toiture.puitsLumiere.map((puit, index) => (
                    <div key={index} className="flex justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">{puit.name || `Puit ${index + 1}`}</span>
                      <span className="font-medium text-sm">
                        {puit.length}" × {puit.width}"
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <hr className="my-8 border-gray-300" />

        {/* Matériaux et quantités - PLUS COMPACT */}
        {submission.materiaux && (submission.materiaux.nbFeuilles > 0 || 
          submission.materiaux.nbMax > 0 || 
          submission.materiaux.nbEvents > 0 || 
          submission.materiaux.nbDrains > 0 || 
          submission.materiaux.trepiedElectrique > 0 || 
          submission.options?.plusieursEpaisseurs) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Matériaux</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {submission.materiaux.nbFeuilles > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xl font-bold">{submission.materiaux.nbFeuilles}</p>
                  <p className="text-xs text-gray-600">Feuilles</p>
                </div>
              )}
              {submission.materiaux.nbMax > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xl font-bold">{submission.materiaux.nbMax}</p>
                  <p className="text-xs text-gray-600">Maximum</p>
                </div>
              )}
              {submission.materiaux.nbEvents > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xl font-bold">{submission.materiaux.nbEvents}</p>
                  <p className="text-xs text-gray-600">Évents</p>
                </div>
              )}
              {submission.materiaux.nbDrains > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xl font-bold">{submission.materiaux.nbDrains}</p>
                  <p className="text-xs text-gray-600">Drains</p>
                </div>
              )}
              {submission.materiaux.trepiedElectrique > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-xl font-bold">{submission.materiaux.trepiedElectrique}</p>
                  <p className="text-xs text-gray-600">Trépied</p>
                </div>
              )}
              {submission.options?.plusieursEpaisseurs && (
                <div className="bg-purple-100 p-2 rounded border border-purple-300">
                  <p className="text-xs font-medium text-purple-700">PLUSIEURS</p>
                  <p className="text-sm font-bold text-purple-700">Épaisseurs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quantités calculées automatiquement - VERSION COMPACTE */}
        {(submission.toiture?.superficie?.toiture > 0 || submission.toiture?.superficie?.parapets > 0) ? (
          <div className="mb-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
            <h2 className="text-lg font-semibold mb-2 text-yellow-900">
              📦 Matériaux à charger
            </h2>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-yellow-700">
                Quantités estimées • {new Date().toLocaleDateString('fr-CA')}
              </p>
              <p className="text-sm font-bold text-yellow-900">
                Total: {materialQuantities.fastNStick + materialQuantities.armourCool + materialQuantities.securePan + materialQuantities.armourBond + materialQuantities.tp180ff} items
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="text-center p-3 bg-white rounded border border-yellow-300">
                <p className="text-2xl font-bold text-yellow-700">{materialQuantities.fastNStick}</p>
                <p className="text-xs font-medium">180 Fast-N-Stick</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-yellow-300">
                <p className="text-2xl font-bold text-yellow-700">{materialQuantities.armourCool}</p>
                <p className="text-xs font-medium">ArmourCool</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-yellow-300">
                <p className="text-2xl font-bold text-yellow-700">{materialQuantities.securePan}</p>
                <p className="text-xs font-medium">SecurePan</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-yellow-300">
                <p className="text-2xl font-bold text-yellow-700">{materialQuantities.armourBond}</p>
                <p className="text-xs font-medium">ArmourBond</p>
              </div>
              <div className="text-center p-3 bg-white rounded border border-yellow-300">
                <p className="text-2xl font-bold text-yellow-700">{materialQuantities.tp180ff}</p>
                <p className="text-xs font-medium">TP-180-FF</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              📐 {Math.round(submission.toiture.superficie.toiture || 0)} pi² toiture + {Math.round(submission.toiture.superficie.parapets || 0)} pi² parapets
            </p>
            
            {/* Indicateurs importants uniquement si applicable */}
            {(submission.options?.grue || submission.options?.hydroQuebec) && (
              <div className="flex gap-2 mt-3 justify-center">
                {submission.options?.grue && (
                  <div className="bg-orange-100 px-3 py-2 rounded border border-orange-300 inline-block">
                    <p className="text-xs font-bold text-orange-700">⚠️ GRUE NÉCESSAIRE</p>
                  </div>
                )}
                {submission.options?.hydroQuebec && (
                  <div className="bg-red-100 px-3 py-2 rounded border border-red-300 inline-block">
                    <p className="text-xs font-bold text-red-700">⚠️ HYDRO-QUÉBEC</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              📦 Matériaux à charger
            </h2>
            <p className="text-sm text-gray-600 text-center">
              ⚠️ Aucune superficie renseignée
            </p>
          </div>
        )}

        {/* Dimensions détaillées du projet - PLUS COMPACT */}
        {submission.toiture?.dimensions && submission.toiture.dimensions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Dimensions détaillées</h2>
            <div className="space-y-1">
              {submission.toiture.dimensions.map((section, index) => (
                <div key={index} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                  <span>{section.name || `Section ${index + 1}`}</span>
                  <span className="font-medium">
                    {section.length} × {section.width} pi = {(section.length * section.width).toFixed(2)} pi²
                  </span>
                </div>
              ))}
              {submission.toiture?.parapets && submission.toiture.parapets.length > 0 && (
                <>
                  <div className="mt-3 font-medium text-sm">Parapets:</div>
                  {submission.toiture.parapets.map((parapet, index) => (
                    <div key={index} className="flex justify-between p-2 bg-orange-50 rounded text-sm">
                      <span>{parapet.name || `Parapet ${index + 1}`}</span>
                      <span className="font-medium">
                        {parapet.length} pi × {parapet.width} po
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Options cochées - PLUS COMPACT - Seulement si au moins une option est cochée */}
        {submission.options && (submission.options.plusieursEpaisseurs || 
          submission.options.hydroQuebec || 
          submission.options.grue || 
          submission.options.trackfall) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Options</h2>
            <div className="space-y-1">
              {submission.options.plusieursEpaisseurs && (
                <p className="text-gray-700 text-sm">✓ Plusieurs épaisseurs de toiture</p>
              )}
              {submission.options.hydroQuebec && (
                <p className="text-gray-700 text-sm">✓ Travaux Hydro Québec requis</p>
              )}
              {submission.options.grue && (
                <p className="text-gray-700 text-sm">✓ Grue nécessaire</p>
              )}
              {submission.options.trackfall && (
                <p className="text-gray-700 text-sm">✓ Trackfall et chute</p>
              )}
            </div>
          </div>
        )}

        {/* Notes avec édition - PLUS COMPACT */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Notes</h2>
            {!isEditingNotes && (
              <button
                onClick={handleStartEdit}
                className="flex items-center space-x-2 px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
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
                disabled={isSaving}
              />
              
              <div className="flex space-x-3 mt-3">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium text-sm ${
                    isSaving 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
                
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-gray-700 hover:text-gray-900 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {submission.notes || 'Aucune note'}
              </p>
            </div>
          )}
        </div>

        {/* Photos - Section principale COMPACTE */}
        {submission.photos && submission.photos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Photos ({submission.photos.length})
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {submission.photos.map((photo, index) => (
                <div
                  key={index}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <img
                    src={photo.uri || photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg shadow-sm"
                    loading="lazy"
                  />
                  <p className="text-center text-xs text-gray-600 mt-1">
                    Photo {index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Viewer plein écran */}
      {selectedPhotoIndex !== null && submission.photos && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-4 text-white text-lg font-medium">
              {selectedPhotoIndex + 1} / {submission.photos.length}
            </div>

            <button
              onClick={() => navigatePhoto('prev')}
              className="absolute left-4 text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={() => navigatePhoto('next')}
              className="absolute right-4 text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <img
              src={submission.photos[selectedPhotoIndex].uri || submission.photos[selectedPhotoIndex]}
              alt={`Photo ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmissionViewer