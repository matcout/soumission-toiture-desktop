// FolderManagementModal.jsx - Modal de gestion des dossiers avec icônes Lucide
import React, { useState, useEffect } from 'react'
import { 
  X, 
  Folder, 
  FolderOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  Search, 
  Home, 
  Settings, 
  BarChart3, 
  Calendar, 
  User, 
  Users, 
  Tag, 
  Tags,
  Check 
} from 'lucide-react'
import folderSyncFunctions from './folderSyncFunctions'

const { AVAILABLE_FOLDER_COLORS, AVAILABLE_FOLDER_ICONS_DESKTOP } = folderSyncFunctions

const FolderManagementModal = ({ isOpen, onClose, onSave, folder = null, parentFolder = null }) => {
  const [formData, setFormData] = useState({
    label: '',
    icon: 'Folder',
    color: '#3b82f6'
  })

  useEffect(() => {
    if (folder) {
      setFormData({
        label: folder.label,
        icon: folder.icon || 'Folder',
        color: folder.color || '#3b82f6'
      })
    } else {
      setFormData({
        label: '',
        icon: 'Folder',
        color: '#3b82f6'
      })
    }
  }, [folder, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.label.trim()) {
      return
    }

    onSave({
      ...formData,
      id: folder?.id,
      parentId: parentFolder?.id || null,
      parentLabel: parentFolder?.label || null
    })

    onClose()
  }

  if (!isOpen) return null

  // Mapping des icônes avec les vrais composants Lucide
  const IconComponents = {
    'Folder': Folder,
    'FolderOpen': FolderOpen,
    'FileText': FileText,
    'Clock': Clock,
    'CheckCircle2': CheckCircle2,
    'Wrench': Wrench,
    'Search': Search,
    'Home': Home,
    'Settings': Settings,
    'BarChart3': BarChart3,
    'Calendar': Calendar,
    'User': User,
    'Users': Users,
    'Tag': Tag,
    'Tags': Tags
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {folder ? 'Modifier le dossier' : parentFolder ? `Nouveau sous-dossier dans "${parentFolder.label}"` : 'Nouveau dossier'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Nom du dossier */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du {parentFolder ? 'sous-' : ''}dossier
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={parentFolder ? "Ex: Urgent" : "Ex: Projets Spéciaux"}
              autoFocus
            />
          </div>

          {/* Sélection d'icône */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icône
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_FOLDER_ICONS_DESKTOP.map(iconName => {
                const IconComponent = IconComponents[iconName]
                if (!IconComponent) return null
                
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.icon === iconName
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    title={iconName}
                  >
                    <IconComponent 
                      className={`w-5 h-5 mx-auto ${
                        formData.icon === iconName ? 'text-blue-600' : 'text-gray-600'
                      }`} 
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sélection de couleur */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_FOLDER_COLORS.map(color => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.hex })}
                  className={`h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
                    formData.color === color.hex
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                >
                  {formData.color === color.hex && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.label.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {folder ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FolderManagementModal