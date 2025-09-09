import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export default function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  containerClassName = '',
  className = '',
  ...props
}: SelectProps) {
  const hasError = !!error;

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-100 form-label">
          {label}
          {props.required && <span className="text-error-500 ml-1" aria-label="campo requerido">*</span>}
        </label>
      )}
      
      <div className="relative group">
        <select
          className={`
            input-enterprise w-full appearance-none pr-12
            transition-all duration-200 shadow-sm hover:shadow-md
            ${hasError 
              ? '!border-error-500 focus:!border-error-500 focus:!ring-2 focus:!ring-error-500/50' 
              : 'hover:border-neutral-300 dark:hover:border-neutral-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-400/50'
            }
            focus:outline-none
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
          {hasError && <AlertTriangle className="h-4 w-4 text-error-500" />}
          <ChevronDown className={`h-4 w-4 transition-colors duration-200 ${
            hasError ? 'text-error-500' : 'text-neutral-400 group-focus-within:text-primary-500'
          }`} />
        </div>
      </div>
      
      {(error || helperText) && (
        <div className="text-xs">
          {error ? (
            <span className="text-error-600 dark:text-error-400 font-medium flex items-center animate-shake">
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
}