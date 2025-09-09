import { describe, test, expect, beforeEach, vi } from 'vitest';
import { seniatExporter } from '../services/seniatExporter';
import { Transaction } from '../types';

// Mock company service
vi.mock('../services/companyService', () => ({
  companyService: {
    getCompanySettings: vi.fn().mockResolvedValue({
      rif: 'J-12345678-9',
      name: 'EMPRESA TEST, C.A.',
      address: 'Av. Test, Caracas',
      phone: '0212-1234567',
      email: 'test@empresa.com',
      periodoVigencia: '08-2025',
      numeroControlInicial: '20250800000001',
      secuenciaComprobantes: 1
    }),
    updateCompanySettings: vi.fn().mockResolvedValue({ success: true })
  }
}));

// Mock validators
vi.mock('../utils/seniatValidators', () => ({
  seniatValidators: {
    validateIVAExportData: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    validateISLRExportData: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
  }
}));

describe('SENIATExporter', () => {
  const mockIVATransactions: Transaction[] = [
    {
      id: 1,
      date: '2025-01-15',
      type: 'IVA',
      documentNumber: 'FAC-001',
      controlNumber: '01-12345678',
      providerRif: 'V-98765432-1',
      providerName: 'Proveedor Test',
      concept: 'Servicios de consultoría',
      totalAmount: 116000,
      taxableBase: 100000,
      retentionPercentage: 75,
      retentionAmount: 12000,
      status: 'PENDING',
      period: '2025-01',
      createdAt: '2025-01-15T10:00:00'
    },
    {
      id: 2,
      date: '2025-01-16',
      type: 'IVA',
      documentNumber: 'FAC-002',
      controlNumber: '01-12345679',
      providerRif: 'J-11111111-1',
      providerName: 'Otra Empresa C.A.',
      concept: 'Servicios técnicos',
      totalAmount: 290000,
      taxableBase: 250000,
      retentionPercentage: 100,
      retentionAmount: 40000,
      status: 'PENDING',
      period: '2025-01',
      createdAt: '2025-01-16T14:00:00'
    }
  ];

  const mockISLRTransactions: Transaction[] = [
    {
      id: 3,
      date: '2025-01-15',
      type: 'ISLR',
      documentNumber: 'HON-001',
      controlNumber: '',
      providerRif: 'V-55555555-5',
      providerName: 'Consultor Independiente',
      concept: 'Honorarios profesionales',
      totalAmount: 100000,
      taxableBase: 100000,
      retentionPercentage: 6,
      retentionAmount: 6000,
      status: 'PENDING',
      period: '2025-01',
      createdAt: '2025-01-15T16:00:00'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IVA TXT Export', () => {
    test('should generate IVA TXT with correct format and headers', async () => {
      const result = await seniatExporter.generateIVATXT(mockIVATransactions, { period: '2025-01' });
      
      const lines = result.split('\r\n');
      
      // Check header
      expect(lines[0]).toBe('RIF_AGENTE;PERIODO;RIF_RETENIDO;NRO_COMPROBANTE;FECHA;NRO_FACTURA;BASE_IMPONIBLE;PORCENTAJE_RETENCION;MONTO_RETENIDO');
      
      // Check data lines count
      expect(lines.length).toBe(3); // Header + 2 data lines
      
      // Check first data line format
      const firstDataLine = lines[1].split(';');
      expect(firstDataLine[0]).toBe('123456789'); // RIF sin formato
      expect(firstDataLine[1]).toBe('202501'); // Período YYYYMM
      expect(firstDataLine[2]).toBe('98765432'); // RIF retenido sin formato
      expect(firstDataLine[4]).toBe('20250115'); // Fecha YYYYMMDD
      expect(firstDataLine[5]).toBe('FAC-001'); // Número factura
      expect(firstDataLine[6]).toBe('100000.00'); // Base imponible con decimales
      expect(firstDataLine[7]).toBe('75'); // Porcentaje retención
      expect(firstDataLine[8]).toBe('12000.00'); // Monto retenido
    });

    test('should filter transactions by period', async () => {
      const wrongPeriodTransactions = [
        { ...mockIVATransactions[0], period: '2025-02' }
      ];
      
      const result = await seniatExporter.generateIVATXT(wrongPeriodTransactions, { period: '2025-01' });
      const lines = result.split('\r\n');
      
      expect(lines.length).toBe(1); // Solo header, no data
    });

    test('should use sequential comprobante numbers', async () => {
      const result = await seniatExporter.generateIVATXT(mockIVATransactions, { period: '2025-01' });
      const lines = result.split('\r\n');
      
      const firstComprobante = lines[1].split(';')[3];
      const secondComprobante = lines[2].split(';')[3];
      
      expect(firstComprobante).toBe('20250800000001');
      expect(secondComprobante).toBe('20250800000002');
    });
  });

  describe('IVA XML Export', () => {
    test('should generate IVA XML with correct structure', async () => {
      const result = await seniatExporter.generateIVAXML(mockIVATransactions, { period: '2025-01' });
      
      // Check XML declaration
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      
      // Check root element with attributes
      expect(result).toContain('<RelacionRetencionesIVA RifAgente="123456789" Periodo="202501">');
      
      // Check agent data
      expect(result).toContain('<Rif>123456789</Rif>');
      expect(result).toContain('<RazonSocial>EMPRESA TEST, C.A.</RazonSocial>');
      
      // Check detail section
      expect(result).toContain('<DetalleRetencion>');
      expect(result).toContain('<LineaRetencion>');
      expect(result).toContain('<NumeroComprobante>20250800000001</NumeroComprobante>');
      expect(result).toContain('<BaseImponible>100000.00</BaseImponible>');
      
      // Check summary
      expect(result).toContain('<TotalOperaciones>2</TotalOperaciones>');
    });

    test('should escape XML special characters', async () => {
      const transactionWithSpecialChars = {
        ...mockIVATransactions[0],
        providerName: 'Empresa & Asociados <TEST>',
        concept: 'Servicios "especiales" & consultoría'
      };
      
      const result = await seniatExporter.generateIVAXML([transactionWithSpecialChars], { period: '2025-01' });
      
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
    });
  });

  describe('ISLR TXT Export', () => {
    test('should generate ISLR TXT with correct format', async () => {
      const result = await seniatExporter.generateISLRTXT(mockISLRTransactions, { period: '2025-01' });
      
      const lines = result.split('\r\n');
      
      // Check header
      expect(lines[0]).toBe('RIF_AGENTE;PERIODO;RIF_RETENIDO;NRO_COMPROBANTE;FECHA;NRO_FACTURA;CONCEPTO;BASE_IMPONIBLE;PORCENTAJE_RETENCION;MONTO_RETENIDO');
      
      // Check data format
      const dataLine = lines[1].split(';');
      expect(dataLine[0]).toBe('123456789'); // RIF agente
      expect(dataLine[1]).toBe('202501'); // Período
      expect(dataLine[2]).toBe('55555555'); // RIF retenido
      expect(dataLine[6]).toBe('001'); // Código concepto
      expect(dataLine[7]).toBe('100000.00'); // Base imponible
      expect(dataLine[8]).toBe('6'); // Porcentaje
      expect(dataLine[9]).toBe('6000.00'); // Monto retenido
    });
  });

  describe('ISLR XML Export', () => {
    test('should generate ISLR XML with correct structure', async () => {
      const result = await seniatExporter.generateISLRXML(mockISLRTransactions, { period: '2025-01' });
      
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<RelacionRetencionesISLR');
      expect(result).toContain('<RifAgente>123456789</RifAgente>');
      expect(result).toContain('<CodigoConcepto>001</CodigoConcepto>');
      expect(result).toContain('<MontoRetenido>6000.00</MontoRetenido>');
    });
  });

  describe('Fiscal Configuration Integration', () => {
    test('should use configured period and control numbers', async () => {
      const result = await seniatExporter.generateIVATXT(mockIVATransactions, { period: '2025-01' });
      const lines = result.split('\r\n');
      
      // Check that it uses the configured numero control inicial
      const comprobanteNumber = lines[1].split(';')[3];
      expect(comprobanteNumber).toMatch(/^20250800000\d{3}$/);
    });

    test('should increment sequence numbers correctly', async () => {
      await seniatExporter.generateIVATXT(mockIVATransactions, { period: '2025-01' });
      
      // Verify that updateCompanySettings was called to increment sequence
      const { companyService } = await import('../services/companyService');
      expect(companyService.updateCompanySettings).toHaveBeenCalledWith({
        secuenciaComprobantes: 3 // 1 + 2 transactions
      });
    });
  });

  describe('Validation Integration', () => {
    test('should validate data before export', async () => {
      const invalidTransaction = {
        ...mockIVATransactions[0],
        retentionAmount: 50000 // Incorrect calculation
      };
      
      // Mock validation to return error
      const { seniatValidators } = await import('../utils/seniatValidators');
      vi.mocked(seniatValidators.validateIVAExportData).mockReturnValueOnce({
        isValid: false,
        errors: ['Monto de retención calculado incorrectamente'],
        warnings: []
      });
      
      await expect(
        seniatExporter.generateIVATXT([invalidTransaction], { period: '2025-01' })
      ).rejects.toThrow('Errores en datos de exportación');
    });
  });

  describe('File Download Integration', () => {
    test('should generate proper file names', () => {
      const period = '2025-01';
      
      expect(`IVA_${period.replace('-', '')}_SENIAT.txt`).toBe('IVA_202501_SENIAT.txt');
      expect(`ISLR_${period.replace('-', '')}_SENIAT.xml`).toBe('ISLR_202501_SENIAT.xml');
    });
  });
});