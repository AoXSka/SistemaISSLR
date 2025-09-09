import { Transaction, Provider } from '../types';
import { licenseService } from './licenseService';
import { formatDate } from '../utils/formatters';
import { seniatValidators } from '../utils/seniatValidators';
import { companyDataProvider } from '../utils/companyDataProvider';

export interface SENIATExportOptions {
  period: string;
}

export class SENIATExporter {
  private static instance: SENIATExporter;

  static getInstance(): SENIATExporter {
    if (!SENIATExporter.instance) {
      SENIATExporter.instance = new SENIATExporter();
    }
    return SENIATExporter.instance;
  }

  // Generar exportación IVA TXT (16 columnas A-P) formato oficial SENIAT
  async generateIVATXT(transactions: Transaction[], options: SENIATExportOptions): Promise<string> {
    try {
      // Check license permissions for SENIAT exports
      if (!licenseService.hasFeature('seniat_exports')) {
        const message = 'Las exportaciones SENIAT no están disponibles en su licencia actual.';
        console.log('🔒 SENIAT export blocked by license');
        throw new Error(message);
      }
      
      // Load company data for SENIAT exports - MUST use configured data
      const companyData = await companyDataProvider.getCompanyForSENIAT();
      
      if (!companyData?.agentRif || !companyData?.agentName) {
        throw new Error('Complete la configuración de empresa antes de exportar datos SENIAT');
      }
      
      console.log('📤 SENIAT IVA Exporter using company data:', {
        rif: companyData.agentRif,
        name: companyData.agentName,
        periodo: companyData.periodoVigencia,
        numeroControl: companyData.numeroControlInicial
      });
    } catch (error) {
      console.error('❌ Error loading company data for SENIAT export:', error);
      throw error;
    }

    // Validar datos antes de exportar
    const validation = seniatValidators.validateIVAExportData(
      transactions.map(t => ({
        documentNumber: t.documentNumber,
        controlNumber: t.controlNumber,
        date: t.date,
        providerRif: t.providerRif,
        totalAmount: t.totalAmount,
        taxableBase: t.taxableBase,
        retentionAmount: t.retentionAmount,
        retentionPercentage: t.retentionPercentage
      }))
    );

    if (!validation.isValid) {
      throw new Error(`Errores en datos de exportación: ${validation.errors.join(', ')}`);
    }

    // Generar exportación TXT formato oficial SENIAT simplificado
    const lines: string[] = [];
    
    // Encabezado oficial SENIAT (formato simplificado para ContaVe Pro)
    lines.push('RIF_AGENTE;PERIODO;RIF_RETENIDO;NRO_COMPROBANTE;FECHA;NRO_FACTURA;BASE_IMPONIBLE;PORCENTAJE_RETENCION;MONTO_RETENIDO');
    
    // Líneas de detalle
    const ivaTransactions = transactions.filter(t => t.type === 'IVA' && t.period === options.period);
    let secuencia = companyData.secuenciaComprobantes;
    
    ivaTransactions.forEach(transaction => {
      const numeroComprobante = this.generateComprobanteNumber(companyData.numeroControlInicial, secuencia);
      
      lines.push([
        this.cleanRIF(companyData.agentRif),
        options.period.replace('-', ''),
        this.cleanRIF(transaction.providerRif),
        numeroComprobante,
        this.formatDateForSENIAT(transaction.date),
        transaction.documentNumber,
        transaction.taxableBase.toFixed(2),
        transaction.retentionPercentage.toString(),
        transaction.retentionAmount.toFixed(2)
      ].join(';'));
      
      secuencia++;
    });

    // Actualizar secuencia en empresa para próxima exportación
    try {
      await companyDataProvider.updateCompanySettings({ 
        secuenciaComprobantes: secuencia 
      });
      console.log('✅ IVA TXT - Secuencia comprobantes actualizada:', secuencia);
    } catch (error) {
      console.error('❌ Error updating comprobante sequence:', error);
    }

    return lines.join('\r\n');
  }

