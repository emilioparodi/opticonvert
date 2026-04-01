const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Converte l'immagine chiamando il processo Main
   * Riceve: { filePath, format, quality, targetFolder }
   */
  convertImage: (data) => ipcRenderer.invoke('convert-image', data),
  
  /**
   * Apre il selettore di cartelle nativo del Mac
   * Restituisce il percorso della cartella selezionata o null se annullato
   */
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  /**
   * Apre il Finder sul file specificato
   */
  openFolder: (path) => ipcRenderer.send('open-folder', path),

  /**
   * ESTRAE IL PERCORSO REALE DEL FILE
   * Risolve l'errore "path undefined" leggendo i metadati nativi di Electron
   */
  getFilePath: (file) => webUtils.getPathForFile(file)
});