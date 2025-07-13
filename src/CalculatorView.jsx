import React, { useState, useEffect } from 'react'
import { Calculator, Save, RefreshCw, FileText } from 'lucide-react'

const CalculatorView = ({ prefilledData = null, onSaveCalculation = null }) => {
  const [formData, setFormData] = useState({
    superficie: prefilledData?.superficie || 0,
    parapets: prefilledData?.parapets || 0,
    useArmourCool: true,
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
    detraileur: 1,
    evacSupreme1: 0,
    evacSupreme2: 0,
    tp180ff: 0,
    autresTotal: 0, // Montant total direct pour "Autres"
  })

  const [results, setResults] = useState({
    fastNStick: 0,
    armourCoolOrTorchflex: 0,
    optimum: 0,
    securePan: 0,
    armourBond: 0,
    tp180ff: 0,
    drains: 0,
    events: 0,
    detraileur: 0,
    autres: 0,
    evacSupreme1: 0,
    evacSupreme2: 0,
    mainOeuvre: 0,
    administration: 0,
    sousTotal: 0,
    profit: 0,
    total: 0
  })

  const defaultPrices = {
    fastNStick: 98,
    armourCoolHD: 132,
    torchflex: 74,
    optimum: 92,
    securePan: 18,
    drains: 58,
    events: 22,
    armourBond: 118,
    detraileur: 725,
    autres: 150, // Prix par jour de référence seulement
    evacSupreme1: 219,
    evacSupreme2: 213,
    tp180ff: 78,
    mainOeuvreHeure: 90,
    administration: 225
  }

  // Charger les prix sauvegardés du localStorage au démarrage
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

  const [editingPrice, setEditingPrice] = useState(null)

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

  // Fonction pour calculer le temps estimé
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
      "Petite": { "Facile": 0.79, "Moyen": 1.0, "Complexe": 1.2 },
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
    
    if (formData.superficie > 0) {
      const tempsEstime = calculerTempsEstime(formData.superficie, formData.complexite);
      setMainOeuvre(prev => ({
        ...prev,
        nbHeures: tempsEstime.heures
      }));
    }
  }, [formData.superficie, formData.parapets, formData.complexite])

  // Suggérer un montant pour "Autres" basé sur les heures