  // Generar exportación IVA XML formato oficial SENIAT
  async generateIVAXML(transactions: Transaction[], options: SENIATExportOptions): Promise<string> {
    let companyData: any;
    
    try {
      // Check license permissions
      if (!licenseService.hasFeature('seniat_exports')) {
        const message = 'Las exportaciones SENIAT no están disponibles en su licencia actual.';
        console.log('🔒 SENIAT XML export blocked by license');
        throw new Error(message);
      }
      
      companyData = await companyDataProvider.getCompanyForSENIAT();
      if (!companyData?.agentRif || !companyData?.agentName) {
        throw new Error('Complete la configuración de empresa antes de exportar XML SENIAT');
      }
      
      console.log('📤 SENIAT IVA XML Exporter using company data:', {
        rif: companyData.agentRif,
        name: companyData.agentName
      });
    } catch (error) {
      console.error('❌ Error loading company data for IVA XML:', error);
      throw error;
    }

    const ivaTransactions = transactions.filter(t => t.type === 'IVA' && t.period === options.period);
    
    // Validar datos
    const validation = seniatValidators.validateIVAExportData(
      ivaTransactions.map(t => ({
        documentNumber: t.documentNumber,
        controlNumber: t.controlNumber,
        date: t.date,
        providerRif: t.providerRif,
        totalAmount: t.totalAmount,
        taxableBase: t.taxableBase,
        retentionAmount: t.retentionAmount,
        retentionPercentage: t.retentionPercentage
      }))
    );

    if (!validation.isValid) {
      throw new Error(`Errores en datos de exportación XML: ${validation.errors.join(', ')}`);
    }

    let secuencia = companyData.secuenciaComprobantes || 1;
    const totalBase = ivaTransactions.reduce((sum, t) => sum + t.taxableBase, 0);
    const totalRetenido = ivaTransactions.reduce((sum, t) => sum + t.retentionAmount, 0);
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<RelacionRetencionesIVA RifAgente="${this.cleanRIF(companyData.agentRif)}" Periodo="${options.period.replace('-', '')}">
  <Agente>
    <Rif>${this.cleanRIF(companyData.agentRif)}</Rif>
    <RazonSocial>${this.escapeXML(companyData.agentName)}</RazonSocial>
    <Direccion>${this.escapeXML('')}</Direccion>
    <Telefono></Telefono>
    <Email></Email>
  </Agente>
  <DetalleRetencion>
${ivaTransactions.map(t => {
  const numeroComprobante = this.generateComprobanteNumber(companyData.numeroControlInicial, secuencia);
  secuencia++;
  return this.formatIVAXMLDetail(t, numeroComprobante);
}).join('\n')}
  </DetalleRetencion>
  <Resumen>
    <TotalOperaciones>${ivaTransactions.length}</TotalOperaciones>
    <MontoTotalBase>${this.formatAmountForXML(totalBase)}</MontoTotalBase>
    <MontoTotalRetenido>${this.formatAmountForXML(totalRetenido)}</MontoTotalRetenido>
    <FechaProcesamiento>${this.formatDateForSENIAT(new Date().toISOString())}</FechaProcesamiento>
  </Resumen>
</RelacionRetencionesIVA>`;

    // Actualizar secuencia
    try {
      await companyDataProvider.updateCompanySettings({ 
        secuenciaComprobantes: secuencia 
      });
      console.log('✅ XML Secuencia comprobantes actualizada:', secuencia);
    } catch (error) {
      console.error('❌ Error updating XML comprobante sequence:', error);
    }

    return xml;
  }

  // Generar exportación ISLR TXT formato oficial SENIAT
  async generateISLRTXT(transactions: Transaction[], options: SENIATExportOptions): Promise<string> {
    const company = await companyDataProvider.getCompanyForSENIAT();
    // Check license permissions
    if (!licenseService.hasFeature('seniat_exports')) {
      const message = 'Las exportaciones SENIAT no están disponibles en su licencia actual.';
      console.log('🔒 ISLR TXT export blocked by license');
      throw new Error(message);
    }
    
    console.log('📤 SENIAT ISLR TXT Exporter using company data:', {
      rif: company.agentRif,
      name: company.agentName
    });

    const islrTransactions = transactions.filter(t => t.type === 'ISLR' && t.period === options.period);
    
    const validation = seniatValidators.validateISLRExportData(
      islrTransactions.map(t => ({
        documentNumber: t.documentNumber,
        date: t.date,
        providerRif: t.providerRif,
        conceptCode: (t as any).conceptCode || '001',
        baseAmount: t.taxableBase,
        retentionAmount: t.retentionAmount,
        retentionPercentage: t.retentionPercentage
      }))
    );

    if (!validation.isValid) {
      throw new Error(`Errores en datos ISLR: ${validation.errors.join(', ')}`);
    }

    const lines: string[] = [];
    
    // Encabezado ISLR TXT
    lines.push('RIF_AGENTE;PERIODO;RIF_RETENIDO;NRO_COMPROBANTE;FECHA;NRO_FACTURA;CONCEPTO;BASE_IMPONIBLE;PORCENTAJE_RETENCION;MONTO_RETENIDO');
    
    let secuencia = company.secuenciaComprobantes;
    
    islrTransactions.forEach(transaction => {
      const numeroComprobante = this.generateComprobanteNumber(company.numeroControlInicial, secuencia);
      
      lines.push([
        this.cleanRIF(company.agentRif),
        options.period.replace('-', ''),
        this.cleanRIF(transaction.providerRif),
        numeroComprobante,
        this.formatDateForSENIAT(transaction.date),
        transaction.documentNumber,
        (transaction as any).conceptCode || '001',
        transaction.taxableBase.toFixed(2),
        transaction.retentionPercentage.toString(),
        transaction.retentionAmount.toFixed(2)
      ].join(';'));
      
      secuencia++;
    });

    // Actualizar secuencia
    try {
      await companyDataProvider.updateCompanySettings({
        secuenciaComprobantes: secuencia
      });
      console.log('✅ ISLR TXT Secuencia actualizada:', secuencia);
    } catch (error) {
      console.error('❌ Error updating ISLR TXT sequence:', error);
    }

    return lines.join('\r\n');
  }

  private generateIVATXTHeader(options: SENIATExportOptions): string {
    // Formato oficial de encabezado IVA TXT SENIAT
    return [
      'H', // A - Tipo de registro (Header)
      this.cleanRIF(options.agentRif), // B - RIF del agente sin formato
      this.formatPeriodForSENIAT(options.period), // C - Período YYYYMM
      this.formatDateForSENIAT(new Date().toISOString()), // D - Fecha generación YYYYMMDD
      'CONTAVE20', // E - Código de software
      '2.0.0', // F - Versión del software
      '1', // G - Tipo de archivo (1 = Normal)
      '0', // H - Número de archivo
      '', // I - Reservado
      '', // J - Reservado
      '', // K - Reservado
      '', // L - Reservado
      '', // M - Reservado
      '', // N - Reservado
      '', // O - Reservado
      ''  // P - Reservado
    ].join('|');
  }

  private formatIVATXTLine(transaction: Transaction): string {
    const ivaAmount = transaction.taxableBase * 0.16;
    const exemptAmount = transaction.totalAmount - transaction.taxableBase - ivaAmount;
    
    return [
      'D', // A - Tipo de registro (Detail)
      this.cleanRIF(transaction.providerRif), // B - RIF proveedor
      transaction.documentNumber, // C - Número de factura
      transaction.controlNumber || '', // D - Número de control
      this.formatDateForSENIAT(transaction.date), // E - Fecha YYYYMMDD
      '01', // F - Tipo documento (01 = Factura)
      this.formatAmountForSENIAT(transaction.totalAmount), // G - Monto total
      this.formatAmountForSENIAT(transaction.totalAmount - ivaAmount), // H - Monto neto
      this.formatAmountForSENIAT(exemptAmount), // I - Monto exento
      this.formatAmountForSENIAT(transaction.taxableBase), // J - Base imponible
      this.formatAmountForSENIAT(ivaAmount), // K - IVA
      this.formatAmountForSENIAT(transaction.retentionAmount), // L - IVA retenido
      transaction.retentionPercentage.toString().replace('.', ','), // M - Porcentaje retención
      'C', // N - Tipo operación (C = Compra)
      '', // O - Número factura afectada
      ''  // P - Fecha factura afectada
    ].join('|');
  }

  private generateIVATXTFooter(
    options: SENIATExportOptions,
    totals: { transactions: number; totalBase: number; totalIVA: number; totalRetained: number }
  ): string {
    return [
      'F', // Tipo de registro (Footer)
      totals.transactions.toString(), // Cantidad de registros
      this.formatAmountForSENIAT(totals.totalBase), // Total base imponible
      this.formatAmountForSENIAT(totals.totalIVA), // Total IVA
      this.formatAmountForSENIAT(totals.totalRetained), // Total retenido
      '', '', '', '', '', '', '', '', '', '', '' // Campos reservados
    ].join('|');
  }

  // Generar exportación ISLR XML formato oficial SENIAT  
  async generateISLRXML(transactions: Transaction[], options: SENIATExportOptions): Promise<string> {
    const company = await companyDataProvider.getCompanyForSENIAT();
    // Check license permissions
    if (!licenseService.hasFeature('seniat_exports')) {
      const message = 'Las exportaciones SENIAT XML no están disponibles en su licencia actual.';
      console.log('🔒 ISLR XML export blocked by license');
      throw new Error(message);
    }
    
    console.log('📤 SENIAT IVA XML Exporter using company data:', {
      rif: company.agentRif,
      name: company.agentName
    });
    console.log('📤 SENIAT ISLR XML Exporter using company data:', {
      rif: company.agentRif,
      name: company.agentName
    });

    const islrTransactions = transactions.filter(t => t.type === 'ISLR' && t.period === options.period);
    
    const validation = seniatValidators.validateISLRExportData(
      islrTransactions.map(t => ({
        documentNumber: t.documentNumber,
        date: t.date,
        providerRif: t.providerRif,
        conceptCode: (t as any).conceptCode || '001',
        baseAmount: t.taxableBase,
        retentionAmount: t.retentionAmount,
        retentionPercentage: t.retentionPercentage
      }))
    );

    if (!validation.isValid) {
      throw new Error(`Errores en datos ISLR: ${validation.errors.join(', ')}`);
    }

    const totalBase = islrTransactions.reduce((sum, t) => sum + t.taxableBase, 0);
    const totalRetenido = islrTransactions.reduce((sum, t) => sum + t.retentionAmount, 0);
    
    let secuencia = company.secuenciaComprobantes;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<RelacionRetencionesISLR xmlns="http://seniat.gob.ve/xsd/islr" version="1.0">
  <Encabezado>
    <RifAgente>${this.cleanRIF(company.agentRif)}</RifAgente>
    <RazonSocial>${this.escapeXML(company.agentName)}</RazonSocial>
    <Direccion>${this.escapeXML(company.agentAddress || '')}</Direccion>
    <Periodo>${this.formatPeriodForSENIAT(options.period)}</Periodo>
    <FechaGeneracion>${this.formatDateForSENIAT(new Date().toISOString())}</FechaGeneracion>
    <SoftwareUtilizado>CONTAVE20</SoftwareUtilizado>
    <VersionSoftware>2.0.0</VersionSoftware>
    <CantidadOperaciones>${islrTransactions.length}</CantidadOperaciones>
    <MontoTotalBase>${this.formatAmountForSENIAT(totalBase)}</MontoTotalBase>
    <MontoTotalRetenido>${this.formatAmountForSENIAT(totalRetenido)}</MontoTotalRetenido>
  </Encabezado>
  <Detalle>
${islrTransactions.map(t => {
  const numeroComprobante = this.generateComprobanteNumber(company.numeroControlInicial, secuencia);
  secuencia++;
  return this.formatISLRXMLDetail(t, numeroComprobante);
}).join('\n')}
  </Detalle>
  <Resumen>
    <TotalOperaciones>${islrTransactions.length}</TotalOperaciones>
    <MontoTotalBase>${this.formatAmountForSENIAT(totalBase)}</MontoTotalBase>
    <MontoTotalRetenido>${this.formatAmountForSENIAT(totalRetenido)}</MontoTotalRetenido>
    <FechaProcesamiento>${this.formatDateForSENIAT(new Date().toISOString())}</FechaProcesamiento>
  </Resumen>
</RelacionRetencionesISLR>`;

    // Actualizar secuencia en empresa
    try {
      await companyDataProvider.updateCompanySettings({
        secuenciaComprobantes: secuencia
      });
      console.log('✅ ISLR XML Secuencia actualizada:', secuencia);
    } catch (error) {
      console.error('❌ Error updating ISLR XML sequence:', error);
    }

    return xml;
  }

