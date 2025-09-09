export const formatters = {
  // Venezuelan RIF validation and formatting
  rif: {
    validate: (rif: string): boolean => {
      const rifPattern = /^[VJEGPGRC]-\d{8}-\d$/;
      return rifPattern.test(rif);
    },
    
    format: (rif: string): string => {
      if (!rif) return '';
      
      const cleanRif = rif.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
      
      if (cleanRif.length >= 10) {
        return `${cleanRif[0]}-${cleanRif.slice(1, 9)}-${cleanRif[9]}`;
      }
      
      return rif;
    },

    clean: (rif: string): string => {
      return rif.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    }
  },

  // Date validation and formatting (DD/MM/YYYY)
  date: {
    validate: (dateStr: string): boolean => {
      const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!datePattern.test(dateStr)) return false;
      
      const [day, month, year] = dateStr.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.getDate() === day && 
             date.getMonth() === month - 1 && 
             date.getFullYear() === year;
    },
    
    format: (date: Date): string => {
      return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    },

    parse: (dateStr: string): Date | null => {
      if (!formatters.date.validate(dateStr)) return null;
      
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
  },

  // Decimal number validation (Venezuelan format with comma)
  decimal: {
    validate: (value: string): boolean => {
      const decimalPattern = /^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/;
      return decimalPattern.test(value);
    },
    
    format: (value: number): string => {
      return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    },

    parse(value: string) {
      return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    }
  },

  // Email validation
  email: {
    validate: (email: string): boolean => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    }
  },

  // Phone validation (Venezuelan format)
  phone: {
    validate: (phone: string): boolean => {
      const phonePattern = /^(\+58-?)?0?(2\d{2}|4\d{2}|5\d{2})-?\d{7}$/;
      return phonePattern.test(phone);
    },
    
    format: (phone: string): string => {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      
      if (cleanPhone.startsWith('58')) {
        const national = cleanPhone.slice(2);
        return `+58-${national.slice(0, 4)}-${national.slice(4)}`;
      } else if (cleanPhone.startsWith('0')) {
        return `${cleanPhone.slice(0, 4)}-${cleanPhone.slice(4)}`;
      }
      
      return phone;
    }
  }
};

export const validators = {
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value) && value !== 0;
    return value != null;
  },

  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min;
  },

  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max;
  },

  min: (min: number) => (value: number): boolean => {
    return value >= min;
  },

  max: (max: number) => (value: number): boolean => {
    return value <= max;
  },

  pattern: (pattern: RegExp) => (value: string): boolean => {
    return pattern.test(value);
  },

  custom: (fn: (value: any) => boolean) => fn
};

export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

export interface FormValidation {
  [field: string]: ValidationRule[];
}

export const validateForm = (data: Record<string, any>, rules: FormValidation): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];

    for (const rule of fieldRules) {
      if (!rule.validator(value)) {
        errors[field] = rule.message;
        break; // Stop at first error for this field
      }
    }
  });

  return errors;
};

// Common validation rules for ContaVe Pro
export const commonValidationRules = {
  rif: [
    { validator: validators.required, message: 'El RIF es obligatorio' },
    { validator: formatters.rif.validate, message: 'El formato del RIF es inválido (Ej: J-12345678-9)' }
  ],
  
  providerName: [
    { validator: validators.required, message: 'El nombre del proveedor es obligatorio' },
    { validator: validators.minLength(3), message: 'El nombre debe tener al menos 3 caracteres' },
    { validator: validators.maxLength(200), message: 'El nombre no puede exceder 200 caracteres' }
  ],
  
  documentNumber: [
    { validator: validators.required, message: 'El número de documento es obligatorio' },
    { validator: validators.minLength(3), message: 'El número debe tener al menos 3 caracteres' }
  ],
  
  email: [
    { validator: formatters.email.validate, message: 'El formato del email es inválido' }
  ],
  
  amount: [
    { validator: validators.required, message: 'El monto es obligatorio' },
    { validator: validators.min(0.01), message: 'El monto debe ser mayor a 0' }
  ],
  
  percentage: [
    { validator: validators.required, message: 'El porcentaje es obligatorio' },
    { validator: validators.min(0), message: 'El porcentaje no puede ser negativo' },
    { validator: validators.max(100), message: 'El porcentaje no puede exceder 100%' }
  ],
  
  date: [
    { validator: validators.required, message: 'La fecha es obligatoria' },
    { 
      validator: (value: string) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }, 
      message: 'La fecha debe tener un formato válido' 
    }
  ]
};

export default {
  formatters,
  validators,
  validateForm,
  commonValidationRules
};