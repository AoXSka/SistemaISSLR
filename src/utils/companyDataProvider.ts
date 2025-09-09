// Company Data Provider - Centralized access to company settings across the app
import { useState, useEffect } from 'react';
import { companyService, CompanySettings } from '../services/companyService';

export class CompanyDataProvider {
  private static instance: CompanyDataProvider;
  private cachedCompany: CompanySettings | null = null;
  private lastRefresh: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CompanyDataProvider {
    if (!CompanyDataProvider.instance) {
      CompanyDataProvider.instance = new CompanyDataProvider();
    }
    return CompanyDataProvider.instance;
  }

  async getCompanyData(): Promise<CompanySettings | null> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cachedCompany && (now - this.lastRefresh) < this.CACHE_DURATION) {
      return this.cachedCompany;
    }

    try {
      const company = await companyService.getCompanySettings();
      this.cachedCompany = company;
      this.lastRefresh = now;
      return company;
    } catch (error) {
      console.error('Error loading company data:', error);
      return this.cachedCompany; // Return stale data if available
    }
  }

  async refreshCache(): Promise<void> {
    this.cachedCompany = null;
    this.lastRefresh = 0;
    await this.getCompanyData();
  }

  async updateCompanySettings(updates: any): Promise<void> {
    // Import dynamically to avoid circular dependencies
    try {
      const { companyService } = await import('../services/companyService');
      await companyService.updateCompanySettings(updates);
    } catch (error) {
      console.error('❌ CompanyDataProvider - Error updating settings:', error);
      throw error;
    }
    await this.refreshCache();
  }

  // Convenience methods for common use cases
  async getCompanyForPDF(): Promise<{
    rif: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    fiscalYear: number;
    periodoVigencia: string;
    numeroControlInicial: string;
  }> {
    const company = await this.getCompanyData();
    
    if (!company || !company.rif || !company.name) {
      throw new Error('Configuración de empresa incompleta. Complete la información de empresa antes de generar PDFs.');
    }

    return {
      rif: company.rif,
      name: company.name,
      address: company.address || 'Dirección no configurada',
      phone: company.phone || 'Teléfono no configurado',
      email: company.email || 'Email no configurado',
      fiscalYear: company.fiscalYear || new Date().getFullYear(),
      periodoVigencia: company.periodoVigencia || `${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`,
      numeroControlInicial: company.numeroControlInicial || `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}00000001`
    };
  }

  async getCompanyForSENIAT(): Promise<{
    agentRif: string;
    agentName: string;
    periodoVigencia: string;
    numeroControlInicial: string;
    secuenciaComprobantes: number;
  }> {
    const company = await this.getCompanyData();
    
    if (!company || !company.rif || !company.name) {
      throw new Error('Configuración de empresa requerida para exportaciones SENIAT. Complete la información de empresa.');
    }

    return {
      agentRif: company.rif,
      agentName: company.name,
      periodoVigencia: company.periodoVigencia || `${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`,
      numeroControlInicial: company.numeroControlInicial || `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}00000001`,
      secuenciaComprobantes: company.secuenciaComprobantes || 1
    };
  }

  async getFiscalConfig(): Promise<{
    fiscalYear: number;
    currency: string;
    taxRegime: string;
    accountingMethod: string;
    defaultISLRPercentage: number;
    defaultIVAPercentage: number;
  }> {
    return await companyService.getFiscalConfig();
  }

  async getEmailConfig(): Promise<{
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromName?: string;
    fromAddress?: string;
  }> {
    return await companyService.getEmailConfig();
  }

  async getBrandingConfig(): Promise<{
    logoPath?: string;
    primaryColor: string;
    secondaryColor: string;
    letterheadPath?: string;
  }> {
    return await companyService.getBrandingConfig();
  }

  async updateCompanySettings(updates: any): Promise<void> {
    const { companyService } = await import('../services/companyService');
    await companyService.updateCompanySettings(updates);
    await this.refreshCache();
  }
}

export const companyDataProvider = CompanyDataProvider.getInstance();

// Hook for components that need company data
export function useCompanyData() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await companyDataProvider.getCompanyData();
        setCompany(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading company data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refresh = async () => {
    await companyDataProvider.refreshCache();
    const data = await companyDataProvider.getCompanyData();
    setCompany(data);
  };

  return { company, loading, error, refresh };
}