export interface LicenseData {
  license: {
    id: string;
    type: 'trial' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'expired' | 'suspended';
    issuedDate: string;
    expiryDate: string;
    activationKey: string;
  };
  limits: {
    maxUsers: number;
    maxRecords: number;
    maxCompanies: number;
  };
  features: string[];
  usage: {
    users: number;
    records: number;
    companies: number;
  };
  client: {
    company: string;
    email: string;
    rif?: string;
  };
  company: {
    name: string;
    email: string;
    rif?: string;
  };
}

class LicenseService {
  private currentLicense: LicenseData | null = null;
  private licenseChangeListeners: (() => void)[] = [];
  private isDevelopment = true; 

  constructor() {
    this.loadStoredLicense();
  }

  private loadStoredLicense(): void {
    try {
      const stored = localStorage.getItem('contave-license');
      if (stored) {
        this.currentLicense = JSON.parse(stored);
        console.log('📋 License loaded from storage:', {
          type: this.currentLicense?.license.type,
          status: this.currentLicense?.license.status
        });
      }
    } catch (error) {
      console.error('Error loading stored license:', error);
      this.currentLicense = null;
    }
  }

  async loadLicenseFromFile(file: File): Promise<{ isValid: boolean; data?: any; error?: string }> {
    try {
      console.log('📄 Loading license from file:', file.name);

      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Parse JSON content
      let licenseData: any;
      try {
        licenseData = JSON.parse(content);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
          isValid: false,
          error: 'Archivo no contiene JSON válido'
        };
      }

      console.log('📋 License data structure:', {
        hasLicense: !!licenseData.license,
        hasActivationKey: !!licenseData.license?.activationKey,
        licenseType: licenseData.license?.type,
        keys: Object.keys(licenseData)
      });

      // Validate license structure - check for required fields
      if (!licenseData.license || !licenseData.license.activationKey) {
        console.error('Invalid license structure. Required: license.activationKey');
        return {
          isValid: false,
          error: 'Archivo no contiene una estructura de licencia válida'
        };
      }

      // Validate all required fields are present
      const requiredFields = ['id', 'type', 'status', 'issuedDate', 'expiryDate', 'activationKey'];
      for (const field of requiredFields) {
        if (!licenseData.license[field]) {
          console.error(`Missing required field: license.${field}`);
          return {
            isValid: false,
            error: `Campo requerido faltante: ${field}`
          };
        }
      }

      // Check if license is expired
      const expiryDate = new Date(licenseData.license.expiryDate);
      const now = new Date();
      if (now > expiryDate) {
        return {
          isValid: false,
          error: 'La licencia ha expirado'
        };
      }

      // Ensure features include transaction permissions for enterprise
      let features = licenseData.features || this.getLicenseFeatures(licenseData.license.type);
      if (licenseData.license.type === 'enterprise' && !features.includes('create_transactions')) {
        features.push('create_transactions');
        features.push('unlimited_all');
      }

      // Load the complete license data from file
      this.currentLicense = {
        license: {
          id: licenseData.license.id || licenseData.id,
          type: licenseData.license.type,
          status: licenseData.license.status || 'active',
          issuedDate: licenseData.license.issuedDate,
          expiryDate: licenseData.license.expiryDate,
          activationKey: licenseData.license.activationKey
        },
        limits: licenseData.limits || {
          maxUsers: -1,
          maxRecords: -1,
          maxCompanies: -1
        },
        features: features,
        usage: licenseData.usage || {
          users: 0,
          records: 0,
          companies: 0
        },
        client: licenseData.client || {
          company: licenseData.company?.name || '',
          email: licenseData.company?.email || '',
          rif: licenseData.company?.rif || licenseData.client?.rif || ''
        },
        company: licenseData.company || {
          name: licenseData.client?.company || '',
          email: licenseData.client?.email || '',
          rif: licenseData.client?.rif || ''
        }
      };

      // Save the loaded license
      this.saveLicense();
      
      // Trigger license change event for hooks to detect
      this.notifyLicenseChange();
      
      console.log('✅ License loaded successfully:', {
        type: this.currentLicense.license.type,
        expires: this.currentLicense.license.expiryDate,
        company: this.currentLicense.company.name,
        canCreateTransactions: this.canCreateTransactions()
      });

      return {
        isValid: true,
        data: this.currentLicense
      };

    } catch (error) {
      console.error('❌ Error loading license from file:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar el archivo'
      };
    }
  }

  async activateLicense(activationKey: string, companyInfo: { name: string; email: string; rif?: string }): Promise<boolean> {
    try {
      // In a real app, this would validate with license server
      console.log('🔑 Activating license:', activationKey);
      
      // Simulate license activation
      const licenseType = this.determineLicenseType(activationKey);
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      
      this.currentLicense = {
        license: {
          id: `lic-${Date.now()}`,
          type: licenseType,
          status: 'active',
          issuedDate: now.toISOString(),
          expiryDate: expiryDate.toISOString(),
          activationKey
        },
        limits: this.getLicenseLimits(licenseType),
        features: this.getLicenseFeatures(licenseType),
        usage: {
          users: 0,
          records: 0,
          companies: 1
        },
        client: {
          company: companyInfo.name,
          email: companyInfo.email,
          rif: companyInfo.rif
        },
        company: companyInfo
      };

      this.saveLicense();
      
      // Trigger license change event
      this.notifyLicenseChange();
      
      return true;
    } catch (error) {
      console.error('❌ Error activating license:', error);
      return false;
    }
  }

  private saveLicense(): void {
    if (this.currentLicense) {
      localStorage.setItem('contave-license', JSON.stringify(this.currentLicense));
      console.log('💾 License saved to localStorage:', {
        type: this.currentLicense.license.type,
        status: this.currentLicense.license.status,
        storageKey: 'contave-license'
      });
    }
  }

  // License change notification system
  private notifyLicenseChange(): void {
    console.log('📢 Notifying license change to', this.licenseChangeListeners.length, 'listeners');
    this.licenseChangeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in license change listener:', error);
      }
    });
    
    // Also trigger a storage event for cross-component communication
    window.dispatchEvent(new CustomEvent('license-changed', {
      detail: this.currentLicense
    }));
  }
  
  onLicenseChange(listener: () => void): () => void {
    this.licenseChangeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.licenseChangeListeners.indexOf(listener);
      if (index > -1) {
        this.licenseChangeListeners.splice(index, 1);
      }
    };
  }
  
  // Force refresh for manual testing
  forceRefresh(): void {
    console.log('🔄 Force refreshing license state');
    this.loadStoredLicense();
    this.notifyLicenseChange();
  }

  getCurrentLicense(): LicenseData | null {
    return this.currentLicense;
  }

  isExpired(): boolean {
    if (!this.currentLicense) return true;
    const now = new Date();
    const expiryDate = new Date(this.currentLicense.license.expiryDate);
    return now > expiryDate;
  }

  getRemainingDays(): number {
    if (!this.currentLicense) return 0;
    const now = new Date();
    const expiryDate = new Date(this.currentLicense.license.expiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUsageStats(): { users: number; records: number; companies: number } {
    return this.currentLicense?.usage || { users: 0, records: 0, companies: 0 };
  }

  hasFeature(feature: string): boolean {
    // En desarrollo, permitir todo
    if (this.isDevelopment) {
      return true;
    }
    
    if (!this.currentLicense) return false;
    return this.currentLicense.features.includes(feature);
  }

  canCreateRecords(): boolean {
    if (!this.currentLicense) return false;
    if (this.isExpired()) return false;
    if (this.currentLicense.limits.maxRecords === -1) return true;
    return this.currentLicense.usage.records < this.currentLicense.limits.maxRecords;
  }

  canAddUsers(): boolean {
    if (!this.currentLicense) return false;
    if (this.isExpired()) return false;
    if (this.currentLicense.limits.maxUsers === -1) return true;
    return this.currentLicense.usage.users < this.currentLicense.limits.maxUsers;
  }

  canCreateTransactions(): boolean {
    if (!this.currentLicense) return false;
    if (this.isExpired()) return false;
    return this.hasFeature('create_transactions') || this.currentLicense.license.type !== 'trial';
  }

  getExpiryWarning(): { message: string; type: 'warning' | 'error' } | null {
    if (!this.currentLicense) return null;
    
    const remainingDays = this.getRemainingDays();
    
    if (remainingDays <= 0) {
      return {
        message: 'Su licencia ha expirado. Renueve para continuar usando todas las funciones.',
        type: 'error'
      };
    } else if (remainingDays <= 7) {
      return {
        message: `Su licencia expira en ${remainingDays} días. Considere renovar pronto.`,
        type: 'warning'
      };
    }
    
    return null;
  }

  async refreshLicense(): Promise<void> {
    // Simulate license refresh from server
    this.loadStoredLicense();
  }

  private determineLicenseType(activationKey: string): LicenseData['license']['type'] {
    // Simple logic to determine license type based on activation key
    if (activationKey.includes('ENT')) return 'enterprise';
    if (activationKey.includes('PRO')) return 'professional';
    if (activationKey.includes('BASIC')) return 'basic';
    return 'trial';
  }

  getLicenseLimits(type: LicenseData['license']['type']) {
    const limits = {
      trial: { maxUsers: 1, maxRecords: 100, maxCompanies: 1 },
      basic: { maxUsers: 1, maxRecords: 1000, maxCompanies: 1 },
      professional: { maxUsers: 3, maxRecords: 10000, maxCompanies: 3 },
      enterprise: { maxUsers: -1, maxRecords: -1, maxCompanies: -1 }
    };
    
    return limits[type];
  }

  getLicenseFeatures(type: LicenseData['license']['type']): string[] {
    const features = {
      trial: ['basic_reports', 'limited_records'],
      basic: ['basic_reports', 'create_transactions', 'export_pdf', 'manage_purchases'], // ← Agregar aquí
      professional: ['basic_reports', 'advanced_reports', 'create_transactions', 'export_pdf', 'api_access', 'manage_purchases', 'manage_providers'], // ← Agregar aquí
      enterprise: ['basic_reports', 'advanced_reports', 'create_transactions', 'export_pdf', 'api_access', 'multi_user', 'unlimited_all', 'manage_purchases', 'manage_providers', 'generate_vouchers'] // ← Agregar aquí
    };
    
    return features[type];
  }
}

  // debugLicenseState() {
  //   console.log('🔧 License Service Debug State:', {
  //     currentLicense: this.currentLicense,
  //     initialized: this.initialized,
  //     isExpired: this.isExpired(),
  //     isValid: this.isValidLicense(),
  //     remainingDays: this.getRemainingDays(),
  //     usageStats: this.getUsageStats(),
  //     canCreateTransactions: this.canCreateTransactions(),
  //     canCreateRecords: this.canCreateRecords()
  //   });
  // }

// Export singleton instance
export const licenseService = new LicenseService();
export default licenseService;