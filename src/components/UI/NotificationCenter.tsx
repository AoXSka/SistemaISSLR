import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Calendar, Eye } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { transactionService } from '../../services/transactionService';
import { voucherService } from '../../services/voucherService';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'info' | 'fiscal';
  title: string;
  message: string;
  date: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const realNotifications: Notification[] = [];
      
      // Check for pending declarations
      const pendingISLR = await transactionService.getTransactions({ 
        type: 'ISLR', 
        status: 'PENDING' 
      });
      
      if (pendingISLR.length > 0) {
        realNotifications.push({
          id: Date.now() + 1,
          type: 'fiscal',
          title: 'Retenciones ISLR Pendientes',
          message: `Tiene ${pendingISLR.length} retenciones ISLR pendientes de pago`,
          date: new Date().toISOString(),
          read: false,
          action: {
            label: 'Ver ISLR',
            onClick: () => window.location.hash = '#islr'
          }
        });
      }
      
      // Check for pending vouchers
      const pendingVouchers = await voucherService.getVouchers({ emailSent: false });
      if (pendingVouchers.length > 0) {
        realNotifications.push({
          id: Date.now() + 2,
          type: 'warning',
          title: 'Comprobantes por Enviar',
          message: `${pendingVouchers.length} comprobantes pendientes de envío por email`,
          date: new Date().toISOString(),
          read: false,
          action: {
            label: 'Ver Comprobantes',
            onClick: () => window.location.hash = '#vouchers'
          }
        });
      }
      
      // Check backup status
      const lastBackup = localStorage.getItem('contave-last-backup');
      if (!lastBackup) {
        realNotifications.push({
          id: Date.now() + 3,
          type: 'info',
          title: 'Backup Recomendado',
          message: 'Se recomienda crear un backup de la base de datos',
          date: new Date().toISOString(),
          read: false,
          action: {
            label: 'Crear Backup',
            onClick: () => window.location.hash = '#settings'
          }
        });
      } else {
        realNotifications.push({
          id: Date.now() + 4,
          type: 'success',
          title: 'Sistema al Día',
          message: 'Todas las operaciones están actualizadas',
          date: new Date().toISOString(),
          read: false
        });
      }
      
      setNotifications(realNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />;
      case 'fiscal':
        return <Calendar className="h-5 w-5 text-error-600" />;
      default:
        return <Info className="h-5 w-5 text-primary-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-success-500 bg-success-50 dark:bg-success-900/20';
      case 'warning':
        return 'border-l-warning-500 bg-warning-50 dark:bg-warning-900/20';
      case 'fiscal':
        return 'border-l-error-500 bg-error-50 dark:bg-error-900/20';
      default:
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Notificaciones
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marcar todas leídas
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">
                    No hay notificaciones
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`
                        border-l-4 p-3 rounded-r-lg transition-all duration-200 cursor-pointer
                        ${getTypeColor(notification.type)}
                        ${!notification.read ? 'shadow-md' : 'opacity-75'}
                        hover:shadow-lg
                      `}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                            {formatDate(notification.date)}
                          </p>
                          
                          {notification.action && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action!.onClick();
                              }}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700 mt-2"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                        >
                          <X className="h-3 w-3 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}