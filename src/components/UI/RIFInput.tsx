import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { rifValidator } from '../../utils/rifValidator';
import { providerService } from '../../services/providerService';

interface RIFInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (result: { isValid: boolean; name?: string; status?: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  showSENIATValidation?: boolean;
  className?: string;
  error?: string;
  autoValidate?: boolean;
}

export default function RIFInput({
  value,
  onChange,
  onValidation,
  placeholder = "V-12345678-9",
  disabled = false,
  showSENIATValidation = true,
  className = '',
  error,
  autoValidate = false
}: RIFInputProps) {
  const [localValidation, setLocalValidation] = useState<{
    isValid: boolean;
    type: string;
    errors: string[];
  }>({ isValid: false, type: '', errors: [] });
  
  const [seniatValidation, setSeniatValidation] = useState<{
    isValidating: boolean;
    result?: { isValid: boolean; name?: string; status?: string; error?: string };
  }>({ isValidating: false });

  // Local validation on value change
  useEffect(() => {
    if (value) {
      const validation = rifValidator.validate(value);
      setLocalValidation(validation);
      
      // Auto-validate with SENIAT if enabled and RIF is valid
      if (autoValidate && validation.isValid && showSENIATValidation) {
        handleSENIATValidation();
      }
    } else {
      setLocalValidation({ isValid: false, type: '', errors: [] });
      setSeniatValidation({ isValidating: false });
    }
  }, [value, autoValidate, showSENIATValidation]);

  const handleRIFChange = (inputValue: string) => {
    const formatted = rifValidator.format(inputValue);
    onChange(formatted);
  };

  const handleSENIATValidation = async () => {
    if (!localValidation.isValid) {
      return;
    }

    setSeniatValidation({ isValidating: true });

    try {
      const result = await providerService.validateProviderRIFWithSENIAT(value);
      setSeniatValidation({ isValidating: false, result });
      onValidation?.(result);
    } catch (error) {
      setSeniatValidation({ 
        isValidating: false, 
        result: { isValid: false, error: 'Error de conexión con SENIAT' }
      });
    }
  };

  const getValidationIcon = () => {
    if (seniatValidation.isValidating) {
      return <RefreshCw className="h-4 w-4 text-primary-600 animate-spin" />;
    }
    
    if (seniatValidation.result?.isValid) {
      return <CheckCircle2 className="h-4 w-4 text-success-600" />;
    }
    
    if (localValidation.isValid) {
      return <CheckCircle2 className="h-4 w-4 text-primary-600" />;
    }
    
    if (value && !localValidation.isValid) {
      return <AlertCircle className="h-4 w-4 text-error-600" />;
    }
    
    return null;
  };

  const getStatusMessage = () => {
    if (error) return null;
    
    if (seniatValidation.isValidating) {
      return <span className="text-primary-600">Validando con SENIAT...</span>;
    }
    
    if (seniatValidation.result?.isValid && seniatValidation.result.name) {
      return (
        <span className="text-success-600">
          ✓ Validado: {seniatValidation.result.name}
        </span>
      );
    }
    
    if (seniatValidation.result?.error) {
      return <span className="text-warning-600">⚠️ {seniatValidation.result.error}</span>;
    }
    
    if (localValidation.isValid && localValidation.type) {
      return <span className="text-primary-600">{localValidation.type}</span>;
    }
    
    if (value && !localValidation.isValid) {
      return <span className="text-error-600">{localValidation.errors[0]}</span>;
    }
    
    return null;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => handleRIFChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            leftIcon={Building2}
            error={error}
            className="pr-10"
          />
          
          {/* Validation icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
        
        {/* SENIAT Validation Button */}
        {showSENIATValidation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSENIATValidation}
            disabled={!localValidation.isValid || disabled || seniatValidation.isValidating}
            loading={seniatValidation.isValidating}
          >
            SENIAT
          </Button>
        )}
      </div>
      
      {/* Status message */}
      <div className="text-xs min-h-[1rem]">
        {getStatusMessage()}
      </div>
    </div>
  );
}