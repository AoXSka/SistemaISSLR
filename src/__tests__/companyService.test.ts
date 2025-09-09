import { describe, test, expect, beforeEach, vi } from 'vitest';
import { companyService, CompanySettings } from '../services/companyService';

// Mock dependencies
vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: () => ({ username: 'admin', role: 'admin' }),
    hasRole: (role: string) => role === 'admin'
  }
}));

vi.mock('../services/auditService', () => ({
  auditService: {
    logAction: vi.fn()
  }
}));

describe('CompanyService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset company service instance
    (companyService as any).currentCompany = null;
  });

  describe('Company Configuration Persistence', () => {
    test('should initialize company settings correctly', async () => {
      const testSettings: CompanySettings = {
        rif: 'J-12345678-9',
        name: 'TEST EMPRESA, C.A.',
        address: 'Av. Test, Caracas',
        phone: '0212-1234567',
        email: 'test@empresa.com',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'ordinary',
        accountingMethod: 'accrual',
        defaultISLRPercentage: 6,
        defaultIVAPercentage: 75
      };

      const result = await companyService.initializeCompanySettings(testSettings);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject invalid RIF format', async () => {
      const invalidSettings: CompanySettings = {
        rif: 'INVALID-RIF',
        name: 'TEST EMPRESA',
        address: 'Test Address',
        phone: '123456789',
        email: 'test@test.com',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'ordinary',
        accountingMethod: 'accrual',
        defaultISLRPercentage: 6,
        defaultIVAPercentage: 75
      };

      const result = await companyService.initializeCompanySettings(invalidSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('RIF');
    });

    test('should persist and retrieve company settings', async () => {
      const testSettings: CompanySettings = {
        rif: 'J-98765432-1',
        name: 'PERSISTENCE TEST, C.A.',
        address: 'Test Persistence Address',
        phone: '0241-9876543',
        email: 'persistence@test.com',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'special',
        accountingMethod: 'cash',
        defaultISLRPercentage: 3,
        defaultIVAPercentage: 100
      };

      // Initialize settings
      await companyService.initializeCompanySettings(testSettings);
      
      // Retrieve settings
      const retrieved = await companyService.getCompanySettings();
      
      expect(retrieved).toBeTruthy();
      expect(retrieved?.rif).toBe(testSettings.rif);
      expect(retrieved?.name).toBe(testSettings.name);
      expect(retrieved?.taxRegime).toBe(testSettings.taxRegime);
      expect(retrieved?.defaultISLRPercentage).toBe(testSettings.defaultISLRPercentage);
      expect(retrieved?.defaultIVAPercentage).toBe(testSettings.defaultIVAPercentage);
    });

    test('should update specific company settings', async () => {
      // First initialize
      await companyService.initializeCompanySettings({
        rif: 'J-11111111-1',
        name: 'ORIGINAL EMPRESA',
        address: 'Original Address',
        phone: '0212-0000000',
        email: 'original@test.com',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'ordinary',
        accountingMethod: 'accrual',
        defaultISLRPercentage: 6,
        defaultIVAPercentage: 75
      });

      // Update specific fields
      const updateResult = await companyService.updateCompanySettings({
        name: 'UPDATED EMPRESA',
        phone: '0212-9999999',
        defaultISLRPercentage: 3
      });

      expect(updateResult.success).toBe(true);

      // Verify updates
      const updated = await companyService.getCompanySettings();
      expect(updated?.name).toBe('UPDATED EMPRESA');
      expect(updated?.phone).toBe('0212-9999999');
      expect(updated?.defaultISLRPercentage).toBe(3);
      // Verify unchanged fields
      expect(updated?.rif).toBe('J-11111111-1');
      expect(updated?.email).toBe('original@test.com');
      expect(updated?.defaultIVAPercentage).toBe(75);
    });
  });

  describe('Company Data Validation', () => {
    test('should validate required fields', async () => {
      const incompleteSettings = {
        rif: '',
        name: '',
        address: '',
        email: '',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'ordinary' as const,
        accountingMethod: 'accrual' as const,
        defaultISLRPercentage: 6,
        defaultIVAPercentage: 75
      };

      const result = await companyService.initializeCompanySettings(incompleteSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('obligatorios faltantes');
    });

    test('should validate email format', async () => {
      const invalidEmailSettings: CompanySettings = {
        rif: 'J-12345678-9',
        name: 'TEST EMPRESA',
        address: 'Test Address with sufficient length',
        phone: '0212-1234567',
        email: 'invalid-email-format',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'ordinary',
        accountingMethod: 'accrual',
        defaultISLRPercentage: 6,
        defaultIVAPercentage: 75
      };

      const result = await companyService.updateCompanySettings(invalidEmailSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('email inválido');
    });

    test('should validate fiscal percentages', async () => {
      const invalidPercentages: Partial<CompanySettings> = {
        defaultISLRPercentage: 150, // Invalid - over 100%
        defaultIVAPercentage: -10   // Invalid - negative
      };

      const result = await companyService.updateCompanySettings(invalidPercentages);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Porcentaje');
    });
  });

  describe('Company Configuration Status', () => {
    test('should detect unconfigured company', async () => {
      const isConfigured = await companyService.isCompanyConfigured();
      expect(isConfigured).toBe(false);
    });

    test('should detect configured company', async () => {
      await companyService.initializeCompanySettings({
        rif: 'J-55555555-5',
        name: 'CONFIGURED EMPRESA',
        address: 'Complete address for testing',
        phone: '0212-5555555',
        email: 'configured@test.com',
        fiscalYear: 2024,
        currency: 'VES',
        taxRegime: 'ordinary',
        accountingMethod: 'accrual',
        defaultISLRPercentage: 6,
        defaultIVAPercentage: 75
      });

      const isConfigured = await companyService.isCompanyConfigured();
      expect(isConfigured).toBe(true);
    });
  });

  describe('Fiscal Configuration Methods', () => {
    test('should return correct fiscal config', async () => {
      await companyService.initializeCompanySettings({
        rif: 'J-77777777-7',
        name: 'FISCAL TEST',
        address: 'Fiscal test address',
        phone: '0212-7777777',
        email: 'fiscal@test.com',
        fiscalYear: 2025,
        currency: 'USD',
        taxRegime: 'special',
        accountingMethod: 'cash',
        defaultISLRPercentage: 2,
        defaultIVAPercentage: 100
      });

      const fiscalConfig = await companyService.getFiscalConfig();
      
      expect(fiscalConfig.fiscalYear).toBe(2025);
      expect(fiscalConfig.currency).toBe('USD');
      expect(fiscalConfig.taxRegime).toBe('special');
      expect(fiscalConfig.accountingMethod).toBe('cash');
      expect(fiscalConfig.defaultISLRPercentage).toBe(2);
      expect(fiscalConfig.defaultIVAPercentage).toBe(100);
    });
  });
});