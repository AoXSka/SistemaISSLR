import { db } from './databaseService';

export interface CompanySettings {
  id?: number;
  rif: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  fiscalYear: number;
  currency: string;
  taxRegime: 'ordinary' | 'special' | 'formal';
  accountingMethod: 'accrual' | 'cash';
  defaultISLRPercentage: number;
  defaultIVAPercentage: number;
  // Nuevos campos fiscales SENIAT
  periodoVigencia?: string; // Formato MM-YYYY (ej: 08-2025)
  numeroControlInicial?: string; // Secuencia inicial (ej: 20250800000001)
  secuenciaComprobantes?: number; // Contador auto-incrementable
  primaryColor?: string;
  secondaryColor?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  emailFromName?: string;
  createdAt?: string;
  updatedAt?: string;
}

class CompanyService {
  async getCompanySettings(): Promise<CompanySettings | null> {
    try {
      await db.connect();
      const dbSettings = await db.getCompanySettings(); // IMPORTANTE: Agregar await
      
      if (!dbSettings) {
        return null;
      }
      
      // Mapear de snake_case a camelCase
      return this.mapFromDatabase(dbSettings);
    } catch (error) {
      console.error('❌ Error fetching company settings:', error);
      throw error;
    }
  }

  async updateCompanySettings(updates: Partial<CompanySettings>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 CompanyService - Updating settings with:', updates);
      console.log('💾 CompanyService - taxRegime in updates:', updates.taxRegime);
      
      await db.connect();
      
      // IMPORTANTE: Agregar await aquí
      const current = await db.getCompanySettings();
      
      // Mapear a formato de base de datos (snake_case)
      const dbUpdates = this.mapToDatabase(updates);
      
      const updatedSettings = current ? { 
        ...current, 
        ...dbUpdates,
        tax_regime: updates.taxRegime || current.tax_regime, // Asegurar que taxRegime se preserve
        updated_at: new Date().toISOString() 
      } : {
        ...dbUpdates,
        tax_regime: updates.taxRegime || 'ordinary', // Default fallback
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 CompanyService - Final settings to save:', {
        ...updatedSettings,
        tax_regime: updatedSettings.tax_regime
      });
      
      // IMPORTANTE: Agregar await aquí
      await db.saveCompanySettings(updatedSettings);
      
