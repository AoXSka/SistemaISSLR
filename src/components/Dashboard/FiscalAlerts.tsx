import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Clock, CheckCircle2, Bell, ArrowRight } from 'lucide-react';

interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  date: string;
  action?: string;
  priority: number;
}

const mockAlerts: Alert[] = [
  {
    id: 1,
    type: 'critical',
    title: 'Declaración IVA Vencida',
    description: 'La declaración de IVA de Noviembre debe ser presentada urgentemente',
    date: '2024-12-15',
    action: 'Declarar Ahora',
    priority: 1
  },
  {
    id: 2,
    type: 'warning',
    title: 'Retención ISLR Pendiente',
    description: 'Comprobante de retención pendiente de envío al proveedor',
    date: '2024-12-20',
    action: 'Enviar Comprobante',
    priority: 2
  },
  {
    id: 3,
    type: 'info',
    title: 'Backup Programado',
    description: 'Backup automático de seguridad programado para mañana 23:00',
    date: '2024-12-14',
    action: 'Configurar',
    priority: 3
  },
  {
    id: 4,
    type: 'success',
    title: 'Declaración Exitosa',
    description: 'IVA de Octubre declarado y procesado correctamente por SENIAT',
    date: '2024-12-10',
    priority: 4
  }
];

export default function FiscalAlerts() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const { transactionService } = await import('../../services/transactionService');
        const { voucherService } = await import('../../services/voucherService');
        
        const transactions = await transactionService.getTransactions({});
        const vouchers = await voucherService.getVouchers({});
        
        const generatedAlerts: Alert[] = [];
        
        // Generate alerts based on real data
        const pendingISLR = transactions.filter(t => t.type === 'ISLR' && t.status === 'PENDING');
        if (pendingISLR.length > 0) {
          generatedAlerts.push({
            id: 1,
            type: 'warning',
            title: 'Retenciones ISLR Pendientes',
            description: `${pendingISLR.length} retenciones ISLR requieren procesamiento`,
            date: new Date().toISOString(),
            action: 'Procesar',
            priority: 2
          });
        }
        
        const pendingIVA = transactions.filter(t => t.type === 'IVA' && t.status === 'PENDING');
        if (pendingIVA.length > 0) {
          generatedAlerts.push({
            id: 2,
            type: 'warning',
            title: 'Retenciones IVA Pendientes',
            description: `${pendingIVA.length} retenciones IVA requieren procesamiento`,
            date: new Date().toISOString(),
            action: 'Procesar',
            priority: 2
          });
        }
        
        const unsentVouchers = vouchers.filter(v => !v.emailSent);
        if (unsentVouchers.length > 0) {
          generatedAlerts.push({
            id: 3,
            type: 'info',
            title: 'Comprobantes Sin Enviar',
            description: `${unsentVouchers.length} comprobantes pendientes de envío`,
            date: new Date().toISOString(),
            action: 'Enviar',
            priority: 3
          });
        }
        
        // Check fiscal calendar
        const today = new Date();
        const day = today.getDate();
        if (day >= 10 && day <= 20) {
          generatedAlerts.push({
            id: 4,
            type: 'critical',
            title: 'Período de Declaraciones',
            description: 'Estamos en período de declaraciones fiscales mensuales',
            date: today.toISOString(),
            action: 'Ver Calendario',
            priority: 1
          });
        }
        
        setAlerts(generatedAlerts);
      } catch (error) {
        console.error('Error loading alerts:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAlerts();
  }, []);

  const sortedAlerts = alerts.sort((a, b) => a.priority - b.priority);

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          bgClass: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10',
          borderClass: 'border-red-200 dark:border-red-800',
          textClass: 'text-red-900 dark:text-red-100',
          actionClass: 'bg-red-600 hover:bg-red-700',
          badgeClass: 'bg-red-500',
          glowClass: 'shadow-red-500/20'
        };
      case 'warning':
        return {
          icon: Clock,
          iconColor: 'text-amber-600',
          bgClass: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10',
          borderClass: 'border-amber-200 dark:border-amber-800',
          textClass: 'text-amber-900 dark:text-amber-100',
          actionClass: 'bg-amber-600 hover:bg-amber-700',
          badgeClass: 'bg-amber-500',
          glowClass: 'shadow-amber-500/20'
        };
      case 'info':
        return {
          icon: Calendar,
          iconColor: 'text-blue-600',
          bgClass: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10',
          borderClass: 'border-blue-200 dark:border-blue-800',
          textClass: 'text-blue-900 dark:text-blue-100',
          actionClass: 'bg-blue-600 hover:bg-blue-700',
          badgeClass: 'bg-blue-500',
          glowClass: 'shadow-blue-500/20'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          bgClass: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10',
          borderClass: 'border-green-200 dark:border-green-800',
          textClass: 'text-green-900 dark:text-green-100',
          actionClass: 'bg-green-600 hover:bg-green-700',
          badgeClass: 'bg-green-500',
          glowClass: 'shadow-green-500/20'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-neutral-600',
          bgClass: 'from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700',
          borderClass: 'border-neutral-200 dark:border-neutral-700',
          textClass: 'text-neutral-900 dark:text-neutral-100',
          actionClass: 'bg-neutral-600 hover:bg-neutral-700',
          badgeClass: 'bg-neutral-500',
          glowClass: 'shadow-neutral-500/20'
        };
    }
  };

  const criticalCount = sortedAlerts.filter(a => a.type === 'critical').length;
  const warningCount = sortedAlerts.filter(a => a.type === 'warning').length;

  if (loading) {
    return (
      <div className="card-premium p-6 animate-slide-up">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-6 animate-slide-up relative overflow-hidden">
      {/* Header Premium */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-warning-500 to-red-500 rounded-xl shadow-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              {(criticalCount + warningCount) > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white dark:border-neutral-800">
                  {criticalCount + warningCount}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Alertas Fiscales
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                Notificaciones importantes del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{criticalCount}</p>
            <p className="text-xs text-red-700 dark:text-red-300 font-semibold">Críticas</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{warningCount}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Avisos</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{alerts.length - criticalCount - warningCount}</p>
            <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Resueltas</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {sortedAlerts.map((alert) => {
          const config = getAlertConfig(alert.type);
          const AlertIcon = config.icon;
          
          return (
            <div 
              key={alert.id}
              className={`
                relative group border-l-4 p-4 rounded-r-xl transition-all duration-300 hover-lift border-2
                bg-gradient-to-r ${config.bgClass} ${config.borderClass} ${config.glowClass} overflow-hidden
              `}
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 ${config.glowClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}></div>
              
              <div className="relative flex items-start space-x-4">
                {/* Icon Container */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200">
                      <AlertIcon className={`h-5 w-5 ${config.iconColor}`} />
                    </div>
                    {alert.type === 'critical' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white dark:border-neutral-800"></div>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-bold ${config.textClass} group-hover:text-opacity-90 transition-all duration-200`}>
                      {alert.title}
                    </h4>
                    {alert.type === 'critical' && (
                      <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        URGENTE
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs font-medium mb-3 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-neutral-500" />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {formatDate(alert.date)}
                      </span>
                    </div>
                    
                    {alert.action && (
                      <button className={`
                        inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-white transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg
                        ${config.actionClass}
                      `}>
                        {alert.action}
                        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
        <button className="w-full text-center py-4 text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-bold bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border border-primary-200 dark:border-primary-800 group">
          Ver Centro de Notificaciones
          <ArrowRight className="h-4 w-4 ml-2 inline group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}