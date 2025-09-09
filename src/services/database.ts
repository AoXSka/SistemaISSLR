import { supabase } from '../config/supabase';
import { licenseService } from './licenseService';

// Database Service - Supabase Integration
// Provides unified interface for both cloud and offline storage

export interface DatabaseUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user' | 'readonly';
  isActive: boolean;
  passwordHash: string;
  lastLogin?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DatabaseTransaction {
  id: number;
  date: string;
  type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE';
  documentNumber?: string;
  controlNumber?: string;
  providerRif?: string;
  providerName?: string;
  concept: string;
  totalAmount: number;
  taxableBase?: number;
  retentionPercentage?: number;
  retentionAmount?: number;
  status: 'PENDING' | 'PAID' | 'DECLARED';
  period: string;
  createdAt: string;
}

export interface DatabaseProvider {
  id: number;
  rif: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  retentionISLRPercentage?: number;
  retentionIVAPercentage?: number;
  createdAt: string;
}

export interface DatabaseVoucher {
  id: number;
  type: 'ISLR' | 'IVA';
  number: string;
  transactionId: number;
  providerRif: string;
  issueDate: string;
  period: string;
  totalRetained: number;
  pdfPath?: string;
  emailSent: boolean;
  createdAt: string;
}

export interface CompanySettings {
  id?: number;
  rif: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  fiscalYear?: number;
  currency?: string;
  taxRegime?: string;
  accountingMethod?: string;
  defaultISLRPercentage?: number;
  defaultIVAPercentage?: number;
  periodoVigencia?: string;
  numeroControlInicial?: string;
  secuenciaComprobantes?: number;
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

class DatabaseService {
  private readonly STORAGE_KEYS = {
    users: 'contave-users-v2',
    transactions: 'contave-transactions-v2',
    providers: 'contave-providers-v2',
    vouchers: 'contave-vouchers-v2',
    company: 'contave-company-v2',
    backups: 'contave-backups'
  };

  private isInitialized = false;
  private fallbackToLocalStorage = false;

  async connect(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔌 Database already connected');
      return;
    }

    try {
      console.log('🔌 Connecting to Supabase database...');
      
      // Test Supabase connection
      const { data, error } = await supabase.from('companies').select('id').limit(1);
      
      if (error) {
        console.warn('⚠️ Supabase connection failed, falling back to localStorage:', error.message);
        this.fallbackToLocalStorage = true;
        this.initializeLocalStorage();
      } else {
        console.log('✅ Successfully connected to Supabase');
        this.fallbackToLocalStorage = false;
      }
      
      this.isInitialized = true;
      console.log('✅ Database service initialized');
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage:', error);
      this.fallbackToLocalStorage = true;
      this.initializeLocalStorage();
      this.isInitialized = true;
    }
  }

