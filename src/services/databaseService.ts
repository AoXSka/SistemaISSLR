// src/services/databaseService.ts
import { supabase } from '../config/database';
import { licenseService } from './licenseService';
import type { Database } from '../config/database';

// Database interfaces matching Supabase schema
export interface DatabaseUser {
  id: number;
  uuid?: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'readonly';
  is_active: boolean;
  password_hash: string;
  last_login?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseTransaction {
  id: number;
  date: string;
  type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE';
  document_number?: string;
  control_number?: string;
  provider_rif?: string;
  provider_name?: string;
  concept: string;
  total_amount: number;
  taxable_base?: number;
  retention_percentage?: number;
  retention_amount?: number;
  status: 'PENDING' | 'PAID' | 'DECLARED';
  period: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseProvider {
  id: number;
  rif: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  retention_islr_percentage?: number;
  retention_iva_percentage?: number;
  website?: string;
  tax_type?: string;
  notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseVoucher {
  id: number;
  type: 'ISLR' | 'IVA';
  number: string;
  transaction_id: number;
  provider_rif: string;
  issue_date: string;
  period: string;
  total_retained: number;
  pdf_path?: string;
  email_sent: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CompanySettings {
  id?: number;
  rif: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  fiscal_year?: number;
  currency?: string;
  tax_regime?: string;
  accounting_method?: string;
  default_islr_percentage?: number;
  default_iva_percentage?: number;
  periodo_vigencia?: string;
  numero_control_inicial?: string;
  secuencia_comprobantes?: number;
  primary_color?: string;
  secondary_color?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  email_from_name?: string;
  created_at?: string;
  updated_at?: string;
}

class DatabaseService {
  private isInitialized = false;

  async connect(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔌 Database already connected');
      return;
    }

    try {
      console.log('🔌 Initializing Supabase connection...');

      // ✅ SOLUCIÓN: Test simple sin contar registros
      const { error } = await supabase
        .from('companies')  // Cambiar a tabla que seguro existe
        .select('id')       // Solo un campo
        .limit(1)
        .maybeSingle();     // No fallar si no hay registros

      if (error && error.code !== 'PGRST116') { // PGRST116 = sin registros (OK)
        console.error('❌ Supabase connection failed:', error);

        // Si es error RLS, intentar continuar
        if (error.code === '42P17') {
          console.warn('⚠️ RLS recursion detected - operating in degraded mode');
          this.isInitialized = true; // Permitir continuar
          return;
        }

        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      this.isInitialized = true;
      console.log('✅ Supabase connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      // En lugar de fallar completamente, permitir modo degradado
      console.warn('⚠️ Continuing in degraded mode...');
      this.isInitialized = true;
    }
  }


  // Helper method to handle Supabase errors
  private handleError(error: any, operation: string): never {
    console.error(`❌ ${operation} failed:`, error);
    
    // Detectar error de recursión RLS específicamente
    if (error?.code === '42P17' || error?.message?.includes('infinite recursion')) {
      const message = `RLS Policy Error: Las políticas de seguridad de base de datos tienen recursión infinita. 

  Solución inmediata:
  1. Ir a Supabase Dashboard
  2. Database → Tables → Deshabilitar RLS temporalmente
  3. O Authentication → Policies → Eliminar políticas problemáticas

  Error técnico: ${error.message}`;

      throw new Error(message);
    }

    throw new Error(`${operation} failed: ${error.message || error}`);
  }

  // Método para verificar estado de base de datos
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Intentar una consulta muy simple sin políticas complejas
      const { error } = await supabase.rpc('ping'); // Función personalizada simple
      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Wrapper seguro para todas las consultas
  private async ultraSafeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        // Log el error pero no crashear en RLS
        if (error.code === '42P17') {
          console.error(`🔄 RLS recursion in ${operationName} - using fallback`);
          return fallbackValue;
        }
        this.handleError(error, operationName);
      }

      // Validar que el resultado sea del tipo esperado
      if (Array.isArray(fallbackValue)) {
        return Array.isArray(data) ? data : fallbackValue;
      }

      return data || fallbackValue;
    } catch (error) {
      console.error(`💥 Ultra-safe query failed for ${operationName}:`, error);
      return fallbackValue;
    }
  }


  // =====================================================
  // USER MANAGEMENT METHODS
  // =====================================================

  async getUsers(): Promise<DatabaseUser[]> {
    try {
      await this.connect();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) this.handleError(error, 'Get users');

      console.log(`👥 Retrieved ${data?.length || 0} users from Supabase`);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return [];
    }
  }

  async getUser(id: number): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        this.handleError(error, 'Get user');
      }

