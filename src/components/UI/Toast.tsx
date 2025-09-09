import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    console.log('🗑️ Toast removed:', id);
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    console.log('🔔 Toast added:', { type: toast.type, title: toast.title });
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remover después de duración
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-success-600',
          bgColor: 'bg-success-50 dark:bg-success-900/30',
          borderColor: 'border-success-200 dark:border-success-700',
          titleColor: 'text-success-800 dark:text-success-100',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-warning-600',
          bgColor: 'bg-warning-50 dark:bg-warning-900/30',
          borderColor: 'border-warning-200 dark:border-warning-700',
          titleColor: 'text-warning-800 dark:text-warning-100',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-error-600',
          bgColor: 'bg-error-50 dark:bg-error-900/30',
          borderColor: 'border-error-200 dark:border-error-700',
          titleColor: 'text-error-800 dark:text-error-100',
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-primary-600',
          bgColor: 'bg-primary-50 dark:bg-primary-900/30',
          borderColor: 'border-primary-200 dark:border-primary-700',
          titleColor: 'text-primary-800 dark:text-primary-100',
        };
    }
  };

  const styles = getToastStyles(toast.type);
  const Icon = styles.icon;

  return (
    <div className={`
      ${styles.bgColor} ${styles.borderColor} 
      border rounded-xl p-4 shadow-lg backdrop-blur-sm
      animate-slide-up transform transition-all duration-300
    `}>
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${styles.titleColor}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
        </button>
      </div>
    </div>
  );
};

export default ToastProvider;