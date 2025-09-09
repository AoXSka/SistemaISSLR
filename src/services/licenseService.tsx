// License Service - Sistema de gestión de licencias ContaVe Pro
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
  private static instance: LicenseService;
  private currentLicense: LicenseData | null = null;
  private initialized = false;

  static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  constructor() {
    this.loadStoredLicense();
  }

  private loadStoredLicense(): void {
    try {
      const stored = localStorage.getItem('contave-license');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentLicense = parsed;
        console.log('📄 License loaded from storage:', {
          type: parsed.license?.type,
          status: parsed.license?.status,
          expires: parsed.license?.expiryDate
        });
      } else {
        // Create default trial license
        this.createTrialLicense();
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error loading license:', error);
      this.createTrialLicense();
      this.initialized = true;
    }
  }

  private createTrialLicense(): void {
    const trialDays = 7;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
    
    this.currentLicense = {
      license: {
        id: `trial-${Date.now()}`,
        type: 'trial',
        status: 'active',
        issuedDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        activationKey: 'TRIAL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      },
      limits: {
        maxUsers: 2,
        maxRecords: 100,
        maxCompanies: 1
      },
      features: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers',
        'basic_reports',
        'create_transactions',  // Add this for trial
        'manage_providers'       // Add this for trial
      ],
      usage: {
        users: 0,
        records: 0,
        companies: 0
      },
      client: {
        company: '',
        email: ''
      },
      company: {
        name: '',
        email: ''
      }
    };

    this.saveLicense();
    console.log('🆓 Trial license created:', {
      expiryDate: expiryDate.toLocaleDateString(),
      daysLeft: trialDays
    });
  }

  private saveLicense(): void {
    if (this.currentLicense) {
      localStorage.setItem('contave-license', JSON.stringify(this.currentLicense));
    }
  }

  getCurrentLicense(): LicenseData | null {
    if (!this.initialized) {
      this.loadStoredLicense();
    }
    return this.currentLicense;
  }

  isExpired(): boolean {
    if (!this.currentLicense) return true;
    
    const now = new Date();
    const expiryDate = new Date(this.currentLicense.license.expiryDate);
    return now > expiryDate;
  }

  isValidLicense(): boolean {
    // Check if license exists and is not expired
    if (!this.currentLicense) {
      console.log('❌ No license found');
      return false;
    }
    
    if (this.isExpired()) {
      console.log('❌ License is expired');
      return false;
    }
    
    // License is valid
    console.log('✅ License is valid:', this.currentLicense.license.type);
    return true;
  }

  getRemainingDays(): number {
    if (!this.currentLicense) return 0;
    
    const now = new Date();
    const expiryDate = new Date(this.currentLicense.license.expiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  getUsageStats(): { users: number; records: number; companies: number } {
    if (!this.currentLicense) {
      return { users: 0, records: 0, companies: 0 };
    }
    
    // Update usage stats from localStorage
    try {
      const users = JSON.parse(localStorage.getItem('contave-users-v2') || '[]');
      const transactions = JSON.parse(localStorage.getItem('contave-transactions-v2') || '[]');
      
      const updatedUsage = {
        users: users.filter((u: any) => u.isActive !== false).length,
        records: transactions.length,
        companies: 1 // Single company for now
      };

      if (this.currentLicense) {
        this.currentLicense.usage = updatedUsage;
        this.saveLicense();
      }

      return updatedUsage;
    } catch (error) {
      console.error('Error updating usage stats:', error);
      return this.currentLicense.usage;
    }
  }

  getLicenseFeatures(licenseType: string): string[] {
    const features = {
      trial: [
        'basic_accounting',
        'islr_retentions', 
        'iva_retentions',
        'generate_vouchers',
        'basic_reports',
        'create_transactions',
        'manage_providers'
      ],
      basic: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions', 
        'generate_vouchers',
        'basic_reports',
        'email_vouchers',
        'create_transactions',
        'manage_providers'
      ],
      professional: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers', 
        'basic_reports',
        'email_vouchers',
        'advanced_reports',
        'seniat_exports',
        'manage_providers',
        'backup_restore',
        'create_transactions',
        'bulk_operations'
      ],
      enterprise: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers',
        'basic_reports', 
        'email_vouchers',
        'advanced_reports',
        'seniat_exports',
        'manage_providers',
        'backup_restore',
        'multi_company',
        'api_access',
        'priority_support',
        'create_transactions',
        'bulk_operations',
        'unlimited_all'
      ]
    };

    return features[licenseType as keyof typeof features] || features.trial;
  }

  getExpiryWarning(): { show: boolean; message: string; type: 'warning' | 'error' } | null {
    const remainingDays = this.getRemainingDays();
    
    if (this.isExpired()) {
      return {
        show: true,
        message: 'Su licencia ha expirado. Renueve para continuar usando todas las funciones.',
        type: 'error'
      };
    }
    
    if (remainingDays <= 7) {
      return {
        show: true,
        message: `Su licencia expira en ${remainingDays} días. Renueve para evitar interrupciones.`,
        type: 'warning'
      };
    }
    
    return null;
  }

  hasFeature(feature: string): boolean {
    if (!this.currentLicense) {
      console.log(`❌ No license for feature: ${feature}`);
      return false;
    }
    
    if (this.isExpired()) {
      console.log(`❌ License expired for feature: ${feature}`);
      return false;
    }
    
    // Enterprise license has access to everything
    if (this.currentLicense.license.type === 'enterprise') {
      console.log(`✅ Enterprise license - feature allowed: ${feature}`);
      return true;
    }
    
    const hasIt = this.currentLicense.features.includes(feature);
    console.log(`${hasIt ? '✅' : '❌'} Feature ${feature}: ${hasIt ? 'allowed' : 'not allowed'} for ${this.currentLicense.license.type}`);
    
    return hasIt;
  }

  canCreateTransactions(): boolean {
    // Check if license is valid and has transaction creation feature
    if (!this.isValidLicense()) {
      console.log('❌ Cannot create transactions - invalid license');
      return false;
    }
    
    // Enterprise always can
    if (this.currentLicense?.license.type === 'enterprise') {
      console.log('✅ Enterprise license - can create transactions');
      return true;
    }
    
    // Check feature flag
    const canCreate = this.hasFeature('create_transactions');
    
    // Also check record limits
    if (canCreate && this.currentLicense) {
      const usage = this.getUsageStats();
      const withinLimits = usage.records < this.currentLicense.limits.maxRecords || 
                          this.currentLicense.limits.maxRecords === -1;
      
      if (!withinLimits) {
        console.log('❌ Cannot create transactions - record limit reached');
        return false;
      }
    }
    
    return canCreate;
  }

  canCreateRecords(): boolean {
    if (!this.currentLicense) {
      console.log('❌ Cannot create records - no license');
      return false;
    }
    
    if (this.isExpired()) {
      console.log('❌ Cannot create records - license expired');
      return false;
    }
    
    // Enterprise has unlimited
    if (this.currentLicense.license.type === 'enterprise') {
      console.log('✅ Enterprise license - unlimited records');
      return true;
    }
    
    const usage = this.getUsageStats();
    const canCreate = usage.records < this.currentLicense.limits.maxRecords || 
                     this.currentLicense.limits.maxRecords === -1;
    
    if (!canCreate) {
      console.log(`❌ Record limit reached: ${usage.records}/${this.currentLicense.limits.maxRecords}`);
    }
    
    return canCreate;
  }

  canAddUsers(): boolean {
    if (!this.currentLicense) return false;
    if (this.isExpired()) return false;
    
    // Enterprise has unlimited
    if (this.currentLicense.license.type === 'enterprise') {
      return true;
    }
    
    const usage = this.getUsageStats();
    return usage.users < this.currentLicense.limits.maxUsers || 
           this.currentLicense.limits.maxUsers === -1;
  }

  async refreshLicense(): Promise<void> {
    try {
      // In a real app, this would check with license server
      console.log('🔄 Refreshing license...');
      this.loadStoredLicense();
    } catch (error) {
      console.error('❌ Error refreshing license:', error);
      throw error;
    }
  }

  async validateLicenseKey(activationKey: string): Promise<{ isValid: boolean; data?: any; error?: string; remainingDays?: number }> {
    try {
      console.log('🔍 Validating license key:', activationKey.substring(0, 10) + '...');
      
      // Basic validation checks
      if (!activationKey || activationKey.length < 10) {
        return {
          isValid: false,
          error: 'Clave de licencia inválida - formato incorrecto'
        };
      }

      // Simulate license validation (in real app, this would call license server)
      const licenseType = this.determineLicenseType(activationKey);
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      const remainingDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Create mock license data for validation response
      const licenseData = {
        license: {
          id: `lic-${Date.now()}`,
          type: licenseType,
          status: 'active',
          issuedDate: now.toISOString(),
          expiryDate: expiryDate.toISOString(),
          activationKey
        },
        client: {
          company: 'Empresa Validada',
          email: 'validacion@empresa.com',
          rif: 'J-123456789'
        }
      };

      return {
        isValid: true,
        data: licenseData,
        remainingDays
      };
    } catch (error) {
      console.error('❌ Error validating license key:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Error desconocido durante la validación'
      };
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
      return true;
    } catch (error) {
      console.error('❌ Error activating license:', error);
      return false;
    }
  }

  private determineLicenseType(activationKey: string): 'trial' | 'basic' | 'professional' | 'enterprise' {
    if (activationKey.startsWith('ENT-') || activationKey.startsWith('ENT')) return 'enterprise';
    if (activationKey.startsWith('PRO-') || activationKey.startsWith('PRO')) return 'professional';
    if (activationKey.startsWith('BASIC-') || activationKey.startsWith('BAS')) return 'basic';
    if (activationKey.startsWith('TRIAL-') || activationKey.startsWith('TRI')) return 'trial';
    return 'trial';
  }

  private getLicenseLimits(licenseType: string): { maxUsers: number; maxRecords: number; maxCompanies: number } {
    const limits = {
      trial: { maxUsers: 2, maxRecords: 100, maxCompanies: 1 },
      basic: { maxUsers: 3, maxRecords: 1000, maxCompanies: 1 },
      professional: { maxUsers: 10, maxRecords: 10000, maxCompanies: 3 },
      enterprise: { maxUsers: -1, maxRecords: -1, maxCompanies: -1 }
    };

    return limits[licenseType as keyof typeof limits] || limits.trial;
  }
}

export const licenseService = LicenseService.getInstance();
export default licenseService;