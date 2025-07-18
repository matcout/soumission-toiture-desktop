// AssignmentModal.jsx - Modal Assignment pour Desktop
import React, { useState, useRef } from 'react'
import { X, User, MapPin, Phone, Mail, FileText } from 'lucide-react'

const AssignmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    courriel: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})
  const phoneInputRef = useRef(null) // ✅ AJOUT: Référence pour le champ téléphone

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'Adresse requise'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData)
      handleClose()
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // ✅ CORRECTION: Fonction handlePhoneChange améliorée
  const handlePhoneChange = (e) => {
    const newValue = e.target.value
    const oldValue = formData.telephone
    
    // Détecter si on supprime (nouvelle valeur plus courte)
    const isDeleting = newValue.length < oldValue.length
    
    // Si on supprime et qu'on essaie de supprimer un tiret, 
    // supprimer aussi le chiffre avant
    if (isDeleting && oldValue.charAt(newValue.length) === '-') {
      const withoutDash = newValue.slice(0, -1)
      const cleaned = withoutDash.replace(/\D/g, '').slice(0, 10)
      handleInputChange('telephone', formatPhoneDisplay(cleaned, true))
      return
    }
    
    const cleaned = newValue.replace(/\D/g, '').slice(0, 10)
    handleInputChange('telephone', formatPhoneDisplay(cleaned, isDeleting))
  }

  // ✅ AJOUT: Fonction helper pour formatage
  const formatPhoneDisplay = (cleaned, isDeleting = false) => {
    // Si on est en train de supprimer et qu'on a moins de caractères, 
    // être plus permissif avec le formatage
    if (isDeleting && cleaned.length <= 6) {
      if (cleaned.length >= 3) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
      }
      return cleaned
    }
    
    // Formatage normal
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    }
    return cleaned
  }

  // ✅ AJOUT: Gestion des touches spéciales
  const handlePhoneKeyDown = (e) => {
    // Permettre les touches de navigation et suppression
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ]
    
    if (allowedKeys.includes(e.key)) {
      return
    }
    
    // Permettre Ctrl+A, Ctrl+C, Ctrl+V, etc.
    if (e.ctrlKey || e.metaKey) {
      return
    }
    
    // Permettre seulement les chiffres
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  // ✅ AJOUT: Double-clic pour sélectionner tout
  const handlePhoneDoubleClick = () => {
    if (phoneInputRef.current) {
      phoneInputRef.current.select()
    }
  }

  const handleClose = () => {
    setFormData({
      nom: '',
      adresse: '',
      telephone: '',
      courriel: '',
      notes: ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Nouvelle Soumission
                </h3>
                <p className="text-sm text-gray-600">
                  Créer un assignment pour l'équipe terrain
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 p-1 rounded-full mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Toiture à aller prendre mesure
                </h4>
               
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du client */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Nom du client
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom complet"
                />
              </div>

              {/* Téléphone - ✅ MODIFIÉ avec les nouvelles fonctions */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  Téléphone
                </label>
                <input
                  ref={phoneInputRef}
                  type="text"
                  value={formData.telephone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  onDoubleClick={handlePhoneDoubleClick}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="514-783-2794"
                  maxLength={12}
                  title="Double-cliquez pour sélectionner tout le numéro"
                />
                {/* ✅ AJOUT: Petit hint discret */}
                <p className="text-xs text-gray-400 mt-1">
                  💡 Double-cliquez pour sélectionner tout
                </p>
              </div>
            </div>

            {/* Adresse des travaux */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                Adresse des travaux *
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.adresse ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Adresse complète du projet"
                required
              />
              {errors.adresse && (
                <p className="text-red-500 text-sm mt-1">{errors.adresse}</p>
              )}
            </div>

            {/* Courriel */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                Courriel
              </label>
              <input
                type="email"
                value={formData.courriel}
                onChange={(e) => handleInputChange('courriel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@exemple.com"
              />
            </div>

            {/* Notes spéciales */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                Instructions pour l'équipe terrain
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Instructions spéciales, accès, contraintes, horaires préférés, détails importants..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Ces notes seront visibles sur l'app mobile pour guider l'équipe
              </p>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Créer Assignment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AssignmentModal