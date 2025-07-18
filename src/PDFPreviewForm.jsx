// PDFPreviewForm.jsx - Version interactive avec choix de langue FR/EN
import React, { useState } from 'react'
import { ArrowLeft, Download, Save, RotateCcw, Globe } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import SoumissionDocument from './SoumissionPDF'

const PDFPreviewForm = ({ initialData, onBack, onSave }) => {
  // ✅ NOUVEAU: État pour la langue
  const [language, setLanguage] = useState('fr') // 'fr' ou 'en'
  
  // État pour toutes les données - STRUCTURE COMPLÈTE
  const [formData, setFormData] = useState({
    // ✅ Informations client MISES À JOUR avec champs supplémentaires
    client: {
      nom: initialData?.client?.nom || '',
      nom2: initialData?.client?.nom2 || '', // ✅ NOUVEAU: Ligne 2 sous client
      nom3: initialData?.client?.nom3 || '', // ✅ NOUVEAU: Ligne 3 sous client
      adresse: initialData?.client?.adresse || '',
      telephone: initialData?.client?.telephone || '',
      telephone2: initialData?.client?.telephone2 || '', // ✅ NOUVEAU: Téléphone 2
      courriel: initialData?.client?.courriel || ''
    },
    
    // Type de document et dates
    typeDocument: 'soumission',
    dateContrat: new Date().toISOString().split('T')[0],
    
    // Superficie
    superficie: {
      totale: Math.round(initialData?.superficie?.totale || 0)
    },
    
    // ✅ Prix MODIFIÉ - utilise customSubmission en priorité
    results: {
      sousTotal: initialData?.customSubmission?.total || initialData?.results?.total || 0
    },
    
    // ✅ NOUVEAU: Référence à la soumission personnalisée
    customSubmission: initialData?.customSubmission || null,
    
    // Étapes de travaux modifiables FR/EN
    travaux: language === 'fr' ? [
      { lettre: 'a)', texte: 'Enlever les solins existants et en disposer.' },
      { lettre: 'b)', texte: 'Arracher la toiture jusqu\'au pontage de bois.' },
      { lettre: 'c)', texte: 'Vérifier le pontage' },
      { lettre: 'd)', texte: 'Si nous devons changer du bois, nous en changerons jusqu\'à un équivalent de 32 pieds carrés, si le bois est plus endommagé, nous vous en aviserons avant de débuter les travaux. Le cout sera de 4,50$ le pi2' },
      { lettre: 'e)', texte: 'Fournir et installer un panneau de fibre de bois Secure panne ½ 4X8 (ignifuge).' },
      { lettre: 'f)', texte: 'Fournir et installer une sous-couche de membrane élastomère 180 fast N Stick.' },
      { lettre: 'g)', texte: 'Fournir et installer 1 pli de membrane armorbond180 sur les parapets.' },
      { lettre: 'h)', texte: 'Fournir et installer de nouveaux drains de cuivre 16 onces avec panier.' },
      { lettre: 'i)', texte: 'Fournir et installer de nouveaux évents de plomberie en aluminium.' },
      { lettre: 'j)', texte: 'Fournir et installer de nouveaux ventilateurs Optimum.' },
      { lettre: 'k)', texte: 'Fournir et installer une membrane élastomère de finition 250 soudé couleur blanche (ArmourCool) avec indice IRS de 82.' },
      { lettre: 'l)', texte: 'Fournir et installer de nouveaux solins.' },
      { lettre: 'm)', texte: 'Calfeutrer tous les joints avec du Mulco Supra Extra' },
      { lettre: 'n)', texte: 'Nettoyer les débris et laisser les lieux propres.' }
    ] : [
      // Version anglaise
      { lettre: 'a)', texte: 'Remove the existent flashing and get rid of it.' },
      { lettre: 'b)', texte: 'Tear away the old roof up to the wooden deck.' },
      { lettre: 'c)', texte: 'Verify the Deck.' },
      { lettre: 'd)', texte: 'If we have to change some wood, we will change it up to an equivalent of 32 square feet, if the wood is more damaged, we will inform you about it before beginning the works. The price will be 4.50$ sq2' },
      { lettre: 'e)', texte: 'Supply and install a tentes secure pan ½ 4X8 (fireproof) on the total surface.' },
      { lettre: 'f)', texte: 'Supply and install 1 fold of sub layer elastomer membrane 180 Fast N Stick.' },
      { lettre: 'g)', texte: 'Supply and install 1 fold of armorbound flash on the parapet.' },
      { lettre: 'h)', texte: 'Supply and install new brass drains 16 ounces with basket.' },
      { lettre: 'i)', texte: 'Supply and install new aluminium plumbing ventilation.' },
      { lettre: 'j)', texte: 'Supply and install new Optimum Ventilator.' },
      { lettre: 'k)', texte: 'Supply and install 1 fold of finishing elastomer membrane 250cap welded white color (ArmourCool) 82 IRS require at Montréal.' },
      { lettre: 'l)', texte: 'Supply and install new flashing' },
      { lettre: 'm)', texte: 'Seal all the joints with Mulco Supra Extra' },
      { lettre: 'n)', texte: 'Clean fragments and leave the place clean.' }
    ],
    
    // Section "Autres" avec 3 lignes
    autres: {
      ligne1: '',
      ligne2: '',
      ligne3: ''
    },
    
    // Textes modifiables des responsabilités FR/EN
    responsabilites: language === 'fr' ? {
      intro: 'n\'assume aucune responsabilité pour les items suivant.',
      point1: 'Problème relier au drain et évent de plomberie qui aurait pour cause un objet qui ferait obstruction au bon fonctionnement.',
      point2: 'Défauts de structure qui pourrait occasionner des rétentions d\'eau sur la surface de la toiture du a de mauvaise pente.'
    } : {
      intro: 'does not assume any responsibility for these items.',
      point1: 'Probleme related to vent pipe or drain that would have for cause any obstructing objects that could get inside.',
      point2: 'Structural defects which could cause water retention on the surface of the roof due to poor slope.'
    },
    
    // Texte des précautions FR/EN
    precautions: language === 'fr' ? 
      'ne se tient aucunement responsable de la poussière qui pourrait tomber lors des travaux de toiture. Le propriétaire de l\'immeuble devra avertir les locataires de fermer toutes ouvertures dans les logements lors de la réfection de la toiture ainsi que déplacer tous véhiculent autour de la bâtisse.' :
      'is not responsible if there is some dust that falls down on car. It is the owner\'s responsibilities to inform the tenants to move the vehicles and leave all the window close so dust won\'t enter their home.',
    
    // Garanties modifiables FR/EN
    garanties: language === 'fr' ? {
      toitpro: { duree: '10', type: 'sur les travaux exécutés' },
      iko: { duree: '20', type: 'limitée sur la membrane utilisée' },
      rbq: 'RBQ 5668-2792-01',
      assurance: 'Assurance Responsabilité 2 000 000$'
    } : {
      toitpro: { duree: '10', type: 'on the work performed' },
      iko: { duree: '20', type: 'limited warranty on the membrane used' },
      rbq: 'RBQ 5668-2792-01',
      assurance: 'Liability Insurance $2,000,000'
    }
  })

  // ✅ NOUVEAU: Fonction pour changer de langue et mettre à jour les textes
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    
    // Mettre à jour les textes par défaut selon la langue
    setFormData(prev => ({
      ...prev,
      travaux: newLanguage === 'fr' ? [
        { lettre: 'a)', texte: 'Enlever les solins existants et en disposer.' },
        { lettre: 'b)', texte: 'Arracher la toiture jusqu\'au pontage de bois.' },
        { lettre: 'c)', texte: 'Vérifier le pontage' },
        { lettre: 'd)', texte: 'Si nous devons changer du bois, nous en changerons jusqu\'à un équivalent de 32 pieds carrés, si le bois est plus endommagé, nous vous en aviserons avant de débuter les travaux. Le cout sera de 4,50$ le pi2' },
        { lettre: 'e)', texte: 'Fournir et installer un panneau de fibre de bois Secure panne ½ 4X8 (ignifuge).' },
        { lettre: 'f)', texte: 'Fournir et installer une sous-couche de membrane élastomère 180 fast N Stick.' },
        { lettre: 'g)', texte: 'Fournir et installer 1 pli de membrane armorbond180 sur les parapets.' },
        { lettre: 'h)', texte: 'Fournir et installer de nouveaux drains de cuivre 16 onces avec panier.' },
        { lettre: 'i)', texte: 'Fournir et installer de nouveaux évents de plomberie en aluminium.' },
        { lettre: 'j)', texte: 'Fournir et installer de nouveaux ventilateurs Optimum.' },
        { lettre: 'k)', texte: 'Fournir et installer une membrane élastomère de finition 250 soudé couleur blanche (ArmourCool) avec indice IRS de 82.' },
        { lettre: 'l)', texte: 'Fournir et installer de nouveaux solins.' },
        { lettre: 'm)', texte: 'Calfeutrer tous les joints avec du Mulco Supra Extra' },
        { lettre: 'n)', texte: 'Nettoyer les débris et laisser les lieux propres.' }
      ] : [
        { lettre: 'a)', texte: 'Remove the existent flashing and get rid of it.' },
        { lettre: 'b)', texte: 'Tear away the old roof up to the wooden deck.' },
        { lettre: 'c)', texte: 'Verify the Deck.' },
        { lettre: 'd)', texte: 'If we have to change some wood, we will change it up to an equivalent of 32 square feet, if the wood is more damaged, we will inform you about it before beginning the works. The price will be 4.50$ sq2' },
        { lettre: 'e)', texte: 'Supply and install a tentes secure pan ½ 4X8 (fireproof) on the total surface.' },
        { lettre: 'f)', texte: 'Supply and install 1 fold of sub layer elastomer membrane 180 Fast N Stick.' },
        { lettre: 'g)', texte: 'Supply and install 1 fold of armorbound flash on the parapet.' },
        { lettre: 'h)', texte: 'Supply and install new brass drains 16 ounces with basket.' },
        { lettre: 'i)', texte: 'Supply and install new aluminium plumbing ventilation.' },
        { lettre: 'j)', texte: 'Supply and install new Optimum Ventilator.' },
        { lettre: 'k)', texte: 'Supply and install 1 fold of finishing elastomer membrane 250cap welded white color (ArmourCool) 82 IRS require at Montréal.' },
        { lettre: 'l)', texte: 'Supply and install new flashing' },
        { lettre: 'm)', texte: 'Seal all the joints with Mulco Supra Extra' },
        { lettre: 'n)', texte: 'Clean fragments and leave the place clean.' }
      ],
      responsabilites: newLanguage === 'fr' ? {
        intro: 'n\'assume aucune responsabilité pour les items suivant.',
        point1: 'Problème relier au drain et évent de plomberie qui aurait pour cause un objet qui ferait obstruction au bon fonctionnement.',
        point2: 'Défauts de structure qui pourrait occasionner des rétentions d\'eau sur la surface de la toiture du a de mauvaise pente.'
      } : {
        intro: 'does not assume any responsibility for these items.',
        point1: 'Probleme related to vent pipe or drain that would have for cause any obstructing objects that could get inside.',
        point2: 'Structural defects which could cause water retention on the surface of the roof due to poor slope.'
      },
      precautions: newLanguage === 'fr' ? 
        'ne se tient aucunement responsable de la poussière qui pourrait tomber lors des travaux de toiture. Le propriétaire de l\'immeuble devra avertir les locataires de fermer toutes ouvertures dans les logements lors de la réfection de la toiture ainsi que déplacer tous véhiculent autour de la bâtisse.' :
        'is not responsible if there is some dust that falls down on car. It is the owner\'s responsibilities to inform the tenants to move the vehicles and leave all the window close so dust won\'t enter their home.',
      garanties: newLanguage === 'fr' ? {
        toitpro: { duree: '10', type: 'sur les travaux exécutés' },
        iko: { duree: '20', type: 'limitée sur la membrane utilisée' },
        rbq: 'RBQ 5668-2792-01',
        assurance: 'Assurance Responsabilité 2 000 000$'
      } : {
        toitpro: { duree: '10', type: 'on the work performed' },
        iko: { duree: '20', type: 'limited warranty on the membrane used' },
        rbq: 'RBQ 5668-2792-01',
        assurance: 'Liability Insurance $2,000,000'
      }
    }))
  }

  // Labels selon la langue
  const labels = {
    fr: {
      client: 'Client',
      telephone: 'Tél.',
      courriel: 'Courriel',
      date: 'Date',
      soumission: 'SOUMISSION',
      contrat: 'CONTRAT',
      addressWorks: 'Adresse des travaux',
      surfaceWorks: 'Superficie des travaux',
      descriptionWorks: 'Description des travaux',
      others: 'Autres',
      responsibility: 'RESPONSABILITÉS',
      precautions: 'PRÉCAUTIONS',
      priceContract: 'PRIX DE CE CONTRAT',
      price: 'Prix',
      total: 'TOTAL',
      guarantee: 'GARANTIE',
      dateSignature: 'Date de la Signature',
      dateWorks: 'Date des travaux',
      mainText: 'Il nous fait plaisir de vous soumettre notre prix pour les travaux à effectuer aux adresses suivantes :',
      validity: 'Cette soumission est valide pour une période de (15) jours.',
      permits: 'N.B. Tous les permis d\'occupation seront aux frais du propriétaire.',
      provides: 'fournis une garantie de',
      years: 'ans',
      sq2Including: 'pi² incluant les relevés'
    },
    en: {
      client: 'Client',
      telephone: 'Tel.',
      courriel: 'Email',
      date: 'Date',
      soumission: 'QUOTATION',
      contrat: 'CONTRACT',
      addressWorks: 'Address of works',
      surfaceWorks: 'Surfaces of works',
      descriptionWorks: 'Description of work',
      others: 'Others',
      responsibility: 'RESPONSIBILITY',
      precautions: 'PRECAUTIONS',
      priceContract: 'PRICE OF THIS CONTRACT',
      price: 'Price',
      total: 'TOTAL',
      guarantee: 'GUARANTEE',
      dateSignature: 'Date of Signature',
      dateWorks: 'Date of Works',
      mainText: 'It is a pleasure to give you a quotation to have your roof change at the above-mentioned address :',
      validity: 'This submission is valid for a period of thirty(15)days.',
      permits: 'N.B. Every occupation permit will be charge of the owner.',
      provides: 'provides a',
      years: 'year',
      sq2Including: 'sq2 including parapet'
    }
  }

  const currentLabels = labels[language]

  // Fonction pour mettre à jour les données
  const updateField = (path, value) => {
    const keys = path.split('.')
    const newData = { ...formData }
    let current = newData
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    setFormData(newData)
  }

  // Fonction pour mettre à jour un travail spécifique
  const updateTravail = (index, newTexte) => {
    const newTravaux = [...formData.travaux]
    newTravaux[index].texte = newTexte
    setFormData({ ...formData, travaux: newTravaux })
  }

  // Ajouter/Supprimer étapes de travaux
  const addTravail = () => {
    const nextLetter = String.fromCharCode(97 + formData.travaux.length) + ')' // a), b), c)...
    setFormData({
      ...formData,
      travaux: [...formData.travaux, { lettre: nextLetter, texte: '' }]
    })
  }

  // ✅ MODIFIÉ: Supprimer et renuméroter automatiquement
  const removeTravail = (index) => {
    if (formData.travaux.length > 1) {
      const newTravaux = formData.travaux.filter((_, i) => i !== index)
      
      // Renuméroter toutes les lettres après suppression
      const renumberedTravaux = newTravaux.map((travail, newIndex) => ({
        ...travail,
        lettre: String.fromCharCode(97 + newIndex) + ')' // a), b), c)...
      }))
      
      setFormData({ ...formData, travaux: renumberedTravaux })
    }
  }

  // Calculs automatiques
  const sousTotal = formData.results.sousTotal
  const tps = sousTotal * 0.05
  const tvq = sousTotal * 0.09975
  const total = sousTotal + tps + tvq

  // Validation
  const isValid = formData.client.adresse.trim() && sousTotal > 0

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prévisualisation PDF Interactive</h1>
              <p className="text-sm text-gray-600">Modifiez directement le contenu du document</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* ✅ NOUVEAU: Toggle de langue */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  language === 'fr' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">FR</span>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  language === 'en' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">EN</span>
              </button>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser</span>
            </button>

            {isValid ? (
              <PDFDownloadLink
                document={<SoumissionDocument data={formData} language={language} />}
                fileName={`${formData.typeDocument}_${formData.client.nom?.replace(/\s+/g, '_') || 'client'}_${formData.dateContrat}.pdf`}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                {({ loading }) => (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{loading ? 'Génération...' : 'Télécharger PDF'}</span>
                  </>
                )}
              </PDFDownloadLink>
            ) : (
              <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium">
                Remplir adresse et prix
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal - Copie conforme du PDF */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg my-8">
        
        {/* PAGE 1 - EXACTEMENT COMME LE PDF */}
        <div className="p-12 min-h-screen border-b-4 border-gray-300">
          
          {/* Logo/Bannière simulation */}
          <div className="text-center mb-6 p-6 bg-blue-600 text-white rounded-lg">
            <h1 className="text-2xl font-bold">TOITPRO</h1>
            <p className="text-sm opacity-90">Logo sera ici dans le PDF final</p>
          </div>
          
          <hr className="border-black border-t-2 mb-6" />

          {/* ✅ Section Client - MISE À JOUR avec champs supplémentaires */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-16">{currentLabels.client} :</span>
                <input
                  type="text"
                  value={formData.client.nom}
                  onChange={(e) => updateField('client.nom', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                  placeholder={language === 'fr' ? 'Nom du client' : 'Client name'}
                />
              </div>
              {/* ✅ NOUVEAU: Ligne 2 sous client maintenant éditable */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-16"></span>
                <input
                  type="text"
                  value={formData.client.nom2 || ''}
                  onChange={(e) => updateField('client.nom2', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                  placeholder={language === 'fr' ? 'Ligne supplémentaire (optionnel)' : 'Additional line (optional)'}
                />
              </div>
              {/* ✅ NOUVEAU: Ligne 3 sous client maintenant éditable */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-16"></span>
                <input
                  type="text"
                  value={formData.client.nom3 || ''}
                  onChange={(e) => updateField('client.nom3', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                  placeholder={language === 'fr' ? 'Ligne supplémentaire (optionnel)' : 'Additional line (optional)'}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-12">{currentLabels.telephone} :</span>
                <input
                  type="text"
                  value={formData.client.telephone}
                  onChange={(e) => updateField('client.telephone', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                  placeholder={language === 'fr' ? 'Téléphone' : 'Phone'}
                />
              </div>
              {/* ✅ NOUVEAU: Ligne 2 sous téléphone maintenant éditable */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-12">{currentLabels.telephone} :</span>
                <input
                  type="text"
                  value={formData.client.telephone2 || ''}
                  onChange={(e) => updateField('client.telephone2', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                  placeholder={language === 'fr' ? 'Téléphone 2 (optionnel)' : 'Phone 2 (optional)'}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-16">{currentLabels.courriel} :</span>
                <input
                  type="email"
                  value={formData.client.courriel}
                  onChange={(e) => updateField('client.courriel', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                  placeholder={language === 'fr' ? 'email@exemple.com' : 'email@example.com'}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium w-12">{currentLabels.date} :</span>
                <input
                  type="date"
                  value={formData.dateContrat}
                  onChange={(e) => updateField('dateContrat', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
                />
              </div>
            </div>
          </div>

          {/* Cases SOUMISSION / CONTRAT */}
          <div className="flex justify-center space-x-16 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="typeDocument"
                value="soumission"
                checked={formData.typeDocument === 'soumission'}
                onChange={(e) => updateField('typeDocument', e.target.value)}
                className="w-4 h-4"
              />
              <span className="font-bold text-lg">{currentLabels.soumission}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="typeDocument"
                value="contrat"
                checked={formData.typeDocument === 'contrat'}
                onChange={(e) => updateField('typeDocument', e.target.value)}
                className="w-4 h-4"
              />
              <span className="font-bold text-lg">{currentLabels.contrat}</span>
            </label>
          </div>

          {/* Texte principal */}
          <p className="mb-4 text-sm">
            {currentLabels.mainText}
          </p>

          {/* Adresse des travaux */}
          <div className="flex items-center mb-4">
            <span className="font-bold text-sm underline mr-2">{currentLabels.addressWorks} :</span>
            <input
              type="text"
              value={formData.client.adresse}
              onChange={(e) => updateField('client.adresse', e.target.value)}
              className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1"
              placeholder={language === 'fr' ? 'Adresse complète des travaux' : 'Complete address of works'}
            />
          </div>

          {/* Superficie */}
          <div className="flex items-center mb-6">
            <span className="font-bold text-sm underline mr-2">{currentLabels.surfaceWorks} :</span>
            <input
              type="number"
              value={formData.superficie.totale}
              onChange={(e) => updateField('superficie.totale', parseInt(e.target.value) || 0)}
              className="w-20 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-1 text-center"
            />
            <span className="ml-1 text-sm">{currentLabels.sq2Including}</span>
          </div>

          {/* Description des travaux */}
          <div className="mb-6">
            <h3 className="font-bold text-sm underline mb-4">{currentLabels.descriptionWorks} :</h3>
            
            <div className="space-y-2">
              {formData.travaux.map((travail, index) => (
                <div key={index} className="flex items-start space-x-2 group">
                  <span className="text-sm font-medium w-6 mt-1">{travail.lettre}</span>
                  <textarea
                    value={travail.texte}
                    onChange={(e) => updateTravail(index, e.target.value)}
                    className="flex-1 bg-transparent border border-gray-200 focus:border-blue-400 focus:bg-blue-50 rounded px-2 py-1 text-sm resize-none"
                    rows={Math.max(1, Math.ceil(travail.texte.length / 80))}
                    placeholder={`${language === 'fr' ? 'Description de l\'étape' : 'Step description'} ${travail.lettre}`}
                  />
                  {/* ✅ MODIFIÉ: Permettre suppression de TOUTES les étapes (sauf si c'est la dernière) */}
                  {formData.travaux.length > 1 && (
                    <button
                      onClick={() => {
                        // Confirmation pour les étapes importantes (a à n)
                        if (index < 14) {
                          if (window.confirm(`${language === 'fr' ? 'Supprimer l\'étape' : 'Delete step'} ${travail.lettre} ?\n\n${language === 'fr' ? 'Cette étape fait partie des travaux standards. Êtes-vous sûr ?' : 'This is a standard work step. Are you sure?'}`)) {
                            removeTravail(index)
                          }
                        } else {
                          removeTravail(index)
                        }
                      }}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity px-1 mt-1 hover:bg-red-50 rounded"
                      title={index < 14 ? (language === 'fr' ? "Supprimer cette étape (avec confirmation)" : "Delete this step (with confirmation)") : (language === 'fr' ? "Supprimer cette étape" : "Delete this step")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addTravail}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
              >
                <span>+</span>
                <span>{language === 'fr' ? 'Ajouter une étape' : 'Add a step'}</span>
              </button>
            </div>
          </div>

          {/* Section Autres */}
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3">{currentLabels.others}:</h4>
            <div className="relative">
              <textarea
                value={[formData.autres.ligne1, formData.autres.ligne2, formData.autres.ligne3].join('\n').replace(/\n+$/, '')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  // Assurer qu'on a toujours 3 lignes max
                  const ligne1 = lines[0] || '';
                  const ligne2 = lines[1] || '';
                  const ligne3 = lines[2] || '';
                  
                  setFormData(prev => ({
                    ...prev,
                    autres: {
                      ligne1,
                      ligne2,
                      ligne3
                    }
                  }));
                }}
                className="w-full bg-transparent focus:outline-none focus:bg-yellow-50 px-1 py-2 text-sm resize-none leading-8"
                rows={3}
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 31px,
                    #000 31px,
                    #000 32px
                  )`,
                  backgroundSize: '100% 32px',
                  lineHeight: '32px',
                  paddingTop: '4px'
                }}
                placeholder={language === 'fr' ? 'Informations supplémentaires...' : 'Additional information...'}
                onKeyDown={(e) => {
                  // Empêcher d'ajouter plus de 3 lignes
                  if (e.key === 'Enter') {
                    const currentValue = e.target.value;
                    const lines = currentValue.split('\n');
                    if (lines.length >= 3) {
                      e.preventDefault();
                    }
                  }
                }}
              />
              
              {/* Indicateurs de lignes */}
              <div className="absolute right-2 top-1 text-xs text-gray-400 pointer-events-none">
                <div className="h-8 flex items-center">1</div>
                <div className="h-8 flex items-center">2</div>
                <div className="h-8 flex items-center">3</div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2 - Responsabilités, Prix et Signatures */}
        <div className="p-12 min-h-screen">
          
          {/* Logo répété */}
          <div className="text-center mb-6 p-4 bg-blue-600 text-white rounded-lg">
            <h1 className="text-xl font-bold">TOITPRO</h1>
          </div>
          <hr className="border-black border-t-2 mb-6" />

          {/* RESPONSABILITÉS */}
          <div className="mb-6">
            <h3 className="font-bold text-sm underline mb-3">{currentLabels.responsibility} :</h3>
            <div className="mb-2">
              <strong>Toitpro</strong>
              <textarea
                value={formData.responsabilites.intro}
                onChange={(e) => updateField('responsabilites.intro', e.target.value)}
                className="ml-1 w-full bg-transparent border border-gray-200 focus:border-blue-400 focus:bg-blue-50 rounded px-2 py-1 text-sm resize-none"
                rows={1}
              />
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <textarea
                  value={formData.responsabilites.point1}
                  onChange={(e) => updateField('responsabilites.point1', e.target.value)}
                  className="flex-1 bg-transparent border border-gray-200 focus:border-blue-400 focus:bg-blue-50 rounded px-2 py-1 text-sm resize-none"
                  rows={2}
                />
              </div>
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <textarea
                  value={formData.responsabilites.point2}
                  onChange={(e) => updateField('responsabilites.point2', e.target.value)}
                  className="flex-1 bg-transparent border border-gray-200 focus:border-blue-400 focus:bg-blue-50 rounded px-2 py-1 text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* PRÉCAUTIONS */}
          <div className="mb-6">
            <h3 className="font-bold text-sm underline mb-3">{currentLabels.precautions} :</h3>
            <div className="mb-2">
              <strong>Toitpro</strong>
              <textarea
                value={formData.precautions}
                onChange={(e) => updateField('precautions', e.target.value)}
                className="ml-1 w-full bg-transparent border border-gray-200 focus:border-blue-400 focus:bg-blue-50 rounded px-2 py-1 text-sm resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* ✅ PRIX DE CE CONTRAT - Utilise automatiquement soumission personnalisée */}
          <div className="mb-6">
            <h3 className="font-bold text-sm underline mb-4">{currentLabels.priceContract}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-32 text-sm">{currentLabels.price}</span>
                <div className="flex-1 flex items-center">
                  <span className="mr-2">$</span>
                  <input
                    type="number"
                    value={formData.results.sousTotal}
                    onChange={(e) => updateField('results.sousTotal', parseFloat(e.target.value) || 0)}
                    className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-2 py-1 text-left"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="w-32 text-sm">T.P.S 5% 820100337 RT</span>
                <div className="flex-1 border-b border-black text-left px-2 py-1">
                  ${tps.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="w-32 text-sm">T.V.Q 9.975% 1220121905 TQ</span>
                <div className="flex-1 border-b border-black text-left px-2 py-1">
                  ${tvq.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="flex items-center font-bold">
                <span className="w-32 text-sm">{currentLabels.total}</span>
                <div className="flex-1 border-b-2 border-black text-left px-2 py-1">
                  ${total.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Notes validité */}
          <p className="mb-2 text-sm">{currentLabels.validity}</p>
          <p className="mb-6 text-sm">{currentLabels.permits}</p>

          {/* GARANTIE */}
          <div className="mb-8">
            <h3 className="font-bold text-sm underline mb-3">{currentLabels.guarantee} :</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <strong>Toitpro</strong>
                <span className="mx-2">{currentLabels.provides}</span>
                <input
                  type="text"
                  value={formData.garanties.toitpro.duree}
                  onChange={(e) => updateField('garanties.toitpro.duree', e.target.value)}
                  className="w-8 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 text-center font-bold underline"
                />
                <span className="mx-2">{currentLabels.years}</span>
                <input
                  type="text"
                  value={formData.garanties.toitpro.type}
                  onChange={(e) => updateField('garanties.toitpro.type', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                />
              </div>
              
              <div className="flex items-center">
                <strong>IKO</strong>
                <span className="mx-2">{currentLabels.provides}</span>
                <input
                  type="text"
                  value={formData.garanties.iko.duree}
                  onChange={(e) => updateField('garanties.iko.duree', e.target.value)}
                  className="w-8 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 text-center font-bold underline"
                />
                <span className="mx-2">{currentLabels.years}</span>
                <input
                  type="text"
                  value={formData.garanties.iko.type}
                  onChange={(e) => updateField('garanties.iko.type', e.target.value)}
                  className="flex-1 border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1"
                />
              </div>
              
              <div className="mt-4 space-y-1">
                <input
                  type="text"
                  value={formData.garanties.rbq}
                  onChange={(e) => updateField('garanties.rbq', e.target.value)}
                  className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 font-bold"
                />
                <input
                  type="text"
                  value={formData.garanties.assurance}
                  onChange={(e) => updateField('garanties.assurance', e.target.value)}
                  className="w-full border-b border-black bg-transparent focus:outline-none focus:bg-yellow-50 px-1 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm mb-2">{currentLabels.dateSignature}</p>
                <div className="border-b border-black h-8"></div>
              </div>
              <div>
                <p className="text-sm mb-2">{language === 'fr' ? 'Client' : 'Client'}</p>
                <div className="border-b border-black h-8"></div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm mb-2">{currentLabels.dateWorks}</p>
                <div className="border-b border-black h-8"></div>
              </div>
              <div>
                <p className="text-sm mb-2">{language === 'fr' ? 'Toitpro' : 'Toitpro inc.'}</p>
                <div className="border-b border-black h-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer avec validation */}
      <div className="bg-gray-50 border-t p-4 text-center">
        {!isValid && (
          <p className="text-red-600 text-sm mb-2">
            {language === 'fr' 
              ? '⚠️ Veuillez remplir l\'adresse des travaux et définir un prix pour générer le PDF'
              : '⚠️ Please fill in the work address and set a price to generate the PDF'}
          </p>
        )}
        <p className="text-gray-600 text-xs">
          {language === 'fr'
            ? 'Cliquez sur n\'importe quel texte pour le modifier • Les champs avec fond jaune sont en cours d\'édition'
            : 'Click on any text to edit • Fields with yellow background are being edited'}
        </p>
      </div>
    </div>
  )
}

export default PDFPreviewForm