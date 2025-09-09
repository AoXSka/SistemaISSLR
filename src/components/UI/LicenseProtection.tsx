import React from 'react';
import { Shield, Lock, Star, AlertTriangle } from 'lucide-react';
import { useLicenseProtection } from '../../hooks/useLicense';
import Button from './Button';

interface LicenseProtectionProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export default function LicenseProtection({ 
  feature, 
  children, 
  fallback,
  showUpgrade = true 
}: LicenseProtectionProps) {
  const { canAccess, blockedMessage, license, remainingDays } = useLicenseProtection(feature);

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-6 text-center bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/10 rounded-xl border-2 border-warning-200 dark:border-warning-700 max-w-md mx-auto">
      <div className="mb-6">
        <div className="inline-flex p-4 bg-warning-500 rounded-full mb-4">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-warning-900 dark:text-warning-100 mb-2">
          Función Restringida
        </h3>
        <p className="text-sm text-warning-800 dark:text-warning-200">
          {blockedMessage}
        </p>
      </div>

      {license && (
        <div className="bg-white/80 dark:bg-neutral-800/80 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Licencia Actual:</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
              {license.license.type}
            </span>
          </div>
          {remainingDays > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-neutral-600 dark:text-neutral-400">Días Restantes:</span>
              <span className={`font-semibold ${
                remainingDays <= 7 ? 'text-error-600' : 
                remainingDays <= 30 ? 'text-warning-600' : 
                'text-success-600'
              }`}>
                {remainingDays}
              </span>
            </div>
          )}
        </div>
      )}

      {showUpgrade && (
        <div className="space-y-3">
          <Button
            variant="primary"
            size="sm"
            icon={Star}
            onClick={() => window.open('https://contavepro.com/upgrade', '_blank')}
          >
            Actualizar Licencia
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://contavepro.com/contact', '_blank')}
          >
            Contactar Ventas
          </Button>
        </div>
      )}
    </div>
  );
}

// Component for showing license requirements
export function LicenseRequirement({ 
  feature, 
  description 
}: { 
  feature: string; 
  description: string;
}) {
  const { canAccess, license } = useLicenseProtection(feature);

  return (
    <div className={`flex items-center space-x-2 text-sm ${
      canAccess ? 'text-success-600' : 'text-error-600'
    }`}>
      {canAccess ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <span className="font-medium">{description}</span>
      {!canAccess && license && (
        <span className="text-xs text-neutral-500 ml-2">
          (Requiere {feature})
        </span>
      )}
    </div>
  );
}