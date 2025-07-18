import React, { useState, useEffect, useRef } from 'react'
import { Calculator, Save, RefreshCw, FileText, DollarSign, AlertTriangle, Clock, Camera } from 'lucide-react'
import { SoumissionPDFButton } from './SoumissionPDF'
import PDFPreviewForm from './PDFPreviewForm'

// Composant Modal de restauration
const DraftRestoreModal = ({ draft, onRestore, onDiscard, onClose }) => {
  if (!draft) return null

  const draftDate = new Date(draft.savedAt)
  const timeAgo = getTimeAgo(draftDate)
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-start mb-4">
          <div className="bg-yellow-100 p-2 rounded-full mr-3">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Brouillon trouvé
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Un calcul non terminé a été trouvé ({timeAgo})
            </p>
            {draft.isDifferentProject && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                ⚠️ Ce brouillon provient d'une autre soumission
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Adresse brouillon:</span>
              <span className="font-medium text-xs">
                {draft.prefilledData?.client?.adresse || 'Calcul vierge'}
              </span>
            </div>
            {draft.isDifferentProject && draft.currentProjectAddress && (
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-gray-600">Soumission actuelle:</span>
                <span className="font-medium text-xs text-blue-600">
                  {draft.currentProjectAddress}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Superficie:</span>
              <span className="font-medium">
                {Math.round((draft.formData.superficie || 0) + (draft.formData.parapets || 0))} pi²
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total calculé:</span>
              <span className="font-medium">
                ${draft.results?.total?.toLocaleString('fr-CA') || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {draftDate.toLocaleDateString('fr-CA')} à {draftDate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Ignorer
          </button>
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Clock className="w-4 h-4 mr-2" />
            Restaurer
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Commencer un nouveau calcul
        </button>
      </div>
    </div>
  )
}

// Fonction helper pour calculer le temps écoulé
const getTimeAgo = (date) => {
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return "à l'instant"
  if (diffMins < 60) return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
  return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
}

const CalculatorView = ({ prefilledData = null, onSaveCalculation = null, onBack = null }) => {
  console.log('🚀 CalculatorView monté avec:', { 
    prefilledData: prefilledData?.client?.adresse || 'Aucune' 
  })
  
  const DRAFT_KEY = 'calculatorDraft'
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [savedDraft, setSavedDraft] = useState(null)
  const [draftStatus, setDraftStatus] = useState({ saved: false, lastSaved: null })
  const autoSaveTimerRef = useRef(null)
  const [showPDFOption, setShowPDFOption] = useState(false)
  
  // ✅ NOUVEAU: État pour conserver les dernières données calculées
  const [lastCalculationData, setLastCalculationData] = useState(null)

  const [formData, setFormData] = useState({
    superficie: prefilledData?.superficie || 0,
    parapets: prefilledData?.parapets || 0,
    membraneType: 'armourCool',
    profitPercent: 30,
    complexite: 'Moyen',
  })

  const [quantities, setQuantities] = useState({
    fastNStick: 0,
    armourCoolOrTorchflex: 0,
    securePan: 0,
    armourBond: 0,
    optimum: prefilledData?.nbMax || 0,
    drains: prefilledData?.nbDrains || 0,
    events: prefilledData?.nbEvents || 0,
    feuillesToles: prefilledData?.nbFeuilles || 0,
    detraileur: 1,
    evacSupreme: 0,
    evacSupremeType: '1s4',
    tp180ff: 0,
    autresTotal: 0,
    puitLumiereLineaire: 0,
  })

  const [results, setResults] = useState({
    fastNStick: 0,
    armourCoolOrTorchflex: 0,
    optimum: 0,
    securePan: 0,
    armourBond: 0,
    feuillesToles: 0,
    tp180ff: 0,
    drains: 0,
    events: 0,
    detraileur: 0,
    autres: 0,
    evacSupreme: 0,
    puitLumiere: 0,
    mainOeuvre: 0,
    administration: 0,
    sousTotal: 0,
    profit: 0,
    total: 0
  })
  
  const [showPDFForm, setShowPDFForm] = useState(false)
  const [pdfData, setPdfData] = useState(null)

  const [customTotal, setCustomTotal] = useState('0')

  const defaultPrices = {
    fastNStick: 98,
    armourCoolHD: 132,
    blancRegulier: 74,
    optimum: 92,
    securePan: 18,
    drains: 58,
    events: 22,
    armourBond: 118,
    feuillesToles: 140,
    detraileur: 725,
    autres: 150,
    evacSupreme1s4: 170,
    evacSupreme2s4: 212,
    evacSupreme1s6: 218,
    tp180ff: 78,
    puitLumiereParPied: 80,
    mainOeuvreHeure: 90,
    administration: 225
  }

  const loadSavedPrices = () => {
    const savedPrices = localStorage.getItem('calculatorPrices')
    if (savedPrices) {
      try {
        return { ...defaultPrices, ...JSON.parse(savedPrices) }
      } catch (e) {
        console.error('Erreur chargement prix:', e)
        return defaultPrices
      }
    }
    return defaultPrices
  }

  const [unitPrices, setUnitPrices] = useState(loadSavedPrices())

  const [mainOeuvre, setMainOeuvre] = useState({
    nbGars: 4,
    nbHeures: 8
  })
  
  // ✅ FONCTION MODIFIÉE POUR OUVRIR LE FORMULAIRE PDF
  const handleOpenPDFForm = (data) => {
    // Ajouter le customTotal actuel aux données
    const pdfDataWithCustomTotal = {
      ...data,
      // Forcer l'utilisation du customTotal si défini
      customSubmission: customTotal && parseFloat(customTotal) > 0 ? {
        total: parseFloat(customTotal),
        profitPercent: formData.profitPercent,
        ...customValues
      } : data.customSubmission
    }
    
    console.log('📄 Ouverture formulaire PDF avec:', pdfDataWithCustomTotal)
    console.log('💰 Custom Total:', customTotal) // Debug
    setPdfData(pdfDataWithCustomTotal)
    setShowPDFForm(true)
  }

  // ✅ FONCTION POUR FERMER LE FORMULAIRE PDF
  const handleClosePDFForm = () => {
    setShowPDFForm(false)
    setPdfData(null)
  }

  const [editingPrice, setEditingPrice] = useState(null)

  // Fonction pour sauvegarder le brouillon
  const saveDraft = () => {
    try {
      const draft = {
        formData,
        quantities,
        unitPrices,
        mainOeuvre,
        results,
        customTotal,
        savedAt: new Date().toISOString(),
        prefilledData // Garder la référence aux données préremplies
      }
      
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setDraftStatus({
        saved: true,
        lastSaved: new Date()
      })
      
      console.log('📝 Brouillon sauvegardé automatiquement')
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error)
    }
  }

  // Fonction pour charger le brouillon
  const loadDraft = () => {
    try {
      const draftString = localStorage.getItem(DRAFT_KEY)
      if (draftString) {
        const draft = JSON.parse(draftString)
        setSavedDraft(draft)
        return draft
      }
    } catch (error) {
      console.error('Erreur chargement brouillon:', error)
    }
    return null
  }

  // Fonction pour restaurer le brouillon
  const restoreDraft = () => {
    if (savedDraft) {
      console.log('📋 Restauration du brouillon...')
      setFormData(savedDraft.formData)
      setQuantities(savedDraft.quantities)
      setUnitPrices(savedDraft.unitPrices)
      setMainOeuvre(savedDraft.mainOeuvre)
      setCustomTotal(savedDraft.customTotal || '0')
      
      setShowDraftModal(false)
      setDraftStatus({
        saved: true,
        lastSaved: new Date(savedDraft.savedAt)
      })
      
      console.log('✅ Brouillon restauré')
    }
  }

  // Fonction pour supprimer le brouillon
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setSavedDraft(null)
    setDraftStatus({ saved: false, lastSaved: null })
    console.log('🗑️ Brouillon supprimé')
  }

  // Log du cycle de vie du composant
  useEffect(() => {
    console.log('🟢 CalculatorView monté')
    
    return () => {
      console.log('🔴 CalculatorView démonté')
    }
  }, [])

  // Vérifier s'il y a un brouillon à chaque montage ou changement de soumission
  useEffect(() => {
    console.log('🔍 Vérification brouillon...', {
      address: prefilledData?.client?.adresse || 'Nouvelle'
    })
    
    // Petit délai pour éviter les conflits avec le montage
    const timeoutId = setTimeout(() => {
      try {
        const draftString = localStorage.getItem(DRAFT_KEY)
        if (draftString) {
          const draft = JSON.parse(draftString)
          console.log('📄 Brouillon trouvé:', {
            draftAddress: draft.prefilledData?.client?.adresse || 'Aucune',
            currentAddress: prefilledData?.client?.adresse || 'Aucune',
            superficie: draft.formData.superficie
          })
          
          // Si un brouillon existe avec des données significatives
          if (draft && (draft.formData.superficie > 0 || draft.formData.parapets > 0 || 
                        draft.quantities.optimum > 0 || draft.quantities.drains > 0)) {
            
            // Vérifier si c'est un brouillon d'une soumission différente
            if (prefilledData && draft.prefilledData?.client?.adresse && 
                draft.prefilledData.client.adresse !== prefilledData?.client?.adresse) {
              draft.isDifferentProject = true
              draft.currentProjectAddress = prefilledData?.client?.adresse
              console.log('⚠️ Brouillon d\'une soumission différente')
            } else {
              console.log('✅ Brouillon disponible')
            }
            
            setSavedDraft(draft)
            setShowDraftModal(true)
            console.log('📋 Modal de brouillon affiché')
          }
        } else {
          console.log('❌ Aucun brouillon trouvé')
        }
      } catch (error) {
        console.error('❌ Erreur chargement brouillon:', error)
      }
    }, 100) // Délai de 100ms
    
    // Cleanup
    return () => clearTimeout(timeoutId)
  }, [prefilledData?.client?.adresse]) // Se déclenche quand l'adresse change

  // Auto-save avec debounce
  useEffect(() => {
    // Ne pas sauvegarder si on n'a pas de données significatives
    const hasData = formData.superficie > 0 || formData.parapets > 0 || 
                   quantities.optimum > 0 || quantities.drains > 0

    if (!hasData) return

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer pour auto-save après 2 secondes d'inactivité
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft()
    }, 2000)

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [formData, quantities, unitPrices, mainOeuvre, customTotal])

  // Ajouter un handler pour le bouton retour
  const handleBackClick = () => {
    // Sauvegarder avant de quitter
    saveDraft()
    
    // Appeler la fonction onBack si elle existe
    if (onBack) {
      onBack()
    }
  }

  // Calculer automatiquement les pieds linéaires des puits de lumière
  useEffect(() => {
    if (prefilledData?.toiture?.puitsLumiere && Array.isArray(prefilledData.toiture.puitsLumiere)) {
      let totalLineaire = 0;
      prefilledData.toiture.puitsLumiere.forEach(puit => {
        const lengthInFeet = (puit.length || 0) / 12;
        const widthInFeet = (puit.width || 0) / 12;
        const perimeter = 2 * (lengthInFeet + widthInFeet);
        totalLineaire += perimeter;
      });
      setQuantities(prev => ({ ...prev, puitLumiereLineaire: Math.round(totalLineaire * 10) / 10 }));
    }
  }, [prefilledData]);

  // Composant pour éditer les prix inline
  const PriceEditor = ({ field, value, unit = "", color = "blue" }) => {
    const [tempValue, setTempValue] = useState(value)
    const colorClass = color === "orange" ? "text-orange-600" : "text-blue-600"
    const hoverClass = color === "orange" ? "hover:text-orange-800" : "hover:text-blue-800"
    const isModified = value !== defaultPrices[field]

    useEffect(() => {
      setTempValue(value)
    }, [value])

    if (editingPrice === field) {
      return (
        <div className="flex items-center space-x-1">
          <span className="text-xs">$</span>
          <input
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => {
              const newValue = parseFloat(tempValue) || 0
              handleUnitPriceChange(field, newValue)
              setEditingPrice(null)
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const newValue = parseFloat(tempValue) || 0
                handleUnitPriceChange(field, newValue)
                setEditingPrice(null)
              }
            }}
            className="w-12 px-1 py-0 text-xs border border-gray-300 rounded"
            autoFocus
            min="0"
            step="0.01"
          />
          <span className="text-xs">{unit}</span>
        </div>
      )
    }

    return (
      <div 
        className={`text-xs cursor-pointer ${colorClass} ${hoverClass} hover:underline group inline-flex items-center`}
        onClick={() => {
          setEditingPrice(field)
          setTempValue(value)
        }}
        title={`Cliquez pour modifier le prix${isModified ? ' (modifié)' : ''}`}
      >
        ${value}{unit}
        {isModified && <span className="ml-0.5 text-xs">*</span>}
        <span className="ml-0.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✎</span>
      </div>
    )
  }

  const calculerTempsEstime = (superficie, complexite) => {
    let categorie;
    if (superficie < 1500) {
      categorie = "Petite";
    } else if (superficie < 3000) {
      categorie = "Moyenne";
    } else {
      categorie = "Grande";
    }
    
    const productivites = {
      "Petite": 60,
      "Moyenne": 85,
      "Grande": 110
    };
    const productivite = productivites[categorie];
    
    const coefficients = {
      "Petite": { "Facile": 0.81,"Moyen": 1.025,"Complexe": 1.4 },
      "Moyenne": { "Facile": 0.9, "Moyen": 1.0, "Complexe": 1.2 },
      "Grande": { "Facile": 0.75, "Moyen": 0.9, "Complexe": 1.1 }
    };
    
    const coefficient = coefficients[categorie][complexite];
    const tempsBase = superficie / productivite;
    const tempsFinal = tempsBase * coefficient;
    
    return {
      heures: Math.round(tempsFinal * 10) / 10,
      categorie,
      productivite,
      coefficient
    };
  }

  const calculateCustomValues = () => {
    const total = parseFloat(customTotal) || 0
    const superficie = Math.round(parseFloat(formData.superficie) + parseFloat(formData.parapets)) || 1
    
    const adminAmount = mainOeuvre.nbHeures * unitPrices.administration
    const sousTotalSansAdmin = results.sousTotal - results.administration
    
    const difference = total - results.total
    const profitTotal = results.profit + difference
    
    const pricePerSqFt = total / superficie
    const daysWork = mainOeuvre.nbHeures / 9
    const profitPerDay = profitTotal / Math.max(1, daysWork)
      
    return {
      total,
      profitTotal,
      difference,
      tps: total * 0.05,
      tvq: total * 0.09975,
      totalWithTaxes: total * 1.14975,
      pricePerSqFt,
      profitPerDay,
      adminAmount,
      sousTotalSansAdmin
    }
  }

  const customValues = calculateCustomValues()

  const formatCurrency = (amount) => {
    return amount.toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCompact = (amount) => {
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'k';
    }
    return amount.toFixed(0);
  };

  useEffect(() => {
    calculateQuantitiesAndPrices()
    
    const superficieTotale = Math.round((parseFloat(formData.superficie) || 0) + (parseFloat(formData.parapets) || 0));
    if (superficieTotale > 0) {
      const tempsEstime = calculerTempsEstime(superficieTotale, formData.complexite);
      setMainOeuvre(prev => ({
        ...prev,
        nbHeures: tempsEstime.heures
      }));
    }
  }, [formData.superficie, formData.parapets, formData.complexite])

  useEffect(() => {
    const joursCalcules = Math.ceil(mainOeuvre.nbHeures / 9)
    const montantSuggere = joursCalcules * unitPrices.autres
    
    setQuantities(prev => ({ ...prev, autresTotal: montantSuggere }))
  }, [mainOeuvre.nbHeures, unitPrices.autres])

  useEffect(() => {
    calculatePrices()
  }, [quantities, unitPrices, mainOeuvre, formData.profitPercent, formData.membraneType])

  const calculateQuantitiesAndPrices = () => {
    const superficie = parseFloat(formData.superficie) || 0
    const parapets = parseFloat(formData.parapets) || 0
    
    const fastNStickQty = Math.ceil((superficie / 140) * 1.1)
    const armourQty = Math.ceil(((superficie + parapets) / 78) * 1.1)
    const securePanQty = Math.ceil((superficie / 32) * 1.1)
    const armourBondQty = Math.ceil((parapets / 98) * 1.15)
    
    setQuantities(prev => ({
      ...prev,
      fastNStick: fastNStickQty,
      armourCoolOrTorchflex: armourQty,
      securePan: securePanQty,
      armourBond: armourBondQty
    }))
  }

  const calculatePrices = () => {
    const membranePrice = formData.membraneType === 'armourCool' ? unitPrices.armourCoolHD : unitPrices.blancRegulier
    
    let evacSupremePrice = 0;
    if (quantities.evacSupremeType === '1s4') {
      evacSupremePrice = unitPrices.evacSupreme1s4;
    } else if (quantities.evacSupremeType === '2s4') {
      evacSupremePrice = unitPrices.evacSupreme2s4;
    } else if (quantities.evacSupremeType === '1s6') {
      evacSupremePrice = unitPrices.evacSupreme1s6;
    }
    
    const newResults = {
      mainOeuvre: mainOeuvre.nbGars * mainOeuvre.nbHeures * unitPrices.mainOeuvreHeure,
      fastNStick: quantities.fastNStick * unitPrices.fastNStick,
      armourCoolOrTorchflex: quantities.armourCoolOrTorchflex * membranePrice,
      optimum: quantities.optimum * unitPrices.optimum,
      securePan: quantities.securePan * unitPrices.securePan,
      armourBond: quantities.armourBond * unitPrices.armourBond,
      feuillesToles: quantities.feuillesToles * unitPrices.feuillesToles,
      tp180ff: quantities.tp180ff * unitPrices.tp180ff,
      drains: quantities.drains * unitPrices.drains,
      events: quantities.events * unitPrices.events,
      detraileur: quantities.detraileur * unitPrices.detraileur,
      autres: quantities.autresTotal,
      evacSupreme: quantities.evacSupreme * evacSupremePrice,
      puitLumiere: quantities.puitLumiereLineaire * unitPrices.puitLumiereParPied,
      administration: mainOeuvre.nbHeures * unitPrices.administration,
      sousTotal: 0,
      profit: 0,
      total: 0
    }
    
    const sousTotalSansAdmin = Object.values(newResults).reduce((sum, value, index) => {
      const keysArray = Object.keys(newResults);
      if (keysArray[index] !== 'administration' && 
          keysArray[index] !== 'sousTotal' && 
          keysArray[index] !== 'profit' && 
          keysArray[index] !== 'total') {
        return sum + value;
      }
      return sum;
    }, 0);
    
    newResults.sousTotal = sousTotalSansAdmin + newResults.administration;
    newResults.profit = sousTotalSansAdmin * (formData.profitPercent / 100);
    newResults.total = newResults.sousTotal + newResults.profit;
    
    setResults(newResults)
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleQuantityChange = (field, value) => {
    if (field === 'autresTotal' || field === 'puitLumiereLineaire') {
      setQuantities(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
    } else {
      setQuantities(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
    }
  }

  const handleUnitPriceChange = (field, value) => {
    const newPrices = { ...unitPrices, [field]: parseFloat(value) || 0 }
    setUnitPrices(newPrices)
    
    const pricesToSave = {}
    Object.keys(newPrices).forEach(key => {
      if (newPrices[key] !== defaultPrices[key]) {
        pricesToSave[key] = newPrices[key]
      }
    })
    localStorage.setItem('calculatorPrices', JSON.stringify(pricesToSave))
  }

  const handleMainOeuvreChange = (field, value) => {
    setMainOeuvre(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
  }

  // ✅ FONCTION handleSave MODIFIÉE
  const handleSave = () => {
    if (onSaveCalculation) {
      clearDraft()
      
      // Créer l'objet de calcul avec customTotal
      const calculationData = {
        inputs: { ...formData, quantities, mainOeuvre },
        results: results,
        calculatedAt: new Date(),
        tempsEstime: mainOeuvre.nbHeures,
        complexite: formData.complexite,
        customSubmission: customTotal && parseFloat(customTotal) > 0 ? {
          total: parseFloat(customTotal),
          profitPercent: formData.profitPercent,
          ...customValues
        } : null
      }
      
      onSaveCalculation(calculationData)
      
      // Stocker les données pour le PDF
      setLastCalculationData(calculationData)
      
      // AJOUT : Afficher l'option PDF
      setShowPDFOption(true)
    } else {
      console.log('💾 Calcul sauvegardé:', { 
        formData, 
        quantities, 
        results, 
        mainOeuvre,
        customSubmission: customTotal && parseFloat(customTotal) > 0 ? customValues : null
      })
      alert('Calcul sauvegardé localement !')
      
      // AJOUT : Afficher l'option PDF
      setShowPDFOption(true)
    }
  }

  const resetCalculator = () => {
    if (window.confirm('Réinitialiser tous les champs? Le brouillon sera supprimé.')) {
      setFormData({
        superficie: 0,
        parapets: 0,
        membraneType: 'armourCool',
        profitPercent: 30,
        complexite: 'Moyen',
      })
      setQuantities({
        fastNStick: 0,
        armourCoolOrTorchflex: 0,
        securePan: 0,
        armourBond: 0,
        optimum: 0,
        drains: 0,
        events: 0,
        feuillesToles: 0,
        detraileur: 1,
        evacSupreme: 0,
        evacSupremeType: '1s4',
        tp180ff: 0,
        autresTotal: 0,
        puitLumiereLineaire: 0,
      })
      setMainOeuvre({
        nbGars: 4,
        nbHeures: 8
      })
      setCustomTotal('0')
      clearDraft() // Effacer le brouillon
    }
  }

  const resetPrices = () => {
    if (window.confirm('Réinitialiser tous les prix aux valeurs par défaut?')) {
      setUnitPrices(defaultPrices)
      localStorage.removeItem('calculatorPrices')
    }
  }

  const getCurrentEvacSupremePrice = () => {
    if (quantities.evacSupremeType === '1s4') return unitPrices.evacSupreme1s4;
    if (quantities.evacSupremeType === '2s4') return unitPrices.evacSupreme2s4;
    if (quantities.evacSupremeType === '1s6') return unitPrices.evacSupreme1s6;
    return 0;
  }

  if (showPDFForm) {
    return (
      <PDFPreviewForm
        initialData={pdfData}
        onBack={handleClosePDFForm}
        onSave={(finalData) => {
          console.log('PDF généré avec:', finalData)
          // Optionnel : sauvegarder les données finales
          handleClosePDFForm()
        }}
      />
    )
  }

  return (
    <div className="w-full relative">
      {/* Modal de restauration de brouillon */}
      {showDraftModal && savedDraft && (
        <DraftRestoreModal
          draft={savedDraft}
          onRestore={restoreDraft}
          onDiscard={() => {
            clearDraft()
            setShowDraftModal(false)
          }}
          onClose={() => {
            setShowDraftModal(false)
          }}
        />
      )}

      {/* Indicateur de statut du brouillon */}
      {draftStatus.saved && (
        <div className="absolute top-0 right-0 text-xs text-gray-500 flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Brouillon sauvegardé {draftStatus.lastSaved && getTimeAgo(draftStatus.lastSaved)}</span>
        </div>
      )}

      {/* Section Main d'œuvre au-dessus */}
      <div className="mb-6 bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-500" />
            Main d'œuvre
          </h4>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Nb gars:</label>
              <input
                type="number"
                value={mainOeuvre.nbGars}
                onChange={(e) => handleMainOeuvreChange('nbGars', e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                min="1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Heures (auto):</label>
              <input
                type="number"
                value={mainOeuvre.nbHeures}
                onChange={(e) => handleMainOeuvreChange('nbHeures', e.target.value)}
                className="w-16 px-2 py-1 border border-green-300 bg-green-50 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                min="1"
                title="Calculé automatiquement selon la superficie et complexité"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Prix/h:</label>
              <input
                type="number"
                value={unitPrices.mainOeuvreHeure}
                onChange={(e) => handleUnitPriceChange('mainOeuvreHeure', e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                min="1"
              />
            </div>
            <div className="text-lg font-bold text-green-700">
              Total: ${formatCompact(results.mainOeuvre)}
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale en 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Colonne 1 - Matériaux BLEUS */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Matériaux principaux</h3>
            <span className="text-xs text-gray-500" title="Les prix marqués avec * ont été modifiés">
              Cliquez sur les prix pour modifier
            </span>
          </div>
          <div className="space-y-2">
            {/* Fast-N-Stick */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Fast-N-Stick 180-FS</div>
                <PriceEditor field="fastNStick" value={unitPrices.fastNStick} unit="/rlx" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.fastNStick}
                  onChange={(e) => handleQuantityChange('fastNStick', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.fastNStick)}
                </span>
              </div>
            </div>

            {/* Membrane de finition */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Membrane de finition</div>
                <div className="flex items-center space-x-2 mt-1">
                  <select
                    value={formData.membraneType}
                    onChange={(e) => handleFormChange('membraneType', e.target.value)}
                    className="text-xs border border-blue-300 rounded px-1 py-0.5"
                  >
                    <option value="armourCool">ArmourCool HD</option>
                    <option value="blancRegulier">Blanc Regulier</option>
                  </select>
                  <PriceEditor 
                    field={formData.membraneType === 'armourCool' ? "armourCoolHD" : "blancRegulier"} 
                    value={formData.membraneType === 'armourCool' ? unitPrices.armourCoolHD : unitPrices.blancRegulier} 
                    unit="/rlx" 
                  />
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.armourCoolOrTorchflex}
                  onChange={(e) => handleQuantityChange('armourCoolOrTorchflex', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.armourCoolOrTorchflex)}
                </span>
              </div>
            </div>

            {/* SecurePan */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">SecurePan</div>
                <PriceEditor field="securePan" value={unitPrices.securePan} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.securePan}
                  onChange={(e) => handleQuantityChange('securePan', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.securePan)}
                </span>
              </div>
            </div>

            {/* ArmourBond */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">ArmourBond 180</div>
                <PriceEditor field="armourBond" value={unitPrices.armourBond} unit="/rlx" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.armourBond}
                  onChange={(e) => handleQuantityChange('armourBond', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.armourBond)}
                </span>
              </div>
            </div>

            {/* TP-180-FF */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">TP-180-FF</div>
                <PriceEditor field="tp180ff" value={unitPrices.tp180ff} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.tp180ff}
                  onChange={(e) => handleQuantityChange('tp180ff', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.tp180ff)}
                </span>
              </div>
            </div>

            {/* Drains */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Drains</div>
                <PriceEditor field="drains" value={unitPrices.drains} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.drains}
                  onChange={(e) => handleQuantityChange('drains', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.drains)}
                </span>
              </div>
            </div>

            {/* Évents */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Évents</div>
                <PriceEditor field="events" value={unitPrices.events} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.events}
                  onChange={(e) => handleQuantityChange('events', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.events)}
                </span>
              </div>
            </div>

            {/* Optimum 102 */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Optimum 102</div>
                <PriceEditor field="optimum" value={unitPrices.optimum} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.optimum}
                  onChange={(e) => handleQuantityChange('optimum', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.optimum)}
                </span>
              </div>
            </div>

            {/* Feuilles de tôles */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Feuilles de tôles</div>
                <PriceEditor field="feuillesToles" value={unitPrices.feuillesToles} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.feuillesToles}
                  onChange={(e) => handleQuantityChange('feuillesToles', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.feuillesToles)}
                </span>
              </div>
            </div>

            {/* Déchets/Traileur */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Déchets/Traileur</div>
                <PriceEditor field="detraileur" value={unitPrices.detraileur} unit="/un" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.detraileur}
                  onChange={(e) => handleQuantityChange('detraileur', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-blue-600 text-xs w-14 text-right">
                  ${formatCompact(results.detraileur)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 2 - Matériaux ORANGE */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Matériaux secondaires</h3>
          <div className="space-y-2">
            {/* Autres */}
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Autres / Extras</div>
                <div className="text-xs text-gray-500">
                  propane/gaz/clous/etc ({Math.ceil(mainOeuvre.nbHeures / 9)}j)
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <span className="text-xs text-gray-500">$</span>
                <input
                  type="number"
                  value={quantities.autresTotal === 0 ? '' : quantities.autresTotal}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    handleQuantityChange('autresTotal', value)
                  }}
                  className="w-16 px-1 py-1 text-center border border-orange-300 bg-orange-50 rounded text-sm font-medium"
                  min="0"
                  step="1"
                  placeholder=""
                  title="Montant automatique basé sur les jours de travail - modifiable manuellement"
                />
                <span className="font-bold text-orange-600 text-xs w-16 text-right">
                  ${unitPrices.autres}×{Math.ceil(mainOeuvre.nbHeures / 9)}j
                </span>
              </div>
            </div>
            
            {/* Evac Supreme combiné avec prix modifiables */}
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Evac Supreme</div>
                <div className="flex items-center space-x-2 mt-1">
                  <select
                    value={quantities.evacSupremeType}
                    onChange={(e) => setQuantities(prev => ({ ...prev, evacSupremeType: e.target.value }))}
                    className="text-xs border border-orange-300 rounded px-1 py-0.5"
                  >
                    <option value="1s4">1s 4"</option>
                    <option value="2s4">2s 4"</option>
                    <option value="1s6">1s 6"</option>
                  </select>
                  <PriceEditor 
                    field={quantities.evacSupremeType === '1s4' ? 'evacSupreme1s4' : 
                           quantities.evacSupremeType === '2s4' ? 'evacSupreme2s4' : 'evacSupreme1s6'} 
                    value={getCurrentEvacSupremePrice()} 
                    unit="/un" 
                    color="orange"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.evacSupreme}
                  onChange={(e) => handleQuantityChange('evacSupreme', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-orange-600 text-xs w-14 text-right">
                  ${formatCompact(results.evacSupreme)}
                </span>
              </div>
            </div>

            {/* Puit de lumière avec prix modifiable */}
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Puit de lumière</div>
                <PriceEditor field="puitLumiereParPied" value={unitPrices.puitLumiereParPied} unit="/pi lin" color="orange" />
                {prefilledData?.toiture?.puitsLumiere && prefilledData.toiture.puitsLumiere.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Auto: {quantities.puitLumiereLineaire} pi
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.puitLumiereLineaire}
                  onChange={(e) => handleQuantityChange('puitLumiereLineaire', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  title="Nombre de pieds linéaires"
                />
                <span className="text-xs text-gray-500">pi</span>
                <span className="font-bold text-orange-600 text-xs w-14 text-right">
                  ${formatCompact(results.puitLumiere)}
                </span>
              </div>
            </div>
          </div>

          {/* Section Soumission personnalisée dans la même colonne */}
          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-500" />
              Soumission personnalisée
            </h4>

            {/* Total personnalisé avec nombres plus gros */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                TOTAL (avant profit)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                <input
                  type="number"
                  value={customTotal}
                  onChange={(e) => setCustomTotal(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-green-300 rounded-lg text-xl font-bold text-center bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            {/* Affichage des calculs avec nombres plus gros */}
            <div className="space-y-2">
              <div className="p-3 bg-green-100 rounded border border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Profit total</span>
                  <span className="text-lg font-bold text-green-700">${formatCurrency(customValues.profitTotal)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Profit calculé ({formData.profitPercent}% de ${formatCurrency(results.sousTotal - results.administration)}): ${formatCurrency(results.profit)}
                  <br/>+ Différence: ${formatCurrency(customValues.difference)}
                </div>
              </div>

              {/* Taxes */}
              <div className="space-y-1 p-3 bg-gray-50 rounded text-sm">
                <div className="flex justify-between">
                  <span>T.P.S (5%)</span>
                  <span className="font-medium text-base">${formatCurrency(customValues.tps)}</span>
                </div>
                <div className="flex justify-between">
                  <span>T.V.Q (9.975%)</span>
                  <span className="font-medium text-base">${formatCurrency(customValues.tvq)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total avec taxes</span>
                  <span className="text-blue-700 text-lg">${formatCurrency(customValues.totalWithTaxes)}</span>
                </div>
              </div>

              {/* Prix au pi² */}
              <div className="p-3 bg-purple-50 rounded border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Prix au pi²</span>
                  <span className="text-base font-bold text-purple-700">${customValues.pricePerSqFt.toFixed(2)}/pi²</span>
                </div>
                <div className="text-xs text-gray-500">
                  Sur {Math.round(parseFloat(formData.superficie) + parseFloat(formData.parapets))} pi²
                </div>
              </div>

              {/* Profit par jour */}
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit/jour</span>
                  <span className="text-base font-bold text-green-700">${formatCurrency(customValues.profitPerDay)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {mainOeuvre.nbHeures}h = {(mainOeuvre.nbHeures / 9).toFixed(1)}j
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 3 - Paramètres et Totaux */}
        <div className="space-y-4">
          {/* Section Paramètres */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-blue-500" />
              Paramètres du projet
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Superficie toiture intérieure (pi²)
                </label>
                <input
                  type="text"
                  value={formData.superficie || ''}
                  onChange={(e) => handleFormChange('superficie', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Superficie parapets (pi²)
                </label>
                <input
                  type="text"
                  value={formData.parapets || ''}
                  onChange={(e) => handleFormChange('parapets', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Superficie totale (pi²)
                </label>
                <div className="w-full px-2 py-1 border-2 border-blue-400 bg-blue-50 rounded text-sm font-semibold text-blue-700">
                  {Math.round((parseFloat(formData.superficie) || 0) + (parseFloat(formData.parapets) || 0))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Complexité du projet
                </label>
                <select
                  value={formData.complexite}
                  onChange={(e) => handleFormChange('complexite', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Facile">Facile</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Complexe">Complexe</option>
                </select>
              </div>
            </div>

            {/* Temps estimé */}
            {formData.superficie > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs text-blue-700">
                  <div className="font-semibold">⏱️ Temps estimé auto</div>
                  <div>Cat: {Math.round(formData.superficie) < 1500 ? 'Petite' : Math.round(formData.superficie) < 3000 ? 'Moyenne' : 'Grande'}</div>
                  <div className="font-bold">{mainOeuvre.nbHeures}h</div>
                </div>
              </div>
            )}
          </div>

          {/* Section Totaux */}
          <div className="bg-white rounded-lg border shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Résumé des prix</h3>
              <button
                onClick={resetPrices}
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                title="Réinitialiser tous les prix aux valeurs par défaut"
              >
                Réinitialiser prix
              </button>
            </div>
            
            {/* Sous-total SANS administration */}
            <div className="p-2 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">SOUS-TOTAL (avant admin)</span>
                <span className="font-bold">${formatCurrency(results.sousTotal - results.administration)}</span>
              </div>
            </div>

            {/* Profit calculé sur sous-total SANS admin */}
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">Profit</span>
                  <input
                    type="number"
                    value={formData.profitPercent}
                    onChange={(e) => handleFormChange('profitPercent', parseFloat(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-center border border-yellow-300 rounded text-xs"
                    min="0"
                    max="100"
                  />
                  <span className="text-xs">%</span>
                </div>
                <span className="font-bold text-yellow-700">${formatCurrency(results.profit)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Calculé sur ${formatCurrency(results.sousTotal - results.administration)}
              </div>
            </div>

            {/* Administration */}
            <div className="p-2 bg-purple-50 rounded border border-purple-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">Admin</span>
                  <input
                    type="number"
                    value={unitPrices.administration}
                    onChange={(e) => handleUnitPriceChange('administration', e.target.value)}
                    className="w-12 px-1 py-0.5 text-center border border-purple-300 rounded text-xs"
                    min="1"
                  />
                  <span className="text-xs text-gray-600">×{mainOeuvre.nbHeures}h</span>
                </div>
                <span className="font-bold text-purple-700">${formatCurrency(results.administration)}</span>
              </div>
            </div>
            
            {/* Total final */}
            <div className="p-3 bg-blue-100 rounded border border-blue-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-xl font-bold text-blue-700">${formatCurrency(results.total)}</span>
              </div>
            </div>

            {/* Taxes */}
            <div className="space-y-1 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>T.P.S (5%)</span>
                <span className="font-medium">${formatCurrency(results.total * 0.05)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>T.V.Q (9.975%)</span>
                <span className="font-medium">${formatCurrency(results.total * 0.09975)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1 border-t">
                <span>Total avec taxes</span>
                <span className="text-blue-700">${formatCurrency(results.total * 1.14975)}</span>
              </div>
            </div>

            {/* Profit par jour */}
            <div className="p-2 bg-green-50 rounded border border-green-200 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-700">Profit/jour</span>
                <span className="text-sm font-bold text-green-700">
                  ${formatCurrency(results.profit / Math.max(1, mainOeuvre.nbHeures / 9))}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {mainOeuvre.nbHeures}h = {(mainOeuvre.nbHeures / 9).toFixed(1)} jour(s)
              </div>
            </div>

            {/* ✅ BOUTONS D'ACTION AVEC NOUVEAU BOUTON PDF MODIFIÉ */}
            <div className="flex space-x-2 pt-3">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium text-sm"
              >
                <Save className="w-4 h-4 mr-1" />
                Sauvegarder
              </button>
              
              {/* ✅ BOUTON PDF AVEC DONNÉES SAUVEGARDÉES ET CUSTOM TOTAL */}
              <SoumissionPDFButton 
                calculationData={lastCalculationData || {
                  inputs: formData,
                  results: results,
                  customSubmission: customTotal && parseFloat(customTotal) > 0 ? {
                    total: parseFloat(customTotal),
                    profitPercent: formData.profitPercent,
                    ...customValues
                  } : null
                }}
                submissionData={{
                  client: prefilledData?.client || {},
                  notes: prefilledData?.notes || ''
                }}
                customTotal={customTotal}
                customValues={customValues}
                onOpenPDFForm={handleOpenPDFForm}
              />
              
              <button
                onClick={resetCalculator}
                className="flex items-center justify-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                title="Réinitialiser le calculateur"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid avec photos EXTRA GRANDES - Seulement si photos existent */}
      {prefilledData?.photos && prefilledData.photos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {prefilledData.photos.map((photo, index) => {
              const photoUrl = typeof photo === 'string' ? photo : photo.uri || photo.url;
              
              return (
                <div key={index} className="relative group">
                  {/* Container photo avec ratio plus grand (18:12) */}
                  <div className="aspect-[18/12] rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-2xl">
                    <img 
                      src={photoUrl} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                      onClick={() => window.open(photoUrl, '_blank')}
                      style={{
                        imageRendering: 'high-quality',
                        WebkitImageRendering: 'high-quality'
                      }}
                    />
                    
                    {/* Overlay avec effet au hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Bouton agrandir simple qui fonctionne */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                         onClick={() => window.open(photoUrl, '_blank')}>
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                    
                    {/* Instructions au bas - plus discrètes */}
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <div className="bg-black/60 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-medium">Cliquer pour ouvrir en plein écran</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info simplifiée sous la photo */}
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600">
                      Photo {index + 1} • Cliquez pour agrandir
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Résumé simplifié des photos */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium text-gray-800">
                    {prefilledData.photos.length} photo{prefilledData.photos.length > 1 ? 's' : ''} disponible{prefilledData.photos.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    • Prises sur le terrain
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  💡 Cliquez sur une photo pour l'agrandir
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Message si pas de photos
        <div className="mt-8 bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucune photo disponible</p>
          <p className="text-sm text-gray-500 mt-2">Les photos seront affichées ici quand disponibles</p>
        </div>
      )}
    </div>
  )
}

export default CalculatorView