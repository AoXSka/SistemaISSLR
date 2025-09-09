import { describe, test, expect, vi } from 'vitest';
import { pdfGenerator } from '../pdfGenerator';
import { Transaction, Provider, CompanyInfo } from '../../types';

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn().mockReturnValue(new Blob(['mock-pdf'], { type: 'application/pdf' }))
  }))
}));

describe('PDFGenerator', () => {
  const mockTransaction: Transaction = {
    id: 1,
    date: '2024-12-01',
    type: 'ISLR',
    documentNumber: 'FAC-001234',
    controlNumber: '01-12345678',
    providerRif: 'V-12345678-9',
    providerName: 'Juan Pérez',
    concept: 'Servicios de Consultoría',
    totalAmount: 150000,
    taxableBase: 150000,
    retentionPercentage: 6,
    retentionAmount: 9000,
    status: 'PENDING',
    period: '2024-12',
    createdAt: '2024-12-01T10:00:00'
  };

  const mockProvider: Provider = {
    id: 1,
    rif: 'V-12345678-9',
    name: 'Juan Pérez',
    address: 'Calle Principal, Valencia',
    phone: '0241-1234567',
    email: 'juan@email.com',
    contactPerson: 'Juan Pérez',
    retentionISLRPercentage: 6,
    retentionIVAPercentage: 75,
    createdAt: '2024-01-01'
  };

  const mockCompany: CompanyInfo = {
    rif: 'J-12345678-9',
    name: 'Empresa Demo C.A.',
    address: 'Av. Principal, Caracas',
    phone: '0212-1234567',
    email: 'contacto@empresa.com'
  };

  describe('generateISLRVoucher', () => {
    test('should generate ISLR voucher PDF', async () => {
      const result = await pdfGenerator.generateISLRVoucher(
        mockTransaction,
        mockProvider,
        mockCompany,
        '202400001'
      );

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });
  });

  describe('generateIVAVoucher', () => {
    test('should generate IVA voucher PDF', async () => {
      const ivaTransaction = { ...mockTransaction, type: 'IVA' as const };
      
      const result = await pdfGenerator.generateIVAVoucher(
        ivaTransaction,
        mockProvider,
        mockCompany,
        '202400001'
      );

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });
  });

  describe('generateLedgerReport', () => {
    test('should generate ledger report PDF', async () => {
      const transactions = [mockTransaction];
      
      const result = await pdfGenerator.generateLedgerReport(
        transactions,
        '2024-12',
        mockCompany
      );

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });
  });
});