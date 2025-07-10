// AssignmentModal.jsx - Modal Assignment pour Desktop
import React, { useState } from 'react'
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

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 10)
    
    if (limited.length >= 6) {
      const formatted = `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`
      handleInputChange('telephone', formatted)
    } else if (limited.length >= 3) {
      const formatted = `${limited.slice(0, 3)}-${limited.slice(3)}`
      handleInputChange('telephone', formatted)
    } else {
      handleInputChange('telephone', limited)
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
                  Assignment pour l'équipe terrain
                </h4>
                <p className="text-sm text-blue-700">
                  Cette soumission apparaîtra dans "Aller prendre mesure" sur l'app mobile. 
                  L'équipe pourra la compléter avec photos et mesures sur le terrain.
                </p>
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

              {/* Téléphone */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  Téléphone
                </label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="514-783-2794"
                  maxLength={12}
                />
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

            {/* Workflow preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Workflow après création :</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>📱 Apparaît dans "Aller prendre mesure" sur mobile</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>📋 Équipe complète avec photos et mesures</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>💻 Sync automatique vers "À compléter" desktop</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>🧮 Calculs matériaux avec FastNstick 2025</span>
                </div>
              </div>
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