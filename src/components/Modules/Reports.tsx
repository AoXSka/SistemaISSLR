import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Zap,
  Activity,
  TrendingDown,
  Eye,
  Mail,
  Printer
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { transactionService } from '../../services/transactionService';
import { companyService } from '../../services/companyService';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { useToast } from '../UI/Toast';
import { useCompany } from '../../hooks/useCompany';

export default function Reports() {
  const { addToast } = useToast();
  const { fiscalYear, loading: fiscalLoading, currency } = useFiscalConfig();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedYear, setSelectedYear] = useState(fiscalYear || new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!fiscalYear || fiscalLoading) return;
    
    const initializeReports = async () => {
      try {
        setLoading(true);
        console.log('📊 Loading transactions for fiscal year:', fiscalYear);
        setSelectedYear(fiscalYear);

        // Load all transactions for analysis
        const allTransactions = await transactionService.getTransactions({
          startDate: `${fiscalYear}-01-01`,
          endDate: `${fiscalYear}-12-31`
        });
        setTransactions(allTransactions);
        console.log('✅ Transactions loaded:', allTransactions.length);
      } catch (error) {
        console.error('❌ Error initializing reports:', error);
        setTransactions([]);
        addToast({
          type: 'error',
          title: 'Error en Reportes',
          message: 'No se pudo cargar los datos de transacciones'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeReports();
  }, [fiscalYear, fiscalLoading, addToast]);

  // Calculate real metrics from loaded transactions
  const realMetrics = useMemo(() => {
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalISLRRetained: 0,
        totalIVARetained: 0,
        netMargin: 0,
        monthlyGrowth: 0
      };
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentPeriod = `${fiscalYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    const currentMonthTransactions = transactions.filter(t => t.period === currentPeriod);
    
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')  
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const totalISLRRetained = currentMonthTransactions
      .filter(t => t.type === 'ISLR')
      .reduce((sum, t) => sum + t.retentionAmount, 0);
    
    const totalIVARetained = currentMonthTransactions
      .filter(t => t.type === 'IVA')
      .reduce((sum, t) => sum + t.retentionAmount, 0);
    
    const netMargin = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    // Calculate monthly growth (compare with previous month real data)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? (fiscalYear || new Date().getFullYear()) - 1 : (fiscalYear || new Date().getFullYear());
    const prevPeriod = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    const prevMonthTransactions = transactions.filter(t => t.period === prevPeriod);
    const prevMonthIncome = prevMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const monthlyGrowth = prevMonthIncome > 0 
      ? ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100 
      : 0;
    
    return {
      totalIncome,
      totalExpenses,
      totalISLRRetained,
      totalIVARetained,
      netMargin,
      monthlyGrowth
    };
  }, [transactions, fiscalYear]);

  // Generate chart data from real transactions
  const chartData = useMemo(() => {
    const monthlyData: { month: string; income: number; expenses: number; retentions: number }[] = [];
    
    // Generate last 6 months of real data
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setFullYear(fiscalYear);
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      const monthName = date.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' });
      
      const monthTransactions = transactions.filter(t => t.period === monthStr);
      
      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.totalAmount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.totalAmount, 0);
      
      const retentions = monthTransactions
        .filter(t => ['ISLR', 'IVA'].includes(t.type))
        .reduce((sum, t) => sum + t.retentionAmount, 0);
      
      monthlyData.push({ month: monthName, income, expenses, retentions });
    }
    
    return monthlyData;
  }, [transactions, fiscalYear]);

  // Show loading if fiscal config is still loading
  if (fiscalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración fiscal...</p>
        </div>
      </div>
    );
  }

  const reportTypes = [
    { 
      id: 'overview', 
      name: 'Resumen Ejecutivo', 
      icon: TrendingUp,
      description: `Dashboard general año fiscal ${fiscalYear}`
    },
    { 
      id: 'income-statement', 
      name: 'Estado de Resultados', 
      icon: DollarSign,
      description: 'Análisis detallado de ingresos y gastos'
    },
    { 
      id: 'balance', 
      name: 'Balance General', 
      icon: BarChart3,
      description: `Estado patrimonial al ${selectedPeriod}`
    },
    { 
      id: 'cash-flow', 
      name: 'Flujo de Caja', 
      icon: Activity,
      description: 'Movimientos de efectivo y proyecciones'
    },
    { 
      id: 'retention-analysis', 
      name: 'Análisis de Retenciones', 
      icon: Target,
      description: `Distribución retenciones período ${fiscalYear}`
    }
  ];

  // Generate period options based on fiscal year
  const periodOptions = [
    { value: 'current-month', label: `Mes Actual (${selectedYear})` },
    { value: 'current-quarter', label: `Trimestre Actual (${selectedYear})` },
    { value: 'current-year', label: `Año Fiscal ${selectedYear}` },
    { value: `${selectedYear}-12`, label: `Diciembre ${selectedYear}` },
    { value: `${selectedYear}-11`, label: `Noviembre ${selectedYear}` },
    { value: `${selectedYear}-10`, label: `Octubre ${selectedYear}` },
    { value: `${selectedYear}-q4`, label: `Q4 ${selectedYear}` },
    { value: `${selectedYear}`, label: `Año ${selectedYear} Completo` }
  ];

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting ${selectedReport} as ${format}`);
    // Implementation for export functionality
  };

  const handleScheduleReport = () => {
    console.log('Scheduling report:', selectedReport);
    // Implementation for scheduling functionality
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reportes y Análisis
            </h1>
            <p className="text-gray-600">
              Informes ejecutivos y análisis financiero avanzado - Año Fiscal {fiscalYear || 'No configurado'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handleScheduleReport}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Programar Reportes
            </button>
            <button 
              onClick={() => handleExportReport('pdf')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Todo
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año Fiscal</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={fiscalYear}>{fiscalYear}</option>
                <option value={fiscalYear - 1}>{fiscalYear - 1}</option>
                {fiscalYear && <option value={fiscalYear - 1}>{fiscalYear - 1}</option>}
                {fiscalYear && <option value={fiscalYear - 2}>{fiscalYear - 2}</option>}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Filtros aplicados: {selectedPeriod}</span>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Ingresos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(realMetrics.totalIncome)}</p>
              <p className="text-xs text-blue-200 mt-1 flex items-center">
                {realMetrics.monthlyGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {realMetrics.monthlyGrowth.toFixed(1)}% vs período anterior
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Gastos Operativos</p>
              <p className="text-2xl font-bold">{formatCurrency(realMetrics.totalExpenses)}</p>
              <p className="text-xs text-red-200 mt-1 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                Período actual
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Retenido</p>
              <p className="text-2xl font-bold">{formatCurrency(realMetrics.totalISLRRetained + realMetrics.totalIVARetained)}</p>
              <p className="text-xs text-purple-200 mt-1">ISLR + IVA</p>
            </div>
            <Target className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Margen Neto</p>
              <p className="text-2xl font-bold">{realMetrics.netMargin.toFixed(1)}%</p>
              <p className="text-xs text-green-200 mt-1 flex items-center">
                {realMetrics.netMargin >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                Período actual
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-8">
        {selectedReport === 'overview' && (
          <div className="space-y-8">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Evolución de Ingresos</h3>
                  {chartData.some(d => d.income > 0) ? (
                    <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => value > 1000000 ? `${(value/1000000).toFixed(1)}M` : `${(value/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
                        <Area type="monotone" dataKey="income" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center">
                      <TrendingUp className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Sin datos de ingresos</p>
                      <p className="text-xs text-gray-400 mt-1">Registre transacciones de ingreso para ver tendencias</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Gastos</h3>
                  {chartData.some(d => d.expenses > 0) ? (
                    <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => value > 1000000 ? `${(value/1000000).toFixed(1)}M` : `${(value/1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Gastos']} />
                        <Bar dataKey="expenses" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center">
                      <PieChart className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Sin datos de gastos</p>
                      <p className="text-xs text-gray-400 mt-1">Registre transacciones de gasto para ver distribución</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Retention Analysis */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Retenciones por Mes</h3>
                {chartData.some(d => d.retentions > 0) ? (
                  <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => value > 1000000 ? `${(value/1000000).toFixed(1)}M` : `${(value/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Retenciones']} />
                      <Area type="monotone" dataKey="retentions" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">Sin datos de retenciones</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Registre retenciones ISLR e IVA para ver el análisis de tendencias mensuales
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Balance General</h3>
                {realMetrics.totalIncome > 0 || realMetrics.totalExpenses > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-900">Ingresos Acumulados</span>
                      <span className="font-bold text-blue-900">{formatCurrency(realMetrics.totalIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-900">Gastos Totales</span>
                      <span className="font-bold text-red-900">{formatCurrency(realMetrics.totalExpenses)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <span className="font-medium text-purple-900">Retenciones Totales</span>
                      <span className="font-bold text-purple-900">{formatCurrency(realMetrics.totalISLRRetained + realMetrics.totalIVARetained)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <span className="font-bold text-green-900">Resultado Neto</span>
                      <span className="text-xl font-bold text-green-900">{formatCurrency(realMetrics.totalIncome - realMetrics.totalExpenses)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">Balance no disponible</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Necesita transacciones de ingresos y gastos para generar el balance general
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Análisis de Proveedores</h3>
                {(() => {
                  // Group transactions by provider to show top providers
                  const providerStats = transactions.reduce((acc, t) => {
                    if (!t.providerRif || !t.providerName) return acc;
                    
                    if (!acc[t.providerRif]) {
                      acc[t.providerRif] = {
                        name: t.providerName,
                        rif: t.providerRif,
                        transactions: 0,
                        totalAmount: 0,
                        totalRetained: 0
                      };
                    }
                    
                    acc[t.providerRif].transactions++;
                    acc[t.providerRif].totalAmount += t.totalAmount;
                    acc[t.providerRif].totalRetained += t.retentionAmount;
                    
                    return acc;
                  }, {} as Record<string, any>);
                  
                  const topProviders = Object.values(providerStats)
                    .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
                    .slice(0, 5);
                  
                  return topProviders.length > 0 ? (
                    <div className="space-y-3">
                      {topProviders.map((provider: any, index) => (
                        <div key={provider.rif} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{provider.name}</p>
                              <p className="text-sm text-gray-600">{provider.transactions} transacciones</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(provider.totalAmount)}</p>
                            <p className="text-xs text-red-600">Ret: {formatCurrency(provider.totalRetained)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-500 mb-2">Sin proveedores registrados</p>
                      <p className="text-sm text-gray-400 max-w-sm">
                        Agregue proveedores y registre transacciones para ver el análisis
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Alertas y Notificaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Declaración Pendiente</p>
                      <p className="text-xs text-yellow-700">Vencimiento: 15 días</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Backup Completado</p>
                      <p className="text-xs text-green-700">Hace 2 horas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Meta Mensual</p>
                      <p className="text-xs text-blue-700">85% completada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'income-statement' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Tendencia Anual</h3>
                {chartData.some(d => d.income > 0 || d.expenses > 0) ? (
                  <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => value > 1000000 ? `${(value/1000000).toFixed(1)}M` : `${(value/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="income" fill="#2563eb" name="Ingresos" />
                      <Bar dataKey="expenses" fill="#dc2626" name="Gastos" />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">Sin datos anuales</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Configure transacciones a lo largo del año fiscal {fiscalYear} para ver tendencias
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Proyecciones Fiscales</h3>
                {(() => {
                  // Calculate real projections based on current year data
                  const yearTransactions = transactions.filter(t => t.date.startsWith(fiscalYear.toString()));
                  const monthsWithData = new Set(yearTransactions.map(t => t.period)).size;
                  
                  if (monthsWithData === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Target className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-500 mb-2">Sin datos para proyecciones</p>
                        <p className="text-sm text-gray-400 max-w-sm">
                          Necesita al menos un mes de datos para generar proyecciones fiscales
                        </p>
                      </div>
                    );
                  }
                  
                  const yearlyIncome = yearTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.totalAmount, 0);
                  const yearlyExpenses = yearTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.totalAmount, 0);
                  const yearlyRetentions = yearTransactions.filter(t => ['ISLR', 'IVA'].includes(t.type)).reduce((sum, t) => sum + t.retentionAmount, 0);
                  
                  // Project to full year if we have partial data
                  const projectionMultiplier = monthsWithData < 12 ? (12 / monthsWithData) : 1;
                  const projectedIncome = yearlyIncome * projectionMultiplier;
                  const projectedRetentions = yearlyRetentions * projectionMultiplier;
                  const projectedMargin = projectedIncome > 0 ? ((projectedIncome - yearlyExpenses * projectionMultiplier) / projectedIncome) * 100 : 0;
                  
                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-green-900">Ingreso Anual Proyectado ({fiscalYear})</span>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(projectedIncome)}</p>
                        {monthsWithData < 12 && (
                          <p className="text-xs text-green-700 mt-1">Basado en {monthsWithData} mes(es) de datos</p>
                        )}
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-yellow-900">Retenciones Estimadas</span>
                          <Target className="h-4 w-4 text-yellow-600" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">{formatCurrency(projectedRetentions)}</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-purple-900">Margen Neto Proyectado</span>
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{projectedMargin.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'retention-analysis' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Retenciones ISLR vs IVA</h3>
                {realMetrics.totalISLRRetained > 0 || realMetrics.totalIVARetained > 0 ? (
                  <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'ISLR', value: realMetrics.totalISLRRetained, color: '#2563eb' },
                          { name: 'IVA', value: realMetrics.totalIVARetained, color: '#7c3aed' }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                      >
                        {[
                          { name: 'ISLR', value: realMetrics.totalISLRRetained, color: '#2563eb' },
                          { name: 'IVA', value: realMetrics.totalIVARetained, color: '#7c3aed' }
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-center">
                    <PieChart className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">Sin datos de retenciones</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                      Registre retenciones ISLR e IVA para ver la comparativa
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Detalle de Retenciones</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-blue-900">ISLR Retenido</span>
                      <span className="text-sm text-blue-700">Período actual</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(realMetrics.totalISLRRetained)}</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-purple-900">IVA Retenido</span>
                      <span className="text-sm text-purple-700">Período actual</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(realMetrics.totalIVARetained)}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-900">Total Retenciones</span>
                      <span className="text-sm text-gray-700">Acumulado</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(realMetrics.totalISLRRetained + realMetrics.totalIVARetained)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Exportar Reporte</h3>
            <p className="text-gray-600">Descargue el reporte actual en diferentes formatos</p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => handleExportReport('pdf')}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button 
              onClick={() => handleExportReport('excel')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </button>
            <button 
              onClick={() => handleExportReport('csv')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </button>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Mail className="h-4 w-4 mr-2" />
              Enviar
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}