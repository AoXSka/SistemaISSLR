import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'rounded-lg shadow-sm hover:shadow-md'
  ];

  const variantClasses = {
    primary: [
      'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      'text-white border border-transparent',
      'focus:ring-blue-500'
    ],
    secondary: [
      'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
      'text-white border border-transparent',
      'focus:ring-gray-500'
    ],
    outline: [
      'bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400',
      'text-gray-700 focus:ring-blue-500'
    ],
    ghost: [
      'bg-transparent hover:bg-gray-100 border border-transparent',
      'text-gray-700 focus:ring-gray-500'
    ],
    danger: [
      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      'text-white border border-transparent',
      'focus:ring-red-500'
    ]
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const allClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const iconElement = Icon && (
    <Icon className={`${iconSizeClasses[size]} ${loading ? 'animate-spin' : ''}`} />
  );

  const loadingSpinner = loading && !Icon && (
    <div className={`${iconSizeClasses[size]} animate-spin rounded-full border-2 border-current border-t-transparent`} />
  );

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && loadingSpinner}
      {iconPosition === 'left' && iconElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </button>
  );
};

export default Button;