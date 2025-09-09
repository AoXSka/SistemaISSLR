// ========== hooks/usePurchases.ts ==========
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAsyncOperation } from './useAsyncOperation';
import { useCompany } from './useCompany';
import { useLicense } from './useLicense';
import { Purchase, PurchaseStatistics } from '../types';

interface PurchaseFilters {
  period?: string;
  providerRif?: string;
  category?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export const usePurchases = (initialFilters?: PurchaseFilters) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filters, setFilters] = useState<PurchaseFilters>(initialFilters || {});
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null);
  const { company } = useCompany();
  const { hasFeature, canCreateRecords } = useLicense();
  const { execute: executeAsync, loading, error } = useAsyncOperation();

  // Load purchases from hybrid database
  const loadPurchases = useCallback(async () => {
    return executeAsync(async () => {
      // Get from localStorage first
      const stored = localStorage.getItem('contave-purchases-v2');
      let allPurchases: Purchase[] = stored ? JSON.parse(stored) : [];
      
      // Apply filters
      if (filters.period) {
        allPurchases = allPurchases.filter(p => p.period === filters.period);
      }
      if (filters.providerRif) {
        allPurchases = allPurchases.filter(p => p.providerRif === filters.providerRif);
      }
      if (filters.category) {
        allPurchases = allPurchases.filter(p => p.category === filters.category);
      }
      if (filters.status) {
        allPurchases = allPurchases.filter(p => p.status === filters.status);
      }
      if (filters.paymentMethod) {
        allPurchases = allPurchases.filter(p => p.paymentMethod === filters.paymentMethod);
      }
      if (filters.startDate) {
        allPurchases = allPurchases.filter(p => p.date >= filters.startDate!);
      }
      if (filters.endDate) {
        allPurchases = allPurchases.filter(p => p.date <= filters.endDate!);
      }
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        allPurchases = allPurchases.filter(p => 
          p.invoiceNumber.toLowerCase().includes(search) ||
          p.providerName.toLowerCase().includes(search) ||
          p.concept.toLowerCase().includes(search)
        );
      }
      
      setPurchases(allPurchases);
      return allPurchases;
    });
  }, [filters, executeAsync]);

  // Create purchase
  const createPurchase = useCallback(async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    if (!hasFeature('manage_purchases')) {
      throw new Error('La gestión de compras no está disponible en su licencia');
    }
    
    if (!canCreateRecords()) {
      throw new Error('Ha alcanzado el límite de registros de su licencia');
    }

    return executeAsync(async () => {
      const stored = localStorage.getItem('contave-purchases-v2');
      const purchases: Purchase[] = stored ? JSON.parse(stored) : [];
      
      // Validate duplicate
      const duplicate = purchases.find(p => 
        p.invoiceNumber === purchaseData.invoiceNumber && 
        p.providerRif === purchaseData.providerRif
      );
      
      if (duplicate) {
        throw new Error(`Ya existe una factura ${purchaseData.invoiceNumber} del proveedor ${purchaseData.providerRif}`);
      }
      
      // Calculate amounts
      const netAmount = purchaseData.netAmount || 0;
      const exemptAmount = purchaseData.exemptAmount || 0;
      const taxableBase = netAmount - exemptAmount;
      const ivaAmount = taxableBase * (purchaseData.ivaRate / 100);
      const totalAmount = netAmount + ivaAmount;
      
      // Create new purchase
      const newPurchase: Purchase = {
        ...purchaseData,
        id: Date.now(),
        taxableBase,
        ivaAmount,
        totalAmount,
        createdAt: new Date().toISOString(),
        createdBy: company?.rif || 'system'
      };
      
      // Save to localStorage
      purchases.push(newPurchase);
      localStorage.setItem('contave-purchases-v2', JSON.stringify(purchases));
      
      // Also save to IndexedDB for backup
      await saveToIndexedDB('purchases', newPurchase);
      
      // Reload purchases
      await loadPurchases();
      
      return newPurchase;
    });
  }, [company, hasFeature, canCreateRecords, executeAsync, loadPurchases]);

  // Update purchase
  const updatePurchase = useCallback(async (id: number, updates: Partial<Purchase>) => {
    return executeAsync(async () => {
      const stored = localStorage.getItem('contave-purchases-v2');
      const purchases: Purchase[] = stored ? JSON.parse(stored) : [];
      
      const index = purchases.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Compra no encontrada');
      }
      
      // Recalculate if financial fields changed
      let updatedPurchase = { ...purchases[index], ...updates };
      
      if (updates.netAmount || updates.exemptAmount || updates.ivaRate) {
        const netAmount = updatedPurchase.netAmount || 0;
        const exemptAmount = updatedPurchase.exemptAmount || 0;
        const taxableBase = netAmount - exemptAmount;
        const ivaAmount = taxableBase * (updatedPurchase.ivaRate / 100);
        const totalAmount = netAmount + ivaAmount;
        
        updatedPurchase = {
          ...updatedPurchase,
          taxableBase,
          ivaAmount,
          totalAmount
        };
      }
      
      updatedPurchase.updatedAt = new Date().toISOString();
      purchases[index] = updatedPurchase;
      
      // Save
      localStorage.setItem('contave-purchases-v2', JSON.stringify(purchases));
      await saveToIndexedDB('purchases', updatedPurchase);
      
      // Reload
      await loadPurchases();
      
      return updatedPurchase;
    });
  }, [executeAsync, loadPurchases]);

  // Delete purchase
  const deletePurchase = useCallback(async (id: number) => {
    return executeAsync(async () => {
      const stored = localStorage.getItem('contave-purchases-v2');
      const purchases: Purchase[] = stored ? JSON.parse(stored) : [];
      
      const filtered = purchases.filter(p => p.id !== id);
      localStorage.setItem('contave-purchases-v2', JSON.stringify(filtered));
      
      await deleteFromIndexedDB('purchases', id);
      await loadPurchases();
    });
  }, [executeAsync, loadPurchases]);

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalIVA = purchases.reduce((sum, p) => sum + p.ivaAmount, 0);
    const totalNet = purchases.reduce((sum, p) => sum + p.netAmount, 0);
    const averageAmount = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    // Group by category
    const byCategory: Record<string, { count: number; amount: number }> = {};
    purchases.forEach(p => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = { count: 0, amount: 0 };
      }
      byCategory[p.category].count++;
      byCategory[p.category].amount += p.totalAmount;
    });

    // Group by payment method
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {};
    purchases.forEach(p => {
      if (!byPaymentMethod[p.paymentMethod]) {
        byPaymentMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byPaymentMethod[p.paymentMethod].count++;
      byPaymentMethod[p.paymentMethod].amount += p.totalAmount;
    });

    // Group by status
    const byStatus: Record<string, { count: number; amount: number }> = {};
    purchases.forEach(p => {
      if (!byStatus[p.status]) {
        byStatus[p.status] = { count: 0, amount: 0 };
      }
      byStatus[p.status].count++;
      byStatus[p.status].amount += p.totalAmount;
    });

    // Monthly trend
    const monthlyTrend: Array<{ month: string; amount: number; count: number }> = [];
    const monthlyData: Record<string, { amount: number; count: number }> = {};
    
    purchases.forEach(p => {
      const date = new Date(p.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      
      monthlyData[monthKey].amount += p.totalAmount;
      monthlyData[monthKey].count++;
    });

    Object.entries(monthlyData).forEach(([month, data]) => {
      monthlyTrend.push({ month, ...data });
    });

    monthlyTrend.sort((a, b) => a.month.localeCompare(b.month));

    const stats: PurchaseStatistics = {
      totalPurchases,
      totalAmount,
      totalIVA,
      totalNet,
      averageAmount,
      byCategory,
      byPaymentMethod,
      byStatus,
      monthlyTrend
    };

    setStatistics(stats);
    return stats;
  }, [purchases]);

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = [
      'Fecha',
      'N° Factura',
      'N° Control',
      'RIF Proveedor',
      'Nombre Proveedor',
      'Concepto',
      'Categoría',
      'Monto Neto',
      'Monto Exento',
      'Base Imponible',
      'Tasa IVA',
      'Monto IVA',
      'Total',
      'Método de Pago',
      'Moneda',
      'Tasa de Cambio',
      'Estado',
      'Observaciones',
      'Período'
    ];

    const rows = purchases.map(p => [
      p.date,
      p.invoiceNumber,
      p.controlNumber,
      p.providerRif,
      p.providerName,
      p.concept,
      p.category,
      p.netAmount.toFixed(2),
      p.exemptAmount.toFixed(2),
      p.taxableBase.toFixed(2),
      p.ivaRate.toFixed(2),
      p.ivaAmount.toFixed(2),
      p.totalAmount.toFixed(2),
      p.paymentMethod,
      p.currency,
      p.exchangeRate.toFixed(2),
      p.status,
      p.observations || '',
      p.period
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `libro-compras-${filters.period || 'todas'}.csv`;
    link.click();
  }, [purchases, filters]);

  const exportToJSON = useCallback(() => {
    const json = JSON.stringify(purchases, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `libro-compras-${filters.period || 'todas'}.json`;
    link.click();
  }, [purchases, filters]);

  const importFromFile = useCallback(async (file: File) => {
    return executeAsync(async () => {
      const text = await file.text();
      let importedPurchases: Purchase[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
          const purchase: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            // Map CSV headers to purchase fields
            // ... mapping logic ...
          });
          
          importedPurchases.push(purchase);
        }
      } else if (file.name.endsWith('.json')) {
        importedPurchases = JSON.parse(text);
      }
      
      // Save imported purchases
      const stored = localStorage.getItem('contave-purchases-v2');
      const existingPurchases: Purchase[] = stored ? JSON.parse(stored) : [];
      
      const newPurchases = [...existingPurchases, ...importedPurchases];
      localStorage.setItem('contave-purchases-v2', JSON.stringify(newPurchases));
      
      await loadPurchases();
      return importedPurchases.length;
    });
  }, [executeAsync, loadPurchases]);

  // Load on mount and when filters change
  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Calculate statistics when purchases change
  useEffect(() => {
    calculateStatistics();
  }, [calculateStatistics]);

  return {
    purchases,
    statistics,
    filters,
    setFilters,
    loading,
    error,
    createPurchase,
    updatePurchase,
    deletePurchase,
    exportToCSV,
    exportToJSON,
    importFromFile,
    refresh: loadPurchases
  };
};