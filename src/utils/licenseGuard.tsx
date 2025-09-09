import React from 'react';
import { Shield } from 'lucide-react';

export class LicenseGuard {
  private static instance: LicenseGuard;
  private licenseCache: any = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  static getInstance(): LicenseGuard {
    if (!LicenseGuard.instance) {
      LicenseGuard.instance = new LicenseGuard();
    }
    return LicenseGuard.instance;
  }

  private getCurrentLicense() {
    const now = Date.now();
    
    // Use cache to prevent excessive license service calls
    if (this.licenseCache && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return this.licenseCache;
    }
    
    try {
      // Import dynamically to prevent circular dependencies
      const { licenseService } = require('../services/licenseService');
      this.licenseCache = licenseService.getCurrentLicense();
      this.lastCacheTime = now;
      return this.licenseCache;
    } catch (error) {
      console.error('Error accessing license service:', error);
      return null;
    }
  }

  // Check if user can access a specific feature
  canAccess(feature: string): boolean {
    try {
      const { licenseService } = require('../services/licenseService');
      return licenseService.hasFeature(feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  // Check if user can create new records
  canCreateRecords(): boolean {
    try {
      const { licenseService } = require('../services/licenseService');
      return licenseService.canCreateRecords();
    } catch (error) {
      console.error('Error checking record creation:', error);
      return false;
    }
  }

  // Check if user can add new users
  canAddUsers(): boolean {
    try {
      const { licenseService } = require('../services/licenseService');
      return licenseService.canAddUsers();
    } catch (error) {
      console.error('Error checking user addition:', error);
      return false;
    }
  }

  // Get blocked action message
  getBlockedMessage(action: string): string {
    const license = this.getCurrentLicense();
    
    if (!license) {
      return `La función '${action}' requiere una licencia válida. Contacte a ventas para obtener una licencia.`;
    }

    try {
      const { licenseService } = require('../services/licenseService');
      if (licenseService.isExpired()) {
      return `Su licencia ha expirado. Renueve su licencia para acceder a '${action}'.`;
      }
    } catch (error) {
      return `Error verificando licencia para '${action}'.`;
    }

    let stats;
    try {
      const { licenseService } = require('../services/licenseService');
      stats = licenseService.getUsageStats();
    } catch (error) {
      return `Error obteniendo estadísticas de uso para '${action}'.`;
    }
    
    if (action === 'create_record' && !this.canCreateRecords()) {
      return `Ha alcanzado el límite de ${license.limits.maxRecords} registros. Actualice su licencia para continuar.`;
    }

    if (action === 'add_user' && !this.canAddUsers()) {
      return `Ha alcanzado el límite de ${license.limits.maxUsers} usuarios. Actualice su licencia para agregar más usuarios.`;
    }

    return `Esta función no está disponible en su licencia ${license.license.type}. Actualice a una licencia superior.`;
  }
}

export const licenseGuard = LicenseGuard.getInstance();

// Higher-order component for license protection
export function withLicenseProtection<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  requiredFeature: string,
  fallbackComponent?: React.ComponentType<any>
) {
  return function LicenseProtectedComponent(props: T) {
    const [canAccess, setCanAccess] = React.useState(false);
    const [blockedMessage, setBlockedMessage] = React.useState('');
    const [checkComplete, setCheckComplete] = React.useState(false);

    React.useEffect(() => {
      // Async check to prevent blocking
      const checkAccess = async () => {
        try {
          const hasAccess = licenseGuard.canAccess(requiredFeature);
          const message = hasAccess ? '' : licenseGuard.getBlockedMessage(requiredFeature);
          
          setCanAccess(hasAccess);
          setBlockedMessage(message);
          setCheckComplete(true);
        } catch (error) {
          console.error('Error in license protection check:', error);
          setCanAccess(false);
          setBlockedMessage('Error verificando permisos de licencia');
          setCheckComplete(true);
        }
      };
      
      checkAccess();
    }, [requiredFeature]);

    if (!checkComplete) {
      // Show loading while checking
      return React.createElement('div', {
        className: "flex items-center justify-center p-4"
      }, [
        React.createElement('div', {
          key: "spinner",
          className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"
        }),
        React.createElement('span', {
          key: "text",
          className: "ml-2 text-sm text-neutral-600"
        }, 'Verificando permisos...')
      ]);
    }

    if (!canAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return React.createElement(FallbackComponent, { message: protection.blockedMessage });
      }

      return React.createElement('div', {
        className: "p-8 text-center bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-700"
      }, [
        React.createElement(Shield, {
          key: "shield",
          className: "h-16 w-16 text-warning-500 mx-auto mb-4"
        }),
        React.createElement('h3', {
          key: "title", 
          className: "text-xl font-bold text-warning-900 dark:text-warning-100 mb-2"
        }, "Función Restringida"),
        React.createElement('p', {
          key: "message",
          className: "text-warning-800 dark:text-warning-200 mb-4"
        }, blockedMessage),
        React.createElement('button', {
          key: "button",
          className: "px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors"
        }, "Actualizar Licencia")
      ]);
    }

    return React.createElement(WrappedComponent, props);
  };
}