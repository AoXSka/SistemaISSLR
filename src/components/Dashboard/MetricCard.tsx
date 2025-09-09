import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: IconComponent;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  isCurrency?: boolean;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

const colorClasses = {
  primary: {
    bg: 'from-blue-600/90 to-blue-700/90',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    accent: 'bg-blue-50'
  },
  secondary: {
    bg: 'from-gray-600/90 to-gray-700/90',
    text: 'text-gray-700',
    icon: 'text-gray-600',
    border: 'border-gray-200',
    accent: 'bg-gray-50'
  },
  accent: {
    bg: 'from-amber-600/90 to-amber-700/90',
    text: 'text-amber-700',
    icon: 'text-amber-600',
    border: 'border-amber-200',
    accent: 'bg-amber-50'
  },
  success: {
    bg: 'from-emerald-600/90 to-emerald-700/90',
    text: 'text-emerald-700',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    accent: 'bg-emerald-50'
  },
  warning: {
    bg: 'from-orange-600/90 to-orange-700/90',
    text: 'text-orange-700',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    accent: 'bg-orange-50'
  },
  error: {
    bg: 'from-red-600/90 to-red-700/90',
    text: 'text-red-700',
    icon: 'text-red-600',
    border: 'border-red-200',
    accent: 'bg-red-50'
  }
};

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  isCurrency = false,
  subtitle,
  trend
}: MetricCardProps) {
  const colors = colorClasses[color];
  
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    if (isCurrency) {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    }
    
    return new Intl.NumberFormat('es-VE').format(val);
  };

  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="group relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 rounded-2xl border border-white/20 backdrop-blur-sm shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105" />
      
      {/* Content */}
      <div className="relative p-6 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${colors.accent}`}>
              <TrendIcon className={`h-3 w-3 ${colors.icon}`} />
              <span className={`text-xs font-medium ${colors.text}`}>
                {trend === 'up' ? 'Subida' : trend === 'down' ? 'Bajada' : 'Estable'}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 leading-tight">
          {title}
        </h3>

        {/* Value */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
              change > 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : change < 0 
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
            }`}>
              {change > 0 && <TrendingUp className="h-3 w-3" />}
              {change < 0 && <TrendingDown className="h-3 w-3" />}
              {change === 0 && <Minus className="h-3 w-3" />}
              <span className="text-xs font-bold">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-neutral-900/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}