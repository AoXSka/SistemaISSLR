const { contextBridge, ipcRenderer } = require('electron');
const log = require('electron-log');

// Security: Validate IPC arguments
const validateArgs = (args) => {
  return args !== null && args !== undefined;
};

const validateString = (str) => {
  return typeof str === 'string' && str.length > 0;
};

const validateObject = (obj) => {
  return obj && typeof obj === 'object';
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations with validation
  showSaveDialog: (options) => {
    if (!validateObject(options)) {
      log.warn('Invalid options for save dialog');
      return Promise.reject(new Error('Invalid options'));
    }
    return ipcRenderer.invoke('show-save-dialog', options);
  },
  
  showOpenDialog: (options) => {
    if (!validateObject(options)) {
      log.warn('Invalid options for open dialog');
      return Promise.reject(new Error('Invalid options'));
    }
    return ipcRenderer.invoke('show-open-dialog', options);
  },
  
  // Database operations
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  
  // PDF operations with validation
  savePDF: (pdfBuffer, fileName) => {
    if (!pdfBuffer || !validateString(fileName)) {
      log.warn('Invalid PDF parameters');
      return Promise.reject(new Error('Invalid PDF parameters'));
    }
    return ipcRenderer.invoke('save-pdf', pdfBuffer, fileName);
  },
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // App lifecycle
  quit: () => ipcRenderer.invoke('quit-app'),
  
  // Event listeners with validation
  onNewTransaction: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('new-transaction', callback);
    }
  },
  
  onImportData: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('import-data', callback);
    }
  },
  
  onExportData: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('export-data', callback);
    }
  },
  
  onGenerateReport: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('generate-report', callback);
    }
  },
  
  onOptimizeDatabase: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('optimize-database', callback);
    }
  },
  
  onOpenPreferences: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('open-preferences', callback);
    }
  },
  
  // Security: Clean up listeners
  removeAllListeners: (channel) => {
    if (validateString(channel)) {
      ipcRenderer.removeAllListeners(channel);
      log.info('Removed all listeners for channel:', channel);
    }
  }
});

// App info (safe to expose)
contextBridge.exposeInMainWorld('appInfo', {
  name: 'ContaVe Pro',
  version: '2.0.0',
  platform: process.platform,
  isElectron: true
});

// Development helpers (only in dev mode)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devTools', {
    openDevTools: () => {
      ipcRenderer.send('open-dev-tools');
    }
  });
}

log.info('Preload script initialized with security enabled');