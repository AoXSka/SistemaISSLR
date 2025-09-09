import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, DollarSign, BarChart } from 'lucide-react';

interface IncomeChartProps {
  data: Array<{ month: string; amount: number }>;
}

export default function IncomeChart({ data }: IncomeChartProps) {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="card-premium p-6 animate-slide-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-primary-600 to-accent-600 rounded-full transform translate-x-12 -translate-y-12"></div>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-xl shadow-lg">
                  <BarChart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    Tendencias de Ingresos
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                    Sin datos disponibles
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h4 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
              No hay datos de ingresos
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 max-w-sm">
              Agregue transacciones de ingresos para ver las tendencias y análisis en este gráfico.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const totalIncome = data.reduce((sum, item) => sum + item.amount, 0);
  const averageIncome = data.length > 0 ? totalIncome / data.length : 0;
  const trend = data.length > 1 && data[data.length - 1].amount > data[0].amount ? 'up' : 'down';
  
  return (
    <div className="card-premium p-6 animate-slide-up relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-48 h-48 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-primary-600 to-accent-600 rounded-full transform translate-x-12 -translate-y-12"></div>
      </div>
      
      <div className="relative">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Tendencias de Ingresos
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Sin datos disponibles
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? 'CRECIMIENTO' : 'DECLIVE'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Promedio: {formatCurrency(averageIncome)}
            </p>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-accent-50/50 dark:from-primary-900/10 dark:to-accent-900/10 rounded-xl"></div>
          
          <div className="relative h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={600}
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                  tick={{ fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 500
                  }}
                />
                <Area
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fill="url(#incomeGradient)"
                  dot={{ 
                    fill: '#2563eb', 
                    strokeWidth: 3, 
                    r: 5,
                    stroke: '#ffffff',
                    shadow: '0 4px 8px rgba(37, 99, 235, 0.3)'
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: '#2563eb', 
                    strokeWidth: 3,
                    fill: '#ffffff',
                    shadow: '0 8px 16px rgba(37, 99, 235, 0.4)'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 glass-card hover-lift">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Total Anual</p>
            </div>
            
            <div className="text-center p-4 glass-card hover-lift">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(averageIncome)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Promedio</p>
            </div>
            
            <div className="text-center p-4 glass-card hover-lift">
              <div className="flex items-center justify-center mb-2">
                <div className={`w-4 h-4 rounded-full ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
              <p className={`text-lg font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {data.length > 1 ? ((data[data.length - 1].amount - data[0].amount) / data[0].amount * 100).toFixed(1) : '0.0'}%
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Variación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}