  private initializeLocalStorage(): void {
    const storageKeys = [
      this.STORAGE_KEYS.users,
      this.STORAGE_KEYS.transactions,
      this.STORAGE_KEYS.providers,
      this.STORAGE_KEYS.vouchers
    ];

    storageKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '[]');
        console.log(`📦 Initialized storage key: ${key}`);
      }
    });

    // Initialize company data as object
    if (!localStorage.getItem(this.STORAGE_KEYS.company)) {
      localStorage.setItem(this.STORAGE_KEYS.company, '{}');
    }

    console.log('📦 LocalStorage fallback initialized');
  }

  // Helper methods to convert between Supabase and interface formats
  private mapUserRow(row: any): DatabaseUser {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      fullName: row.full_name || '',
      role: row.role,
      isActive: row.is_active,
      passwordHash: row.password_hash,
      lastLogin: row.last_login,
      failedLoginAttempts: row.failed_login_attempts || 0,
      lockedUntil: row.locked_until,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // User Management Methods
  async getUsers(): Promise<DatabaseUser[]> {
    try {
      await this.connect();

      if (this.fallbackToLocalStorage) {
        const users = JSON.parse(localStorage.getItem('contave-users-v2') || '[]');
        return users.filter((u: DatabaseUser) => u.isActive !== false);
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching users from Supabase:', error);
        return [];
      }

      return data.map(this.mapUserRow);
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return [];
    }
  }

  async getUser(id: number): Promise<DatabaseUser | null> {
    try {
      await this.connect();

      if (this.fallbackToLocalStorage) {
        const users = await this.getUsers();
        return users.find(u => u.id === id) || null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        console.error(`❌ Error getting user ${id}:`, error);
        return null;
      }

      return this.mapUserRow(data);
    } catch (error) {
      console.error(`❌ Error getting user ${id}:`, error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<DatabaseUser | null> {
    try {
      await this.connect();

      if (this.fallbackToLocalStorage) {
        const users = await this.getUsers();
        return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .limit(1);

      if (error) {
        console.error(`❌ Error getting user by username '${username}':`, error);
        return null;
      }

      return data[0] ? this.mapUserRow(data[0]) : null;
    } catch (error) {
      console.error(`❌ Error getting user by username '${username}':`, error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      await this.connect();

      if (this.fallbackToLocalStorage) {
        const users = await this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error) {
        console.error(`❌ Error getting user by email '${email}':`, error);
        return null;
      }

      return data[0] ? this.mapUserRow(data[0]) : null;
    } catch (error) {
      console.error(`❌ Error getting user by email '${email}':`, error);
      return null;
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role?: 'admin' | 'user' | 'readonly';
    isActive?: boolean;
  }): Promise<number> {
    try {
      await this.connect();

      // Check license permissions
      if (!licenseService.canAddUsers()) {
        throw new Error('Ha alcanzado el límite de usuarios de su licencia.');
      }

      if (this.fallbackToLocalStorage) {
        const users = await this.getUsers();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        
        const newUser: DatabaseUser = {
          id: newId,
          ...userData,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          role: userData.role || 'user',
          failedLoginAttempts: 0,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('contave-users-v2', JSON.stringify(users));
        return newUser.id;
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: userData.passwordHash,
          full_name: userData.fullName,
          role: userData.role || 'user',
          is_active: userData.isActive !== undefined ? userData.isActive : true,
          failed_login_attempts: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user in Supabase:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }

      console.log('✅ User created in Supabase:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<DatabaseUser>): Promise<void> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        throw new Error(`User with ID ${id} not found`);
      }

      users[userIndex] = { 
        ...users[userIndex], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
      localStorage.setItem(this.STORAGE_KEYS.users, JSON.stringify(users));
      console.log(`✅ User ${id} updated successfully`);
    } catch (error) {
      console.error(`❌ Error updating user ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await this.updateUser(id, { isActive: false });
      console.log(`🗑️ User ${id} deleted (marked as inactive)`);
    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Transaction Methods
  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    providerRif?: string;
    period?: string;
  }): Promise<DatabaseTransaction[]> {
    try {
      if (!this.isInitialized) {
        await this.connect();
      }
      if (!this.isInitialized) {
        throw new Error('Database not connected. Call connect() first.');
      }
      
      const transactions = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.transactions) || '[]');
      
      if (!filters) {
        return transactions.filter((t: DatabaseTransaction) => t && typeof t === 'object' && t.id);
      }
      
      return transactions.filter((t: DatabaseTransaction) => {
        // Validate transaction object
        if (!t || typeof t !== 'object' || !t.id) return false;
        
        if (filters.period && t.period !== filters.period) return false;
        if (filters.type && t.type !== filters.type) return false;
        if (filters.status && t.status !== filters.status) return false;
        if (filters.providerRif && t.providerRif !== filters.providerRif) return false;
        if (filters.startDate && t.date < filters.startDate) return false;
        if (filters.endDate && t.date > filters.endDate) return false;
        return true;
      });
    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      return [];
    }
  }

  async getTransaction(id: number): Promise<DatabaseTransaction | null> {
    try {
      const transactions = await this.getTransactions();
      return transactions.find(t => t.id === id) || null;
    } catch (error) {
      console.error(`❌ Error getting transaction ${id}:`, error);
      return null;
    }
  }

  async createTransaction(transactionData: Omit<DatabaseTransaction, 'id' | 'createdAt'>): Promise<number> {
    try {
      // Check license permissions
      if (!licenseService.canCreateRecords()) {
        const message = 'Ha alcanzado el límite de registros de su licencia. Actualice para continuar.';
        console.log('🔒 Transaction creation blocked by license');
        throw new Error(message);
      }
      
      if (!this.isInitialized) {
        throw new Error('Database not connected. Call connect() first.');
      }
      
      const transactions = await this.getTransactions();
      const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
      
      const newTransaction: DatabaseTransaction = {
        id: newId,
        ...transactionData,
        // Ensure all required fields have default values
        documentNumber: transactionData.documentNumber || '',
        controlNumber: transactionData.controlNumber || '',
        providerRif: transactionData.providerRif || '',
        providerName: transactionData.providerName || '',
        taxableBase: transactionData.taxableBase || 0,
        retentionPercentage: transactionData.retentionPercentage || 0,
        retentionAmount: transactionData.retentionAmount || 0,
        createdAt: new Date().toISOString()
      };
      
      transactions.push(newTransaction);
      localStorage.setItem(this.STORAGE_KEYS.transactions, JSON.stringify(transactions));
      
      console.log('✅ Transaction created in database:', { 
        id: newTransaction.id, 
        type: newTransaction.type,
        amount: newTransaction.totalAmount,
        provider: newTransaction.providerName
      });
      return newTransaction.id;
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, updates: Partial<DatabaseTransaction>): Promise<void> {
    try {
      console.log('🗄️ Database - Updating transaction:', { id, updates });
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index === -1) {
        console.error('❌ Database - Transaction not found:', id);
        throw new Error(`Transaction ${id} not found`);
      }

      // Create updated transaction with proper merge
      transactions[index] = { 
        ...transactions[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to localStorage immediately
      localStorage.setItem(this.STORAGE_KEYS.transactions, JSON.stringify(transactions));
      
      console.log('✅ Database - Transaction updated:', { 
        id,
        type: transactions[index].type,
        updatedFields: Object.keys(updates),
        newStatus: transactions[index].status,
        savedToStorage: true
      });
      
      // Verify the update was saved
      const verifyTransactions = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.transactions) || '[]');
      const verifyUpdated = verifyTransactions.find((t: any) => t.id === id);
      console.log('🔍 Database - Update verification:', { 
        found: !!verifyUpdated,
        status: verifyUpdated?.status,
        updatedAt: verifyUpdated?.updatedAt
      });
    } catch (error) {
      console.error(`❌ Error updating transaction ${id}:`, error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.transactions, JSON.stringify(filtered));
    } catch (error) {
      console.error(`❌ Error deleting transaction ${id}:`, error);
      throw error;
    }
  }

  // Provider Methods
  getProviders(searchTerm?: string): DatabaseProvider[] {
    try {
      const providers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.providers) || '[]');
      
      if (!searchTerm) {
        return providers;
      }
      
      return providers.filter((p: DatabaseProvider) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rif.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Error getting providers:', error);
      return [];
    }
  }

  getProvider(id: number): DatabaseProvider | null {
    try {
      const providers = this.getProviders();
      return providers.find(p => p.id === id) || null;
    } catch (error) {
      console.error(`❌ Error getting provider ${id}:`, error);
      return null;
    }
  }

  getProviderByRIF(rif: string): DatabaseProvider | null {
    try {
      console.log('🔍 Database - Looking for provider by RIF:', rif);
      const providers = this.getProviders();
      console.log('📊 Database - Total providers in storage:', providers.length);
      
      if (providers.length > 0) {
        console.log('📋 Database - Available RIFs:', providers.map(p => p.rif));
      }
      
      const provider = providers.find(p => p.rif === rif) || null;
      console.log('✅ Database - Provider lookup result:', {
        searchRif: rif,
        found: !!provider,
        exactMatch: provider ? (provider.rif === rif) : false,
        providerName: provider?.name || 'N/A'
      });
      
      return provider;
    } catch (error) {
      console.error(`❌ Error getting provider by RIF ${rif}:`, error);
      return null;
    }
  }

  createProvider(providerData: Omit<DatabaseProvider, 'id' | 'createdAt'>): number {
    try {
      // Check license permissions
      if (!licenseService.hasFeature('manage_providers')) {
        const message = 'La gestión de proveedores no está disponible en su licencia actual.';
        console.log('🔒 Provider creation blocked by license');
        throw new Error(message);
      }
      
      const providers = this.getProviders();
      const newId = providers.length > 0 ? Math.max(...providers.map(p => p.id)) + 1 : 1;
      
      const newProvider: DatabaseProvider = {
        id: newId,
        ...providerData,
        createdAt: new Date().toISOString()
      };
      
      providers.push(newProvider);
      localStorage.setItem(this.STORAGE_KEYS.providers, JSON.stringify(providers));
      
      return newProvider.id;
    } catch (error) {
      console.error('❌ Error creating provider:', error);
      throw error;
    }
  }

  updateProvider(id: number, updates: Partial<DatabaseProvider>): void {
    try {
      console.log('🗄️ Database - Updating provider:', { id, updates });
      const providers = this.getProviders();
      const index = providers.findIndex(p => p.id === id);
      
      if (index === -1) {
        console.error('❌ Database - Provider not found:', id);
        throw new Error(`Provider ${id} not found`);
      }

      // Create updated provider with proper merge
      providers[index] = { 
        ...providers[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to localStorage immediately
      localStorage.setItem(this.STORAGE_KEYS.providers, JSON.stringify(providers));
      
      console.log('✅ Database - Provider updated:', { 
        id, 
        name: providers[index].name,
        updatedFields: Object.keys(updates),
        savedToStorage: true
      });
      
      // Verify the update was saved
      const verifyProviders = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.providers) || '[]');
      const verifyUpdated = verifyProviders.find((p: any) => p.id === id);
      console.log('🔍 Database - Provider update verification:', { 
        found: !!verifyUpdated,
        name: verifyUpdated?.name,
        updatedAt: verifyUpdated?.updatedAt
      });
    } catch (error) {
      console.error(`❌ Error updating provider ${id}:`, error);
      throw error;
    }
  }

  deleteProvider(id: number): void {
    try {
      const providers = this.getProviders();
      const filtered = providers.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.providers, JSON.stringify(filtered));
    } catch (error) {
      console.error(`❌ Error deleting provider ${id}:`, error);
      throw error;
    }
  }

  // Voucher Methods
  getVouchers(filters?: {
    type?: 'ISLR' | 'IVA';
    period?: string;
    providerRif?: string;
    emailSent?: boolean;
  }): DatabaseVoucher[] {
    try {
      const vouchers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.vouchers) || '[]');
      
      if (!filters) {
        return vouchers;
      }
      
      return vouchers.filter((v: DatabaseVoucher) => {
        if (filters.type && v.type !== filters.type) return false;
        if (filters.period && v.period !== filters.period) return false;
        if (filters.providerRif && v.providerRif !== filters.providerRif) return false;
        if (filters.emailSent !== undefined && v.emailSent !== filters.emailSent) return false;
        return true;
      });
    } catch (error) {
      console.error('❌ Error getting vouchers:', error);
      return [];
    }
  }

  getVoucher(id: number): DatabaseVoucher | null {
    try {
      const vouchers = this.getVouchers();
      return vouchers.find(v => v.id === id) || null;
    } catch (error) {
      console.error(`❌ Error getting voucher ${id}:`, error);
      return null;
    }
  }

  getVoucherByTransaction(transactionId: number): DatabaseVoucher | null {
    try {
      const vouchers = this.getVouchers();
      return vouchers.find(v => v.transactionId === transactionId) || null;
    } catch (error) {
      console.error(`❌ Error getting voucher by transaction ${transactionId}:`, error);
      return null;
    }
  }

  getVouchersByTransaction(transactionId: number): DatabaseVoucher[] {
    try {
      const vouchers = this.getVouchers();
      return vouchers.filter(v => v.transactionId === transactionId);
    } catch (error) {
      console.error(`❌ Error getting vouchers by transaction ${transactionId}:`, error);
      return [];
    }
  }

  createVoucher(voucherData: Omit<DatabaseVoucher, 'id' | 'createdAt'>): number {
    try {
      // Check license permissions
      if (!licenseService.hasFeature('generate_vouchers')) {
        const message = 'La generación de comprobantes no está disponible en su licencia actual.';
        console.log('🔒 Voucher creation blocked by license');
        throw new Error(message);
      }
      
      const vouchers = this.getVouchers();
      const newId = vouchers.length > 0 ? Math.max(...vouchers.map(v => v.id)) + 1 : 1;
      
      const newVoucher: DatabaseVoucher = {
        id: newId,
        ...voucherData,
        createdAt: new Date().toISOString()
      };
      
      vouchers.push(newVoucher);
      localStorage.setItem(this.STORAGE_KEYS.vouchers, JSON.stringify(vouchers));
      
      return newVoucher.id;
    } catch (error) {
      console.error('❌ Error creating voucher:', error);
      throw error;
    }
  }

  updateVoucher(id: number, updates: Partial<DatabaseVoucher>): void {
    try {
      console.log('🗄️ Database - Updating voucher:', { id, updates });
      const vouchers = this.getVouchers();
      const index = vouchers.findIndex(v => v.id === id);
      
      if (index === -1) {
        console.error('❌ Database - Voucher not found:', id);
        throw new Error(`Voucher ${id} not found`);
      }

      vouchers[index] = { 
        ...vouchers[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEYS.vouchers, JSON.stringify(vouchers));
      
      console.log('✅ Database - Voucher updated successfully:', {
        id,
        updatedFields: Object.keys(updates),
        savedToStorage: true
      });
    } catch (error) {
      console.error(`❌ Error updating voucher ${id}:`, error);
      throw error;
    }
  }

  deleteVoucher(id: number): void {
    try {
      const vouchers = this.getVouchers();
      const filtered = vouchers.filter(v => v.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.vouchers, JSON.stringify(filtered));
    } catch (error) {
      console.error(`❌ Error deleting voucher ${id}:`, error);
      throw error;
    }
  }

  // Utility Methods
  getISLRConcepts(): Array<{ code: string; name: string; rate: number }> {
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

  // Company Settings Methods
  getCompanySettings(): CompanySettings | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.company);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting company settings:', error);
      return null;
    }
  }

  saveCompanySettings(settings: CompanySettings): void {
    try {
      console.log('🗄️ Database - Saving company settings:', {
        rif: settings.rif,
        name: settings.name,
        taxRegime: settings.taxRegime,
        hasAllFields: !!(settings.rif && settings.name && settings.taxRegime),
        originalTaxRegime: settings.taxRegime,
        settingsKeys: Object.keys(settings)
      });
      
      // Ensure taxRegime is properly included in the save
      const settingsToSave = {
        ...settings,
        taxRegime: settings.taxRegime || 'ordinary' // Ensure it's never undefined
      };
      
      localStorage.setItem(this.STORAGE_KEYS.company, JSON.stringify(settings));
      
      // Verify save worked
      const saved = localStorage.getItem(this.STORAGE_KEYS.company);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Database - Settings verified saved:', {
          taxRegime: parsed.taxRegime,
          originalValue: settings.taxRegime,
          savedValue: parsed.taxRegime,
          matches: parsed.taxRegime === settings.taxRegime,
          settingsSize: JSON.stringify(settings).length
        });
      }
      console.log('💾 Company settings saved to storage');
    } catch (error) {
      console.error('❌ Database - Error saving company settings:', error);
      console.error('Error saving company settings:', error);
      throw error;
    }
  }

  updateCompanySettings(updates: Partial<CompanySettings>): void {
    try {
      const current = this.getCompanySettings();
      if (!current) {
        throw new Error('No company settings found to update');
      }

      const updated = { 
        ...current, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
      this.saveCompanySettings(updated);
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }
  createBackup(fileName: string, filePath: string, fileSize: number): void {
    try {
      const backupData = {
        id: Date.now(),
        fileName,
        filePath,
        fileSize,
        createdAt: new Date().toISOString(),
        type: 'manual'
      };
      
      const backups = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.backups) || '[]');
      backups.push(backupData);
      localStorage.setItem(this.STORAGE_KEYS.backups, JSON.stringify(backups));
      
      console.log('💾 Backup record created:', fileName);
    } catch (error) {
      console.error('❌ Error creating backup record:', error);
    }
  }

  getRecentBackups(): any[] {
    try {
      const backups = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.backups) || '[]');
      return backups.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 10);
    } catch (error) {
      console.error('❌ Error getting recent backups:', error);
      return [];
    }
  }

  // Debug and testing methods
  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  getStorageInfo(): {
    totalSize: number;
    keyCount: number;
    keys: string[];
    isHealthy: boolean;
  } {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('contave-'));
    const totalSize = keys.reduce((size, key) => {
      return size + (localStorage.getItem(key)?.length || 0);
    }, 0);

    return {
      totalSize,
      keyCount: keys.length,
      keys,
      isHealthy: totalSize < 5 * 1024 * 1024 // Less than 5MB is healthy
    };
  }

  // Clear all data (for testing/development)
  clearAllData(): void {
    console.warn('🚨 CLEARING ALL DATABASE DATA');
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeLocalStorage();
    console.log('🧹 All data cleared and storage reinitialized');
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