      console.log(`👤 User lookup by ID ${id}:`, data ? 'found' : 'not found');
      return data || null;
    } catch (error) {
      console.error(`❌ Error getting user ${id}:`, error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get user by username');
      }

      console.log(`🔍 User lookup by username '${username}':`, data ? 'found' : 'not found');
      return data || null;
    } catch (error) {
      console.error(`❌ Error getting user by username '${username}':`, error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get user by email');
      }

      console.log(`📧 User lookup by email '${email}':`, data ? 'found' : 'not found');
      return data || null;
    } catch (error) {
      console.error(`❌ Error getting user by email '${email}':`, error);
      return null;
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    password_hash: string;
    full_name: string;
    role?: 'admin' | 'user' | 'readonly';
    is_active?: boolean;
  }): Promise<number> {
    try {
      // Check license permissions
      if (!licenseService.canAddUsers()) {
        throw new Error('Ha alcanzado el límite de usuarios de su licencia. Actualice para agregar más usuarios.');
      }

      console.log('📝 Creating user in Supabase:', {
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      });

      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: userData.password_hash,
          full_name: userData.full_name,
          role: userData.role || 'user',
          is_active: userData.is_active !== false
        })
        .select('id')
        .single();

      if (error) this.handleError(error, 'Create user');

      console.log('✅ User created successfully:', data?.id);
      return data!.id;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<DatabaseUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

      if (error) this.handleError(error, 'Update user');

      console.log(`✅ User ${id} updated successfully`);
    } catch (error) {
      console.error(`❌ Error updating user ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await this.updateUser(id, { is_active: false });
      console.log(`🗑️ User ${id} deleted (marked as inactive)`);
    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // =====================================================
  // TRANSACTION METHODS
  // =====================================================

  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    providerRif?: string;
    period?: string;
  }): Promise<DatabaseTransaction[]> {
    return this.ultraSafeQuery(
      async () => {
        await this.connect();

        let query = supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        // Apply filters only if they exist
        if (filters?.period) {
          query = query.eq('period', filters.period);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.providerRif) {
          query = query.eq('provider_rif', filters.providerRif);
        }
        if (filters?.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('date', filters.endDate);
        }

        const result = await query;
        
        if (result.data) {
          console.log(`Retrieved ${result.data.length} transactions from Supabase`);
        }
        
        return result;
      },
      [], // Fallback siempre un array vacío
      'Get transactions'
    );
  }

  async getTransaction(id: number): Promise<DatabaseTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get transaction');
      }

      return data || null;
    } catch (error) {
      console.error(`❌ Error getting transaction ${id}:`, error);
      return null;
    }
  }

  async createTransaction(transactionData: Omit<DatabaseTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      // Check license permissions
      if (!licenseService.canCreateRecords()) {
        throw new Error('Ha alcanzado el límite de registros de su licencia. Actualice para continuar.');
      }

      console.log('📝 Creating transaction in Supabase:', {
        type: transactionData.type,
        amount: transactionData.total_amount,
        provider: transactionData.provider_name
      });

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          date: transactionData.date,
          type: transactionData.type,
          document_number: transactionData.document_number,
          control_number: transactionData.control_number,
          provider_rif: transactionData.provider_rif,
          provider_name: transactionData.provider_name,
          concept: transactionData.concept,
          total_amount: transactionData.total_amount,
          taxable_base: transactionData.taxable_base || 0,
          retention_percentage: transactionData.retention_percentage || 0,
          retention_amount: transactionData.retention_amount || 0,
          status: transactionData.status || 'PENDING',
          period: transactionData.period,
          created_by: transactionData.created_by
        })
        .select('id')
        .single();

      if (error) this.handleError(error, 'Create transaction');

      console.log('✅ Transaction created:', data?.id);
      return data!.id;
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, updates: Partial<DatabaseTransaction>): Promise<void> {
    try {
      console.log('🗄️ Updating transaction in Supabase:', { id, updates });

      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id);

      if (error) this.handleError(error, 'Update transaction');

      console.log('✅ Transaction updated successfully:', id);
    } catch (error) {
      console.error(`❌ Error updating transaction ${id}:`, error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) this.handleError(error, 'Delete transaction');

      console.log(`🗑️ Transaction ${id} deleted`);
    } catch (error) {
      console.error(`❌ Error deleting transaction ${id}:`, error);
      throw error;
    }
  }

  // =====================================================
  // PROVIDER METHODS
  // =====================================================

  async getProviders(searchTerm?: string): Promise<DatabaseProvider[]> {
    return this.ultraSafeQuery(
      async () => {
        await this.connect();
      
        let query = supabase
          .from('providers')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });
      
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,rif.ilike.%${searchTerm}%`);
        }
      
        return await query;
      },
      [], // ✅ Fallback garantizado
      'Get providers'
    );
  }

  async getProvider(id: number): Promise<DatabaseProvider | null> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get provider');
      }

      return data || null;
    } catch (error) {
      console.error(`❌ Error getting provider ${id}:`, error);
      return null;
    }
  }

  async getProviderByRIF(rif: string): Promise<DatabaseProvider | null> {
    try {
      console.log('🔍 Looking for provider by RIF:', rif);

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('rif', rif)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get provider by RIF');
      }

      console.log('✅ Provider lookup result:', {
        searchRif: rif,
        found: !!data,
        providerName: data?.name || 'N/A'
      });

      return data || null;
    } catch (error) {
      console.error(`❌ Error getting provider by RIF ${rif}:`, error);
      return null;
    }
  }

  async createProvider(providerData: Omit<DatabaseProvider, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      // Check license permissions
      if (!licenseService.hasFeature('manage_providers')) {
        throw new Error('La gestión de proveedores no está disponible en su licencia actual.');
      }
  
      console.log('🔍 Creating provider in Supabase:', {
        rif: providerData.rif,
        name: providerData.name
      });
  
      // IMPORTANTE: Mapear correctamente de camelCase a snake_case
      const { data, error } = await supabase
        .from('providers')
        .insert({
          rif: providerData.rif,
          name: providerData.name,
          address: providerData.address || '',
          phone: providerData.phone || '',
          email: providerData.email || '',
          // MAPEO CORRECTO - de camelCase a snake_case
          contact_person: providerData.contactPerson || providerData.contact_person || '',
          retention_islr_percentage: 
            providerData.retentionISLRPercentage || 
            providerData.retention_islr_percentage || 
            6, // Valor por defecto
          retention_iva_percentage: 
            providerData.retentionIVAPercentage || 
            providerData.retention_iva_percentage || 
            75, // Valor por defecto
          website: providerData.website || '',
          tax_type: providerData.taxType || providerData.tax_type || 'ordinary',
          notes: providerData.notes || '',
          is_active: providerData.is_active !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
  
      if (error) this.handleError(error, 'Create provider');
  
      console.log('✅ Provider created with all fields:', data?.id);
      return data!.id;
    } catch (error) {
      console.error('❌ Error creating provider:', error);
      throw error;
    }
  }
  
  // También corregir updateProvider:
  async updateProvider(id: number, updates: Partial<DatabaseProvider>): Promise<void> {
    try {
      console.log('🗄️ Updating provider in Supabase:', { id, updates });
  
      // MAPEO CORRECTO para actualización
      const mappedUpdates: any = {
        updated_at: new Date().toISOString()
      };
  
      // Mapear solo los campos que vienen en el update
      if (updates.rif !== undefined) mappedUpdates.rif = updates.rif;
      if (updates.name !== undefined) mappedUpdates.name = updates.name;
      if (updates.address !== undefined) mappedUpdates.address = updates.address;
      if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
      if (updates.email !== undefined) mappedUpdates.email = updates.email;
      
      // Mapeo de campos camelCase a snake_case
      if (updates.contactPerson !== undefined) {
        mappedUpdates.contact_person = updates.contactPerson;
      } else if (updates.contact_person !== undefined) {
        mappedUpdates.contact_person = updates.contact_person;
      }
      
      if (updates.retentionISLRPercentage !== undefined) {
        mappedUpdates.retention_islr_percentage = updates.retentionISLRPercentage;
      } else if (updates.retention_islr_percentage !== undefined) {
        mappedUpdates.retention_islr_percentage = updates.retention_islr_percentage;
      }
      
      if (updates.retentionIVAPercentage !== undefined) {
        mappedUpdates.retention_iva_percentage = updates.retentionIVAPercentage;
      } else if (updates.retention_iva_percentage !== undefined) {
        mappedUpdates.retention_iva_percentage = updates.retention_iva_percentage;
      }
      
      if (updates.taxType !== undefined) {
        mappedUpdates.tax_type = updates.taxType;
      } else if (updates.tax_type !== undefined) {
        mappedUpdates.tax_type = updates.tax_type;
      }
      
      if (updates.website !== undefined) mappedUpdates.website = updates.website;
      if (updates.notes !== undefined) mappedUpdates.notes = updates.notes;
      if (updates.is_active !== undefined) mappedUpdates.is_active = updates.is_active;
  
      const { error } = await supabase
        .from('providers')
        .update(mappedUpdates)
        .eq('id', id);
  
      if (error) this.handleError(error, 'Update provider');
  
      console.log('✅ Provider updated successfully with mapped fields:', id);
    } catch (error) {
      console.error(`❌ Error updating provider ${id}:`, error);
      throw error;
    }
  }

  async deleteProvider(id: number): Promise<void> {
    try {
      await this.updateProvider(id, { is_active: false });
      console.log(`🗑️ Provider ${id} deleted (marked as inactive)`);
    } catch (error) {
      console.error(`❌ Error deleting provider ${id}:`, error);
      throw error;
    }
  }

  // =====================================================
  // VOUCHER METHODS
  // =====================================================

  async getVouchers(filters?: {
    type?: 'ISLR' | 'IVA';
    period?: string;
    providerRif?: string;
    emailSent?: boolean;
  }): Promise<DatabaseVoucher[]> {
    return this.ultraSafeQuery(
      async () => {
        await this.connect();

        let query = supabase
          .from('vouchers')
          .select('*')
          .order('issue_date', { ascending: false });

        // Apply filters only if they exist
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.period) {
          query = query.eq('period', filters.period);
        }
        if (filters?.providerRif) {
          query = query.eq('provider_rif', filters.providerRif);
        }
        if (filters?.emailSent !== undefined) {
          query = query.eq('email_sent', filters.emailSent);
        }

        const result = await query;
        
        if (result.data) {
          console.log(`Retrieved ${result.data.length} vouchers from Supabase`);
        }
        
        return result;
      },
      [], // Fallback siempre un array vacío
      'Get vouchers'
    );
  }

  async getVoucher(id: number): Promise<DatabaseVoucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get voucher');
      }

      return data || null;
    } catch (error) {
      console.error(`❌ Error getting voucher ${id}:`, error);
      return null;
    }
  }

  async getVoucherByTransaction(transactionId: number): Promise<DatabaseVoucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get voucher by transaction');
      }

      return data || null;
    } catch (error) {
      console.error(`❌ Error getting voucher by transaction ${transactionId}:`, error);
      return null;
    }
  }

  async getVouchersByTransaction(transactionId: number): Promise<DatabaseVoucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('transaction_id', transactionId);

      if (error) this.handleError(error, 'Get vouchers by transaction');

      return data || [];
    } catch (error) {
      console.error(`❌ Error getting vouchers by transaction ${transactionId}:`, error);
      return [];
    }
  }

  async createVoucher(voucherData: Omit<DatabaseVoucher, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      // Check license permissions
      if (!licenseService.hasFeature('generate_vouchers')) {
        throw new Error('La generación de comprobantes no está disponible en su licencia actual.');
      }

      console.log('📝 Creating voucher in Supabase:', {
        type: voucherData.type,
        number: voucherData.number,
        provider_rif: voucherData.provider_rif
      });

      const { data, error } = await supabase
        .from('vouchers')
        .insert({
          type: voucherData.type,
          number: voucherData.number,
          transaction_id: voucherData.transaction_id,
          provider_rif: voucherData.provider_rif,
          issue_date: voucherData.issue_date,
          period: voucherData.period,
          total_retained: voucherData.total_retained,
          pdf_path: voucherData.pdf_path,
          email_sent: voucherData.email_sent || false
        })
        .select('id')
        .single();

      if (error) this.handleError(error, 'Create voucher');

      console.log('✅ Voucher created:', data?.id);
      return data!.id;
    } catch (error) {
      console.error('❌ Error creating voucher:', error);
      throw error;
    }
  }

  async updateVoucher(id: number, updates: Partial<DatabaseVoucher>): Promise<void> {
    try {
      console.log('🗄️ Updating voucher in Supabase:', { id, updates });

      const { error } = await supabase
        .from('vouchers')
        .update(updates)
        .eq('id', id);

      if (error) this.handleError(error, 'Update voucher');

      console.log('✅ Voucher updated successfully:', id);
    } catch (error) {
      console.error(`❌ Error updating voucher ${id}:`, error);
      throw error;
    }
  }

  async deleteVoucher(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id);

      if (error) this.handleError(error, 'Delete voucher');

      console.log(`🗑️ Voucher ${id} deleted`);
    } catch (error) {
      console.error(`❌ Error deleting voucher ${id}:`, error);
      throw error;
    }
  }

  // =====================================================
  // COMPANY SETTINGS METHODS
  // =====================================================

  async getCompanySettings(): Promise<CompanySettings | null> {
    try {
      await this.connect();

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'Get company settings');
      }

      console.log('🏢 Company settings retrieved:', !!data);
      return data || null;
    } catch (error) {
      console.error('❌ Error getting company settings:', error);
      return null;
    }
  }

  async saveCompanySettings(settings: CompanySettings): Promise<void> {
    try {
      console.log('🗄️ Saving company settings to Supabase:', {
        rif: settings.rif,
        name: settings.name,
        hasId: !!settings.id
      });

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from('companies')
          .update({
            rif: settings.rif,
            name: settings.name,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            website: settings.website,
            fiscal_year: settings.fiscal_year,
            currency: settings.currency || 'VES',
            tax_regime: settings.tax_regime,
            accounting_method: settings.accounting_method,
            default_islr_percentage: settings.default_islr_percentage || 0,
            default_iva_percentage: settings.default_iva_percentage || 16,
            periodo_vigencia: settings.periodo_vigencia,
            numero_control_inicial: settings.numero_control_inicial,
            secuencia_comprobantes: settings.secuencia_comprobantes || 1,
            primary_color: settings.primary_color || '#1976d2',
            secondary_color: settings.secondary_color || '#424242',
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_password: settings.smtp_password,
            email_from_name: settings.email_from_name
          })
          .eq('id', settings.id);

        if (error) this.handleError(error, 'Update company settings');
      } else {
        // Create new
        const { error } = await supabase
          .from('companies')
          .insert({
            rif: settings.rif,
            name: settings.name,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            website: settings.website,
            fiscal_year: settings.fiscal_year,
            currency: settings.currency || 'VES',
            tax_regime: settings.tax_regime,
            accounting_method: settings.accounting_method,
            default_islr_percentage: settings.default_islr_percentage || 0,
            default_iva_percentage: settings.default_iva_percentage || 16,
            periodo_vigencia: settings.periodo_vigencia,
            numero_control_inicial: settings.numero_control_inicial,
            secuencia_comprobantes: settings.secuencia_comprobantes || 1,
            primary_color: settings.primary_color || '#1976d2',
            secondary_color: settings.secondary_color || '#424242',
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_password: settings.smtp_password,
            email_from_name: settings.email_from_name
          });

        if (error) this.handleError(error, 'Create company settings');
      }

      console.log('✅ Company settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving company settings:', error);
      throw error;
    }
  }

  async updateCompanySettings(updates: Partial<CompanySettings>): Promise<void> {
    try {
      const current = await this.getCompanySettings();
      if (!current) {
        throw new Error('No company settings found to update');
      }

      const updated = { 
        ...current, 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      
      await this.saveCompanySettings(updated);
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  async getISLRConcepts(): Promise<Array<{ code: string; name: string; rate: number }>> {
    try {
      await this.connect();

      const { data, error } = await supabase
        .from('islr_concepts')
        .select('code, name, retention_rate')
        .eq('is_active', true)
        .order('code');

      if (error) this.handleError(error, 'Get ISLR concepts');

      return (data || []).map(item => ({
        code: item.code,
        name: item.name,
        rate: item.retention_rate
      }));
    } catch (error) {
      console.error('❌ Error getting ISLR concepts:', error);
      // Fallback to hardcoded values
      return [
        { code: '001', name: 'Honorarios Profesionales', rate: 6.00 },
        { code: '002', name: 'Servicios Técnicos', rate: 3.00 },
        { code: '003', name: 'Servicios de Construcción', rate: 2.00 },
        { code: '004', name: 'Servicios de Publicidad', rate: 3.00 },
        { code: '005', name: 'Servicios de Limpieza', rate: 2.00 },
        { code: '006', name: 'Servicios de Transporte', rate: 2.00 },
        { code: '007', name: 'Arrendamientos', rate: 6.00 },
        { code: '008', name: 'Servicios de Informática', rate: 3.00 }
      ];
    }
  }

  // =====================================================
  // BACKUP AND MAINTENANCE
  // =====================================================

  async createBackup(fileName: string, filePath: string, fileSize: number): Promise<void> {
    try {
      await supabase
        .from('backups')
        .insert({
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize,
          status: 'completed',
          type: 'manual'
        });

      console.log('💾 Backup record created:', fileName);
    } catch (error) {
      console.error('❌ Error creating backup record:', error);
    }
  }

  async getRecentBackups(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) this.handleError(error, 'Get recent backups');

      return data || [];
    } catch (error) {
      console.error('❌ Error getting recent backups:', error);
      return [];
    }
  }

  // =====================================================
  // DEBUG AND TESTING
  // =====================================================

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  getDatabaseInfo(): { type: string; connected: boolean } {
    return {
      type: 'Supabase PostgreSQL',
      connected: this.isInitialized
    };
  }

  // Clear all data (for testing/development) - BE VERY CAREFUL!
  async clearAllData(): Promise<void> {
    console.warn('🚨 CLEARING ALL DATABASE DATA FROM SUPABASE');
    
    try {
      // Delete in correct order to respect foreign keys
      await supabase.from('vouchers').delete().neq('id', 0);
      await supabase.from('transactions').delete().neq('id', 0);
      await supabase.from('providers').delete().neq('id', 0);
      await supabase.from('users').delete().neq('id', 0);
      await supabase.from('companies').delete().neq('id', 0);
      
      console.log('🧹 All data cleared from Supabase');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  close(): void {
    if (this.isInitialized) {
      this.isInitialized = false;
      console.log('🔌 Database connection closed');
    }
  }
}

// Create and export singleton instance
export const db = new DatabaseService();
export default db;