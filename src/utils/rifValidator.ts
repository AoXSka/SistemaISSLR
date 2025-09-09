// Venezuelan RIF validation utility
// Complies with SENIAT format and checksum validation

export interface RIFValidationResult {
  isValid: boolean;
  formatted: string;
  type: string;
  errors: string[];
}

export class RIFValidator {
  private static instance: RIFValidator;

  static getInstance(): RIFValidator {
    if (!RIFValidator.instance) {
      RIFValidator.instance = new RIFValidator();
    }
    return RIFValidator.instance;
  }

  private readonly rifTypes = {
    'V': 'Persona Natural Venezolana',
    'E': 'Persona Natural Extranjera',
    'J': 'Persona Jurídica',
    'P': 'Pasaporte',
    'G': 'Gobierno',
    'R': 'Persona Natural Residente',
    'C': 'Cédula'
  };

  validate(rif: string): RIFValidationResult {
    const errors: string[] = [];
    let isValid = false;
    let formatted = '';
    let type = '';

    if (!rif) {
      errors.push('El RIF es obligatorio');
      return { isValid: false, formatted: '', type: '', errors };
    }

    // Clean and format RIF
    const cleanRif = rif.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    
    if (cleanRif.length !== 10) {
      errors.push('El RIF debe tener exactamente 10 caracteres');
      return { isValid: false, formatted: rif, type: '', errors };
    }

    const rifType = cleanRif[0];
    const rifNumber = cleanRif.slice(1, 9);
    const checkDigit = cleanRif[9];

    // Validate RIF type
    if (!this.rifTypes[rifType as keyof typeof this.rifTypes]) {
      errors.push(`Tipo de RIF inválido: ${rifType}`);
    } else {
      type = this.rifTypes[rifType as keyof typeof this.rifTypes];
    }

    // Validate number part
    if (!/^\d{8}$/.test(rifNumber)) {
      errors.push('La parte numérica del RIF debe contener exactamente 8 dígitos');
    }

    // Validate check digit
    if (!/^\d$/.test(checkDigit)) {
      errors.push('El dígito de control debe ser un número');
    }

    // Format RIF
    formatted = `${rifType}-${rifNumber}-${checkDigit}`;

    // Calculate and validate check digit
    if (errors.length === 0) {
      const calculatedCheckDigit = this.calculateCheckDigit(rifType, rifNumber);
      if (calculatedCheckDigit.toString() !== checkDigit) {
        errors.push('El dígito de control es incorrecto');
      }
    }

    isValid = errors.length === 0;

    return { isValid, formatted, type, errors };
  }

  private calculateCheckDigit(rifType: string, rifNumber: string): number {
    const typeValues = {
      'V': 1, 'E': 2, 'J': 3, 'P': 4, 'G': 5, 'R': 6, 'C': 7
    };

    const typeValue = typeValues[rifType as keyof typeof typeValues] || 0;
    const multipliers = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = typeValue * 4; // Type weight
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(rifNumber[i]) * multipliers[i + 1];
    }

    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;

    return checkDigit;
  }

  format(rif: string): string {
    const validation = this.validate(rif);
    return validation.formatted || rif;
  }

  clean(rif: string): string {
    return rif.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  }

  isValid(rif: string): boolean {
    return this.validate(rif).isValid;
  }

  getType(rif: string): string {
    const validation = this.validate(rif);
    return validation.type;
  }

  // Batch validation for multiple RIFs
  validateBatch(rifs: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    rifs.forEach(rif => {
      if (this.isValid(rif)) {
        valid.push(this.format(rif));
      } else {
        invalid.push(rif);
      }
    });

    return { valid, invalid };
  }
}

export const rifValidator = RIFValidator.getInstance();
export default rifValidator;