  private formatISLRXMLDetail(transaction: Transaction, numeroComprobante: string): string {
    return `    <Retencion>
      <NumeroComprobante>${numeroComprobante}</NumeroComprobante>
      <RifRetenido>${this.cleanRIF(transaction.providerRif)}</RifRetenido>
      <NombreRetenido>${this.escapeXML(transaction.providerName)}</NombreRetenido>
      <NumeroFactura>${this.escapeXML(transaction.documentNumber)}</NumeroFactura>
      <NumeroControl>${this.escapeXML(transaction.controlNumber || '')}</NumeroControl>
      <FechaOperacion>${this.formatDateForSENIAT(transaction.date)}</FechaOperacion>
      <CodigoConcepto>${(transaction as any).conceptCode || '001'}</CodigoConcepto>
      <ConceptoRetencion>${this.escapeXML(transaction.concept)}</ConceptoRetencion>
      <MontoOperacion>${this.formatAmountForSENIAT(transaction.totalAmount)}</MontoOperacion>
      <BaseImponible>${this.formatAmountForSENIAT(transaction.taxableBase)}</BaseImponible>
      <PorcentajeRetencion>${transaction.retentionPercentage}</PorcentajeRetencion>
      <MontoRetenido>${this.formatAmountForSENIAT(transaction.retentionAmount)}</MontoRetenido>
    </Retencion>`;
  }

