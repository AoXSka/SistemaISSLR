// Venezuelan tax calculation utilities for ISLR and IVA

export interface ISLRCalculation {
  conceptCode: string;
  conceptName: string;
  baseAmount: number;
  retentionRate: number;
  retentionAmount: number;
  exemptAmount: number;
  taxableBase: number;
}

export interface IVACalculation {
  totalAmount: number;
  exemptAmount: number;
  taxableBase: number;
  ivaRate: number;
  ivaAmount: number;
  retentionRate: number;
  retentionAmount: number;
  netPayment: number;
}

export class TaxCalculators {
  private static instance: TaxCalculators;

  static getInstance(): TaxCalculators {
    if (!TaxCalculators.instance) {
      TaxCalculators.instance = new TaxCalculators();
    }
    return TaxCalculators.instance;
  }

  // Official ISLR concepts from SENIAT
  private readonly islrConcepts = {
    '001': { name: 'Honorarios Profesionales', rate: 6.00, description: 'Servicios profesionales independientes' },
    '002': { name: 'Servicios Técnicos', rate: 3.00, description: 'Servicios técnicos especializados' },
    '003': { name: 'Servicios de Construcción', rate: 2.00, description: 'Servicios relacionados con construcción' },
    '004': { name: 'Servicios de Publicidad', rate: 3.00, description: 'Servicios de publicidad y marketing' },
    '005': { name: 'Servicios de Limpieza', rate: 2.00, description: 'Servicios de aseo y limpieza' },
    '006': { name: 'Servicios de Transporte', rate: 2.00, description: 'Servicios de transporte de carga y pasajeros' },
    '007': { name: 'Arrendamientos', rate: 6.00, description: 'Alquiler de bienes muebles e inmuebles' },
    '008': { name: 'Servicios de Informática', rate: 3.00, description: 'Desarrollo y mantenimiento de software' }
  };

  // Calculate ISLR retention
  calculateISLR(
    conceptCode: string,
    baseAmount: number,
    exemptAmount: number = 0
  ): ISLRCalculation {
    const concept = this.islrConcepts[conceptCode as keyof typeof this.islrConcepts];
    
    if (!concept) {
      throw new Error(`Invalid ISLR concept code: ${conceptCode}`);
    }

    const taxableBase = Math.max(0, baseAmount - exemptAmount);
    const retentionAmount = (taxableBase * concept.rate) / 100;

    return {
      conceptCode,
      conceptName: concept.name,
      baseAmount,
      retentionRate: concept.rate,
      retentionAmount,
      exemptAmount,
      taxableBase
    };
  }

  // Calculate IVA retention
  calculateIVA(
    totalAmount: number,
    exemptAmount: number = 0,
    ivaRate: number = 16,
    retentionRate: number = 75
  ): IVACalculation {
    if (ivaRate < 0 || ivaRate > 50) {
      throw new Error('IVA rate must be between 0% and 50%');
    }

    if (retentionRate !== 75 && retentionRate !== 100) {
      throw new Error('IVA retention rate must be 75% or 100%');
    }

    // CORRECCIÓN CRÍTICA: Calcular base imponible correctamente
    // Si totalAmount incluye IVA: base = total / (1 + tasa_iva)
    // Si totalAmount es neto: base = total - exentos
    const netAmount = totalAmount / (1 + (ivaRate / 100));
    const taxableBase = this.roundToTwoDecimals(Math.max(0, netAmount - exemptAmount));
    const ivaAmount = this.roundToTwoDecimals((taxableBase * ivaRate) / 100);
    const retentionAmount = this.roundToTwoDecimals((ivaAmount * retentionRate) / 100);
    const netPayment = this.roundToTwoDecimals(totalAmount - retentionAmount);
    
    // VALIDACIÓN DE COHERENCIA CONTABLE
    const calculatedTotal = this.roundToTwoDecimals(taxableBase + ivaAmount + exemptAmount);
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.warn(`⚠️ IVA Calculation Warning: Total mismatch. Expected: ${totalAmount}, Calculated: ${calculatedTotal}`);
    }

