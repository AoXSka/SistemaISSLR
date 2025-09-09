// components/PurchaseStatistics.tsx
import React from 'react';
import {
  TrendingUp, DollarSign, ShoppingCart, CreditCard,
  Package, BarChart3, PieChart, Activity
} from 'lucide-react';
import { PurchaseStatistics } from '../../types/index';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface PurchaseStatisticsProps {
  statistics: PurchaseStatistics;
  period: string;
}

const PurchaseStatisticsComponent: React.FC<PurchaseStatisticsProps> = ({ 
  statistics, 
  period 
}) => {
  const categoryColors = {
    'INV': '#3B82F6', // Blue
    'SRV': '#10B981', // Green
    'GAO': '#F59E0B', // Yellow
    'GAD': '#EF4444', // Red
    'ACT': '#8B5CF6', // Purple
    'MAN': '#EC4899', // Pink
    'PUB': '#06B6D4', // Cyan
    'OTR': '#6B7280'  // Gray
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalPurchases}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statistics.totalAmount, 'VES')}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">IVA Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statistics.totalIVA, 'VES')}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statistics.averageAmount, 'VES')}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribución por Categoría
          </h3>
          <div className="space-y-3">
            {Object.entries(statistics.byCategory).map(([category, data]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm text-gray-600">
                    {data.count} ({formatPercentage((data.count / statistics.totalPurchases) * 100, 1)})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(data.amount / statistics.totalAmount) * 100}%`,
                      backgroundColor: categoryColors[category as keyof typeof categoryColors]
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(data.amount, 'VES')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Métodos de Pago
          </h3>
          <div className="space-y-3">
            {Object.entries(statistics.byPaymentMethod).map(([method, data]) => {
              const methodLabels: Record<string, string> = {
                cash: 'Efectivo',
                transfer: 'Transferencia',
                check: 'Cheque',
                card: 'Tarjeta',
                other: 'Otro'
              };
              
              return (
                <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{methodLabels[method] || method}</p>
                    <p className="text-sm text-gray-600">{data.count} transacciones</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(data.amount, 'VES')}</p>
                    <p className="text-sm text-gray-600">
                      {formatPercentage((data.amount / statistics.totalAmount) * 100, 1)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tendencia Mensual
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {statistics.monthlyTrend.map((month, index) => (
              <div key={month.month} className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium w-20">{month.month}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-end pr-3"
                    style={{
                      width: `${(month.amount / Math.max(...statistics.monthlyTrend.map(m => m.amount))) * 100}%`
                    }}
                  >
                    <span className="text-xs text-white font-medium">
                      {month.count} compras
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold w-32 text-right">
                  {formatCurrency(month.amount, 'VES')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estado de Facturas
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(statistics.byStatus).map(([status, data]) => {
            const statusConfig = {
              pending: { label: 'Pendientes', color: 'yellow' },
              paid: { label: 'Pagadas', color: 'green' },
              cancelled: { label: 'Anuladas', color: 'red' }
            };
            
            const config = statusConfig[status as keyof typeof statusConfig];
            
            return (
              <div
                key={status}
                className={`p-4 rounded-lg bg-${config.color}-50 border border-${config.color}-200`}
              >
                <p className={`text-sm font-medium text-${config.color}-700`}>
                  {config.label}
                </p>
                <p className={`text-2xl font-bold text-${config.color}-900`}>
                  {data.count}
                </p>
                <p className={`text-sm text-${config.color}-600 mt-1`}>
                  {formatCurrency(data.amount, 'VES')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PurchaseStatisticsComponent;