useEffect(() => {
  const joursCalcules = Math.ceil(mainOeuvre.nbHeures / 8)
  const montantSuggere = joursCalcules * unitPrices.autres
  
  // Toujours appliquer le montant suggéré automatiquement
  setQuantities(prev => ({ ...prev, autresTotal: montantSuggere }))
}, [mainOeuvre.nbHeures, unitPrices.autres])

  useEffect(() => {
    calculatePrices()
  }, [quantities, unitPrices, mainOeuvre, formData.profitPercent])

  const calculateQuantitiesAndPrices = () => {
    const superficie = parseFloat(formData.superficie) || 0
    const parapets = parseFloat(formData.parapets) || 0
    
    const fastNStickQty = Math.ceil((superficie / 140) * 1.1)
    const armourQty = Math.ceil(((superficie + parapets) / 78) * 1.1)
    const securePanQty = Math.ceil((superficie / 32) * 1.1)
    const armourBondQty = Math.ceil((parapets / 98) * 1.1)
    
    setQuantities(prev => ({
      ...prev,
      fastNStick: fastNStickQty,
      armourCoolOrTorchflex: armourQty,
      securePan: securePanQty,
      armourBond: armourBondQty
    }))
  }

  const calculatePrices = () => {
    const armourPrice = formData.useArmourCool ? unitPrices.armourCoolHD : unitPrices.torchflex
    
    const newResults = {
      mainOeuvre: mainOeuvre.nbGars * mainOeuvre.nbHeures * unitPrices.mainOeuvreHeure,
      fastNStick: quantities.fastNStick * unitPrices.fastNStick,
      armourCoolOrTorchflex: quantities.armourCoolOrTorchflex * armourPrice,
      optimum: quantities.optimum * unitPrices.optimum,
      securePan: quantities.securePan * unitPrices.securePan,
      armourBond: quantities.armourBond * unitPrices.armourBond,
      tp180ff: quantities.tp180ff * unitPrices.tp180ff,
      drains: quantities.drains * unitPrices.drains,
      events: quantities.events * unitPrices.events,
      detraileur: quantities.detraileur * unitPrices.detraileur,
      autres: quantities.autresTotal, // Utiliser le montant direct
      evacSupreme1: quantities.evacSupreme1 * unitPrices.evacSupreme1,
      evacSupreme2: quantities.evacSupreme2 * unitPrices.evacSupreme2,
      administration: mainOeuvre.nbHeures * unitPrices.administration,
      sousTotal: 0,
      profit: 0,
      total: 0
    }
    
    newResults.sousTotal = Object.values(newResults).reduce((sum, value, index) => {
      if (index < Object.values(newResults).length - 3) {
        return sum + value
      }
      return sum
    }, 0)
    
    newResults.profit = newResults.sousTotal * (formData.profitPercent / 100)
    newResults.total = newResults.sousTotal + newResults.profit
    
    setResults(newResults)
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleQuantityChange = (field, value) => {
    // Pour autresTotal, accepter les décimales
    if (field === 'autresTotal') {
      setQuantities(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
    } else {
      setQuantities(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
    }
  }

  const handleUnitPriceChange = (field, value) => {
    const newPrices = { ...unitPrices, [field]: parseFloat(value) || 0 }
    setUnitPrices(newPrices)
    
    // Sauvegarder les prix modifiés dans localStorage
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

  const handleSave = () => {
    if (onSaveCalculation) {
      onSaveCalculation({
        inputs: { ...formData, quantities, mainOeuvre },
        results: results,
        calculatedAt: new Date(),
        tempsEstime: mainOeuvre.nbHeures,
        complexite: formData.complexite
      })
    } else {
      console.log('💾 Calcul sauvegardé:', { formData, quantities, results, mainOeuvre })
      alert('Calcul sauvegardé localement !')
    }
  }

  const resetCalculator = () => {
    setFormData({
      superficie: 0,
      parapets: 0,
      useArmourCool: true,
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
      detraileur: 1,
      evacSupreme1: 0,
      evacSupreme2: 0,
      tp180ff: 0,
      autresTotal: 0,
    })
    setMainOeuvre({
      nbGars: 4,
      nbHeures: 8
    })
  }

  const resetPrices = () => {
    if (window.confirm('Réinitialiser tous les prix aux valeurs par défaut?')) {
      setUnitPrices(defaultPrices)
      localStorage.removeItem('calculatorPrices')
    }
  }

  return (
    <div className="w-full">
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
      <div className="grid grid-cols-3 gap-6">
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

            {/* ArmourCool / Torchflex */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {formData.useArmourCool ? 'ArmourCool HD' : 'Torchflex TP'}
                  </span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!formData.useArmourCool}
                      onChange={() => handleFormChange('useArmourCool', !formData.useArmourCool)}
                      className="rounded h-3 w-3"
                    />
                    <span className="text-xs text-gray-600 ml-1">Blanc Regulier</span>
                  </label>
                </div>
                <PriceEditor 
                  field={formData.useArmourCool ? "armourCoolHD" : "torchflex"} 
                  value={formData.useArmourCool ? unitPrices.armourCoolHD : unitPrices.torchflex} 
                  unit="/rlx" 
                />
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
          </div>
        </div>

        {/* Colonne 2 - Matériaux ORANGE */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Matériaux secondaires</h3>
          <div className="space-y-2">
            {/* Déchets/Traileur */}
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Déchets/Traileur</div>
                <PriceEditor field="detraileur" value={unitPrices.detraileur} unit="/un" color="orange" />
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
                <span className="font-bold text-orange-600 text-xs w-14 text-right">
                  ${formatCompact(results.detraileur)}
                </span>
              </div>
            </div>

{/* Autres */}
<div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
  <div className="flex-1 min-w-0">
    <div className="font-medium text-gray-900 text-sm truncate">Autres / Extras</div>
    <div className="text-xs text-gray-500">
      propane/gaz/clous/etc ({Math.ceil(mainOeuvre.nbHeures / 8)}j)
    </div>
  </div>
  <div className="flex items-center space-x-1 ml-2">
    <span className="text-xs text-gray-500">$</span>
    <input
      type="number"
      value={quantities.autresTotal === 0 ? '' : quantities.autresTotal}
      onChange={(e) => {
        // Permettre valeur vide ou nombre
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
      ${unitPrices.autres}×{Math.ceil(mainOeuvre.nbHeures / 8)}j
    </span>
  </div>
</div>
            {/* Evac Supreme 1 */}
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Evac Supreme 1s 4"</div>
                <PriceEditor field="evacSupreme1" value={unitPrices.evacSupreme1} unit="/un" color="orange" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.evacSupreme1}
                  onChange={(e) => handleQuantityChange('evacSupreme1', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-orange-600 text-xs w-14 text-right">
                  ${formatCompact(results.evacSupreme1)}
                </span>
              </div>
            </div>

            {/* Evac Supreme 2 */}
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">Evac Supreme 2s 4"</div>
                <PriceEditor field="evacSupreme2" value={unitPrices.evacSupreme2} unit="/un" color="orange" />
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <input
                  type="number"
                  value={quantities.evacSupreme2}
                  onChange={(e) => handleQuantityChange('evacSupreme2', e.target.value)}
                  className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                  min="0"
                />
                <span className="text-xs text-gray-500">×</span>
                <span className="font-bold text-orange-600 text-xs w-14 text-right">
                  ${formatCompact(results.evacSupreme2)}
                </span>
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
                  Superficie toiture (pi²)
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
                  <div>Cat: {formData.superficie < 1500 ? 'Petite' : formData.superficie < 3000 ? 'Moyenne' : 'Grande'}</div>
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
            
            {/* Sous-total */}
            <div className="p-2 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">SOUS-TOTAL</span>
                <span className="font-bold">${formatCurrency(results.sousTotal)}</span>
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

            {/* Profit */}
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
                  ${formatCurrency(results.profit / Math.max(1, mainOeuvre.nbHeures / 8))}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {mainOeuvre.nbHeures}h = {(mainOeuvre.nbHeures / 8).toFixed(1)} jour(s)
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-2 pt-3">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium text-sm"
              >
                <Save className="w-4 h-4 mr-1" />
                Sauvegarder
              </button>
              <button
                onClick={resetCalculator}
                className="flex items-center justify-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalculatorView