// EvernoteImporter.js - Pour app Desktop
import { saveSubmissionToFirebase } from './firebaseFunctions';

export class EvernoteImporter {
  constructor() {
    this.defaultFolder = 'imported_notes'; // Dossier par défaut
  }

  // Importer fichier ENEX
  async importENEX(fileContent, targetFolderId = null) {
    try {
      console.log('🔄 Import ENEX en cours...');
      
      // Parser XML ENEX
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
      
      // Extraire toutes les notes
      const notes = xmlDoc.getElementsByTagName('note');
      const importedSubmissions = [];
      
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const submission = await this.parseEvernoteNote(note, targetFolderId);
        
        if (submission) {
          // Sauvegarder dans Firebase
          const result = await saveSubmissionToFirebase(submission);
          if (result.success) {
            importedSubmissions.push({
              ...submission,
              id: result.id
            });
          }
        }
      }
      
      console.log(`✅ ${importedSubmissions.length} notes importées`);
      return {
        success: true,
        count: importedSubmissions.length,
        data: importedSubmissions
      };
      
    } catch (error) {
      console.error('❌ Erreur import ENEX:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parser une note Evernote individuelle
  async parseEvernoteNote(noteElement, targetFolderId) {
    try {
      // Extraire les données de base
      const title = this.getTextContent(noteElement, 'title') || 'Note sans titre';
      const content = this.getTextContent(noteElement, 'content') || '';
      const created = this.getTextContent(noteElement, 'created');
      const updated = this.getTextContent(noteElement, 'updated');
      
      // Extraire tags Evernote
      const tags = this.extractTags(noteElement);
      
      // Extraire adresse si présente dans le titre ou contenu
      const addressInfo = this.extractAddressInfo(title, content);
      
      // Extraire info client
      const clientInfo = this.extractClientInfo(content);
      
      // Convertir vers format soumission
      const submission = {
        // Info client (extraite du contenu)
        client: {
          nom: clientInfo.nom || this.extractNameFromTitle(title),
          adresse: addressInfo.adresse || title,
          telephone: clientInfo.telephone || '',
          courriel: clientInfo.courriel || ''
        },
        
        // Toiture (valeurs par défaut)
        toiture: {
          superficie: { toiture: 0, parapets: 0, totale: 0 },
          dimensions: [{ length: 0, width: 0, name: 'Section 1' }],
          parapets: [{ length: 0, width: 0, name: 'Parapet 1' }],
          puitsLumiere: [{ length: 0, width: 0, name: 'Puit 1' }]
        },
        
        // Matériaux (vides par défaut)
        materiaux: {
          nbFeuilles: 0,
          nbMax: 0,
          nbEvents: 0,
          nbDrains: 0,
          trepiedElectrique: 0
        },
        
        // Options (par défaut)
        options: {
          plusieursEpaisseurs: false,
          hydroQuebec: false,
          grue: false,
          trackfall: false
        },
        
        // Notes - CONTENU PRINCIPAL D'EVERNOTE
        notes: this.cleanHTMLContent(content),
        
        // Métadonnées import
        importedFrom: 'evernote',
        originalTitle: title,
        evernoteCreated: created,
        evernoteUpdated: updated,
        evernoteTags: tags,
        
        // Status et dossier
        status: 'imported',
        folderId: targetFolderId || this.defaultFolder,
        
        // Photos (à traiter séparément si nécessaire)
        photos: [],
        photoCount: 0,
        
        // Dates
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        platform: 'desktop-import'
      };
      
      return submission;
      
    } catch (error) {
      console.error('❌ Erreur parsing note:', error);
      return null;
    }
  }

  // Extraire le contenu texte d'un élément XML
  getTextContent(element, tagName) {
    const elements = element.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0].textContent : '';
  }

  // Extraire les tags Evernote
  extractTags(noteElement) {
    const tags = [];
    const tagElements = noteElement.getElementsByTagName('tag');
    
    for (let i = 0; i < tagElements.length; i++) {
      tags.push(tagElements[i].textContent);
    }
    
    return tags;
  }

  // Extraire info d'adresse du titre/contenu
  extractAddressInfo(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    
    // Patterns d'adresse québécoise
    const addressPatterns = [
      /(\d+,?\s+[a-zA-Z\s]+(?:rue|avenue|boulevard|chemin|place|circuit|impasse))/i,
      /(\d+\s+[a-zA-Z\s]+(?:st|ave|blvd|ch|pl|cir))/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        return { adresse: match[1].trim() };
      }
    }
    
    return { adresse: '' };
  }

  // Extraire info client du contenu
  extractClientInfo(content) {
    const info = { nom: '', telephone: '', courriel: '' };
    
    // Pattern téléphone québécois
    const phonePattern = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/;
    const phoneMatch = content.match(phonePattern);
    if (phoneMatch) {
      info.telephone = phoneMatch[1];
    }
    
    // Pattern email
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = content.match(emailPattern);
    if (emailMatch) {
      info.courriel = emailMatch[1];
    }
    
    return info;
  }

  // Extraire nom du titre
  extractNameFromTitle(title) {
    // Si le titre contient un nom (souvent au début)
    const words = title.split(' ');
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`;
    }
    return '';
  }

  // Nettoyer le contenu HTML
  cleanHTMLContent(htmlContent) {
    if (!htmlContent) return '';
    
    // Retirer les balises HTML mais garder la structure
    return htmlContent
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<br[^>]*>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<[^>]*>/g, '') // Retirer toutes les autres balises
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Mapper tags Evernote vers dossiers
  mapTagsToFolders(tags, availableFolders) {
    // Logique pour mapper automatiquement les tags vers vos dossiers
    const mapping = {
      'toiture': 'projects_2025',
      'assignment': 'system_assignments',
      'completed': 'system_completed',
      'urgent': 'urgent_projects'
    };
    
    for (const tag of tags) {
      if (mapping[tag.toLowerCase()]) {
        return mapping[tag.toLowerCase()];
      }
    }
    
    return this.defaultFolder;
  }
}

// Fonction utilitaire pour l'interface
export const importEvernoteFile = async (file, targetFolderId = null) => {
  const importer = new EvernoteImporter();
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const result = await importer.importENEX(e.target.result, targetFolderId);
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Erreur lecture fichier'
      });
    };
    
    reader.readAsText(file);
  });
};

export default EvernoteImporter;