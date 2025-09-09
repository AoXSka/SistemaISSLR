import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import Input from './Input';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  currency?: 'VES' | 'USD';
  showSymbol?: boolean;
  allowNegative?: boolean;
  maxDecimals?: number;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  disabled = false,
  className = '',
  error,
  currency = 'VES',
  showSymbol = true,
  allowNegative = false,
  maxDecimals = 2
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format number for display
  const formatForDisplay = (num: number): string => {
    if (num === 0 && !isFocused) return '';
    
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: isFocused ? 0 : maxDecimals,
      maximumFractionDigits: maxDecimals
    }).format(num);
  };

  // Parse input string to number
  const parseValue = (str: string): number => {
    if (!str) return 0;
    
    // Remove all non-numeric characters except comma and minus
    let cleaned = str.replace(/[^\d,\-]/g, '');
    
    // Handle negative numbers
    const isNegative = cleaned.startsWith('-');
    if (isNegative && !allowNegative) {
      cleaned = cleaned.substring(1);
    }
    
    // Replace comma with period for parsing
    cleaned = cleaned.replace(',', '.');
    
    const parsed = parseFloat(cleaned) || 0;
    return isNegative ? -parsed : parsed;
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatForDisplay(value));
    }
  }, [value, isFocused, maxDecimals]);

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue);
    
    const numericValue = parseValue(inputValue);
    
    // Validate range
    if (!allowNegative && numericValue < 0) {
      return;
    }
    
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number without formatting when focused
    setDisplayValue(value === 0 ? '' : value.toString().replace('.', ','));
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format for display when unfocused
    setDisplayValue(formatForDisplay(value));
  };

  const currencySymbol = currency === 'VES' ? 'Bs' : '$';
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            input-enterprise w-full
            ${showSymbol ? 'pl-16' : 'pl-4'} pr-4
            transition-all duration-200 shadow-sm hover:shadow-md
            ${error 
              ? '!border-error-500 focus:!border-error-500 focus:!ring-2 focus:!ring-error-500/50' 
              : 'hover:border-neutral-300 dark:hover:border-neutral-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-400/50'
            }
            focus:outline-none
            ${className}
          `}
        />
        
        {/* Currency Symbol */}
        {showSymbol && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
            <DollarSign className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              {currencySymbol}
            </span>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-1 text-xs text-error-600 dark:text-error-400 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}