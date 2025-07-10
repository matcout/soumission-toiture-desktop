import React, { useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// Types de notifications
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// Durée par défaut des notifications (en ms)
const DEFAULT_DURATION = 5000

// Hook pour gérer les notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((type, title, message, options = {}) => {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      type,
      title,
      message,
      duration: options.duration || DEFAULT_DURATION,
      persistent: options.persistent || false,
      createdAt: new Date()
    }

    setNotifications(prev => [...prev, notification])

    // Auto-remove après la durée spécifiée (sauf si persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Fonctions helper pour chaque type
  const showSuccess = useCallback((title, message, options) => {
    return addNotification(NOTIFICATION_TYPES.SUCCESS, title, message, options)
  }, [addNotification])

  const showError = useCallback((title, message, options) => {
    return addNotification(NOTIFICATION_TYPES.ERROR, title, message, { 
      duration: 8000, // Plus long pour les erreurs
      ...options 
    })
  }, [addNotification])

  const showInfo = useCallback((title, message, options) => {
    return addNotification(NOTIFICATION_TYPES.INFO, title, message, options)
  }, [addNotification])

  const showWarning = useCallback((title, message, options) => {
    return addNotification(NOTIFICATION_TYPES.WARNING, title, message, options)
  }, [addNotification])

  // Notification spéciale pour les soumissions créées
  const showSubmissionCreated = useCallback((submissionData, isAssignment = false) => {
    const title = isAssignment ? 'Assignment créé !' : 'Soumission créée !'
    const message = `"${submissionData.adresse}" a été ${isAssignment ? 'créé' : 'sauvegardé'} avec succès`
    
    return showSuccess(title, message, {
      duration: 6000,
      submissionId: submissionData.id
    })
  }, [showSuccess])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showSubmissionCreated
  }
}

// Composant pour une notification individuelle
const NotificationItem = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case NOTIFICATION_TYPES.INFO:
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-50 border-green-200 text-green-800'
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-50 border-red-200 text-red-800'
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-CA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className={`flex items-start p-4 rounded-lg border shadow-sm transition-all duration-300 ${getColors()}`}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm leading-tight">
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-sm opacity-90 mt-1 leading-relaxed">
                {notification.message}
              </p>
            )}
            <p className="text-xs opacity-75 mt-2">
              {formatTime(notification.createdAt)}
            </p>
          </div>
          
          <button
            onClick={() => onRemove(notification.id)}
            className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant conteneur pour toutes les notifications
export const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
      
      {notifications.length > 3 && (
        <div className="text-center">
          <button
            onClick={() => notifications.forEach(n => onRemove(n.id))}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Tout effacer ({notifications.length})
          </button>
        </div>
      )}
    </div>
  )
}

// Composant de notification toast simple (optionnel)
export const Toast = ({ 
  message, 
  type = NOTIFICATION_TYPES.INFO, 
  duration = 3000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Attendre la fin de l'animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const getToastColors = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-500 text-white'
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-500 text-white'
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-500 text-white'
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${getToastColors()} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-center space-x-2">
        {type === NOTIFICATION_TYPES.SUCCESS && <CheckCircle className="w-4 h-4" />}
        {type === NOTIFICATION_TYPES.ERROR && <AlertCircle className="w-4 h-4" />}
        {type === NOTIFICATION_TYPES.WARNING && <AlertTriangle className="w-4 h-4" />}
        {type === NOTIFICATION_TYPES.INFO && <Info className="w-4 h-4" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

export default {
  useNotifications,
  NotificationContainer,
  Toast,
  NOTIFICATION_TYPES
}