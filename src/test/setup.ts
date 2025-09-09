import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron API for tests
global.window.electronAPI = {
  showSaveDialog: vi.fn(),
  showOpenDialog: vi.fn(),
  backupDatabase: vi.fn(),
  savePDF: vi.fn(),
  getSystemInfo: vi.fn(),
  onNewTransaction: vi.fn(),
  onImportData: vi.fn(),
  onExportData: vi.fn(),
  onGenerateReport: vi.fn(),
  onOptimizeDatabase: vi.fn(),
  onOpenPreferences: vi.fn(),
  removeAllListeners: vi.fn(),
};

global.window.appInfo = {
  name: 'ContaVe Pro Test',
  version: '2.0.0',
  platform: 'win32'
};

// Mock URL.createObjectURL for PDF tests
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;