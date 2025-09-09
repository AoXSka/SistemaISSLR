// Corrección completa de providerService.ts

import { db } from './databaseService';
import { Provider } from '../types';
import { rifValidator } from '../utils/rifValidator';

export class ProviderService {
  private static instance: ProviderService;

  static getInstance(): ProviderService {
    if (!ProviderService.instance) {
      ProviderService.instance = new ProviderService();
    }
    return ProviderService.instance;
  }

  async createProvider(provider: Omit<Provider, 'id' | 'createdAt'>): Promise<number> {
    // Validate provider data
    this.validateProvider(provider);

    try {
      console.log('🔍 Checking if provider exists with RIF:', provider.rif);
      
      // Check if RIF already exists
      const existingProvider = await this.getProviderByRIF(provider.rif);
      
      if (existingProvider) {
        console.log('⚠️ Provider already exists, updating instead');
        await this.updateProvider(existingProvider.id, provider);
        return existingProvider.id;
      }

      console.log('✅ Creating new provider with complete data');

      const id = await db.createProvider({
        rif: provider.rif,
        name: provider.name,
        address: provider.address || '',
        phone: provider.phone || '',
        email: provider.email || '',
        contactPerson: provider.contactPerson || '',
        retentionISLRPercentage: provider.retentionISLRPercentage || 6,
        retentionIVAPercentage: provider.retentionIVAPercentage || 75,
        website: provider.website || '',
        taxType: provider.taxType || 'ordinary',
        notes: provider.notes || '',
        is_active: true
      });
      
      // Log audit action
      await this.logAuditAction('CREATE', 'provider', id, null, provider);
      
      console.log('✅ Provider created successfully with ID:', id);
      return id;
      
    } catch (error: any) {
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        console.error('❌ Duplicate key error detected');
        
        try {
          const existingProvider = await this.getProviderByRIF(provider.rif);
          if (existingProvider) {
            console.log('🔄 Found existing provider, updating and returning its ID');
            await this.updateProvider(existingProvider.id, provider);
            return existingProvider.id;
          }
        } catch (fallbackError) {
          console.error('❌ Could not recover from duplicate error:', fallbackError);
        }
        
        throw new Error(`Ya existe un proveedor con RIF ${provider.rif}`);
      }
      
      console.error('❌ Failed to create provider:', error);
      throw new Error(`Error al crear proveedor: ${error?.message || error}`);
    }
  }

  async updateProvider(id: number, updates: Partial<Provider>): Promise<void> {
    const oldProvider = await this.getProvider(id);
    if (!oldProvider) {
      throw new Error('Proveedor no encontrado');
    }

    console.log('🔧 ProviderService - Updating provider:', { id });

    // Validate updates
    this.validateProviderUpdates(updates);

    try {
      // Remove fields that shouldn't be updated
      const { id: _, createdAt, ...updateData } = updates;
      
      await db.updateProvider(id, updateData);
      
      // Log audit action
      await this.logAuditAction('UPDATE', 'provider', id, oldProvider, updateData);
      
      console.log('✅ ProviderService - Provider updated successfully');
    } catch (error) {
      console.error('❌ ProviderService - Update failed:', error);
      throw new Error(`Error al actualizar proveedor: ${error}`);
    }
  }

  async getProvider(id: number): Promise<Provider | null> {
    try {
      const dbProvider = await db.getProvider(id);
      
      if (!dbProvider) {
        console.log(`⚠️ Provider with id ${id} not found`);
        return null;
      }
      
      // IMPORTANTE: Mapear de snake_case a camelCase
      const provider: Provider = {
        id: dbProvider.id,
        rif: dbProvider.rif,
        name: dbProvider.name,
        address: dbProvider.address || '',
        phone: dbProvider.phone || '',
        email: dbProvider.email || '',
        contactPerson: dbProvider.contact_person || '',
        retentionISLRPercentage: parseFloat(dbProvider.retention_islr_percentage) || 6,
        retentionIVAPercentage: parseFloat(dbProvider.retention_iva_percentage) || 75,
        website: dbProvider.website || '',
        taxType: dbProvider.tax_type || 'ordinary',
        notes: dbProvider.notes || '',
        createdAt: dbProvider.created_at || new Date().toISOString()
      };
      
      console.log('✅ Provider retrieved and mapped:', {
        id: provider.id,
        name: provider.name,
        hasAllFields: !!(provider.name && provider.rif)
      });
      
      return provider;
    } catch (error) {
      console.error(`Failed to get provider with id ${id}:`, error);
      return null;
    }
  }

  async getProviderByRIF(rif: string): Promise<Provider | null> {
    try {
      const normalizedRif = rif.toUpperCase().trim();
      const dbProvider = await db.getProviderByRIF(normalizedRif);
      
      if (!dbProvider) {
        return null;
      }
      
      // IMPORTANTE: Mapear de snake_case a camelCase
      const provider: Provider = {
        id: dbProvider.id,
        rif: dbProvider.rif,
        name: dbProvider.name,
        address: dbProvider.address || '',
        phone: dbProvider.phone || '',
        email: dbProvider.email || '',
        contactPerson: dbProvider.contact_person || '',
        retentionISLRPercentage: parseFloat(dbProvider.retention_islr_percentage) || 6,
        retentionIVAPercentage: parseFloat(dbProvider.retention_iva_percentage) || 75,
        website: dbProvider.website || '',
        taxType: dbProvider.tax_type || 'ordinary',
        notes: dbProvider.notes || '',
        createdAt: dbProvider.created_at || new Date().toISOString()
      };
      
      return provider;
    } catch (error) {
      console.error('Failed to get provider by RIF:', error);
      return null;
    }
  }

  async getProviders(searchTerm?: string): Promise<Provider[]> {
    try {
      const dbProviders = await db.getProviders(searchTerm);
      
      // Convert database format to Provider type with proper mapping
      return dbProviders.map(dbProvider => ({
        id: dbProvider.id,
        rif: dbProvider.rif,
        name: dbProvider.name,
        address: dbProvider.address || '',
        phone: dbProvider.phone || '',
        email: dbProvider.email || '',
        contactPerson: dbProvider.contact_person || '',
        retentionISLRPercentage: parseFloat(dbProvider.retention_islr_percentage) || 6,
        retentionIVAPercentage: parseFloat(dbProvider.retention_iva_percentage) || 75,
        website: dbProvider.website || '',
        taxType: dbProvider.tax_type || 'ordinary',
        notes: dbProvider.notes || '',
        createdAt: dbProvider.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to get providers:', error);
      return [];
    }
  }

  async deleteProvider(id: number): Promise<void> {
    const provider = await this.getProvider(id);
    if (!provider) {
      throw new Error('Proveedor no encontrado');
    }

    console.log('🗑️ ProviderService - Deleting provider:', { id, name: provider.name });

    try {
      // Check if provider has related transactions
      const transactions = await db.getTransactions({ providerRif: provider.rif });
      
      if (transactions.length > 0) {
        throw new Error(`No se puede eliminar el proveedor ${provider.name} porque tiene ${transactions.length} transacciones asociadas`);
      }
      
      await db.deleteProvider(id);
      
      console.log('✅ ProviderService - Provider deleted successfully:', id);
      await this.logAuditAction('DELETE', 'provider', id, provider, null);
    } catch (error: any) {
      console.error('❌ ProviderService - Delete failed:', error);
      throw new Error(`Error al eliminar proveedor: ${error?.message || error}`);
    }
  }

  async getProviderStatistics(providerRif: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    totalRetained: number;
    averageRetention: number;
    lastTransaction?: string;
    yearlyAmount: number;
    monthlyAmount: number;
  }> {
    const transactions = await db.getTransactions({ providerRif });
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const yearlyTransactions = transactions.filter(t => 
      new Date(t.date).getFullYear() === currentYear
    );

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const totalAmount = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const totalRetained = transactions.reduce((sum, t) => sum + (t.retention_amount || 0), 0);
    const averageRetention = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + (t.retention_percentage || 0), 0) / transactions.length
      : 0;

    const lastTransaction = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

    return {
      totalTransactions: transactions.length,
      totalAmount,
      totalRetained,
      averageRetention,
      lastTransaction,
      yearlyAmount: yearlyTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
      monthlyAmount: monthlyTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
    };
  }

  async validateProviderRIFWithSENIAT(rif: string): Promise<{
    isValid: boolean;
    name?: string;
    status?: string;
    error?: string;
  }> {
    try {
      const validation = rifValidator.validate(rif);
      
      if (!validation.isValid) {
        return { isValid: false, error: validation.errors.join(', ') };
      }

      // Simulate SENIAT API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        isValid: true,
        name: 'NOMBRE VALIDADO POR SENIAT',
        status: 'ACTIVO'
      };
    } catch (error) {
      return { isValid: false, error: 'Error conectando con API de SENIAT' };
    }
  }

  private validateProvider(provider: Omit<Provider, 'id' | 'createdAt'>): void {
    const errors: string[] = [];

    // RIF validation
    const rifValidation = rifValidator.validate(provider.rif);
    if (!rifValidation.isValid) {
      errors.push(`RIF inválido: ${rifValidation.errors.join(', ')}`);
    }

    // Required fields
    if (!provider.name || provider.name.length < 3) {
      errors.push('Nombre debe tener al menos 3 caracteres');
    }

    if (provider.email && !this.isValidEmail(provider.email)) {
      errors.push('Formato de email inválido');
    }

    // Retention percentages
    if (provider.retentionISLRPercentage !== undefined) {
      if (provider.retentionISLRPercentage < 0 || provider.retentionISLRPercentage > 100) {
        errors.push('Porcentaje ISLR debe estar entre 0 y 100');
      }
    }

    if (provider.retentionIVAPercentage !== undefined) {
      if (provider.retentionIVAPercentage < 0 || provider.retentionIVAPercentage > 100) {
        errors.push('Porcentaje IVA debe estar entre 0 y 100');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private validateProviderUpdates(updates: Partial<Provider>): void {
    const errors: string[] = [];

    if (updates.rif) {
      const rifValidation = rifValidator.validate(updates.rif);
      if (!rifValidation.isValid) {
        errors.push(`RIF inválido: ${rifValidation.errors.join(', ')}`);
      }
    }

    if (updates.name !== undefined && updates.name.length < 3) {
      errors.push('Nombre debe tener al menos 3 caracteres');
    }

    if (updates.email && !this.isValidEmail(updates.email)) {
      errors.push('Formato de email inválido');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async logAuditAction(
    action: string,
    entityType: string,
    entityId: number,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    try {
      console.log(`Audit: ${action} ${entityType} ${entityId}`, { oldValues, newValues });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }
}

export const providerService = ProviderService.getInstance();