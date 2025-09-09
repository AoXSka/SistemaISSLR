import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Faltan variables de entorno de Supabase.
    
    Por favor configure:
    - VITE_SUPABASE_URL: URL del proyecto Supabase
    - VITE_SUPABASE_ANON_KEY: Clave anónima del proyecto
    
    Obtenga estos valores desde el dashboard de Supabase:
    https://app.supabase.com/project/[your-project]/settings/api
  `);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'contave-pro@2.0.0'
    }
  }
});

// Connection test helper
export async function testSupabaseConnection(): Promise<{ 
  connected: boolean; 
  error?: string; 
  projectInfo?: any 
}> {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist (404), Supabase is still connected
      if (error.code === 'PGRST205') {
        console.log('✅ Supabase connected (tables not yet created)');
        return { 
          connected: true, 
          projectInfo: { 
            url: import.meta.env.VITE_SUPABASE_URL,
            tablesCount: 0 
          } 
        };
      }
      console.error('❌ Supabase connection failed:', error.message);
      return { connected: false, error: error.message };
    }

    console.log('✅ Supabase connection successful');
    return { 
      connected: true, 
      projectInfo: { 
        url: import.meta.env.VITE_SUPABASE_URL,
        tablesCount: data?.length || 0 
      } 
    };
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown connection error' 
    };
  }
}

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          uuid: string;
          username: string;
          email: string;
          full_name: string;
          role: 'admin' | 'user' | 'readonly';
          is_active: boolean;
          password_hash: string;
          last_login: string | null;
          failed_login_attempts: number;
          locked_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          username: string;
          email: string;
          full_name: string;
          password_hash: string;
          role?: 'admin' | 'user' | 'readonly';
          is_active?: boolean;
        };
        Update: {
          username?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'user' | 'readonly';
          is_active?: boolean;
          last_login?: string | null;
          failed_login_attempts?: number;
          locked_until?: string | null;
        };
      };
      companies: {
        Row: {
          id: number;
          rif: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          fiscal_year: number | null;
          currency: string;
          tax_regime: string | null;
          accounting_method: string | null;
          default_islr_percentage: number;
          default_iva_percentage: number;
          periodo_vigencia: string | null;
          numero_control_inicial: string | null;
          secuencia_comprobantes: number;
          primary_color: string;
          secondary_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
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
        };
        Update: {
          name?: string;
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
        };
      };
      transactions: {
        Row: {
          id: number;
          date: string;
          type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE';
          document_number: string | null;
          control_number: string | null;
          provider_rif: string | null;
          provider_name: string | null;
          concept: string;
          total_amount: number;
          taxable_base: number;
          retention_percentage: number;
          retention_amount: number;
          status: 'PENDING' | 'PAID' | 'DECLARED';
          period: string;
          created_by: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          date: string;
          type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE';
          concept: string;
          period: string;
          document_number?: string;
          control_number?: string;
          provider_rif?: string;
          provider_name?: string;
          total_amount?: number;
          taxable_base?: number;
          retention_percentage?: number;
          retention_amount?: number;
          status?: 'PENDING' | 'PAID' | 'DECLARED';
          created_by?: number;
        };
        Update: {
          date?: string;
          document_number?: string;
          control_number?: string;
          provider_rif?: string;
          provider_name?: string;
          concept?: string;
          total_amount?: number;
          taxable_base?: number;
          retention_percentage?: number;
          retention_amount?: number;
          status?: 'PENDING' | 'PAID' | 'DECLARED';
          period?: string;
        };
      };
    };
  };
};

export default supabase;