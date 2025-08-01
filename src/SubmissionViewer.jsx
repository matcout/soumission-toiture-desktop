import React, { useState, useEffect } from 'react'
import { ArrowLeft, Edit3, Save, X, ChevronLeft, ChevronRight, MapPin, ExternalLink } from 'lucide-react'

const SubmissionViewer = ({ submission, onBack, onUpdate }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState(submission.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  
  // État pour les sections multiples
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

  // Obtenir les données pour l'affichage
  const getDisplayData = () => {
    // Si sections multiples et on affiche une section spécifique
    if (submission.hasMultipleSections && submission.sections && currentSectionIndex >= 0 && submission.sections[currentSectionIndex]) {
      const section = submission.sections[currentSectionIndex];
      return {
        dimensions: section.dimensions || [],
        parapets: section.parapets || [],
        puitsLumiere: section.puitsLumiere || [],
        photos: section.photos || [],
        superficie: typeof section.superficie === 'object' ? section.superficie : { totale: section.superficie || 0, toiture: 0, parapets: 0 },
        nbFeuilles: section.nbFeuilles || 0,
        nbDrains: section.nbDrains || 0,
        nbEventsPlomberie: section.nbEventsPlomberie || 0,
        nbAerateurs: section.nbAerateurs || 0,
        nbTrepiedElectrique: section.nbTrepiedElectrique || 0,
        hydroQuebec: section.hydroQuebec || false,
        grue: section.grue || false,
        trackfall: section.trackfall || false,
        plusieursEpaisseurs: section.plusieursEpaisseurs || false,
        sectionName: section.sectionName || `Section ${currentSectionIndex + 1}`
      };
    }
    
    // Données normales (pas de sections multiples)
    return {
      dimensions: submission.toiture?.dimensions || [],
      parapets: submission.toiture?.parapets || [],
      puitsLumiere: submission.toiture?.puitsLumiere || [],
      photos: submission.photos || [],
      superficie: submission.toiture?.superficie || { totale: 0, toiture: 0, parapets: 0 },
      nbFeuilles: submission.toiture?.nbFeuilles || submission.materiaux?.nbFeuilles || 0,
      nbDrains: submission.toiture?.nbDrains || submission.materiaux?.nbDrains || 0,
      nbEventsPlomberie: submission.toiture?.nbEventsPlomberie || submission.materiaux?.nbEvents || 0,
      nbAerateurs: submission.toiture?.nbAerateurs || submission.materiaux?.nbMax || 0,
      nbTrepiedElectrique: submission.toiture?.nbTrepiedElectrique || submission.materiaux?.trepiedElectrique || 0,
      hydroQuebec: submission.toiture?.hydroQuebec || submission.options?.hydroQuebec || false,
      grue: submission.toiture?.grue || submission.options?.grue || false,
      trackfall: submission.toiture?.trackfall || submission.options?.trackfall || false,
      plusieursEpaisseurs: submission.toiture?.plusieursEpaisseurs || submission.options?.plusieursEpaisseurs || false,
      sectionName: null
    };
  };

  const displayData = getDisplayData();

  // Fonction pour gérer la sauvegarde des notes
  const handleSaveNotes = async () => {
    setIsSaving(true)
    try {
      if (onUpdate) {
        await onUpdate(submission.id, { notes: editedNotes })
      }
      submission.notes = editedNotes
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedNotes(submission.notes || '')
    setIsEditingNotes(false)
  }

  // Calculer les matériaux
  const calculateMaterials = () => {
    const superficie = displayData.superficie?.toiture || 0
    const parapets = displayData.superficie?.parapets || 0
    const superficieTotale = superficie + parapets
    
    return {
      fastNStick: Math.ceil((superficie / 140) * 1.1),
      armourCool: Math.ceil((superficieTotale / 78) * 1.1),
      securePan: Math.ceil((superficie / 32) * 1.1),
      armourBond: Math.ceil((parapets / 98) * 1.15),
      tp180ff: Math.ceil(superficieTotale / 1500)
    }
  }

  const materials = calculateMaterials()

  // Navigation photos
  const handleNavigatePhoto = (direction) => {
    const photos = displayData.photos
    if (!photos || photos.length === 0) return

    if (direction === 'prev') {
      setSelectedPhotoIndex(current => 
        current > 0 ? current - 1 : photos.length - 1
      )
    } else {
      setSelectedPhotoIndex(current => 
        current < photos.length - 1 ? current + 1 : 0
      )
    }
  }

  // Vérifier si on a des puits de lumière valides
  const hasPuitsLumiere = displayData.puitsLumiere && 
    displayData.puitsLumiere.length > 0 && 
    displayData.puitsLumiere.some(puit => puit.length > 0 || puit.width > 0)

  // Obtenir l'URL d'une photo
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    
    // Si c'est une string
    if (typeof photo === 'string') {
      // Vérifier si c'est un chemin local (file://)
      if (photo.startsWith('file://') || photo.includes('/private/var/mobile/')) {
        console.warn('Photo avec chemin local détecté, URL Firebase requise');
        return null;
      }
      return photo;
    }
    
    // Si c'est un objet, prioriser les URLs Firebase
    if (photo?.downloadURL) return photo.downloadURL;
    if (photo?.url && !photo.url.startsWith('file://')) return photo.url;
    if (photo?.firebaseUrl) return photo.firebaseUrl;
    
    // Si on a un uri local, on ne peut pas l'utiliser sur desktop
    if (photo?.uri && (photo.uri.startsWith('file://') || photo.uri.includes('/private/var/mobile/'))) {
      console.warn('Photo avec URI local:', photo.uri);
      // Chercher une URL alternative
      if (photo?.remoteUrl) return photo.remoteUrl;
      if (photo?.cloudUrl) return photo.cloudUrl;
      return null;
    }
    
    return photo?.uri || null;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>
        <h1 className="text-xl font-semibold">Détails de la soumission</h1>
        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Info client et adresse */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Client</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Nom: </span>
              <span>{submission.nom || submission.client?.nom || 'Non spécifié'}</span>
            </div>
            <div>
              <span className="font-medium">Téléphone: </span>
              <span>{submission.telephone || submission.client?.telephone || 'Non spécifié'}</span>
            </div>
            <div>
              <span className="font-medium">Courriel: </span>
              <span>{submission.email || submission.courriel || submission.client?.email || submission.client?.courriel || 'Non spécifié'}</span>
            </div>
            
            {/* Adresse avec lien Google Maps */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Adresse: </span>
              {(submission.adresse || submission.client?.adresse) ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(submission.adresse || submission.client?.adresse)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {submission.adresse || submission.client?.adresse}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span>Non spécifiée</span>
              )}
            </div>
          </div>
        </div>

        {/* Sélecteur de sections si multi-sections */}
        {submission.hasMultipleSections && submission.sections && submission.sections.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Sections du projet ({submission.sections.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {submission.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentSectionIndex === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="font-medium">
                    {section.sectionName || `Section ${index + 1}`}
                  </div>
                  <div className="text-sm opacity-80">
                    {typeof section.superficie === 'object' 
                      ? (section.superficie.totale || 0) 
                      : (section.superficie || 0)} pi²
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nom de la section courante si multi-sections */}
        {submission.hasMultipleSections && displayData.sectionName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">
                {displayData.sectionName}
              </h3>
              <span className="text-sm text-blue-700">
                Section {currentSectionIndex + 1} sur {submission.sections.length}
              </span>
            </div>
          </div>
        )}

        {/* Superficie et dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Superficie */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Superficie</h2>
            <p className="text-3xl font-bold text-blue-600 mb-4">
              {displayData.superficie?.totale || 0}.00 pi²
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Toiture: </span>
                <span className="font-medium">{displayData.superficie?.toiture || 0} pi²</span>
              </div>
              <div>
                <span className="text-gray-600">Parapets: </span>
                <span className="font-medium">{displayData.superficie?.parapets || 0} pi²</span>
              </div>
            </div>
          </div>

          {/* Dimensions détaillées */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Dimensions</h2>
            
            {/* Toiture */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Toiture:</h3>
              {displayData.dimensions && displayData.dimensions.length > 0 ? (
                displayData.dimensions.map((dim, index) => (
                  <div key={index} className="text-sm mb-1">
                    <span className="text-gray-600">{dim.name || `Section ${index + 1}`}: </span>
                    <span className="font-medium">{dim.length}' × {dim.width}'</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune dimension</p>
              )}
            </div>

            {/* Parapets */}
            {displayData.parapets && displayData.parapets.some(p => p.length > 0 || p.width > 0) && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Parapets:</h3>
                {displayData.parapets.map((parapet, index) => (
                  parapet.length > 0 || parapet.width > 0 ? (
                    <div key={index} className="text-sm mb-1">
                      <span className="text-gray-600">{parapet.name || `Parapet ${index + 1}`}: </span>
                      <span className="font-medium">{parapet.length}' × {parapet.width}'</span>
                    </div>
                  ) : null
                ))}
              </div>
            )}

            {/* Puits de lumière */}
            {hasPuitsLumiere && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Puits de lumière:</h3>
                {displayData.puitsLumiere.map((puit, index) => (
                  <div key={index} className="text-sm mb-1 bg-blue-50 p-2 rounded flex justify-between">
                    <span className="text-gray-600">{puit.name || `Puit ${index + 1}`}</span>
                    <span className="font-medium">{puit.length}" × {puit.width}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Matériaux à charger */}
        <div className="bg-yellow-50 rounded-lg shadow-sm p-6 mb-6 border-2 border-yellow-100">
          <h2 className="text-lg font-semibold mb-2">📦 Matériaux à charger</h2>
          <p className="text-sm text-gray-600 mb-4">
            Quantités estimées • {new Date().toLocaleDateString('fr-CA')}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
              <p className="text-2xl font-bold" style={{ color: '#d4a574' }}>{materials.fastNStick}</p>
              <p className="text-xs text-gray-600">180 Fast-N-Stick</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
              <p className="text-2xl font-bold" style={{ color: '#d4a574' }}>{materials.armourCool}</p>
              <p className="text-xs text-gray-600">ArmourCool</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
              <p className="text-2xl font-bold" style={{ color: '#d4a574' }}>{materials.securePan}</p>
              <p className="text-xs text-gray-600">SecurePan</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
              <p className="text-2xl font-bold" style={{ color: '#d4a574' }}>{materials.armourBond}</p>
              <p className="text-xs text-gray-600">ArmourBond</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
              <p className="text-2xl font-bold" style={{ color: '#d4a574' }}>{materials.tp180ff}</p>
              <p className="text-xs text-gray-600">TP-180-FF</p>
            </div>
          </div>
          
          <div className="text-right font-semibold">
            Total: {materials.fastNStick + materials.armourCool + materials.securePan + materials.armourBond + materials.tp180ff} items
          </div>
          <p className="text-center text-sm text-gray-600 italic mt-2">
            {displayData.superficie?.toiture || 0} pi² toiture + {displayData.superficie?.parapets || 0} pi² parapets
          </p>
        </div>

        {/* Matériaux et options */}
        {(displayData.nbFeuilles > 0 || displayData.nbDrains > 0 || displayData.nbEventsPlomberie > 0 || 
          displayData.nbAerateurs > 0 || displayData.nbTrepiedElectrique > 0 || displayData.plusieursEpaisseurs ||
          displayData.hydroQuebec || displayData.grue || displayData.trackfall) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Matériaux et options</h2>
            
            {/* Grille de matériaux */}
            {(displayData.nbFeuilles > 0 || displayData.nbDrains > 0 || displayData.nbEventsPlomberie > 0 || 
              displayData.nbAerateurs > 0 || displayData.nbTrepiedElectrique > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                {displayData.nbFeuilles > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold">{displayData.nbFeuilles}</p>
                    <p className="text-xs text-gray-600">Feuilles</p>
                  </div>
                )}
                {displayData.nbDrains > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold">{displayData.nbDrains}</p>
                    <p className="text-xs text-gray-600">Drains</p>
                  </div>
                )}
                {displayData.nbEventsPlomberie > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold">{displayData.nbEventsPlomberie}</p>
                    <p className="text-xs text-gray-600">Évents</p>
                  </div>
                )}
                {displayData.nbAerateurs > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold">{displayData.nbAerateurs}</p>
                    <p className="text-xs text-gray-600">Aérateurs</p>
                  </div>
                )}
                {displayData.nbTrepiedElectrique > 0 && (
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold">{displayData.nbTrepiedElectrique}</p>
                    <p className="text-xs text-gray-600">Trépieds élec.</p>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            {(displayData.plusieursEpaisseurs || displayData.hydroQuebec || displayData.grue || displayData.trackfall) && (
              <div className="space-y-2">
                {displayData.plusieursEpaisseurs && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">Plusieurs épaisseurs</span>
                  </div>
                )}
                {displayData.hydroQuebec && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">Hydro-Québec</span>
                  </div>
                )}
                {displayData.grue && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">Grue nécessaire</span>
                  </div>
                )}
                {displayData.trackfall && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">Trackfall requis</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notes</h2>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Ajouter des notes..."
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
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

        {/* Photos */}
        {displayData.photos && displayData.photos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Photos ({displayData.photos.length})
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayData.photos.map((photo, index) => {
                const photoUrl = getPhotoUrl(photo);
                if (!photoUrl) {
                  console.warn(`Photo ${index + 1} n'a pas d'URL Firebase valide:`, photo);
                  return (
                    <div
                      key={index}
                      className="bg-gray-100 rounded-lg shadow-sm flex items-center justify-center h-40"
                    >
                      <div className="text-center p-4">
                        <p className="text-gray-500 text-sm">Photo {index + 1}</p>
                        <p className="text-xs text-gray-400 mt-1">Non disponible sur desktop</p>
                        <p className="text-xs text-gray-400">(Photo locale mobile)</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={index}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    <img
                      src={photoUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg shadow-sm"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Erreur chargement photo ${index + 1}:`, photoUrl);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="bg-gray-100 rounded-lg shadow-sm flex items-center justify-center h-40">
                            <div class="text-center p-4">
                              <p class="text-gray-500 text-sm">Photo ${index + 1}</p>
                              <p class="text-xs text-gray-400 mt-1">Erreur de chargement</p>
                            </div>
                          </div>
                        `;
                      }}
                    />
                    <p className="text-center text-xs text-gray-600 mt-1">
                      Photo {index + 1}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {/* Message d'information si des photos sont manquantes */}
            {displayData.photos.some(photo => {
              const url = getPhotoUrl(photo);
              return !url || (typeof photo === 'string' && photo.startsWith('file://')) || 
                     (photo?.uri && photo.uri.startsWith('file://'));
            }) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Certaines photos ne sont pas disponibles car elles sont stockées localement sur l'appareil mobile. 
                  Les photos doivent être uploadées sur Firebase Storage pour être visibles sur desktop.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Résumé global si multi-sections */}
        {submission.hasMultipleSections && submission.superficieTotaleGlobale && (
          <div className="bg-blue-50 rounded-lg shadow-sm p-6 mt-6 border-2 border-blue-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">Résumé global du projet</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Superficie totale:</span>
                <span className="text-2xl font-bold text-blue-600">{submission.superficieTotaleGlobale} pi²</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Nombre de sections:</span>
                <span className="font-semibold">{submission.sections.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total de photos:</span>
                <span className="font-semibold">{submission.totalPhotos || 0}</span>
              </div>
              
              {submission.superficiesParSection && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="font-medium text-gray-700 mb-2">Détail par section:</p>
                  {Object.entries(submission.superficiesParSection).map(([sectionName, superficie]) => (
                    <div key={sectionName} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">• {sectionName}:</span>
                      <span className="font-medium">
                        {typeof superficie === 'object' ? (superficie.totale || 0) : superficie} pi²
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Viewer plein écran */}
      {selectedPhotoIndex !== null && displayData.photos && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleNavigatePhoto('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <img
              src={getPhotoUrl(displayData.photos[selectedPhotoIndex])}
              alt={`Photo ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            <button
              onClick={() => handleNavigatePhoto('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {selectedPhotoIndex + 1} / {displayData.photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmissionViewer