import { useEffect, useState } from 'react';

// Enhanced type definitions for Electron API
interface ElectronAPI {
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  backupDatabase: () => Promise<any>;
  savePDF: (pdfBuffer: any, fileName: string) => Promise<any>;
  getSystemInfo: () => Promise<any>;
  getVersion: () => Promise<string>;
  quit: () => Promise<void>;
  onNewTransaction: (callback: Function) => void;
  onImportData: (callback: Function) => void;
  onExportData: (callback: Function) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    windowControls?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
    appInfo?: {
      name: string;
      version: string;
      platform: string;
      isElectron: boolean;
    };
  }
}

export const useElectronAPI = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    const checkElectron = async () => {
      const isElectronEnv = !!window.electronAPI && !!window.appInfo?.isElectron;
      setIsElectron(isElectronEnv);
      
      if (isElectronEnv) {
        try {
          const info = await window.electronAPI.getSystemInfo();
          setSystemInfo(info);
        } catch (error) {
          console.error('Failed to get system info:', error);
        }
      }
    };
    
    checkElectron();
  }, []);

  return {
    isElectron,
    systemInfo,
    electronAPI: window.electronAPI,
    windowControls: window.windowControls,
    appInfo: window.appInfo
  };
};

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const { isElectron, electronAPI } = useElectronAPI();

  useEffect(() => {
    if (isElectron && electronAPI) {
      electronAPI.getSystemInfo().then(setSystemInfo);
    }
  }, [isElectron, electronAPI]);

  return systemInfo;
};

export const useFileOperations = () => {
  const { isElectron, electronAPI } = useElectronAPI();

  const savePDF = async (pdfBlob: Blob, fileName: string) => {
    if (!isElectron || !electronAPI) {
      // Web fallback - trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    }

    // Convert blob to buffer for Electron
    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      return await electronAPI.savePDF(buffer, fileName);
    } catch (error) {
      console.error('PDF save error:', error);
      throw new Error('No se pudo guardar el PDF');
    }
  };

  const saveFile = async (content: Blob | Buffer, fileName: string, filters?: any[]) => {
    if (!isElectron || !electronAPI) {
      // Web fallback
      const url = window.URL.createObjectURL(content as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    }

    const options = {
      title: 'Guardar Archivo',
      defaultPath: fileName,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    };

    return await electronAPI.showSaveDialog(options);
  };

  const openFile = async (filters?: any[]) => {
    if (!isElectron || !electronAPI) {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = filters?.map(f => f.extensions.map((ext: string) => `.${ext}`).join(',')).join(',') || '*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          resolve(file ? { filePaths: [file] } : { canceled: true });
        };
        input.click();
      });
    }

    const options = {
      title: 'Abrir Archivo',
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    };

    return await electronAPI.showOpenDialog(options);
  };

  const createBackup = async () => {
    if (!isElectron || !electronAPI) {
      alert('La función de backup requiere la versión de escritorio');
      return;
    }

    return await electronAPI.backupDatabase();
  };

  return {
    saveFile,
    openFile,
    createBackup,
    savePDF,
    isElectron
  };
};