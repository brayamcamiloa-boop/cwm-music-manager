const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('musicLibrary', {
  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveLibrary: (library) => ipcRenderer.invoke('library:save', library),
  saveMedia: (file) => ipcRenderer.invoke('media:save', file),
  readMedia: (id) => ipcRenderer.invoke('media:read', id),
  deleteMedia: (id) => ipcRenderer.invoke('media:delete', id),
});