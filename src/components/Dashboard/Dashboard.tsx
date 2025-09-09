import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingDown, Receipt, FileText, AlertCircle, TrendingUp, Calendar, Building2, Loader2 } from 'lucide-react';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { useCompany } from '../../hooks/useCompany';
import MetricCard from './MetricCard';
import IncomeChart from './IncomeChart';
import RetentionChart from './RetentionChart';
import RecentTransactions from './RecentTransactions';
import FiscalAlerts from './FiscalAlerts';
import QuickActions from '../UI/QuickActions';
import { transactionService } from '../../services/transactionService';

interface DashboardProps {
  onNavigate?: (module: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { fiscalYear } = useFiscalConfig();
  const { company } = useCompany();

  // Calculate real metrics from transactions
  const metrics = useMemo(() => {
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalISLRRetained: 0,
        totalIVARetained: 0,
        pendingDeclarations: 0,
        monthlyGrowth: 0
      };
    }

    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentMonthTransactions = transactions.filter(t => t.period === currentMonth);
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    
    const totalISLRRetained = currentMonthTransactions
      .filter(t => t.type === 'ISLR')
      .reduce((sum, t) => sum + (t.retentionAmount || 0), 0);
    
    const totalIVARetained = currentMonthTransactions
      .filter(t => t.type === 'IVA')
      .reduce((sum, t) => sum + (t.retentionAmount || 0), 0);
    
    const pendingDeclarations = currentMonthTransactions
      .filter(t => t.status === 'PENDING').length;
    
    // Calculate growth compared to previous month
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toISOString().substring(0, 7);
    const prevMonthIncome = transactions
      .filter(t => t.period === prevMonthStr && t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    
    const monthlyGrowth = prevMonthIncome > 0 
      ? ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100 
      : 0;

    return {
      totalIncome,
      totalExpenses,
      totalISLRRetained,
      totalIVARetained,
      pendingDeclarations,
      monthlyGrowth
    };
  }, [transactions]);

  // Load real transactions data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Load transactions for the last 6 months to get accurate data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        
        const data = await transactionService.getTransactions({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
        
        setTransactions(data);
        console.log('📊 Dashboard loaded transactions:', {
          total: data.length,
          income: data.filter(t => t.type === 'INCOME').length,
          expenses: data.filter(t => t.type === 'EXPENSE').length,
          islr: data.filter(t => t.type === 'ISLR').length,
          iva: data.filter(t => t.type === 'IVA').length
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (fiscalYear) {
      loadDashboardData();
    }
  }, [fiscalYear]);

  // Chart data from real transactions
  const chartData = useMemo(() => {
    const monthlyIncome: { month: string; amount: number }[] = [];
    const retentionsByType: { type: string; amount: number }[] = [];
    
    // Generate last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      const monthName = date.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' });
      
      const monthTransactions = transactions.filter(t => t.period === monthStr);
      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      monthlyIncome.push({ month: monthName, amount: income });
      
      if (i === 0) { // Current month
        const islrRetentions = monthTransactions
          .filter(t => t.type === 'ISLR')
          .reduce((sum, t) => sum + (t.retention_amount || 0), 0);
        
        const ivaRetentions = monthTransactions
          .filter(t => t.type === 'IVA')
          .reduce((sum, t) => sum + (t.retention_amount || 0), 0);
        
        retentionsByType.push(
          { type: 'ISLR', amount: islrRetentions },
          { type: 'IVA', amount: ivaRetentions }
        );
      }
    }
    
    // Ensure we always have data for current month even if empty
    if (retentionsByType.length === 0) {
      retentionsByType.push(
        { type: 'ISLR', amount: 0 },
        { type: 'IVA', amount: 0 }
      );
    }
    
    return { monthlyIncome, retentionsByType };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-primary-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-900/20 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-primary-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-900/20 transition-all duration-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-venezuela-yellow/20 via-transparent to-venezuela-blue/20"></div>
      </div>
      
      <div className="relative p-6">
        {/* Hero Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-xl">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 bg-clip-text text-transparent mb-2">
                Dashboard Ejecutivo
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium">
                Gestión contable y fiscal en tiempo real • Año Fiscal {fiscalYear}
              </p>
            </div>
          </div>
          
          {/* System Status */}
          <div className="inline-flex items-center space-x-3 px-6 py-3 glass-card">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-sm text-neutral-700 dark:text-neutral-300 font-semibold">Sistema Operativo</span>
            </div>
            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Última sincronización: {new Date().toLocaleTimeString('es-VE')}
            </span>
          </div>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
          <MetricCard
            title="Ingresos Totales"
            value={metrics.totalIncome}
            change={metrics.monthlyGrowth}
            icon={DollarSign}
            color="success"
            isCurrency
            subtitle="Este período"
            trend="up"
          />
          <MetricCard
            title="Gastos Operativos"
            value={metrics.totalExpenses}
            change={-2.3}
            icon={TrendingDown}
            color="error"
            isCurrency
            subtitle="Vs. período anterior"
            trend="down"
          />
          <MetricCard
            title="Retenciones ISLR"
            value={metrics.totalISLRRetained}
            icon={Receipt}
            color="primary"
            isCurrency
            subtitle="Acumulado mensual"
            trend="stable"
          />
          <MetricCard
            title="Retenciones IVA"
            value={metrics.totalIVARetained}
            icon={FileText}
            color="accent"
            isCurrency
            subtitle="Período actual"
            trend="up"
          />
          <MetricCard
            title="Obligaciones Pendientes"
            value={metrics.pendingDeclarations}
            icon={AlertCircle}
            color="warning"
            subtitle="Próximos vencimientos"
            trend="stable"
          />
          <MetricCard
            title="Crecimiento Mensual"
            value={`${metrics.monthlyGrowth}%`}
            change={metrics.monthlyGrowth}
            icon={TrendingUp}
            color="success"
            subtitle="Tendencia positiva"
            trend="up"
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <IncomeChart data={chartData.monthlyIncome} />
          </div>
          <div className="space-y-6">
            <RetentionChart data={chartData.retentionsByType} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Acciones Rápidas
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">
              Operaciones más frecuentes al alcance de un clic
            </p>
          </div>
          <QuickActions
            onNavigate={onNavigate}
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <RecentTransactions />
          </div>
          <div className="space-y-6">
            <FiscalAlerts />
          </div>
        </div>

        {/* Footer Status */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 px-8 py-4 glass-card">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">
                {company?.name || 'ContaVe Pro Enterprise'}
              </span>
            </div>
            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              v2.0.0 • Año Fiscal {fiscalYear}
            </span>
            {company?.rif && (
              <>
                <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  RIF: {company.rif}
                </span>
              </>
            )}
            {company?.rif && (
              <>
                <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  RIF: {company.rif}
                </span>
              </>
            )}
            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-venezuela-flag rounded-full shadow-sm"></div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Venezuela</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}