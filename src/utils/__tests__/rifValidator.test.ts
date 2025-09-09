import { describe, test, expect } from 'vitest';
import { rifValidator } from '../rifValidator';

describe('RIFValidator', () => {
  describe('validate', () => {
    test('should validate correct Venezuelan RIFs', () => {
      const validRIFs = [
        'V-12345678-9',
        'J-12345678-9', 
        'E-12345678-9',
        'G-20000169-4'
      ];

      validRIFs.forEach(rif => {
        const result = rifValidator.validate(rif);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid RIF formats', () => {
      const invalidRIFs = [
        '',
        'V-1234567-9', // Too short
        'X-12345678-9', // Invalid type
        'V-12345678-A', // Invalid check digit
        'V12345678-9', // Missing dash
        'V-12345678', // Missing check digit
      ];

      invalidRIFs.forEach(rif => {
        const result = rifValidator.validate(rif);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should format RIF correctly', () => {
      const testCases = [
        { input: 'V123456789', expected: 'V-12345678-9' },
        { input: 'j123456789', expected: 'J-12345678-9' },
        { input: 'V-12345678-9', expected: 'V-12345678-9' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = rifValidator.format(input);
        expect(result).toBe(expected);
      });
    });

    test('should identify RIF type correctly', () => {
      const testCases = [
        { rif: 'V-12345678-9', expectedType: 'Persona Natural Venezolana' },
        { rif: 'J-12345678-9', expectedType: 'Persona Jurídica' },
        { rif: 'E-12345678-9', expectedType: 'Persona Natural Extranjera' },
        { rif: 'G-20000169-4', expectedType: 'Gobierno' }
      ];

      testCases.forEach(({ rif, expectedType }) => {
        const result = rifValidator.validate(rif);
        expect(result.type).toBe(expectedType);
      });
    });
  });

  describe('batch validation', () => {
    test('should validate multiple RIFs', () => {
      const rifs = ['V-12345678-9', 'J-12345678-9', 'invalid-rif', 'E-12345678-9'];
      const result = rifValidator.validateBatch(rifs);
      
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0]).toBe('invalid-rif');
    });
  });
});