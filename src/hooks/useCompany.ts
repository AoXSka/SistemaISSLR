import { useState, useEffect, useCallback } from 'react';
import { companyService, CompanySettings } from '../services/companyService.ts';
import { useToast } from '../components/UI/Toast';

export function useCompany() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await companyService.getCompanySettings();
      setCompany(settings);
      console.log('📋 Company settings loaded:', settings ? 'configured' : 'not configured');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar configuración';
      setError(errorMessage);
      console.error('❌ Error loading company:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (updates: Partial<CompanySettings>) => {
    try {
      console.log('🏢 useCompany - Updating company with:', {
        ...updates,
        taxRegime: updates.taxRegime,
        updateKeys: Object.keys(updates)
      });
      const result = await companyService.updateCompanySettings(updates);
      
      if (result.success) {
        // Reload company data to get the updated version
        await loadCompany();
        
        // Verify the update was applied correctly
        const verified = await companyService.getCompanySettings();
        console.log('✅ useCompany - Company updated successfully:', {
          taxRegime: verified?.taxRegime,
          expectedTaxRegime: updates.taxRegime,
          updateWorked: verified?.taxRegime === updates.taxRegime
        });
        addToast({
          type: 'success',
          title: 'Configuración actualizada',
          message: 'Los datos de la empresa han sido guardados exitosamente'
        });
        return { success: true };
      } else {
        console.error('❌ useCompany - Update failed:', result.error);
        addToast({
          type: 'error',
          title: 'Error al actualizar',
          message: result.error || 'No se pudo guardar la configuración'
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ useCompany - Exception during update:', err);
      addToast({
        type: 'error',
        title: 'Error del sistema',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }, [loadCompany, addToast]);

  const initializeCompany = useCallback(async (settings: CompanySettings) => {
    try {
      const result = await companyService.initializeCompanySettings(settings);
      
      if (result.success) {
        await loadCompany();
        addToast({
          type: 'success',
          title: 'Empresa configurada',
          message: 'La configuración inicial ha sido guardada'
        });
        return { success: true };
      } else {
        addToast({
          type: 'error',
          title: 'Error en configuración inicial',
          message: result.error || 'No se pudo guardar la configuración inicial'
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, error: errorMessage };
    }
  }, [loadCompany, addToast]);

  const isConfigured = useCallback(async (): Promise<boolean> => {
    return await companyService.isCompanyConfigured();
  }, []);

  const exportConfiguration = useCallback(async (): Promise<void> => {
    try {
      const blob = await companyService.exportConfiguration();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `configuracion-empresa-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Configuración exportada',
        message: 'El archivo ha sido descargado exitosamente'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error al exportar',
        message: 'No se pudo generar el archivo de configuración'
      });
    }
  }, [addToast]);

  // Load company data on hook initialization
  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  return {
    company,
    loading,
    error,
    isConfigured: company && company.rif && company.name ? true : false,
    loadCompany,
    updateCompany,
    initializeCompany,
    exportConfiguration,
    refresh: loadCompany
  };
}

export default useCompany;