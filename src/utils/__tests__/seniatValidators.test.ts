import { describe, test, expect } from 'vitest';
import { seniatValidators } from '../seniatValidators';

describe('SENIATValidators', () => {
  describe('validateDocumentNumber', () => {
    test('should validate correct document numbers', () => {
      const validDocNumbers = ['FAC-001234', 'FAC001234', 'NF-2024-001'];
      
      validDocNumbers.forEach(docNum => {
        const result = seniatValidators.validateDocumentNumber(docNum);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid document numbers', () => {
      const invalidDocNumbers = ['', 'AB', '12@#$%'];
      
      invalidDocNumbers.forEach(docNum => {
        const result = seniatValidators.validateDocumentNumber(docNum);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateIVAExportData', () => {
    test('should validate correct IVA export data', () => {
      const transactions = [{
        documentNumber: 'FAC-001234',
        controlNumber: '01-12345678',
        date: '2024-12-01',
        providerRif: 'V-12345678-9',
        totalAmount: 116000,
        taxableBase: 100000,
        retentionAmount: 12000,
        retentionPercentage: 75
      }];
      
      const result = seniatValidators.validateIVAExportData(transactions);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid retention calculations', () => {
      const transactions = [{
        documentNumber: 'FAC-001234',
        controlNumber: '01-12345678',
        date: '2024-12-01',
        providerRif: 'V-12345678-9',
        totalAmount: 116000,
        taxableBase: 100000,
        retentionAmount: 5000, // Incorrect calculation
        retentionPercentage: 75
      }];
      
      const result = seniatValidators.validateIVAExportData(transactions);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('calculado incorrectamente'))).toBe(true);
    });
  });

  describe('validateCompanyData', () => {
    test('should validate complete company data', () => {
      const company = {
        rif: 'J-12345678-9',
        name: 'Empresa Demo C.A.',
        address: 'Av. Principal, Torre Ejecutiva, Caracas',
        phone: '0212-1234567',
        email: 'contacto@empresa.com'
      };
      
      const result = seniatValidators.validateCompanyData(company);
      expect(result.isValid).toBe(true);
    });

    test('should reject incomplete company data', () => {
      const company = {
        rif: 'invalid-rif',
        name: 'AB', // Too short
        address: 'Short', // Too short
        phone: '123', // Invalid format
        email: 'invalid-email'
      };
      
      const result = seniatValidators.validateCompanyData(company);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});