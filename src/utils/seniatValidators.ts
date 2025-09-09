// SENIAT-specific validation utilities for Venezuelan tax compliance

export interface SENIATValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SENIATValidators {
  private static instance: SENIATValidators;

  static getInstance(): SENIATValidators {
    if (!SENIATValidators.instance) {
      SENIATValidators.instance = new SENIATValidators();
    }
    return SENIATValidators.instance;
  }

  // Validate document number format for invoices
  validateDocumentNumber(documentNumber: string, documentType: string = '01'): SENIATValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!documentNumber) {
      errors.push('Número de documento es requerido');
      return { isValid: false, errors, warnings };
    }

    // Basic format validation
    if (documentNumber.length < 3) {
      errors.push('Número de documento debe tener al menos 3 caracteres');
    }

    // Check for invalid characters
    if (!/^[A-Z0-9\-]+$/i.test(documentNumber)) {
      warnings.push('El número de documento contiene caracteres especiales');
    }

    // Type-specific validations
    switch (documentType) {
      case '01': // Factura
        if (!documentNumber.toUpperCase().includes('FAC')) {
          warnings.push('Las facturas generalmente incluyen "FAC" en el número');
        }
        break;
      case '02': // Nota de Débito
        if (!documentNumber.toUpperCase().includes('ND')) {
          warnings.push('Las notas de débito generalmente incluyen "ND" en el número');
        }
        break;
      case '03': // Nota de Crédito
        if (!documentNumber.toUpperCase().includes('NC')) {
          warnings.push('Las notas de crédito generalmente incluyen "NC" en el número');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate control number format
  validateControlNumber(controlNumber: string): SENIATValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!controlNumber) {
      warnings.push('Número de control recomendado para trazabilidad fiscal');
      return { isValid: true, errors, warnings };
    }

    // Format validation (typically XX-XXXXXXXX)
    const controlPattern = /^\d{2}-\d{8}$/;
    if (!controlPattern.test(controlNumber)) {
      errors.push('Formato de número de control inválido (debe ser XX-XXXXXXXX)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate IVA export data for SENIAT TXT format
  validateIVAExportData(transactions: Array<{
    documentNumber: string;
    controlNumber?: string;
    date: string;
    providerRif: string;
    totalAmount: number;
    taxableBase: number;
    retentionAmount: number;
    retentionPercentage: number;
  }>): SENIATValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    transactions.forEach((transaction, index) => {
      const lineNumber = index + 1;

      // Document number validation
      const docValidation = this.validateDocumentNumber(transaction.documentNumber);
      if (!docValidation.isValid) {
        errors.push(`Línea ${lineNumber}: ${docValidation.errors.join(', ')}`);
      }

      // RIF validation
      if (!this.isValidRIF(transaction.providerRif)) {
        errors.push(`Línea ${lineNumber}: RIF del proveedor inválido`);
      }

      // Date validation
      if (!this.isValidDate(transaction.date)) {
        errors.push(`Línea ${lineNumber}: Fecha inválida`);
      }

      // Amount validations
      if (transaction.totalAmount <= 0) {
        errors.push(`Línea ${lineNumber}: Monto total debe ser mayor a 0`);
      }

      if (transaction.taxableBase < 0) {
        errors.push(`Línea ${lineNumber}: Base imponible no puede ser negativa`);
      }

      if (transaction.taxableBase > transaction.totalAmount) {
        warnings.push(`Línea ${lineNumber}: Base imponible mayor al monto total`);
      }

      // Retention validation
      if (transaction.retentionPercentage !== 75 && transaction.retentionPercentage !== 100) {
        errors.push(`Línea ${lineNumber}: Porcentaje de retención debe ser 75% o 100%`);
      }

      // Calculate expected retention
      const expectedIVA = transaction.taxableBase * 0.16;
      const expectedRetention = expectedIVA * (transaction.retentionPercentage / 100);
      const retentionDiff = Math.abs(expectedRetention - transaction.retentionAmount);
      
      if (retentionDiff > 0.01) { // Allow for rounding differences
        errors.push(`Línea ${lineNumber}: Monto de retención calculado incorrectamente`);
      }

      // Control number validation
      if (transaction.controlNumber) {
        const controlValidation = this.validateControlNumber(transaction.controlNumber);
        if (!controlValidation.isValid) {
          warnings.push(`Línea ${lineNumber}: ${controlValidation.errors.join(', ')}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate ISLR export data for SENIAT XML/TXT format
  validateISLRExportData(transactions: Array<{
    documentNumber: string;
    date: string;
    providerRif: string;
    conceptCode: string;
    baseAmount: number;
    retentionAmount: number;
    retentionPercentage: number;
  }>): SENIATValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    transactions.forEach((transaction, index) => {
      const lineNumber = index + 1;

      // Document number validation
      const docValidation = this.validateDocumentNumber(transaction.documentNumber);
      if (!docValidation.isValid) {
        errors.push(`Línea ${lineNumber}: ${docValidation.errors.join(', ')}`);
      }

      // RIF validation
      if (!this.isValidRIF(transaction.providerRif)) {
        errors.push(`Línea ${lineNumber}: RIF del proveedor inválido`);
      }

      // Date validation
      if (!this.isValidDate(transaction.date)) {
        errors.push(`Línea ${lineNumber}: Fecha inválida`);
      }

      // ISLR concept validation
      if (!this.isValidISLRConcept(transaction.conceptCode)) {
        errors.push(`Línea ${lineNumber}: Código de concepto ISLR inválido`);
      }

      // Amount validations
      if (transaction.baseAmount <= 0) {
        errors.push(`Línea ${lineNumber}: Base imponible debe ser mayor a 0`);
      }

      if (transaction.retentionAmount <= 0) {
        errors.push(`Línea ${lineNumber}: Monto de retención debe ser mayor a 0`);
      }

      // Retention percentage validation
      if (!this.isValidISLRRate(transaction.conceptCode, transaction.retentionPercentage)) {
        errors.push(`Línea ${lineNumber}: Porcentaje de retención no corresponde al concepto`);
      }

      // Calculate expected retention
      const expectedRetention = (transaction.baseAmount * transaction.retentionPercentage) / 100;
      const retentionDiff = Math.abs(expectedRetention - transaction.retentionAmount);
      
      if (retentionDiff > 0.01) {
        errors.push(`Línea ${lineNumber}: Monto de retención calculado incorrectamente`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate period format and business rules
  validatePeriod(period: string): SENIATValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Format validation (YYYY-MM)
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!periodRegex.test(period)) {
      errors.push('Formato de período inválido (debe ser YYYY-MM)');
      return { isValid: false, errors, warnings };
    }

    const [year, month] = period.split('-').map(Number);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Year validation
    if (year < 2020 || year > currentYear + 1) {
      errors.push('Año fiscal fuera del rango permitido');
    }

    // Future period validation
    if (year > currentYear || (year === currentYear && month > currentMonth + 1)) {
      warnings.push('Período fiscal está en el futuro');
    }

    // Past period validation (older than 5 years)
    if (year < currentYear - 5) {
      warnings.push('Período fiscal muy antiguo - verifique normativas aplicables');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate company data for official documents
  validateCompanyData(company: {
    rif: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
  }): SENIATValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // RIF validation
    if (!this.isValidRIF(company.rif)) {
      errors.push('RIF de la empresa inválido');
    }

    // Required fields
    if (!company.name || company.name.length < 3) {
      errors.push('Nombre de empresa debe tener al menos 3 caracteres');
    }

    if (!company.address || company.address.length < 10) {
      errors.push('Dirección debe ser más específica (mínimo 10 caracteres)');
    }

    // Optional field validations
    if (company.email && !this.isValidEmail(company.email)) {
      warnings.push('Formato de email corporativo inválido');
    }

    if (company.phone && !this.isValidVenezuelanPhone(company.phone)) {
      warnings.push('Formato de teléfono venezolano inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Private helper methods
  private isValidRIF(rif: string): boolean {
    const rifPattern = /^[VEJGPGRC]-\d{8}-\d$/;
    return rifPattern.test(rif);
  }

  private isValidDate(date: string): boolean {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime()) && date.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  private isValidVenezuelanPhone(phone: string): boolean {
    const phonePattern = /^(\+58-?)?0?(2\d{2}|4\d{2}|5\d{2})-?\d{7}$/;
    return phonePattern.test(phone);
  }

  private isValidISLRConcept(conceptCode: string): boolean {
    const validConcepts = ['001', '002', '003', '004', '005', '006', '007', '008'];
    return validConcepts.includes(conceptCode);
  }

  private isValidISLRRate(conceptCode: string, rate: number): boolean {
    const conceptRates = {
      '001': 6, '002': 3, '003': 2, '004': 3,
      '005': 2, '006': 2, '007': 6, '008': 3
    };
    return conceptRates[conceptCode as keyof typeof conceptRates] === rate;
  }
}

export const seniatValidators = SENIATValidators.getInstance();