      // Verificar que se guardó correctamente
      const verified = await db.getCompanySettings();
      console.log('✅ CompanyService - Settings saved and verified:', {
        taxRegime: verified?.tax_regime,
        verifiedTaxRegime: verified?.tax_regime === updates.taxRegime ? 'MATCH' : 'MISMATCH',
        name: verified?.name,
        rif: verified?.rif
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ CompanyService - Error updating settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  async initializeCompanySettings(settings: CompanySettings): Promise<{ success: boolean; error?: string }> {
    try {
      await db.connect();
      
      // Mapear a formato de base de datos
      const dbSettings = this.mapToDatabase(settings);
      
      const settingsWithTimestamp = {
        ...dbSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // IMPORTANTE: Agregar await
      await db.saveCompanySettings(settingsWithTimestamp);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error initializing company settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  async isCompanyConfigured(): Promise<boolean> {
    try {
      await db.connect();
      const settings = await db.getCompanySettings(); // Agregar await
      return settings !== null && settings.rif && settings.name ? true : false;
    } catch (error) {
      console.error('❌ Error checking company configuration:', error);
      return false;
    }
  }

  async getFiscalConfig(): Promise<{
    fiscalYear: number;
    currency: string;
    taxRegime: string;
    accountingMethod: string;
    defaultISLRPercentage: number;
    defaultIVAPercentage: number;
  }> {
    try {
      await db.connect();
      const settings = await db.getCompanySettings(); // Agregar await
      
      if (!settings) {
        // Return default fiscal configuration
        return {
          fiscalYear: new Date().getFullYear(),
          currency: 'VES',
          taxRegime: 'ordinary',
          accountingMethod: 'accrual',
          defaultISLRPercentage: 3.0,
          defaultIVAPercentage: 16.0
        };
      }
      
      // Mapear de snake_case a camelCase
      return {
        fiscalYear: settings.fiscal_year || new Date().getFullYear(),
        currency: settings.currency || 'VES',
        taxRegime: settings.tax_regime || 'ordinary',
        accountingMethod: settings.accounting_method || 'accrual',
        defaultISLRPercentage: settings.default_islr_percentage || 3.0,
        defaultIVAPercentage: settings.default_iva_percentage || 16.0
      };
    } catch (error) {
      console.error('❌ Error fetching fiscal config:', error);
      throw error;
    }
  }

  async getEmailConfig(): Promise<{
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromName?: string;
    fromAddress?: string;
  }> {
    try {
      await db.connect();
      const settings = await db.getCompanySettings(); // Agregar await
      
      if (!settings) {
        return {};
      }
      
      return {
        smtpHost: settings.smtp_host,
        smtpPort: settings.smtp_port,
        smtpUser: settings.smtp_user,
        smtpPassword: settings.smtp_password,
        fromName: settings.email_from_name,
        fromAddress: settings.email
      };
    } catch (error) {
      console.error('❌ Error fetching email config:', error);
      throw error;
    }
  }

  async getBrandingConfig(): Promise<{
    logoPath?: string;
    primaryColor: string;
    secondaryColor: string;
    letterheadPath?: string;
  }> {
    try {
      await db.connect();
      const settings = await db.getCompanySettings(); // Agregar await
      
      if (!settings) {
        return {
          primaryColor: '#1e40af',
          secondaryColor: '#dc2626'
        };
      }
      
      return {
        primaryColor: settings.primary_color || '#1e40af',
        secondaryColor: settings.secondary_color || '#dc2626'
      };
    } catch (error) {
      console.error('❌ Error fetching branding config:', error);
      throw error;
    }
  }

  async exportConfiguration(): Promise<Blob> {
    try {
      const settings = await db.getCompanySettings(); // Agregar await
      
      if (!settings) {
        throw new Error('No hay configuración para exportar');
      }
      
      const exportData = {
        company: this.mapFromDatabase(settings),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const jsonData = JSON.stringify(exportData, null, 2);
      return new Blob([jsonData], { type: 'application/json' });
    } catch (error) {
      console.error('❌ Error exporting configuration:', error);
      throw error;
    }
  }

  // Mapeo de camelCase a snake_case (para guardar en DB)
  private mapToDatabase(settings: Partial<CompanySettings>): any {
    const mapped: any = {};
    
    // Campos básicos
    if (settings.rif !== undefined) mapped.rif = settings.rif;
    if (settings.name !== undefined) mapped.name = settings.name;
    if (settings.address !== undefined) mapped.address = settings.address;
    if (settings.phone !== undefined) mapped.phone = settings.phone;
    if (settings.email !== undefined) mapped.email = settings.email;
    if (settings.website !== undefined) mapped.website = settings.website;
    
    // Campos fiscales - MAPEO CORRECTO
    if (settings.fiscalYear !== undefined) mapped.fiscal_year = settings.fiscalYear;
    if (settings.currency !== undefined) mapped.currency = settings.currency;
    if (settings.taxRegime !== undefined) mapped.tax_regime = settings.taxRegime;
    if (settings.accountingMethod !== undefined) mapped.accounting_method = settings.accountingMethod;
    if (settings.defaultISLRPercentage !== undefined) mapped.default_islr_percentage = settings.defaultISLRPercentage;
    if (settings.defaultIVAPercentage !== undefined) mapped.default_iva_percentage = settings.defaultIVAPercentage;
    
    // Campos SENIAT
    if (settings.periodoVigencia !== undefined) mapped.periodo_vigencia = settings.periodoVigencia;
    if (settings.numeroControlInicial !== undefined) mapped.numero_control_inicial = settings.numeroControlInicial;
    if (settings.secuenciaComprobantes !== undefined) mapped.secuencia_comprobantes = settings.secuenciaComprobantes;
    
    // Campos de branding
    if (settings.primaryColor !== undefined) mapped.primary_color = settings.primaryColor;
    if (settings.secondaryColor !== undefined) mapped.secondary_color = settings.secondaryColor;
    
    // Campos de email
    if (settings.smtpHost !== undefined) mapped.smtp_host = settings.smtpHost;
    if (settings.smtpPort !== undefined) mapped.smtp_port = settings.smtpPort;
    if (settings.smtpUser !== undefined) mapped.smtp_user = settings.smtpUser;
    if (settings.smtpPassword !== undefined) mapped.smtp_password = settings.smtpPassword;
    if (settings.emailFromName !== undefined) mapped.email_from_name = settings.emailFromName;
    
    console.log('🔄 Mapped to database format:', mapped);
    return mapped;
  }

  // Mapeo de snake_case a camelCase (para leer de DB)
  private mapFromDatabase(dbSettings: any): CompanySettings {
    return {
      id: dbSettings.id,
      rif: dbSettings.rif,
      name: dbSettings.name,
      address: dbSettings.address || '',
      phone: dbSettings.phone || '',
      email: dbSettings.email || '',
      website: dbSettings.website || '',
      fiscalYear: dbSettings.fiscal_year || new Date().getFullYear(),
      currency: dbSettings.currency || 'VES',
      taxRegime: dbSettings.tax_regime || 'ordinary',
      accountingMethod: dbSettings.accounting_method || 'accrual',
      defaultISLRPercentage: dbSettings.default_islr_percentage || 3.0,
      defaultIVAPercentage: dbSettings.default_iva_percentage || 16.0,
      periodoVigencia: dbSettings.periodo_vigencia,
      numeroControlInicial: dbSettings.numero_control_inicial,
      secuenciaComprobantes: dbSettings.secuencia_comprobantes,
      primaryColor: dbSettings.primary_color,
      secondaryColor: dbSettings.secondary_color,
      smtpHost: dbSettings.smtp_host,
      smtpPort: dbSettings.smtp_port,
      smtpUser: dbSettings.smtp_user,
      smtpPassword: dbSettings.smtp_password,
      emailFromName: dbSettings.email_from_name,
      createdAt: dbSettings.created_at,
      updatedAt: dbSettings.updated_at
    };
  }
}

export const companyService = new CompanyService();
export { CompanyService };