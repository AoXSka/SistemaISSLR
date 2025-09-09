// Venezuelan-specific formatters for dates, currency, and official documents

export class VenezuelanFormatters {
  private static instance: VenezuelanFormatters;

  static getInstance(): VenezuelanFormatters {
    if (!VenezuelanFormatters.instance) {
      VenezuelanFormatters.instance = new VenezuelanFormatters();
    }
    return VenezuelanFormatters.instance;
  }

  // Currency formatting for Venezuelan Bolívars
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Number formatting with Venezuelan decimal separators
  formatNumber(number: number, decimals: number = 2): string {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }

  // Date formatting for Venezuelan official documents
  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  }

  // Long date format for official documents
  formatLongDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  }

  // Period formatting for SENIAT (YYYYMM)
  formatPeriodForSENIAT(period: string): string {
    return period.replace('-', '');
  }

  // Date formatting for SENIAT exports (YYYYMMDD)
  formatDateForSENIAT(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // Amount formatting for SENIAT (Venezuelan decimal with comma)
  formatAmountForSENIAT(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }

  // Clean text for SENIAT exports (remove special characters)
  cleanTextForSENIAT(text: string, maxLength: number = 60): string {
    return text
      .normalize('NFD') // Normalize unicode
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .trim()
      .substring(0, maxLength)
      .toUpperCase();
  }

  // Parse Venezuelan date format (DD/MM/YYYY)
  parseVenezuelanDate(dateStr: string): Date | null {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    
    // Validate the date
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }

    return date;
  }

  // Format percentage for Venezuelan documents
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  // Format phone number for Venezuela
  formatVenezuelanPhone(phone: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (cleanPhone.startsWith('58')) {
      // International format
      const nationalNumber = cleanPhone.slice(2);
      return `+58-${nationalNumber.slice(0, 3)}-${nationalNumber.slice(3)}`;
    } else if (cleanPhone.startsWith('0')) {
      // National format
      return `${cleanPhone.slice(0, 4)}-${cleanPhone.slice(4)}`;
    }
    
    return phone;
  }

  // Generate sequential document numbers
  generateDocumentNumber(prefix: string, sequence: number): string {
    return `${prefix}-${sequence.toString().padStart(6, '0')}`;
  }

  // Format control number for Venezuelan invoices
  formatControlNumber(controlNumber: string): string {
    const cleaned = controlNumber.replace(/[^0-9]/g, '');
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }
    return controlNumber;
  }

  // Validate and format Venezuelan ID (Cédula)
  formatCedula(cedula: string): string {
    const cleanCedula = cedula.replace(/[^0-9]/g, '');
    if (cleanCedula.length >= 7) {
      return `V-${cleanCedula}`;
    }
    return cedula;
  }

  // Format business name for official documents
  formatBusinessName(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Validate Venezuelan fiscal period
  validateFiscalPeriod(period: string): boolean {
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    return periodRegex.test(period);
  }

  // Convert amount to words (for checks and official documents)
  amountToWords(amount: number): string {
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    const [integerPart, decimalPart] = amount.toFixed(2).split('.');
    const integer = parseInt(integerPart);

    if (integer === 0) {
      return `cero bolívares con ${decimalPart}/100`;
    }

    const convertNumber = (num: number): string => {
      if (num === 0) return '';
      if (num < 10) return units[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) {
        const tensDigit = Math.floor(num / 10);
        const unitsDigit = num % 10;
        return tens[tensDigit] + (unitsDigit > 0 ? ` y ${units[unitsDigit]}` : '');
      }
      if (num < 1000) {
        const hundredsDigit = Math.floor(num / 100);
        const remainder = num % 100;
        return hundreds[hundredsDigit] + (remainder > 0 ? ` ${convertNumber(remainder)}` : '');
      }
      // Handle thousands, millions, etc. (simplified for this use case)
      return num.toLocaleString('es-VE');
    };

    const words = convertNumber(integer);
    return `${words} bolívares con ${decimalPart}/100`;
  }
}

export const venezuelanFormatters = VenezuelanFormatters.getInstance();