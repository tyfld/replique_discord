const { contextBridge, ipcRenderer } = require('electron');

// Expose les contrôles de fenêtre (minimiser, maximiser/restaurer, fermer) au renderer
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  onMaximizeChange: (callback) =>
    ipcRenderer.on('window:isMaximized', (_, state) => callback(state)),
  close: () => ipcRenderer.send('window:close')
});

// Expose une API pour les menus contextuels basés sur le type d'élément (serveur, canal, message)
contextBridge.exposeInMainWorld('electronAPI', {
  // Permet au renderer de demander l'affichage d'un menu contextuel avec des paramètres spécifiques
  showContextMenu: (params) => ipcRenderer.invoke('show-context-menu', params),
  onContextMenuAction: (callback) => ipcRenderer.on('context-menu-action', (_, data) => callback(data))
});