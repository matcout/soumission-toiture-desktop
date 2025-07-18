import React, { useState } from 'react'
import { 
  ArrowLeft, 
  Camera, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ZoomIn,
  User,
  MapPin,
  Phone,
  Mail,
  Ruler,
  Home,
  FileText,
  Settings,
  Calendar,
  ExternalLink,
  Edit3,
  Save,
  XCircle
} from 'lucide-react'

const SubmissionViewer = ({ submission, onBack, onUpdate }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const [expandedSections, setExpandedSections] = useState(['client', 'dimensions', 'parapets', 'materiaux', 'options', 'notes', 'photos'])
  const [isEditingNotes, setIsEditingNotes] = useState(false)
const [editedNotes, setEditedNotes] = useState(submission.notes || '')
const [isSaving, setIsSaving] = useState(false)

  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

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

  // ✅ NOUVEAU: Fonction pour ouvrir Google Maps
  const openGoogleMaps = (address) => {
    if (!address || !address.trim()) {
      alert('Aucune adresse disponible')
      return
    }
    
    // Encoder l'adresse pour l'URL
    const encodedAddress = encodeURIComponent(address.trim())
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    
    // Ouvrir dans le navigateur par défaut
    if (window.electron && window.electron.openExternal) {
      // Si on est dans Electron, utiliser la méthode Electron
      window.electron.openExternal(mapsUrl)
    } else {
      // Sinon, utiliser window.open (pour le développement web)
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

  // Section Header Component
  const SectionHeader = ({ icon: Icon, title, section }) => (
    <div
      className="bg-blue-500 p-4 flex items-center justify-between rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-white" />
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <svg
        className={`w-5 h-5 text-white transform transition-transform ${
          expandedSections.includes(section) ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
            <div>
              {/* ✅ MODIFIÉ: Adresse cliquable dans le header */}
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold">
                  {submission.client?.adresse || submission.displayName || 'Soumission'}
                </h1>
                {submission.client?.adresse && (
                  <button
                    onClick={() => openGoogleMaps(submission.client.adresse)}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                    title="Ouvrir dans Google Maps"
                  >
                    <MapPin className="w-4 h-4" />
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {formatDate(submission.createdAt || submission.date)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        
        {/* Section Informations client */}
        <div>
          <SectionHeader icon={User} title="Informations client" section="client" />
          {expandedSections.includes('client') && (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom du client</label>
                  <p className="text-gray-900 mt-1">{submission.client?.nom || 'Non spécifié'}</p>
                </div>
                {/* ✅ MODIFIÉ: Adresse cliquable dans la section client */}
                <div>
                  <label className="text-sm font-medium text-gray-600">Adresse</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-gray-900 flex-1">{submission.client?.adresse || 'Non spécifiée'}</p>
                    {submission.client?.adresse && (
                      <button
                        onClick={() => openGoogleMaps(submission.client.adresse)}
                        className="flex items-center space-x-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors text-sm"
                        title="Voir sur Google Maps"
                      >
                        <MapPin className="w-3 h-3" />
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-xs">Maps</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-gray-900 mt-1">{submission.client?.telephone || 'Non spécifié'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Courriel</label>
                  <p className="text-gray-900 mt-1">{submission.client?.courriel || 'Non spécifié'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Dimensions de la toiture */}
        <div>
          <SectionHeader icon={Ruler} title="Dimensions de la toiture" section="dimensions" />
          {expandedSections.includes('dimensions') && (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
              {/* Sections de toiture */}
              {submission.toiture?.dimensions && submission.toiture.dimensions.length > 0 && (
                <div className="mb-6">
                  <div className="space-y-2">
                    {submission.toiture.dimensions.map((section, index) => (
                      <div key={index} className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>{section.name || `Section ${index + 1}`}</span>
                        <span className="font-medium">
                          {section.length} × {section.width} pi = {(section.length * section.width).toFixed(2)} pi²
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Superficie totale */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Superficie totale:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {submission.toiture?.superficie?.totale?.toFixed(2) || '0.00'} pi²
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Dimensions des parapets */}
        <div>
          <SectionHeader icon={Ruler} title="Dimensions des parapets" section="parapets" />
          {expandedSections.includes('parapets') && (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
              {submission.toiture?.parapets && submission.toiture.parapets.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {submission.toiture.parapets.map((parapet, index) => (
                      <div key={index} className="flex justify-between p-3 bg-gray-50 rounded">
                        <span>{parapet.name || `Parapet ${index + 1}`}</span>
                        <span className="font-medium">
                          {parapet.length} pi × {parapet.width} po = {(parapet.length * (parapet.width / 12)).toFixed(2)} pi²
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Superficie des parapets:</span>
                      <span className="font-bold text-orange-600">
                        {submission.toiture?.superficie?.parapets?.toFixed(2) || '0.00'} pi²
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun parapet</p>
              )}
            </div>
          )}
        </div>

        {/* Section Matériaux et accessoires */}
        {submission.materiaux && (
          <div>
            <SectionHeader icon={Settings} title="Matériaux et accessoires" section="materiaux" />
            {expandedSections.includes('materiaux') && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Feuilles de tôles</span>
                    <p className="font-semibold text-lg">{submission.materiaux.nbFeuilles || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Maximum</span>
                    <p className="font-semibold text-lg">{submission.materiaux.nbMax || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Évents</span>
                    <p className="font-semibold text-lg">{submission.materiaux.nbEvents || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Drains</span>
                    <p className="font-semibold text-lg">{submission.materiaux.nbDrains || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Trépied électrique</span>
                    <p className="font-semibold text-lg">{submission.materiaux.trepiedElectrique || 0}</p>
                  </div>
                </div>

                {/* Puits de lumière */}
                {submission.toiture?.puitsLumiere && submission.toiture.puitsLumiere.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-700 mb-3">Puits de lumière</h4>
                    <div className="space-y-2">
                      {submission.toiture.puitsLumiere.map((puit, index) => (
                        <div key={index} className="flex justify-between p-3 bg-yellow-50 rounded">
                          <span>{puit.name || `Puit ${index + 1}`}</span>
                          <span className="font-medium">{puit.length}" × {puit.width}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section Options */}
        {submission.options && (
          <div>
            <SectionHeader icon={Settings} title="Autres options" section="options" />
            {expandedSections.includes('options') && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={submission.options.plusieursEpaisseurs || false}
                      disabled
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Plusieurs épaisseurs de toiture</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={submission.options.hydroQuebec || false}
                      disabled
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Travaux Hydro Québec requis</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={submission.options.grue || false}
                      disabled
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Grue nécessaire</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={submission.options.trackfall || false}
                      disabled
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Trackfall et chute</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Section Notes supplémentaires - ÉDITABLE */}
<div>
  <SectionHeader icon={FileText} title="Notes supplémentaires" section="notes" />
  {expandedSections.includes('notes') && (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
      {isEditingNotes ? (
        // Mode édition
        <div className="space-y-4">
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={6}
            placeholder="Ajoutez vos notes ici... Informations supplémentaires, observations, instructions spéciales, etc."
            disabled={isSaving}
          />
          
          {/* Boutons d'action en mode édition */}
          <div className="flex space-x-3">
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            💡 Ces notes seront synchronisées avec l'application mobile
          </p>
        </div>
      ) : (
        // Mode lecture avec bouton éditer
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {submission.notes && submission.notes.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap">{submission.notes}</p>
              ) : (
                <p className="text-gray-400 italic">Aucune note ajoutée. Cliquez sur "Modifier" pour ajouter des notes.</p>
              )}
            </div>
            
            <button
              onClick={handleStartEdit}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors ml-4"
            >
              <Edit3 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          </div>
          
          {submission.notes && submission.notes.trim() && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Dernière modification: {new Date().toLocaleDateString('fr-CA')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>

     {/* Section Photos du projet - PHOTOS TRÈS GRANDES */}
          <div>
            <SectionHeader icon={Camera} title="Photos du projet" section="photos" />
            {expandedSections.includes('photos') && (
              <div className="bg-gray-100 rounded-lg mt-2 p-0">
                {/* Bouton Ajouter des photos (désactivé pour desktop) */}
                <div className="p-4">
                  <button 
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Camera className="w-5 h-5" />
                    <span className="font-medium">Ajouter des photos (mobile uniquement)</span>
                  </button>
                </div>

                {/* Liste des photos - TRÈS GRANDES */}
                {submission.photos && submission.photos.length > 0 ? (
                  <>
                    <div className="px-4 pb-4 space-y-6">
                      {submission.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group max-w-2xl mx-auto"
                          onClick={() => setSelectedPhotoIndex(index)}
                        >
                          {/* Container photo avec ratio 16:10 (large) */}
                          <div className="aspect-[16/10] relative">
<img
  src={photo.uri || photo}
  alt={`Photo ${index + 1}`}
  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 high-quality-image"
  loading="lazy"
/>
                            
                            {/* Overlay et contrôles */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="absolute top-4 left-4 bg-blue-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-lg">
                              Photo {index + 1}
                            </div>

                            <a
                              href={photo.uri || photo}
                              download={`photo_${index + 1}.jpg`}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                            >
                              <Download className="w-5 h-5 text-gray-700" />
                            </a>
                            
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-5 h-5" />
                            </div>
                          </div>
                          
                          {/* Info photo */}
                          <div className="p-4 bg-white">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-medium text-gray-700">
                                Photo {index + 1} sur {submission.photos.length}
                              </span>
                              <span className="text-sm text-gray-500">
                                Cliquer pour agrandir en plein écran
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Compteur de photos */}
                    <div className="px-4 pb-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Camera className="w-5 h-5 text-blue-500" />
                            <span className="font-medium text-gray-700">
                              {submission.photos.length} photo{submission.photos.length > 1 ? 's' : ''} ajoutée{submission.photos.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Cliquez sur une photo pour l'agrandir
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-12 px-4">
                    <Camera className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Aucune photo ajoutée</p>
                    <p className="text-gray-400 text-sm mt-2">Les photos sont capturées sur l'application mobile</p>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhotoIndex !== null && submission.photos && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Photo counter */}
            <div className="absolute top-4 left-4 text-white text-lg font-medium">
              {selectedPhotoIndex + 1} / {submission.photos.length}
            </div>

            {/* Navigation buttons */}
            <button
              onClick={() => navigatePhoto('prev')}
              className="absolute left-4 text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={() => navigatePhoto('next')}
              className="absolute right-4 text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Main image */}
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