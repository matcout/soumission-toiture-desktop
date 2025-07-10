import React, { useState, useEffect } from 'react'
import { Calculator, Save, RefreshCw, FileText } from 'lucide-react'

const CalculatorView = ({ prefilledData = null, onSaveCalculation = null }) => {
  const [formData, setFormData] = useState({
    superficie: prefilledData?.superficie || 0,
    parapets: prefilledData?.parapets || 0,
    useArmourCool: true,
    profitPercent: 30,
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
    mainOeuvreHeure: 90,
    administration: 225
  })

  const [mainOeuvre, setMainOeuvre] = useState({
    nbGars: 4,
    nbHeures: 8
  })

  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    calculateQuantitiesAndPrices()
  }, [formData])

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
      autres: quantities.jours * unitPrices.autres,
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
        inputs: { ...formData, quantities },
        results: results,
        calculatedAt: new Date()
      })
    } else {
      console.log('💾 Calcul sauvegardé:', { formData, quantities, results })
      alert('Calcul sauvegardé localement !')
    }
  }

  const resetCalculator = () => {
    setFormData({
      superficie: 0,
      parapets: 0,
      useArmourCool: true,
      profitPercent: 30,
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
      jours: 1,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Colonne gauche - Matériaux */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-500" />
            Matériaux et calculs
          </h3>  
          
          <div className="space-y-4">
            {/* Main d'œuvre - COMPACT */}
            <div className="p-1 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-0">Main d'œuvre</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nb gars</label>
                  <input
                    type="number"
                    value={mainOeuvre.nbGars}
                    onChange={(e) => handleMainOeuvreChange('nbGars', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Heures</label>
                  <input
                    type="number"
                    value={mainOeuvre.nbHeures}
                    onChange={(e) => handleMainOeuvreChange('nbHeures', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prix/h ($)</label>
                  <input
                    type="number"
                    value={unitPrices.mainOeuvreHeure}
                    onChange={(e) => handleUnitPriceChange('mainOeuvreHeure', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    min="1"
                  />
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm font-bold text-green-700">
                  Total: ${results.mainOeuvre.toLocaleString()}
                </span>
              </div>
            </div>

            {/* MATÉRIAUX EN 2 COLONNES */}
            <div className="grid grid-cols-2 gap-3">
              {/* COLONNE GAUCHE - MATÉRIAUX BLEUS */}
              <div className="space-y-2">
                {/* Fast-N-Stick */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Fast-N-Stick 180-FS</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.fastNStick}/rouleau</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.fastNStick}
                      onChange={(e) => handleQuantityChange('fastNStick', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.fastNStick.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ArmourCool / Torchflex */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {formData.useArmourCool ? 'ArmourCool HD-Cap' : 'Torchflex TP-250'}
                        </span>
                        <span className="text-xs text-blue-600 block">
                          ${formData.useArmourCool ? unitPrices.armourCoolHD : unitPrices.torchflex}/rouleau
                        </span>
                      </div>
                      <label className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={!formData.useArmourCool}
                          onChange={() => handleFormChange('useArmourCool', !formData.useArmourCool)}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-600">Torchflex</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.armourCoolOrTorchflex}
                      onChange={(e) => handleQuantityChange('armourCoolOrTorchflex', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.armourCoolOrTorchflex.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* SecurePan */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">SecurePan</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.securePan}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.securePan}
                      onChange={(e) => handleQuantityChange('securePan', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.securePan.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ArmourBond */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">ArmourBond 180</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.armourBond}/rouleau</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.armourBond}
                      onChange={(e) => handleQuantityChange('armourBond', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.armourBond.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* TP-180-FF */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">TP-180-FF</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.tp180ff}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.tp180ff}
                      onChange={(e) => handleQuantityChange('tp180ff', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.tp180ff.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Drains */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Drains</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.drains}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.drains}
                      onChange={(e) => handleQuantityChange('drains', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.drains.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Évents */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Évents</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.events}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.events}
                      onChange={(e) => handleQuantityChange('events', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.events.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Optimum 102 */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Optimum 102</span>
                    <span className="text-xs text-blue-600 block">${unitPrices.optimum}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.optimum}
                      onChange={(e) => handleQuantityChange('optimum', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.optimum.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* COLONNE DROITE - MATÉRIAUX ORANGE */}
              <div className="space-y-2">
                {/* Déchets/Traileur */}
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Déchets/Traileur</span>
                    <span className="text-xs text-orange-600 block">${unitPrices.detraileur}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.detraileur}
                      onChange={(e) => handleQuantityChange('detraileur', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.detraileur.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Autres */}
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Autres</span>
                    <span className="text-xs text-orange-600 block">${unitPrices.autres}/jour</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.jours}
                      onChange={(e) => handleQuantityChange('jours', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.autres.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Evac Supreme 1 */}
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Evac Supreme 1 sortie 4"</span>
                    <span className="text-xs text-orange-600 block">${unitPrices.evacSupreme1}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.evacSupreme1}
                      onChange={(e) => handleQuantityChange('evacSupreme1', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.evacSupreme1.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Evac Supreme 2 */}
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 text-sm">Evac Supreme 2 sorties 4"</span>
                    <span className="text-xs text-orange-600 block">${unitPrices.evacSupreme2}/unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={quantities.evacSupreme2}
                      onChange={(e) => handleQuantityChange('evacSupreme2', e.target.value)}
                      className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">×</span>
                    <span className="font-bold text-toiture-600 text-xs w-16 text-right">
                      ${results.evacSupreme2.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite - Paramètres et totaux */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-toiture-500" />
            Paramètres du projet
          </h3>
          
          {/* Superficie */}
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
              />
            </div>
          </div>

          {/* TOTAUX */}
          <div className="space-y-4">
            {/* Sous-total */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">SOUS-TOTAL</span>
                <span className="text-xl font-bold text-gray-700">${formatCurrency(results.sousTotal)}</span>
              </div>
            </div>

            {/* Administration */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900">Administration</span>
                  <input
                    type="number"
                    value={unitPrices.administration}
                    onChange={(e) => handleUnitPriceChange('administration', e.target.value)}
                    className="w-16 px-2 py-1 text-center border border-purple-300 rounded text-sm"
                    min="1"
                  />
                  <span className="text-sm text-gray-600">× {mainOeuvre.nbHeures}h</span>
                </div>
                <span className="text-xl font-bold text-purple-700">${formatCurrency(results.administration)}</span>
              </div>
            </div>

            {/* Profit affiché avec contrôle % */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900">Profit</span>
                  <input
                    type="number"
                    value={formData.profitPercent}
                    onChange={(e) => handleFormChange('profitPercent', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-center border border-yellow-300 rounded text-sm"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <span className="text-xl font-bold text-yellow-700">${formatCurrency(results.profit)}</span>
              </div>
            </div>
            
            {/* Total final */}
            <div className="p-4 bg-toiture-50 rounded-lg border border-toiture-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">TOTAL FINAL</span>
                <span className="text-3xl font-bold text-toiture-600">${formatCurrency(results.total)}</span>
              </div>
            </div>

            {/* TPS */}
            <div className="p-4 bg-toiture-50 rounded-lg border border-toiture-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">T.P.S</span>
                <span className="text-3xl font-bold text-toiture-600">${formatCurrency(results.total * 0.05)}</span>
              </div>
            </div>

            {/* TVQ */}
            <div className="p-4 bg-toiture-50 rounded-lg border border-toiture-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">T.V.Q</span>
                <span className="text-3xl font-bold text-toiture-600">${formatCurrency(results.total * 0.09975)}</span>
              </div>
            </div>

            {/* Total avec taxe */}
            <div className="p-4 bg-toiture-50 rounded-lg border border-toiture-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total avec taxe</span>
                <span className="text-3xl font-bold text-toiture-600">${formatCurrency(results.total * 1.14975)}</span>
              </div>
            </div>

            {/* Profit par jour */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Profit par jour</span>
                <span className="text-lg font-bold text-blue-600">
                  ${formatCurrency(results.profit / (mainOeuvre.nbHeures / 8))}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Basé sur {mainOeuvre.nbHeures}h = {(mainOeuvre.nbHeures / 8).toFixed(1)} jour(s)
              </div>
            </div>

            {/* Boutons d'action */}
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
      </div>
    </div>
  )
}

export default CalculatorView