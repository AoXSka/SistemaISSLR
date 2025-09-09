import React from 'react';
import { Loader2, Building2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function LoadingScreen({ 
  message = 'Cargando ContaVe Pro...', 
  progress = 0,
  showProgress = false 
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center z-50">
      <div className="text-center text-white">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
            <Building2 className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-venezuela-yellow to-warning-400 bg-clip-text text-transparent">
            ContaVe Pro
          </h1>
          <p className="text-primary-200 text-sm">Sistema Enterprise v2.0</p>
        </div>

        {/* Loading Animation */}
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-venezuela-yellow mr-3" />
          <span className="text-lg">{message}</span>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 mx-auto">
            <div className="bg-primary-800 rounded-full h-2 mb-2">
              <div 
                className="bg-venezuela-yellow rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-primary-200">{Math.round(progress)}% completado</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-xs text-primary-300">
          <p>© 2024 ContaVe Solutions</p>
          <p>Sistema de Gestión Contable Enterprise</p>
        </div>
      </div>
    </div>
  );
}