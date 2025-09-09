// src/services/initializationService.ts
import { supabase } from '../config/database';
import { db } from './databaseService';

interface SystemConfig {
  id?: number;
  is_initialized: boolean;
  setup_completed_at?: string;
  company_configured: boolean;
  admin_created: boolean;
  license_activated: boolean;
  deployment_url?: string;
  config_version?: string;
}

class InitializationService {
  private static instance: InitializationService;
  private isChecking = false;
  private cachedStatus: SystemConfig | null = null;

  static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  /**
   * Verifica si el sistema ya fue inicializado
   * Primero intenta desde la base de datos, luego localStorage como fallback
   */
  async checkInitializationStatus(): Promise<boolean> {
    if (this.isChecking) {
      // Evitar múltiples chequeos simultáneos
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.checkInitializationStatus();
    }

    this.isChecking = true;

    try {
      console.log('🔍 Checking system initialization status...');

      // 1. Intentar obtener el estado desde Supabase
      const dbStatus = await this.getStatusFromDatabase();
      
      if (dbStatus && dbStatus.is_initialized) {
        console.log('✅ System already initialized (from database)');
        this.cachedStatus = dbStatus;
        
        // Sincronizar con localStorage para este navegador
        this.syncToLocalStorage(dbStatus);
        
        return true;
      }

      // 2. Si no está en DB, verificar localStorage (migración)
      const localStatus = this.getStatusFromLocalStorage();
      
      if (localStatus && localStatus.is_initialized) {
        console.log('📦 Found local initialization, migrating to database...');
        
        // Migrar a la base de datos
        await this.saveStatusToDatabase(localStatus);
        this.cachedStatus = localStatus;
        
        return true;
      }

      // 3. Sistema no inicializado
      console.log('🆕 System not initialized, need setup');
      return false;

    } catch (error) {
      console.error('❌ Error checking initialization:', error);
      
      // En caso de error de red, usar localStorage como fallback
      const localStatus = this.getStatusFromLocalStorage();
      return localStatus?.is_initialized || false;
      
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Marca el sistema como inicializado
   */
  async markAsInitialized(config?: Partial<SystemConfig>): Promise<void> {
    try {
      const status: SystemConfig = {
        is_initialized: true,
        setup_completed_at: new Date().toISOString(),
        company_configured: config?.company_configured ?? true,
        admin_created: config?.admin_created ?? true,
        license_activated: config?.license_activated ?? false,
        deployment_url: window.location.origin,
        config_version: '1.0.0',
        ...config
      };

      // Guardar en base de datos
      await this.saveStatusToDatabase(status);
      
      // Guardar en localStorage como backup
      this.syncToLocalStorage(status);
      
      this.cachedStatus = status;
      
      console.log('✅ System marked as initialized');
    } catch (error) {
      console.error('❌ Error marking system as initialized:', error);
      throw error;
    }
  }

  /**
   * Reinicializa el sistema (para desarrollo/testing)
   */
  async resetInitialization(): Promise<void> {
    try {
      console.warn('🔄 Resetting system initialization...');
      
      // Limpiar base de datos
      await supabase
        .from('system_config')
        .delete()
        .neq('id', 0); // Eliminar todos
      
      // Limpiar localStorage
      this.clearLocalStorage();
      
      // Limpiar caché
      this.cachedStatus = null;
      
      console.log('✅ System initialization reset');
    } catch (error) {
      console.error('❌ Error resetting initialization:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado desde la base de datos
   */
  private async getStatusFromDatabase(): Promise<SystemConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get status from database:', error);
      return null;
    }
  }

  /**
   * Guarda el estado en la base de datos
   */
  private async saveStatusToDatabase(status: SystemConfig): Promise<void> {
    try {
      // Verificar si ya existe un registro
      const existing = await this.getStatusFromDatabase();
      
      if (existing && existing.id) {
        // Actualizar existente
        const { error } = await supabase
          .from('system_config')
          .update({
            ...status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('system_config')
          .insert({
            ...status,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      console.log('💾 System status saved to database');
    } catch (error) {
      console.error('Failed to save status to database:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado desde localStorage (fallback)
   */
  private getStatusFromLocalStorage(): SystemConfig | null {
    try {
      const firstRun = localStorage.getItem('system.first_run');
      const setupCompleted = localStorage.getItem('system.setup_completed');
      const companyData = localStorage.getItem('contave-company-v2');
      const licenseData = localStorage.getItem('contave-license');
      
      if (firstRun === 'false' && setupCompleted) {
        return {
          is_initialized: true,
          setup_completed_at: setupCompleted,
          company_configured: !!companyData,
          admin_created: true, // Asumimos que sí si llegó hasta aquí
          license_activated: !!licenseData
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Sincroniza el estado con localStorage
   */
  private syncToLocalStorage(status: SystemConfig): void {
    try {
      localStorage.setItem('system.first_run', 'false');
      localStorage.setItem('system.setup_completed', status.setup_completed_at || new Date().toISOString());
      localStorage.setItem('system.initialized', JSON.stringify(status));
      
      console.log('📱 Status synced to localStorage');
    } catch (error) {
      console.error('Error syncing to localStorage:', error);
    }
  }

  /**
   * Limpia los datos de localStorage
   */
  private clearLocalStorage(): void {
    const keysToRemove = [
      'system.first_run',
      'system.setup_completed',
      'system.initialized',
      'contave-company-v2',
      'contave-license',
      'contave-auth-session'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Obtiene información del sistema
   */
  async getSystemInfo(): Promise<{
    initialized: boolean;
    database: boolean;
    company: boolean;
    admin: boolean;
    license: boolean;
  }> {
    const status = this.cachedStatus || await this.getStatusFromDatabase();
    
    return {
      initialized: status?.is_initialized || false,
      database: await db.testConnection(),
      company: status?.company_configured || false,
      admin: status?.admin_created || false,
      license: status?.license_activated || false
    };
  }
}

export const initializationService = InitializationService.getInstance();
export default initializationService;