  private formatIVAXMLDetail(transaction: Transaction, numeroComprobante: string): string {
    return `    <LineaRetencion>
      <NumeroComprobante>${numeroComprobante}</NumeroComprobante>
      <FechaOperacion>${this.formatDateForSENIAT(transaction.date)}</FechaOperacion>
      <NumeroFactura>${this.escapeXML(transaction.documentNumber)}</NumeroFactura>
      <NumeroControl>${this.escapeXML(transaction.controlNumber || '')}</NumeroControl>
      <RifRetenido>${this.cleanRIF(transaction.providerRif)}</RifRetenido>
      <NombreRetenido>${this.escapeXML(transaction.providerName)}</NombreRetenido>
      <BaseImponible>${this.formatAmountForXML(transaction.taxableBase)}</BaseImponible>
      <MontoIVA>${this.formatAmountForXML(transaction.taxableBase * 0.16)}</MontoIVA>
      <PorcentajeRetencion>${transaction.retentionPercentage}</PorcentajeRetencion>
      <MontoRetenido>${this.formatAmountForXML(transaction.retentionAmount)}</MontoRetenido>
    </LineaRetencion>`;
  }

  // Generar número de comprobante secuencial
  private generateComprobanteNumber(numeroInicial: string, secuencia: number): string {
    const base = numeroInicial.substring(0, numeroInicial.length - 8);
    const numeroSecuencial = (parseInt(numeroInicial.substring(numeroInicial.length - 8)) + secuencia - 1).toString().padStart(8, '0');
    return base + numeroSecuencial;
  }

