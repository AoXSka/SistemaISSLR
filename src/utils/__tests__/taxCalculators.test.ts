import { describe, test, expect } from 'vitest';
import { taxCalculators } from '../taxCalculators';

describe('TaxCalculators', () => {
  describe('ISLR Calculations', () => {
    test('should calculate ISLR for honorarios profesionales correctly', () => {
      const result = taxCalculators.calculateISLR('001', 100000, 0);
      
      expect(result.conceptCode).toBe('001');
      expect(result.conceptName).toBe('Honorarios Profesionales');
      expect(result.retentionRate).toBe(6.00);
      expect(result.baseAmount).toBe(100000);
      expect(result.taxableBase).toBe(100000);
      expect(result.retentionAmount).toBe(6000); // 6% of 100000
      expect(result.exemptAmount).toBe(0);
    });

    test('should calculate ISLR with exempt amount', () => {
      const result = taxCalculators.calculateISLR('001', 100000, 20000);
      
      expect(result.taxableBase).toBe(80000);
      expect(result.retentionAmount).toBe(4800); // 6% of 80000
      expect(result.exemptAmount).toBe(20000);
    });

    test('should throw error for invalid concept code', () => {
      expect(() => {
        taxCalculators.calculateISLR('999', 100000, 0);
      }).toThrow('Invalid ISLR concept code: 999');
    });

    test('should handle zero and negative amounts', () => {
      const result = taxCalculators.calculateISLR('001', 50000, 60000);
      
      expect(result.taxableBase).toBe(0); // Max(0, 50000 - 60000)
      expect(result.retentionAmount).toBe(0);
    });
  });

  describe('IVA Calculations', () => {
    test('should calculate IVA retention 75% correctly', () => {
      const result = taxCalculators.calculateIVA(116000, 0, 16, 75);
      
      expect(result.totalAmount).toBe(116000);
      expect(result.taxableBase).toBe(116000);
      expect(result.ivaAmount).toBe(18560); // 16% of 116000
      expect(result.retentionAmount).toBe(13920); // 75% of 18560
      expect(result.netPayment).toBe(102080); // 116000 - 13920
    });

    test('should calculate IVA retention 100% correctly', () => {
      const result = taxCalculators.calculateIVA(116000, 0, 16, 100);
      
      expect(result.retentionAmount).toBe(18560); // 100% of IVA
      expect(result.netPayment).toBe(97440); // 116000 - 18560
    });

    test('should throw error for invalid IVA rate', () => {
      expect(() => {
        taxCalculators.calculateIVA(100000, 0, 55, 75);
      }).toThrow('IVA rate must be between 0% and 50%');
    });

    test('should throw error for invalid retention rate', () => {
      expect(() => {
        taxCalculators.calculateIVA(100000, 0, 16, 80);
      }).toThrow('IVA retention rate must be 75% or 100%');
    });
  });

  describe('Fiscal Period Utilities', () => {
    test('should get current fiscal period', () => {
      const period = taxCalculators.getCurrentFiscalPeriod();
      expect(period).toMatch(/^\d{4}-\d{2}$/);
    });

    test('should check if period is open', () => {
      const currentPeriod = taxCalculators.getCurrentFiscalPeriod();
      expect(taxCalculators.isPeriodOpen(currentPeriod)).toBe(true);
      
      const oldPeriod = '2020-01';
      expect(taxCalculators.isPeriodOpen(oldPeriod)).toBe(false);
    });

    test('should generate fiscal deadlines for year', () => {
      const deadlines = taxCalculators.getFiscalDeadlines(2024);
      
      expect(deadlines.length).toBeGreaterThan(30); // Should have many deadlines
      expect(deadlines.some(d => d.type === 'IVA')).toBe(true);
      expect(deadlines.some(d => d.type === 'ISLR')).toBe(true);
    });
  });
});