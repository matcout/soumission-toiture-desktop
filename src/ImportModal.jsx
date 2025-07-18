// ImportModal.jsx - Interface pour importer des notes Evernote
import React, { useState } from 'react';
import { Upload, FileText, Folder, AlertCircle, CheckCircle, X } from 'lucide-react';
import { importEvernoteFile } from './EvernoteImporter';

const ImportModal = ({ visible, onClose, folders, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.name.endsWith('.enex')) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Veuillez sélectionner un fichier .enex d\'Evernote');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleImport = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier .enex');
      return;
    }

    setImporting(true);
    try {
      const result = await importEvernoteFile(file, selectedFolder);
      setImportResult(result);
      
      if (result.success && onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setSelectedFolder('');
    setImporting(false);
    setImportResult(null);
    setDragOver(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Upload className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Importer notes Evernote
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Comment exporter depuis Evernote :
            </h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Ouvrez Evernote Desktop</li>
              <li>2. Sélectionnez les notes à exporter</li>
              <li>3. Fichier → Exporter → Format ENEX</li>
              <li>4. Glissez le fichier .enex ci-dessous</li>
            </ol>
          </div>

          {/* Zone de drop */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          >
            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <FileText className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Glissez votre fichier .enex ici
                </p>
                <p className="text-gray-500 mb-4">ou</p>
                <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                  <input
                    type="file"
                    accept=".enex"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Sélection du dossier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dossier de destination
            </label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un dossier...</option>
                <option value="imported_notes">📁 Notes importées (nouveau)</option>
                {Object.entries(folders).map(([id, folder]) => (
                  <option key={id} value={id}>
                    {folder.isSystemFolder ? '🏠' : '📂'} {folder.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Résultat d'import */}
          {importResult && (
            <div className={`border rounded-lg p-4 ${
              importResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start">
                {importResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                )}
                <div>
                  <h4 className={`font-medium ${
                    importResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importResult.success ? 'Import réussi !' : 'Erreur d\'import'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    importResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {importResult.success 
                      ? `${importResult.count} notes ont été importées avec succès.`
                      : importResult.error
                    }
                  </p>
                  {importResult.success && importResult.data && (
                    <div className="mt-2 text-xs text-green-600">
                      <p>Aperçu des notes importées :</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {importResult.data.slice(0, 3).map((note, index) => (
                          <li key={index}>
                            {note.client?.adresse || note.originalTitle || 'Note sans titre'}
                          </li>
                        ))}
                        {importResult.data.length > 3 && (
                          <li>... et {importResult.data.length - 3} autres</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={importing}
            >
              {importResult?.success ? 'Fermer' : 'Annuler'}
            </button>
            
            {!importResult?.success && (
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className={`px-6 py-2 rounded-md transition-colors ${
                  !file || importing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {importing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Import en cours...
                  </div>
                ) : (
                  'Importer'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;