  // Funciones utilitarias para formatos SENIAT
  private formatAmountForSENIAT(amount: number): string {
    // CORRECCIÓN: Redondeo contable antes del formato SENIAT
    const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
    return roundedAmount.toFixed(2); // Punto decimal para TXT
  }

  private formatAmountForXML(amount: number): string {
    // CORRECCIÓN: Redondeo contable para XML
    const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
    return roundedAmount.toFixed(2); // Punto decimal para XML también
  }

  private formatDateForSENIAT(date: string): string {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private formatPeriodForSENIAT(period: string): string {
    return period.replace('-', '');
  }

  private cleanRIF(rif: string): string {
    return rif.replace(/[^0-9]/g, '');
  }

  private escapeXML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFD') // Normalizar unicode
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
      .replace(/[^\w\s]/gi, '') // Remover caracteres especiales
      .trim()
      .substring(0, 60)
      .toUpperCase();
  }

  // Exportar a archivo
  async generateCombinedTXT(transactions: Transaction[], options: SENIATExportOptions): Promise<string> {
    const islrTxs = transactions.filter(t => t.type === 'ISLR');
    const ivaTxs = transactions.filter(t => t.type === 'IVA');
    
    let content = '';
    
    if (islrTxs.length > 0) {
      content += await this.generateISLRTXT(islrTxs, options);
    }
    
    if (ivaTxs.length > 0) {
      if (content) content += '\n\n';
      content += await this.generateIVATXT(ivaTxs, options);
    }
    
    return content;
  }

  async generateCombinedXML(transactions: Transaction[], options: SENIATExportOptions): Promise<string> {
    const islrTxs = transactions.filter(t => t.type === 'ISLR');
    const ivaTxs = transactions.filter(t => t.type === 'IVA');
    
    let content = '<?xml version="1.0" encoding="UTF-8"?>\n<RelacionRetenciones>\n';
    
    if (islrTxs.length > 0) {
      const islrXml = await this.generateISLRXML(islrTxs, options);
      content += islrXml.replace('<?xml version="1.0" encoding="UTF-8"?>', '');
    }
    
    if (ivaTxs.length > 0) {
      const ivaXml = await this.generateIVAXML(ivaTxs, options);
      content += ivaXml.replace('<?xml version="1.0" encoding="UTF-8"?>', '');
    }
    
    content += '\n</RelacionRetenciones>';
    
    return content;
  }

