import React from 'react';
import { Minimize, Square, X } from 'lucide-react';
import { useElectronAPI } from '../../hooks/useElectronAPI';

export default function WindowControls() {
  const { isElectron, windowControls, appInfo } = useElectronAPI();

  if (!isElectron || !windowControls) {
    return null;
  }

  return (
    <div className="flex items-center justify-between w-full bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">CV</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-900">{appInfo?.name}</span>
          <span className="text-xs text-gray-500 ml-2">v{appInfo?.version}</span>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={windowControls.minimize}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Minimizar"
        >
          <Minimize className="h-3 w-3 text-gray-600" />
        </button>
        <button
          onClick={windowControls.maximize}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Maximizar"
        >
          <Square className="h-3 w-3 text-gray-600" />
        </button>
        <button
          onClick={windowControls.close}
          className="p-1.5 hover:bg-red-100 rounded transition-colors group"
          title="Cerrar"
        >
          <X className="h-3 w-3 text-gray-600 group-hover:text-red-600" />
        </button>
      </div>
    </div>
  );
}