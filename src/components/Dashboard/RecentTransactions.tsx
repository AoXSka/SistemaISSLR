import React from 'react';
import { useState, useEffect } from 'react';
import { Eye, FileText, Receipt, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function RecentTransactions() {
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const loadRecentTransactions = async () => {
      try {
        const allTransactions = await transactionService.getTransactions({});
        setRecentTransactions(allTransactions.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent transactions:', error);
        setRecentTransactions([]);
      }
    };
    
    loadRecentTransactions();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISLR':
        return <Receipt className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
      case 'IVA':
        return <FileText className="h-5 w-5 text-accent-600 dark:text-accent-400" />;
      default:
        return <FileText className="h-5 w-5 text-neutral-500" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          badge: 'status-warning',
          text: 'Pendiente',
          icon: Clock,
          iconColor: 'text-amber-500'
        };
      case 'PAID':
        return {
          badge: 'status-success',
          text: 'Pagado',
          icon: CheckCircle2,
          iconColor: 'text-green-500'
        };
      case 'DECLARED':
        return {
          badge: 'status-success',
          text: 'Declarado',
          icon: CheckCircle2,
          iconColor: 'text-blue-500'
        };
      default:
        return {
          badge: 'status-pending',
          text: status,
          icon: Clock,
          iconColor: 'text-neutral-500'
        };
    }
  };

  const totalRetained = recentTransactions.reduce((sum, t) => sum + t.retentionAmount, 0);

  return (
    <div className="card-premium p-6 animate-slide-up overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-primary-600 to-accent-600 rounded-full transform translate-x-20 -translate-y-20"></div>
      </div>
      
      <div className="relative">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full shadow-lg"></div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Transacciones Recientes
              </h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              Últimas operaciones registradas en el sistema
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Total Período</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(totalRetained)}
              </p>
            </div>
            <button className="px-4 py-2 text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 text-sm font-semibold bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border border-primary-200 dark:border-primary-800">
              Ver todas
              <TrendingUp className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {recentTransactions.map((transaction, index) => {
            const statusConfig = getStatusConfig(transaction.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div 
                key={transaction.id}
                className="group relative flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 hover:from-primary-50 hover:to-accent-50 dark:hover:from-primary-900/10 dark:hover:to-accent-900/10 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Background Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center space-x-4 flex-1">
                  {/* Type Icon */}
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 rounded-xl group-hover:from-primary-100 group-hover:to-primary-200 dark:group-hover:from-primary-900/30 dark:group-hover:to-primary-800/30 transition-all duration-200 shadow-md group-hover:shadow-lg">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                  </div>
                  
                  {/* Transaction Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                        {transaction.providerName}
                      </h4>
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                        transaction.type === 'ISLR' ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-neutral-600 dark:text-neutral-400">{transaction.documentNumber}</span>
                      </div>
                      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">{formatDate(transaction.date)}</span>
                      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
                      <span className="font-mono text-neutral-500 dark:text-neutral-400">{transaction.providerRif}</span>
                    </div>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="relative flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                      {formatCurrency(transaction.retentionAmount)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      Base: {formatCurrency(transaction.taxableBase)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold border shadow-sm ${statusConfig.badge}`}>
                      <StatusIcon className={`h-3 w-3 mr-1.5 ${statusConfig.iconColor}`} />
                      {statusConfig.text}
                    </div>
                    
                    <button className="p-2 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform group-hover:scale-110">
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="glass-card p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Retenciones del Mes
                  </p>
                  <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {recentTransactions.length} operaciones
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mb-1">Total Acumulado</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">
                  {formatCurrency(totalRetained)}
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="mt-4 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-success-500 to-success-600 rounded-full transition-all duration-1000 shadow-sm" style={{ width: '67%' }}>
                <div className="h-full bg-white bg-opacity-30 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}