  downloadFile(content: string, fileName: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: `${mimeType}; charset=utf-8` });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Validar datos de exportación antes de generar archivos
  validateExportData(transactions: Transaction[], type: 'ISLR' | 'IVA'): { isValid: boolean; errors: string[]; warnings: string[] } {
    if (type === 'IVA') {
      return seniatValidators.validateIVAExportData(
        transactions.map(t => ({
          documentNumber: t.documentNumber,
          controlNumber: t.controlNumber,
          date: t.date,
          providerRif: t.providerRif,
          totalAmount: t.totalAmount,
          taxableBase: t.taxableBase,
          retentionAmount: t.retentionAmount,
          retentionPercentage: t.retentionPercentage
        }))
      );
    } else {
      return seniatValidators.validateISLRExportData(
        transactions.map(t => ({
          documentNumber: t.documentNumber,
          date: t.date,
          providerRif: t.providerRif,
          conceptCode: (t as any).conceptCode || '001',
          baseAmount: t.taxableBase,
          retentionAmount: t.retentionAmount,
          retentionPercentage: t.retentionPercentage
        }))
      );
    }
  }

  // Generar declaraciones mensuales completas
  generateMonthlyIVADeclaration(transactions: Transaction[], options: SENIATExportOptions): {
    txtContent: string;
    summary: any;
  } {
    const txtContent = this.generateIVATXT(transactions, options);
    
    const ivaTransactions = transactions.filter(t => t.type === 'IVA' && t.period === options.period);
    
    const summary = {
      period: options.period,
      totalTransactions: ivaTransactions.length,
      totalPurchases: ivaTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      totalTaxableBase: ivaTransactions.reduce((sum, t) => sum + t.taxableBase, 0),
      totalIVA: ivaTransactions.reduce((sum, t) => sum + (t.taxableBase * 0.16), 0),
      totalRetained: ivaTransactions.reduce((sum, t) => sum + t.retentionAmount, 0),
      byRetentionType: {
        retention75: ivaTransactions.filter(t => t.retentionPercentage === 75).length,
        retention100: ivaTransactions.filter(t => t.retentionPercentage === 100).length
      }
    };

    return { txtContent, summary };
  }

  generateQuarterlyISLRDeclaration(transactions: Transaction[], year: number, quarter: number): {
    xmlContent: string;
    txtContent: string;
    summary: any;
  } {
    const quarterMonths = this.getQuarterMonths(year, quarter);
    const islrTransactions = transactions.filter(t => 
      t.type === 'ISLR' && quarterMonths.includes(t.period)
    );

    const options = {
      period: `${year}-Q${quarter}`,
      agentRif: 'J-123456789-0', // This should come from company settings
      agentName: 'EMPRESA DEMO, C.A.' // This should come from company settings
    };

    const xmlContent = this.generateISLRXML(islrTransactions, options);
    const txtContent = this.generateISLRTXT(islrTransactions, options);

    const summary = {
      quarter: `Q${quarter} ${year}`,
      totalTransactions: islrTransactions.length,
      totalBase: islrTransactions.reduce((sum, t) => sum + t.taxableBase, 0),
      totalRetained: islrTransactions.reduce((sum, t) => sum + t.retentionAmount, 0),
      byConcept: this.groupISLRByConcept(islrTransactions)
    };

    return { xmlContent, txtContent, summary };
  }

  private getQuarterMonths(year: number, quarter: number): string[] {
    const quarters = {
      1: [`${year}-01`, `${year}-02`, `${year}-03`],
      2: [`${year}-04`, `${year}-05`, `${year}-06`],
      3: [`${year}-07`, `${year}-08`, `${year}-09`],
      4: [`${year}-10`, `${year}-11`, `${year}-12`]
    };
    return quarters[quarter as keyof typeof quarters] || [];
  }

  private groupISLRByConcept(transactions: Transaction[]): Record<string, any> {
    return transactions.reduce((acc, t) => {
      const conceptCode = (t as any).conceptCode || '001';
      if (!acc[conceptCode]) {
        acc[conceptCode] = {
          count: 0,
          totalBase: 0,
          totalRetained: 0
        };
      }
      acc[conceptCode].count++;
      acc[conceptCode].totalBase += t.taxableBase;
      acc[conceptCode].totalRetained += t.retentionAmount;
      return acc;
    }, {} as Record<string, any>);
  }
}

export const seniatExporter = SENIATExporter.getInstance();