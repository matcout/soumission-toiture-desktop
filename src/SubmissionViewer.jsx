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
  Calendar
} from 'lucide-react'

const SubmissionViewer = ({ submission, onBack, onUpdate }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const [expandedSections, setExpandedSections] = useState(['client', 'dimensions', 'parapets', 'materiaux', 'options', 'notes', 'photos'])

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
              <h1 className="text-2xl font-bold">
                {submission.client?.adresse || submission.displayName || 'Soumission'}
              </h1>
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
                <div>
                  <label className="text-sm font-medium text-gray-600">Adresse</label>
                  <p className="text-gray-900 mt-1">{submission.client?.adresse || 'Non spécifiée'}</p>
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

        {/* Section Notes supplémentaires */}
        {submission.notes && (
          <div>
            <SectionHeader icon={FileText} title="Notes supplémentaires" section="notes" />
            {expandedSections.includes('notes') && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-2">
                <p className="text-gray-700 whitespace-pre-wrap">{submission.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Section Photos du projet - Style Evernote */}
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

              {/* Liste des photos style Evernote - TAILLE AJUSTÉE */}
              {submission.photos && submission.photos.length > 0 ? (
                <>
                  <div className="px-4 pb-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {submission.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedPhotoIndex(index)}
                      >
                        <div className="aspect-square">
                          <img
                            src={photo.uri || photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Numéro de photo */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded-full">
                          <span className="text-white text-xs font-semibold">{index + 1}</span>
                        </div>

                        {/* Bouton télécharger */}
                        <a
                          href={photo.uri || photo}
                          download={`photo_${index + 1}.jpg`}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 right-2 bg-white bg-opacity-90 p-1.5 rounded-full hover:bg-opacity-100 transition-all"
                        >
                          <Download className="w-3 h-3 text-gray-700" />
                        </a>
                      </div>
                    ))}
                  </div>

                  {/* Compteur de photos */}
                  <div className="text-center py-4 border-t border-gray-200">
                    <p className="text-gray-600 italic">
                      {submission.photos.length} photo{submission.photos.length > 1 ? 's' : ''} ajoutée{submission.photos.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-12 px-4">
                  <Camera className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-500">Aucune photo ajoutée</p>
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