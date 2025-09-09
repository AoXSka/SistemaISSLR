import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Zap } from 'lucide-react';

export type StatusType = 'success' | 'pending' | 'warning' | 'error' | 'active';

interface StatusIndicatorProps {
  status: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function StatusIndicator({
  status,
  text,
  size = 'md',
  showIcon = true,
  pulse = false,
  className = ''
}: StatusIndicatorProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-gradient-to-r from-success-100 to-success-50 dark:from-success-900/30 dark:to-success-800/20',
          textColor: 'text-success-800 dark:text-success-200',
          borderColor: 'border-success-300 dark:border-success-600',
          iconColor: 'text-success-600 dark:text-success-400',
          glowColor: 'shadow-success-500/20',
          defaultText: 'Completado'
        };
      case 'pending':
        return {
          icon: Clock,
          bgColor: 'bg-gradient-to-r from-warning-100 to-warning-50 dark:from-warning-900/30 dark:to-warning-800/20',
          textColor: 'text-warning-800 dark:text-warning-200',
          borderColor: 'border-warning-300 dark:border-warning-600',
          iconColor: 'text-warning-600 dark:text-warning-400',
          glowColor: 'shadow-warning-500/20',
          defaultText: 'Pendiente'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-gradient-to-r from-warning-100 to-warning-50 dark:from-warning-900/30 dark:to-warning-800/20',
          textColor: 'text-warning-800 dark:text-warning-200',
          borderColor: 'border-warning-300 dark:border-warning-600',
          iconColor: 'text-warning-600 dark:text-warning-400',
          glowColor: 'shadow-warning-500/20',
          defaultText: 'Advertencia'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-gradient-to-r from-error-100 to-error-50 dark:from-error-900/30 dark:to-error-800/20',
          textColor: 'text-error-800 dark:text-error-200',
          borderColor: 'border-error-300 dark:border-error-600',
          iconColor: 'text-error-600 dark:text-error-400',
          glowColor: 'shadow-error-500/20',
          defaultText: 'Error'
        };
      case 'active':
        return {
          icon: Zap,
          bgColor: 'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20',
          textColor: 'text-primary-800 dark:text-primary-200',
          borderColor: 'border-primary-300 dark:border-primary-600',
          iconColor: 'text-primary-600 dark:text-primary-400',
          glowColor: 'shadow-primary-500/20',
          defaultText: 'Activo'
        };
    }
  };

  const sizeClasses = {
    sm: {
      container: 'px-3 py-1.5 text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      container: 'px-4 py-2 text-sm',
      icon: 'h-4 w-4'
    },
    lg: {
      container: 'px-6 py-3 text-base',
      icon: 'h-5 w-5'
    }
  };

  const config = getStatusConfig(status);
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center rounded-full border-2 font-bold transition-all duration-200 shadow-sm hover:shadow-md
      ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.glowColor}
      ${sizes.container}
      ${pulse ? 'animate-pulse-slow' : ''}
      ${className}
    `}>
      {showIcon && (
        <Icon className={`${sizes.icon} ${config.iconColor} ${text ? 'mr-2' : ''} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      <span className="font-semibold tracking-wide">
        {text || config.defaultText}
      </span>
    </div>
  );
}