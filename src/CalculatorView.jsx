import React, { useState, useEffect } from 'react'
import { Calculator, Save, RefreshCw, FileText } from 'lucide-react'

const CalculatorView = ({ prefilledData = null, onSaveCalculation = null }) => {
  const [formData, setFormData] = useState({
    superficie: prefilledData?.superficie || 0,
    parapets: prefilledData?.parapets || 0,
    useArmourCool: true,
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
    jours: 1,
  })

  const [results, setResults] = useState({
    mainOeuvre: 0,
    fastNStick: 0,
    armourCoolOrTorchflex: 0,
    optimum: 0,
    securePan: 0,
    drains: 0,
    events: 0,
    armourBond: 0,
    tp180ff: 0,
    detraileur: 0,
    autres: 0,
    evacSupreme1: 0,
    evacSupreme2: 0,
    sousTotal: 0,
    total: 0
  })

  const [unitPrices, setUnitPrices] = useState({
    fastNStick: 98,
    armourCoolHD: 132,
    torchflex: 74,
    optimum: 92,
    securePan: 18,
    drains: 58,
    events: 22,
    armourBond: 118,
    detraileur: 725,
    autres: 150,
    evacSupreme1: 219,
    evacSupreme2: 213,
    tp180ff: 78,
    mainOeuvreHeure: 25
  })

  const [mainOeuvre, setMainOeuvre] = useState({
    nbGars: 2,
    nbHeures: 8
  })

  const noSpinnerStyle = {
    WebkitAppearance: 'textfield',
    MozAppearance: 'textfield',
    appearance: 'textfield'
  }

  useEffect(() => {
    calculateQuantitiesAndPrices()
  }, [formData])

  useEffect(() => {
    calculatePrices()
  }, [quantities, unitPrices, mainOeuvre])

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
      drains: quantities.drains * unitPrices.drains,
      events: quantities.events * unitPrices.events,
      armourBond: quantities.armourBond * unitPrices.armourBond,
      tp180ff: quantities.tp180ff * unitPrices.tp180ff,
      detraileur: quantities.detraileur * unitPrices.detraileur,
      autres: quantities.jours * unitPrices.autres,
      evacSupreme1: quantities.evacSupreme1 * unitPrices.evacSupreme1,
      evacSupreme2: quantities.evacSupreme2 * unitPrices.evacSupreme2,
      sousTotal: 0,
      total: 0
    }
    
    newResults.sousTotal = Object.values(newResults).reduce((sum, value, index) => {
      if (index < Object.values(newResults).length - 2) {
        return sum + value
      }
      return sum
    }, 0)
    
    newResults.total = newResults.sousTotal
    setResults(newResults)
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleQuantityChange = (field, value) => {
    setQuantities(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
  }

  const handleUnitPriceChange = (field, value) => {
    setUnitPrices(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  const handleMainOeuvreChange = (field, value) => {
    setMainOeuvre(prev => ({ ...prev, [field]: parseInt(value) || 0 }))
  }

  const handleSave = () => {
    if (onSaveCalculation) {
      onSaveCalculation({
        inputs: { ...formData, quantities, mainOeuvre },
        results: results,
        calculatedAt: new Date()
      })
    } else {
      console.log('💾 Calcul sauvegardé:', { formData, quantities, results, mainOeuvre })
      alert('Calcul sauvegardé localement !')
    }
  }

  const resetCalculator = () => {
    setFormData({ superficie: 0, parapets: 0, useArmourCool: true })
    setQuantities({
      fastNStick: 0, armourCoolOrTorchflex: 0, securePan: 0, armourBond: 0,
      optimum: 0, drains: 0, events: 0, detraileur: 1, evacSupreme1: 0,
      evacSupreme2: 0, tp180ff: 0, jours: 1
    })
    setMainOeuvre({ nbGars: 2, nbHeures: 8 })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-500" />
            Matériaux et calculs
          </h3>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-800 mb-3">Main d'œuvre</h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-green-700 mb-1">Nb gars</label>
                  <input
                    type="text"
                    value={mainOeuvre.nbGars || ''}
                    onChange={(e) => handleMainOeuvreChange('nbGars', e.target.value)}
                    className="w-full px-2 py-1 text-center border border-green-300 rounded"
                    placeholder="1"
                    style={noSpinnerStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs text-green-700 mb-1">Heures</label>
                  <input
                    type="text"
                    value={mainOeuvre.nbHeures || ''}
                    onChange={(e) => handleMainOeuvreChange('nbHeures', e.target.value)}
                    className="w-full px-2 py-1 text-center border border-green-300 rounded"
                    placeholder="1"
                    style={noSpinnerStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs text-green-700 mb-1">Prix/h</label>
                  <input
                    type="text"
                    value={unitPrices.mainOeuvreHeure || ''}
                    onChange={(e) => handleUnitPriceChange('mainOeuvreHeure', e.target.value)}
                    className="w-full px-2 py-1 text-center border border-green-300 rounded"
                    placeholder="1"
                    style={noSpinnerStyle}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <span className="text-sm text-green-800">
                  {mainOeuvre.nbGars} × {mainOeuvre.nbHeures} × ${unitPrices.mainOeuvreHeure}
                </span>
                <span className="font-bold text-green-900">${results.mainOeuvre.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <span className="font-medium text-blue-900">Fast-N-Stick 180-FS</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.fastNStick || ''}
                    onChange={(e) => handleUnitPriceChange('fastNStick', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-blue-600">/rouleau</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.fastNStick || ''}
                  onChange={(e) => handleQuantityChange('fastNStick', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-blue-600">×</span>
                <span className="font-bold text-blue-800 w-20 text-right">
                  ${results.fastNStick.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <span className="font-medium text-blue-900">
                  {formData.useArmourCool ? 'ArmourCool HD-Cap' : 'Torchflex TP-250'}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-600">$</span>
                  <input
                    type="text"
                    value={formData.useArmourCool ? unitPrices.armourCoolHD : unitPrices.torchflex}
                    onChange={(e) => handleUnitPriceChange(
                      formData.useArmourCool ? 'armourCoolHD' : 'torchflex', e.target.value
                    )}
                    className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-blue-600">/rouleau</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.armourCoolOrTorchflex || ''}
                  onChange={(e) => handleQuantityChange('armourCoolOrTorchflex', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-blue-600">×</span>
                <span className="font-bold text-blue-800 w-20 text-right">
                  ${results.armourCoolOrTorchflex.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <span className="font-medium text-blue-900">SecurePan</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.securePan || ''}
                    onChange={(e) => handleUnitPriceChange('securePan', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-blue-600">/unité</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.securePan || ''}
                  onChange={(e) => handleQuantityChange('securePan', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-blue-600">×</span>
                <span className="font-bold text-blue-800 w-20 text-right">
                  ${results.securePan.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">📱 Données terrain</h4>
              
              <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg mb-3">
                <div className="flex-1">
                  <span className="font-medium text-blue-900">Optimum 102</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-blue-600">$</span>
                    <input
                      type="text"
                      value={unitPrices.optimum || ''}
                      onChange={(e) => handleUnitPriceChange('optimum', e.target.value)}
                      className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                      style={noSpinnerStyle}
                    />
                    <span className="text-xs text-blue-600">/unité</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={quantities.optimum || ''}
                    onChange={(e) => handleQuantityChange('optimum', e.target.value)}
                    className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                    placeholder="0"
                    style={noSpinnerStyle}
                  />
                  <span className="text-sm text-blue-600">×</span>
                  <span className="font-bold text-blue-800 w-20 text-right">
                    ${results.optimum.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg mb-3">
                <div className="flex-1">
                  <span className="font-medium text-blue-900">Drains</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-blue-600">$</span>
                    <input
                      type="text"
                      value={unitPrices.drains || ''}
                      onChange={(e) => handleUnitPriceChange('drains', e.target.value)}
                      className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                      style={noSpinnerStyle}
                    />
                    <span className="text-xs text-blue-600">/unité</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={quantities.drains || ''}
                    onChange={(e) => handleQuantityChange('drains', e.target.value)}
                    className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                    placeholder="0"
                    style={noSpinnerStyle}
                  />
                  <span className="text-sm text-blue-600">×</span>
                  <span className="font-bold text-blue-800 w-20 text-right">
                    ${results.drains.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-blue-900">Évents</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-blue-600">$</span>
                    <input
                      type="text"
                      value={unitPrices.events || ''}
                      onChange={(e) => handleUnitPriceChange('events', e.target.value)}
                      className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                      style={noSpinnerStyle}
                    />
                    <span className="text-xs text-blue-600">/unité</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={quantities.events || ''}
                    onChange={(e) => handleQuantityChange('events', e.target.value)}
                    className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                    placeholder="0"
                    style={noSpinnerStyle}
                  />
                  <span className="text-sm text-blue-600">×</span>
                  <span className="font-bold text-blue-800 w-20 text-right">
                    ${results.events.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <span className="font-medium text-blue-900">ArmourBond 180</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.armourBond || ''}
                    onChange={(e) => handleUnitPriceChange('armourBond', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-blue-600">/rouleau</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.armourBond || ''}
                  onChange={(e) => handleQuantityChange('armourBond', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-blue-600">×</span>
                <span className="font-bold text-blue-800 w-20 text-right">
                  ${results.armourBond.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <span className="font-medium text-blue-900">TP-180-FF</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-blue-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.tp180ff || ''}
                    onChange={(e) => handleUnitPriceChange('tp180ff', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-blue-300 rounded bg-white"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-blue-600">/unité</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.tp180ff || ''}
                  onChange={(e) => handleQuantityChange('tp180ff', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-blue-300 rounded bg-white"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-blue-600">×</span>
                <span className="font-bold text-blue-800 w-20 text-right">
                  ${results.tp180ff.toLocaleString()}
                </span>
              </div>
            </div>

            <hr className="my-4" />

            <h4 className="font-semibold text-gray-800 mb-3">Quantités manuelles</h4>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <span className="font-medium text-gray-900">Déchets/Traileur</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-orange-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.detraileur || ''}
                    onChange={(e) => handleUnitPriceChange('detraileur', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-orange-300 rounded"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-orange-600">/unité</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.detraileur || ''}
                  onChange={(e) => handleQuantityChange('detraileur', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-orange-300 rounded"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-orange-600">×</span>
                <span className="font-bold text-orange-800 w-20 text-right">
                  ${results.detraileur.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <span className="font-medium text-gray-900">Autres</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-orange-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.autres || ''}
                    onChange={(e) => handleUnitPriceChange('autres', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-orange-300 rounded"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-orange-600">/jour</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.jours || ''}
                  onChange={(e) => handleQuantityChange('jours', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-orange-300 rounded"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-orange-600">×</span>
                <span className="font-bold text-orange-800 w-20 text-right">
                  ${results.autres.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <span className="font-medium text-gray-900">Evac Supreme 1 sortie</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-orange-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.evacSupreme1 || ''}
                    onChange={(e) => handleUnitPriceChange('evacSupreme1', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-orange-300 rounded"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-orange-600">/unité</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.evacSupreme1 || ''}
                  onChange={(e) => handleQuantityChange('evacSupreme1', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-orange-300 rounded"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-orange-600">×</span>
                <span className="font-bold text-orange-800 w-20 text-right">
                  ${results.evacSupreme1.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-1">
                <span className="font-medium text-gray-900">Evac Supreme 2 sorties</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-orange-600">$</span>
                  <input
                    type="text"
                    value={unitPrices.evacSupreme2 || ''}
                    onChange={(e) => handleUnitPriceChange('evacSupreme2', e.target.value)}
                    className="w-16 px-1 py-0.5 text-xs border border-orange-300 rounded"
                    style={noSpinnerStyle}
                  />
                  <span className="text-xs text-orange-600">/unité</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={quantities.evacSupreme2 || ''}
                  onChange={(e) => handleQuantityChange('evacSupreme2', e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-orange-300 rounded"
                  placeholder="0"
                  style={noSpinnerStyle}
                />
                <span className="text-sm text-orange-600">×</span>
                <span className="font-bold text-orange-800 w-20 text-right">
                  ${results.evacSupreme2.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center p-4 bg-toiture-50 rounded-lg">
              <span className="text-xl font-bold text-gray-900">TOTAL</span>
              <span className="text-3xl font-bold text-toiture-600">${results.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-toiture-500 text-white rounded-md hover:bg-toiture-600 transition-colors font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </button>
            <button
              onClick={resetCalculator}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-toiture-500" />
            Paramètres du projet
          </h3>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Superficie toiture (pi²)
              </label>
              <input
                type="text"
                value={formData.superficie || ''}
                onChange={(e) => handleFormChange('superficie', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-toiture-500"
                placeholder="0"
                style={noSpinnerStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Superficie parapets (pi²)
              </label>
              <input
                type="text"
                value={formData.parapets || ''}
                onChange={(e) => handleFormChange('parapets', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-toiture-500"
                placeholder="0"
                style={noSpinnerStyle}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de membrane
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  checked={formData.useArmourCool}
                  onChange={() => handleFormChange('useArmourCool', true)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">ArmourCool HD-Cap</span>
                  <span className="text-sm text-gray-500 block">${unitPrices.armourCoolHD}/rouleau</span>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  checked={!formData.useArmourCool}
                  onChange={() => handleFormChange('useArmourCool', false)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Torchflex TP-250</span>
                  <span className="text-sm text-gray-500 block">${unitPrices.torchflex}/rouleau</span>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Informations</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Calculs basés sur formules FastNstick 2025</p>
              <p>• Quantités arrondies au supérieur + 10% perte</p>
            </div>
          </div>

          {prefilledData && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">📱 Données du terrain</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>Superficie: {prefilledData.superficie} pi²</p>
                <p>Parapets: {prefilledData.parapets} pi²</p>
                <p>Optimum: {prefilledData.nbMax}</p>
                <p>Drains: {prefilledData.nbDrains}</p>
                <p>Évents: {prefilledData.nbEvents}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Résumé</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Matériaux:</span>
                <span>${(results.total - results.mainOeuvre).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Main d'œuvre:</span>
                <span>${results.mainOeuvre.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>TOTAL:</span>
                <span className="text-toiture-600">${results.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalculatorView