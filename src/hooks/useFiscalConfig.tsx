import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { companyService } from '../services/companyService';

interface FiscalConfig {
  fiscalYear: number;
  currency: string;
  taxRegime: string;
  accountingMethod: string;
  defaultISLRPercentage: number;
  defaultIVAPercentage: number;
}

interface FiscalContextType {
  config: FiscalConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  fiscalYear: number;
  currency: string;
  taxRegime: string;
  accountingMethod: string;
  defaultISLRPercentage: number;
  defaultIVAPercentage: number;
}

const FiscalContext = createContext<FiscalContextType | undefined>(undefined);

export function FiscalProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FiscalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiscalConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load fiscal configuration from company service
      const fiscalConfig = await companyService.getFiscalConfig();
      setConfig(fiscalConfig);
      console.log('📅 Fiscal config loaded:', fiscalConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading fiscal config';
      setError(errorMessage);
      console.error('❌ Error loading fiscal config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiscalConfig();
  }, []);

  const refreshConfig = async () => {
    await loadFiscalConfig();
  };

  return (
    <FiscalContext.Provider value={{ 
      config, 
      loading, 
      error, 
      refreshConfig,
      fiscalYear: config?.fiscalYear || new Date().getFullYear(),
      currency: config?.currency || 'VES',
      taxRegime: config?.taxRegime || 'ordinario',
      accountingMethod: config?.accountingMethod || 'devengado',
      defaultISLRPercentage: config?.defaultISLRPercentage || 2,
      defaultIVAPercentage: config?.defaultIVAPercentage || 16
    }}>
      {children}
    </FiscalContext.Provider>
  );
}

export const useFiscalConfig = () => {
  const context = useContext(FiscalContext);
  if (!context) {
    throw new Error('useFiscalConfig must be used within a FiscalProvider');
  }
  return context;
};

export default useFiscalConfig;