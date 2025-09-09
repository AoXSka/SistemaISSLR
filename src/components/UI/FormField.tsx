import React, { ReactNode } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  warning?: string;
  helperText?: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  required = false,
  error,
  warning,
  helperText,
  tooltip,
  children,
  className = ''
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-100 form-label">
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label="campo requerido">*</span>
            )}
          </label>
          {tooltip && (
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-neutral-400 cursor-help" />
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-100 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl border border-neutral-700 dark:border-neutral-600">
                {tooltip}
                <div className="absolute bottom-full right-4 transform -translate-x-1/2 border-4 border-transparent border-b-neutral-900 dark:border-b-neutral-800"></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {(error || warning || helperText) && (
        <div className="text-xs space-y-1">
          {error && (
            <div className="text-error-600 dark:text-error-400 font-medium flex items-center animate-shake">
              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error}
            </div>
          )}
          {warning && (
            <div className="text-warning-600 dark:text-warning-400 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
              {warning}
            </div>
          )}
          {helperText && !error && !warning && (
            <div className="text-neutral-500 dark:text-neutral-400 font-medium">
              {helperText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}