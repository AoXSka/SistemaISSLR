import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { PieChart as PieChartIcon, Receipt, FileText } from 'lucide-react';

interface RetentionChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export default function RetentionChart({ data }: RetentionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const largestSegment = Math.max(...data.map(d => d.value));
  const averageRetention = data.length > 0 ? total / data.length : 0;
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="glass-card p-4 shadow-xl border border-neutral-200/50 dark:border-neutral-700/50">
          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {data.name}
          </p>
          <div className="space-y-1">
            <p className="text-lg font-bold" style={{ color: data.payload.color }}>
              {formatCurrency(data.value)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {percentage}% del total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="card-premium p-6 animate-slide-up relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5">
        <div className="w-full h-full bg-gradient-to-tr from-accent-600 to-primary-600 rounded-full transform -translate-x-12 translate-y-12"></div>
      </div>
      
      <div className="relative">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl shadow-lg">
                <PieChartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Distribución de Retenciones
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Clasificación por tipo de impuesto retenido
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Total Retenido</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-50/50 to-primary-50/50 dark:from-accent-900/10 dark:to-primary-900/10 rounded-xl"></div>
          
          <div className="relative h-80 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend Premium */}
            <div className="w-1/2 pl-6 space-y-4">
              {data.map((entry, index) => {
                const percentage = ((entry.value / total) * 100).toFixed(1);
                const isLargest = entry.value === largestSegment;
                
                return (
                  <div 
                    key={index}
                    className={`
                      flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover-lift group
                      ${isLargest 
                        ? 'border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 dark:border-primary-700' 
                        : 'border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div 
                          className="w-4 h-4 rounded-full shadow-md"
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        {isLargest && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border border-white dark:border-neutral-800"></div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          {entry.name === 'ISLR' ? (
                            <Receipt className="h-4 w-4 text-primary-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-accent-600" />
                          )}
                          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {entry.name}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                          {percentage}% del total
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(entry.value)}
                      </p>
                      {isLargest && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-bold">
                          Mayor retención
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl border border-primary-200 dark:border-primary-800">
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {data.length}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300 font-semibold">Categorías</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/10 rounded-xl border border-accent-200 dark:border-accent-800">
              <p className="text-lg font-bold text-accent-600 dark:text-accent-400">
                {formatCurrency(averageRetention)}
              </p>
              <p className="text-xs text-accent-700 dark:text-accent-300 font-semibold">Promedio</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/10 rounded-xl border border-success-200 dark:border-success-800">
              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                100%
              </p>
              <p className="text-xs text-success-700 dark:text-success-300 font-semibold">Compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}