// evernoteMapping.js - Configuration pour mapper Evernote vers vos dossiers

export const EVERNOTE_MAPPING_CONFIG = {
  // Mapping par tags Evernote
  tagMapping: {
    // Tags Evernote → IDs de vos dossiers
    'toiture': 'projects_2025',
    'roof': 'projects_2025',
    'assignment': 'system_assignments',
    'mesure': 'system_assignments',
    'terrain': 'system_assignments',
    'complet': 'system_completed', 
    'completed': 'system_completed',
    'terminé': 'system_completed',
    'urgent': 'urgent_projects',
    'priorité': 'urgent_projects',
    'client': 'client_notes',
    'devis': 'estimates',
    'soumission': 'estimates'
  },

  // Mapping par mots-clés dans le titre
  titleKeywords: {
    'assignment': 'system_assignments',
    'mesure': 'system_assignments',
    'terrain': 'system_assignments',
    'devis': 'estimates',
    'soumission': 'estimates',
    'client': 'client_notes',
    'urgent': 'urgent_projects',
    'URGENT': 'urgent_projects'
  },

  // Mapping par mots-clés dans le contenu
  contentKeywords: {
    'pi²': 'projects_2025',
    'superficie': 'projects_2025',
    'dimensions': 'projects_2025',
    'toiture': 'projects_2025',
    'parapet': 'projects_2025',
    'drain': 'projects_2025',
    'évent': 'projects_2025',
    'membrane': 'projects_2025'
  },

  // Patterns d'adresse pour identifier les projets
  addressPatterns: [
    /\d+\s+[a-zA-Z\s]+(rue|avenue|boulevard|chemin|place|circuit)/i,
    /\d+\s+[a-zA-Z\s]+(st|ave|blvd|ch|pl|cir)/i
  ],

  // Dossier par défaut si aucun mapping trouvé
  defaultFolder: 'imported_notes',

  // Créer automatiquement ce dossier si inexistant
  createDefaultFolder: true
};

// Fonction pour déterminer le dossier optimal
export const determineBestFolder = (note, availableFolders) => {
  const { title = '', content = '', tags = [] } = note;
  const searchText = `${title} ${content}`.toLowerCase();
  
  // 1. Priorité : Tags Evernote
  for (const tag of tags) {
    const folderId = EVERNOTE_MAPPING_CONFIG.tagMapping[tag.toLowerCase()];
    if (folderId && availableFolders[folderId]) {
      return {
        folderId,
        reason: `Tag Evernote: "${tag}"`,
        confidence: 'high'
      };
    }
  }

  // 2. Mots-clés dans le titre
  for (const [keyword, folderId] of Object.entries(EVERNOTE_MAPPING_CONFIG.titleKeywords)) {
    if (title.toLowerCase().includes(keyword.toLowerCase())) {
      if (availableFolders[folderId]) {
        return {
          folderId,
          reason: `Mot-clé titre: "${keyword}"`,
          confidence: 'medium'
        };
      }
    }
  }

  // 3. Mots-clés dans le contenu
  for (const [keyword, folderId] of Object.entries(EVERNOTE_MAPPING_CONFIG.contentKeywords)) {
    if (searchText.includes(keyword.toLowerCase())) {
      if (availableFolders[folderId]) {
        return {
          folderId,
          reason: `Mot-clé contenu: "${keyword}"`,
          confidence: 'low'
        };
      }
    }
  }

  // 4. Détection d'adresse → Projet
  for (const pattern of EVERNOTE_MAPPING_CONFIG.addressPatterns) {
    if (pattern.test(searchText)) {
      const projectFolder = availableFolders['projects_2025'] ? 'projects_2025' : null;
      if (projectFolder) {
        return {
          folderId: projectFolder,
          reason: 'Adresse détectée',
          confidence: 'medium'
        };
      }
    }
  }

  // 5. Dossier par défaut
  return {
    folderId: EVERNOTE_MAPPING_CONFIG.defaultFolder,
    reason: 'Dossier par défaut',
    confidence: 'none'
  };
};

// Analyser une note avant l'import
export const analyzeEvernoteNote = (noteElement) => {
  const analysis = {
    title: '',
    contentPreview: '',
    tags: [],
    hasAddress: false,
    hasRoofingKeywords: false,
    hasClientInfo: false,
    suggestedFolder: null,
    confidence: 'none'
  };

  try {
    // Extraire le titre
    const titleElement = noteElement.getElementsByTagName('title')[0];
    analysis.title = titleElement ? titleElement.textContent : '';

    // Extraire preview du contenu
    const contentElement = noteElement.getElementsByTagName('content')[0];
    if (contentElement) {
      const content = contentElement.textContent;
      analysis.contentPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
      
      // Analyser le contenu
      const searchText = `${analysis.title} ${content}`.toLowerCase();
      
      // Détecter adresse
      for (const pattern of EVERNOTE_MAPPING_CONFIG.addressPatterns) {
        if (pattern.test(searchText)) {
          analysis.hasAddress = true;
          break;
        }
      }
      
      // Détecter mots-clés toiture
      const roofingKeywords = ['toiture', 'toit', 'membrane', 'parapet', 'drain', 'évent', 'pi²', 'superficie'];
      analysis.hasRoofingKeywords = roofingKeywords.some(keyword => 
        searchText.includes(keyword)
      );
      
      // Détecter info client
      const clientPatterns = [
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // Téléphone
        /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
        /client\s*:?\s*[a-zA-Z]/i // "Client: Nom"
      ];
      analysis.hasClientInfo = clientPatterns.some(pattern => 
        pattern.test(content)
      );
    }

    // Extraire les tags
    const tagElements = noteElement.getElementsByTagName('tag');
    for (let i = 0; i < tagElements.length; i++) {
      analysis.tags.push(tagElements[i].textContent);
    }

    return analysis;

  } catch (error) {
    console.error('Erreur analyse note:', error);
    return analysis;
  }
};

// Interface de prévisualisation pour l'utilisateur
export const generateImportPreview = (enexContent) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(enexContent, 'text/xml');
    const notes = xmlDoc.getElementsByTagName('note');
    
    const preview = [];
    
    for (let i = 0; i < Math.min(notes.length, 10); i++) { // Max 10 pour preview
      const analysis = analyzeEvernoteNote(notes[i]);
      const suggestion = determineBestFolder(analysis, {}); // Vous passerez vos vrais dossiers
      
      preview.push({
        ...analysis,
        suggestedFolder: suggestion.folderId,
        suggestedReason: suggestion.reason,
        confidence: suggestion.confidence
      });
    }
    
    return {
      success: true,
      totalNotes: notes.length,
      preview: preview
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export default EVERNOTE_MAPPING_CONFIG;