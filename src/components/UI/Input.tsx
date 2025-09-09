import React, { InputHTMLAttributes, forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';

type IconComponent = React.ComponentType<{ className?: string }>;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  onRightIconClick?: () => void;
  containerClassName?: string;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  containerClassName = '',
  className = '',
  required = false,
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-100 form-label">
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="campo requerido">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {LeftIcon && (
          <LeftIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${
            hasError ? 'text-error-500' : 'text-neutral-400 group-focus-within:text-primary-500'
          }`} />
        )}
        
        <input
          ref={ref}
          className={`
            input-enterprise w-full
            transition-all duration-200 shadow-sm hover:shadow-md
            ${LeftIcon ? 'pl-12' : ''}
            ${RightIcon ? 'pr-12' : ''}
            ${hasError 
              ? '!border-error-500 focus:!border-error-500 focus:!ring-2 focus:!ring-error-500/50' 
              : 'hover:border-neutral-300 dark:hover:border-neutral-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-400/50'
            }
            focus:outline-none
            ${className}
          `}
          {...props}
        />
        
        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertTriangle className="h-4 w-4 text-error-500" />
          </div>
        )}
        
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all duration-200 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            tabIndex={-1}
          >
            <RightIcon className="h-4 w-4 text-neutral-400" />
          </button>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="text-xs">
          {error ? (
            <span className="text-error-600 dark:text-error-400 font-medium flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {error}
            </span>
          ) : (
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;