    return {
      totalAmount: this.roundToTwoDecimals(totalAmount),
      exemptAmount: this.roundToTwoDecimals(exemptAmount),
      taxableBase,
      ivaRate,
      ivaAmount,
      retentionRate,
      retentionAmount,
      netPayment
    };
  }

  // NUEVO: Función de redondeo contable estándar
  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // NUEVO: Validador de coherencia contable
  validateAccountingCoherence(data: {
    base: number;
    iva: number;
    exempt: number;
    total: number;
    retention: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const calculatedTotal = this.roundToTwoDecimals(data.base + data.iva + data.exempt);
    
    // Validar que base + iva + exento = total
    if (Math.abs(calculatedTotal - data.total) > 0.01) {
      errors.push(`Total incoherente: Base(${data.base}) + IVA(${data.iva}) + Exento(${data.exempt}) = ${calculatedTotal} ≠ Total(${data.total})`);
    }
    
    // Validar que retención no exceda IVA
    if (data.retention > data.iva + 0.01) {
      errors.push(`Retención(${data.retention}) no puede ser mayor que IVA(${data.iva})`);
    }
    
    // Validar valores no negativos
    if (data.base < 0 || data.iva < 0 || data.exempt < 0 || data.total < 0 || data.retention < 0) {
      errors.push('Los montos contables no pueden ser negativos');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get all available ISLR concepts
  getISLRConcepts(): Array<{ code: string; name: string; rate: number; description: string }> {
    return Object.entries(this.islrConcepts).map(([code, data]) => ({
      code,
      name: data.name,
      rate: data.rate,
      description: data.description
    }));
  }

  // Get ISLR concept by code
  getISLRConcept(code: string): { name: string; rate: number; description: string } | null {
    const concept = this.islrConcepts[code as keyof typeof this.islrConcepts];
    return concept || null;
  }

  // Validate retention percentages according to Venezuelan law
  validateISLRRate(conceptCode: string, rate: number): boolean {
    const concept = this.getISLRConcept(conceptCode);
    return concept ? concept.rate === rate : false;
  }

  validateIVARetentionRate(rate: number): boolean {
    return rate === 75 || rate === 100;
  }

  // Calculate annual ISLR summary for declarations
  calculateAnnualISLRSummary(transactions: Array<{
    conceptCode: string;
    baseAmount: number;
    retentionAmount: number;
    date: string;
  }>): {
    totalBase: number;
    totalRetained: number;
    conceptBreakdown: Record<string, { count: number; base: number; retained: number }>;
    quarterlyTotals: Record<string, { base: number; retained: number }>;
  } {
    const conceptBreakdown: Record<string, { count: number; base: number; retained: number }> = {};
    const quarterlyTotals: Record<string, { base: number; retained: number }> = {
      'Q1': { base: 0, retained: 0 },
      'Q2': { base: 0, retained: 0 },
      'Q3': { base: 0, retained: 0 },
      'Q4': { base: 0, retained: 0 }
    };

    let totalBase = 0;
    let totalRetained = 0;

    transactions.forEach(transaction => {
      const quarter = this.getQuarterFromDate(transaction.date);
      
      // Concept breakdown
      if (!conceptBreakdown[transaction.conceptCode]) {
        conceptBreakdown[transaction.conceptCode] = { count: 0, base: 0, retained: 0 };
      }
      
      conceptBreakdown[transaction.conceptCode].count++;
      conceptBreakdown[transaction.conceptCode].base += transaction.baseAmount;
      conceptBreakdown[transaction.conceptCode].retained += transaction.retentionAmount;

      // Quarterly totals
      quarterlyTotals[quarter].base += transaction.baseAmount;
      quarterlyTotals[quarter].retained += transaction.retentionAmount;

      // Annual totals
      totalBase += transaction.baseAmount;
      totalRetained += transaction.retentionAmount;
    });

    return {
      totalBase,
      totalRetained,
      conceptBreakdown,
      quarterlyTotals
    };
  }

  // Calculate monthly IVA summary for declarations
  calculateMonthlyIVASummary(transactions: Array<{
    totalAmount: number;
    taxableBase: number;
    ivaAmount: number;
    retentionAmount: number;
    exemptAmount: number;
    documentType: string;
  }>): {
    totalPurchases: number;
    totalTaxableBase: number;
    totalIVA: number;
    totalRetained: number;
    totalExempt: number;
    documentTypeBreakdown: Record<string, number>;
    netIVAToPay: number;
  } {
    const documentTypeBreakdown: Record<string, number> = {};
    
    const summary = transactions.reduce((acc, transaction) => {
      // Document type breakdown
      documentTypeBreakdown[transaction.documentType] = 
        (documentTypeBreakdown[transaction.documentType] || 0) + 1;

      return {
        totalPurchases: acc.totalPurchases + transaction.totalAmount,
        totalTaxableBase: acc.totalTaxableBase + transaction.taxableBase,
        totalIVA: acc.totalIVA + transaction.ivaAmount,
        totalRetained: acc.totalRetained + transaction.retentionAmount,
        totalExempt: acc.totalExempt + transaction.exemptAmount
      };
    }, {
      totalPurchases: 0,
      totalTaxableBase: 0,
      totalIVA: 0,
      totalRetained: 0,
      totalExempt: 0
    });

    // Net IVA to pay (IVA generated - IVA retained)
    const netIVAToPay = Math.max(0, summary.totalIVA - summary.totalRetained);

    return {
      ...summary,
      documentTypeBreakdown,
      netIVAToPay
    };
  }

  private getQuarterFromDate(date: string): string {
    const month = new Date(date).getMonth() + 1; // 1-indexed
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  }

  // Venezuelan tax year utilities
  getCurrentFiscalYear(): number {
    return new Date().getFullYear();
  }

  getCurrentFiscalPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  // Check if a period is still open for modifications
  isPeriodOpen(period: string): boolean {
    const [year, month] = period.split('-').map(Number);
    const periodDate = new Date(year, month - 1, 1);
    const now = new Date();
    
    // Period is open if it's current or next month
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    return periodDate < cutoffDate;
  }

  // Get fiscal deadlines for Venezuelan taxes
  getFiscalDeadlines(year?: number): Array<{
    date: string;
    description: string;
    type: 'ISLR' | 'IVA' | 'GENERAL';
  }> {
    const fiscalYear = year || new Date().getFullYear();
    const deadlines = [];
    
    // Monthly IVA deadlines (15th of each month)
    for (let month = 1; month <= 12; month++) {
      deadlines.push({
        date: `${fiscalYear}-${month.toString().padStart(2, '0')}-15`,
        description: `Declaración IVA ${this.getMonthName(month - 1)}`,
        type: 'IVA' as const
      });
    }

    // ISLR deadlines (15th and last day of each month)
    for (let month = 1; month <= 12; month++) {
      deadlines.push({
        date: `${fiscalYear}-${month.toString().padStart(2, '0')}-15`,
        description: `Pago ISLR 1ra quincena ${this.getMonthName(month - 1)}`,
        type: 'ISLR' as const
      });
      
      const lastDay = new Date(fiscalYear, month, 0).getDate();
      deadlines.push({
        date: `${fiscalYear}-${month.toString().padStart(2, '0')}-${lastDay}`,
        description: `Pago ISLR 2da quincena ${this.getMonthName(month - 1)}`,
        type: 'ISLR' as const
      });
    }

    // Annual ISLR declaration
    deadlines.push({
      date: `${fiscalYear + 1}-01-31`,
      description: `Declaración Anual ISLR ${fiscalYear}`,
      type: 'ISLR' as const
    });

    return deadlines.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getMonthName(monthIndex: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  }
}

export const taxCalculators = TaxCalculators.getInstance();