import { jsPDF } from 'jspdf';
import { Transaction, Provider, CompanyInfo } from '../types';
import { formatCurrency, formatDate, formatRIF } from '../utils/formatters';
import { companyDataProvider } from '../utils/companyDataProvider';

/**
 * Generador de PDFs para Producción
 * Usa exclusivamente datos reales de la base de datos
 * NO incluye valores de prueba o ficticios
 */
export class PDFGenerator {
  private static instance: PDFGenerator;
  private missingFields: Set<string> = new Set();
  private generationLog: Array<{field: string, reason: string}> = [];

  static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  /**
   * Valida y obtiene valor real o retorna indicador de dato faltante
   */
  private getFieldValue(value: any, fieldName: string, required: boolean = false): string {
    if (value === null || value === undefined || value === '') {
      this.missingFields.add(fieldName);
      this.generationLog.push({
        field: fieldName,
        reason: 'Dato no disponible en base de datos'
      });
      
      if (required) {
        throw new Error(`Campo requerido faltante: ${fieldName}`);
      }
      
      return ''; // Campo vacío para datos opcionales
    }
    
    return String(value);
  }

  /**
   * Valida datos numéricos reales
   */
  private getNumericValue(value: any, fieldName: string): number {
    if (value === null || value === undefined || isNaN(Number(value))) {
      this.missingFields.add(fieldName);
      this.generationLog.push({
        field: fieldName,
        reason: 'Valor numérico no disponible'
      });
      return 0;
    }
    return Number(value);
  }

  /**
   * Formatea montos solo si son valores reales
   */
  private formatRealAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '-.--';
    }
    
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount).replace(/\./g, '_').replace(/,/g, '.').replace(/_/g, ',');
  }

  /**
   * Genera comprobante ISLR con datos reales de producción
   */
  async generateISLRVoucher(
    transaction: Transaction,
    provider: Provider,
    voucherNumber: string
  ): Promise<Blob> {
    // Limpiar logs anteriores
    this.missingFields.clear();
    this.generationLog = [];
    
    console.log('🔍 Iniciando generación de PDF con datos de producción');
    console.log(`📊 Transacción ID: ${transaction.id}`);
    console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
    
    // Validar datos críticos antes de proceder
    if (!transaction || !provider || !voucherNumber) {
      throw new Error('Datos insuficientes para generar el comprobante');
    }
    
    // Cargar datos reales de la empresa desde la base de datos
    let company: CompanyInfo;
    try {
      company = await companyDataProvider.getCompanyForPDF();
      
      // Validación estricta de datos de empresa
      if (!company?.rif) {
        throw new Error('RIF de empresa no configurado en base de datos');
      }
      if (!company?.name) {
        throw new Error('Razón social de empresa no configurada en base de datos');
      }
    } catch (error) {
      console.error('❌ Error crítico al obtener datos de empresa:', error);
      throw new Error('No se pueden obtener datos de empresa desde la base de datos');
    }
    
    const pdf = new jsPDF('l', 'mm', 'letter');
    
    // Configuración de página
    const margin = { top: 15, right: 15, bottom: 15, left: 15 };
    const pageWidth = 279;
    const pageHeight = 216;
    const contentWidth = pageWidth - margin.left - margin.right;
    
    pdf.setFont('helvetica', 'normal');
    
    // ========== ENCABEZADO CON DATOS REALES ==========
    let yPos = margin.top;
    
    // Datos reales de empresa
    pdf.setFontSize(9);
    const companyName = this.getFieldValue(company.name, 'company.name', true);
    const companyAddress = this.getFieldValue(company.address, 'company.address');
    
    if (companyName) {
      pdf.text(companyName, margin.left, yPos);
    }
    yPos += 4;
    
    if (companyAddress) {
      pdf.text(companyAddress, margin.left, yPos);
    }
    yPos += 4;
    
    // Fecha y hora real del sistema
    const currentDate = new Date();
    const realDate = formatDate(currentDate.toISOString());
    pdf.text(realDate, pageWidth - margin.right - 50, margin.top);
    pdf.text(`${currentDate.getHours()}:${currentDate.getMinutes().toString().padStart(2, '0')}`, pageWidth - margin.right - 50, margin.top + 4);
    
    yPos = margin.top + 15;
    
    // Título
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Comprobante de Retención de ISLR de Proveedores', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    // Período real de la transacción
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    const startDate = this.getFieldValue(transaction.startDate || transaction.date, 'transaction.startDate');
    const endDate = this.getFieldValue(transaction.endDate || transaction.date, 'transaction.endDate');
    
    if (startDate && endDate) {
      pdf.text(`Emisión: Desde ${startDate} Hasta ${endDate}`, margin.left, yPos);
    } else if (transaction.date) {
      pdf.text(`Fecha: ${formatDate(transaction.date)}`, margin.left, yPos);
    }
    
    yPos += 8;
    
    // ========== MARCO DEL COMPROBANTE ==========
    pdf.setLineWidth(0.5);
    pdf.rect(margin.left, yPos, 120, 20);
    
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin.left, yPos, 120, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Comprobante de Retención de I.S.L.R.', margin.left + 2, yPos + 4);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Gaceta Oficial N° 36.206 del 12/05/1997', margin.left + 2, yPos + 4);
    yPos += 5;
    pdf.text('Decreto N° 1808 del 23/04/1997', margin.left + 2, yPos + 4);
    
    yPos += 15;
    
    // ========== DATOS REALES DEL PROVEEDOR Y AGENTE ==========
    const seccionAncho = contentWidth / 2 - 5;
    
    // SUJETO RETENIDO - Solo datos reales
    pdf.setLineWidth(0.3);
    pdf.rect(margin.left, yPos, seccionAncho, 35);
    
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin.left, yPos, seccionAncho, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('SUJETO RETENIDO (PROVEEDOR / BENEFICIARIO)', margin.left + (seccionAncho / 2), yPos + 4, { align: 'center' });
    
    let proveedorY = yPos + 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Validar y mostrar solo datos reales del proveedor
    const providerFields = [
      { 
        label: 'Proveedor:', 
        value: this.getFieldValue(provider.name, 'provider.name', true) 
      },
      { 
        label: 'RIF:', 
        value: provider.rif ? formatRIF(provider.rif) : ''
      },
      { 
        label: 'NIT:', 
        value: this.getFieldValue(provider.nit, 'provider.nit') 
      },
      { 
        label: 'Dirección:', 
        value: this.getFieldValue(provider.address, 'provider.address')
      }
    ];
    
    providerFields.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.label, margin.left + 2, proveedorY);
      pdf.setFont('helvetica', 'normal');
      
      if (item.value) {
        const displayValue = item.value.length > 60 ? 
          item.value.substring(0, 57) + '...' : item.value;
        pdf.text(displayValue, margin.left + 20, proveedorY);
      }
      proveedorY += 5;
    });
    
    // AGENTE DE RETENCIÓN - Solo datos reales
    const agenteX = margin.left + seccionAncho + 10;
    pdf.rect(agenteX, yPos, seccionAncho, 35);
    
    pdf.setFillColor(240, 240, 240);
    pdf.rect(agenteX, yPos, seccionAncho, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('AGENTE DE RETENCIÓN (EMPRESA)', agenteX + (seccionAncho / 2), yPos + 4, { align: 'center' });
    
    let agenteY = yPos + 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Datos reales del agente
    const agentFields = [
      { 
        label: 'Empresa:', 
        value: this.getFieldValue(company.name, 'company.name', true)
      },
      { 
        label: 'RIF:', 
        value: this.getFieldValue(company.rif, 'company.rif', true)
      },
      { 
        label: 'NIT:', 
        value: this.getFieldValue(company.nit || company.rif, 'company.nit')
      },
      { 
        label: 'Dirección:', 
        value: this.getFieldValue(company.address, 'company.address')
      }
    ];
    
    agentFields.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.label, agenteX + 2, agenteY);
      pdf.setFont('helvetica', 'normal');
      
      if (item.value) {
        const displayValue = item.value.length > 60 ? 
          item.value.substring(0, 57) + '...' : item.value;
        pdf.text(displayValue, agenteX + 20, agenteY);
      }
      agenteY += 5;
    });
    
    yPos += 40;
    
    // ========== TABLA CON DATOS REALES DE LA TRANSACCIÓN ==========
    
    const columnas = [
      { titulo: 'Fecha', ancho: 20, align: 'center' },
      { titulo: 'Documento\ndel Pago', ancho: 25, align: 'center' },
      { titulo: 'Tipo', ancho: 15, align: 'center' },
      { titulo: 'N° del\nDocumento', ancho: 22, align: 'center' },
      { titulo: 'Monto del\nDocumento', ancho: 24, align: 'right' },
      { titulo: 'Monto\nAbonado', ancho: 25, align: 'right' },
      { titulo: 'Base Objeto\nde Retención', ancho: 20, align: 'right' },
      { titulo: 'Sustraendo', ancho: 20, align: 'right' },
      { titulo: 'Porcentaje\nRetenido', ancho: 20, align: 'center' },
      { titulo: 'Concepto de ISLR', ancho: 35, align: 'left' },
      { titulo: 'Monto\nRetenido', ancho: 20, align: 'right' }
    ];
    
    // Calcular posiciones
    let xActual = margin.left;
    const columnasConPosicion = columnas.map(col => {
      const colConPos = { ...col, x: xActual };
      xActual += col.ancho;
      return colConPos;
    });
    
    // Encabezados de tabla
    const alturaEncabezado = 12;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin.left, yPos, contentWidth, alturaEncabezado, 'F');
    pdf.setLineWidth(0.3);
    pdf.rect(margin.left, yPos, contentWidth, alturaEncabezado);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    
    columnasConPosicion.forEach(col => {
      const lineas = col.titulo.split('\n');
      const yInicial = yPos + (alturaEncabezado - (lineas.length * 3)) / 2 + 2;
      
      lineas.forEach((linea, index) => {
        const xPos = col.align === 'center' ? col.x + col.ancho / 2 :
                     col.align === 'right' ? col.x + col.ancho - 1 :
                     col.x + 1;
        pdf.text(linea, xPos, yInicial + (index * 3), { align: col.align });
      });
      
      if (col.x > margin.left) {
        pdf.line(col.x, yPos, col.x, yPos + alturaEncabezado);
      }
    });
    
    yPos += alturaEncabezado;
    
    // Fila con datos reales de la transacción
    const alturaFila = 8;
    pdf.rect(margin.left, yPos, contentWidth, alturaFila);
    
    // Obtener valores reales de la transacción
    const transactionDate = transaction.date ? formatDate(transaction.date) : '';
    const paymentDoc = this.getFieldValue(transaction.paymentDocument, 'transaction.paymentDocument');
    const docType = this.getFieldValue(transaction.type, 'transaction.type');
    const docNumber = this.getFieldValue(transaction.documentNumber, 'transaction.documentNumber', true);
    const totalAmount = this.getNumericValue(transaction.totalAmount, 'transaction.totalAmount');
    const taxableBase = this.getNumericValue(transaction.taxableBase, 'transaction.taxableBase');
    const retentionPercentage = this.getNumericValue(transaction.retentionPercentage, 'transaction.retentionPercentage');
    const retentionAmount = this.getNumericValue(transaction.retentionAmount, 'transaction.retentionAmount');
    const concept = this.getFieldValue(transaction.concept, 'transaction.concept');
    const sustraendo = this.getNumericValue(transaction.sustraendo, 'transaction.sustraendo');
    
    const datosTransaccion = [
      transactionDate,
      paymentDoc,
      docType,
      docNumber,
      this.formatRealAmount(totalAmount),
      this.formatRealAmount(totalAmount), // Monto abonado
      this.formatRealAmount(taxableBase),
      this.formatRealAmount(sustraendo),
      retentionPercentage > 0 ? `${retentionPercentage},00` : '',
      concept ? (concept.length > 25 ? concept.substring(0, 22) + '...' : concept) : '',
      this.formatRealAmount(retentionAmount)
    ];
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    columnasConPosicion.forEach((col, index) => {
      const valor = datosTransaccion[index];
      if (valor) { // Solo renderizar si hay valor real
        const xPos = col.align === 'center' ? col.x + col.ancho / 2 :
                     col.align === 'right' ? col.x + col.ancho - 1 :
                     col.x + 1;
        pdf.text(valor, xPos, yPos + 5, { align: col.align });
      }
      
      if (col.x > margin.left) {
        pdf.line(col.x, yPos, col.x, yPos + alturaFila);
      }
    });
    
    yPos += alturaFila;
    
    // ========== TOTALES REALES ==========
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    
    // Solo mostrar totales si hay valores reales
    if (taxableBase > 0) {
      const totalBaseX = columnasConPosicion[6].x;
      pdf.text('Total Base:', totalBaseX - 20, yPos);
      pdf.text(this.formatRealAmount(taxableBase), totalBaseX + columnasConPosicion[6].ancho - 1, yPos, { align: 'right' });
    }
    
    if (retentionAmount > 0) {
      const totalRetenidoX = columnasConPosicion[10].x;
      pdf.text('Total Retenido:', totalRetenidoX - 45, yPos);  // ← MOVIDO MÁS A LA IZQUIERDA
      pdf.text(this.formatRealAmount(retentionAmount), totalRetenidoX + columnasConPosicion[10].ancho - 1, yPos, { align: 'right' });
    }
    
    // ========== FIRMAS ==========
    yPos = pageHeight - 40;
    const firmaAncho = 80;
    const firmaY = yPos + 20;
    
    pdf.line(margin.left + 30, firmaY, margin.left + 30 + firmaAncho, firmaY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Firma del Agente de Retención', margin.left + 30 + firmaAncho/2, firmaY + 5, { align: 'center' });
    
    pdf.line(pageWidth - margin.right - 30 - firmaAncho, firmaY, pageWidth - margin.right - 30, firmaY);
    pdf.text('Firma del Beneficiario', pageWidth - margin.right - 30 - firmaAncho/2, firmaY + 5, { align: 'center' });
    
    // ========== METADATOS DE GENERACIÓN ==========
    pdf.setFontSize(6);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generado: ${new Date().toISOString()}`, margin.left, pageHeight - 10);
    pdf.text(`Doc ID: ${transaction.id || 'N/A'}`, margin.left, pageHeight - 7);
    
    // Registrar campos faltantes
    if (this.missingFields.size > 0) {
      console.warn('⚠️ Campos sin datos:', Array.from(this.missingFields));
      pdf.text(`Campos vacíos: ${this.missingFields.size}`, margin.left, pageHeight - 4);
    }
    
    // Log final
    console.log('✅ PDF generado con datos de producción');
    console.log(`📋 Campos procesados: ${Object.keys(transaction).length + Object.keys(provider).length}`);
    console.log(`⚠️ Campos faltantes: ${this.missingFields.size}`);
    
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
  }

  /**
   * Genera comprobante IVA con datos reales
   */
  async generateIVAVoucher(
    transaction: Transaction,
    provider: Provider,
    voucherNumber: string
  ): Promise<Blob> {
    // Limpiar logs
    this.missingFields.clear();
    this.generationLog = [];
    
    console.log('🔍 Generando comprobante IVA con datos reales');
    console.log(`📊 Transacción: ${transaction.id}`);
    
    // Validación inicial
    if (!transaction || !provider || !voucherNumber) {
      throw new Error('Datos insuficientes para generar comprobante IVA');
    }
    
    const company = await this.loadCompanyDataStrict();
    const pdf = new jsPDF('l', 'mm', 'letter');
    
    const margin = { top: 15, right: 15, bottom: 15, left: 15 };
    const pageWidth = 279;
    const pageHeight = 216;
    const contentWidth = pageWidth - margin.left - margin.right;
    
    pdf.setFont('helvetica', 'normal');
    
    // ========== ENCABEZADO ==========
    let yPos = margin.top;
    
    pdf.setFontSize(9);
    const companyName = this.getFieldValue(company.name, 'company.name', true);
    const companyAddress = this.getFieldValue(company.address, 'company.address');
    
    if (companyName) pdf.text(companyName, margin.left, yPos);
    yPos += 4;
    if (companyAddress) pdf.text(companyAddress, margin.left, yPos);
    
    // Timestamp real
    const now = new Date();
    pdf.text(formatDate(now.toISOString()), pageWidth - margin.right - 50, margin.top);
    pdf.text(`Hora: ${now.toLocaleTimeString()}`, pageWidth - margin.right - 50, margin.top + 4);
    
    yPos = margin.top + 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Comprobante de Retención del I.V.A.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    const period = this.getFieldValue(transaction.period, 'transaction.period');
    if (period) {
      pdf.text(`Período: ${period}`, margin.left, yPos);
    }
    yPos += 8;
    
    // ========== INFORMACIÓN DEL COMPROBANTE ==========
    pdf.setLineWidth(0.5);
    pdf.rect(margin.left, yPos, 140, 25);
    
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin.left, yPos, 140, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Comprobante de Retención del Impuesto al Valor Agregado', margin.left + 2, yPos + 4);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Número de comprobante real
    pdf.text(`Número de Comprobante: ${voucherNumber}`, margin.left + 2, yPos + 4);
    yPos += 5;
    pdf.text(`Fecha de Emisión: ${formatDate(now.toISOString())}`, margin.left + 2, yPos + 4);
    yPos += 5;
    pdf.text('Providencia Administrativa SNAT/2015/0049', margin.left + 2, yPos + 4);
    
    yPos += 15;
    
    // ========== DATOS DEL AGENTE Y CONTRIBUYENTE ==========
    const seccionAncho = contentWidth / 2 - 5;
    
    // AGENTE DE RETENCIÓN
    pdf.setLineWidth(0.3);
    pdf.rect(margin.left, yPos, seccionAncho, 35);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin.left, yPos, seccionAncho, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('AGENTE DE RETENCIÓN', margin.left + (seccionAncho / 2), yPos + 4, { align: 'center' });
    
    let agenteY = yPos + 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Solo datos reales del agente
    const agenteDataIVA = [
      { label: 'Nombre o Razón Social:', value: companyName },
      { label: 'RIF del Agente:', value: company.rif },
      { label: 'Dirección:', value: companyAddress },
      { label: 'Período Fiscal:', value: period }
    ];
    
    agenteDataIVA.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.label, margin.left + 2, agenteY);
      pdf.setFont('helvetica', 'normal');
      if (item.value) {
        const displayValue = item.value.length > 50 ? 
          item.value.substring(0, 47) + '...' : item.value;
        pdf.text(displayValue, margin.left + 35, agenteY);
      }
      agenteY += 5;
    });
    
    // CONTRIBUYENTE
    const contribuyenteX = margin.left + seccionAncho + 10;
    pdf.rect(contribuyenteX, yPos, seccionAncho, 35);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(contribuyenteX, yPos, seccionAncho, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('CONTRIBUYENTE (SUJETO RETENIDO)', contribuyenteX + (seccionAncho / 2), yPos + 4, { align: 'center' });
    
    let contribuyenteY = yPos + 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Solo datos reales del contribuyente
    const contribuyenteData = [
      { label: 'Nombre o Razón Social:', value: this.getFieldValue(provider.name, 'provider.name', true) },
      { label: 'RIF del Contribuyente:', value: provider.rif ? formatRIF(provider.rif) : '' },
      { label: 'Dirección:', value: this.getFieldValue(provider.address, 'provider.address') },
      { label: 'Teléfono:', value: this.getFieldValue(provider.phone, 'provider.phone') }
    ];
    
    contribuyenteData.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.label, contribuyenteX + 2, contribuyenteY);
      pdf.setFont('helvetica', 'normal');
      if (item.value) {
        const displayValue = item.value.length > 50 ? 
          item.value.substring(0, 47) + '...' : item.value;
        pdf.text(displayValue, contribuyenteX + 35, contribuyenteY);
      }
      contribuyenteY += 5;
    });
    
    yPos += 40;
    
    // ========== TABLA DE OPERACIONES IVA ==========
    const columnasIVA = [
      { titulo: 'Fecha\nFactura', ancho: 16, align: 'center' },
      { titulo: 'Tipo de\nOperación', ancho: 17, align: 'center' },
      { titulo: 'N° de\nFactura', ancho: 22, align: 'center' },
      { titulo: 'N° Control\nFactura', ancho: 22, align: 'center' },
      { titulo: 'N° Nota\nDébito', ancho: 17, align: 'center' },
      { titulo: 'N° Nota\nCrédito', ancho: 17, align: 'center' },
      { titulo: 'N° Factura\nAfectada', ancho: 17, align: 'center' },
      { titulo: 'Total Compras\ninc. IVA', ancho: 18, align: 'right' },
      { titulo: 'Compras\nsin IVA', ancho: 18, align: 'right' },
      { titulo: 'Base\nImponible', ancho: 25, align: 'right' },
      { titulo: 'Alícuota\n%', ancho: 13, align: 'center' },
      { titulo: 'IVA', ancho: 15, align: 'right' },
      { titulo: '% Ret.', ancho: 13, align: 'center' },
      { titulo: 'IVA\nRetenido', ancho: 18, align: 'right' }
    ];
    
    let xActualIVA = margin.left;
    const columnasIVAConPos = columnasIVA.map(col => {
      const colConPos = { ...col, x: xActualIVA };
      xActualIVA += col.ancho;
      return colConPos;
    });
    
    // Encabezados
    const alturaEncabezadoIVA = 12;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin.left, yPos, contentWidth, alturaEncabezadoIVA, 'F');
    pdf.setLineWidth(0.3);
    pdf.rect(margin.left, yPos, contentWidth, alturaEncabezadoIVA);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    
    columnasIVAConPos.forEach(col => {
      const lineas = col.titulo.split('\n');
      const yInicial = yPos + (alturaEncabezadoIVA - (lineas.length * 3)) / 2 + 2;
      
      lineas.forEach((linea, index) => {
        const xPos = col.align === 'center' ? col.x + col.ancho / 2 :
                     col.align === 'right' ? col.x + col.ancho - 1 :
                     col.x + 1;
        pdf.text(linea, xPos, yInicial + (index * 3), { align: col.align });
      });
      
      if (col.x > margin.left) {
        pdf.line(col.x, yPos, col.x, yPos + alturaEncabezadoIVA);
      }
    });
    
    yPos += alturaEncabezadoIVA;
    
    // Datos reales de la transacción IVA
    const alturaFilaIVA = 8;
    pdf.rect(margin.left, yPos, contentWidth, alturaFilaIVA);
    
    // Calcular IVA solo con valores reales
    const taxableBase = this.getNumericValue(transaction.taxableBase, 'transaction.taxableBase');
    const ivaRate = this.getNumericValue(transaction.ivaRate || 16, 'transaction.ivaRate');
    const ivaAmount = taxableBase * (ivaRate / 100);
    
    const datosIVA = [
      transaction.date ? formatDate(transaction.date) : '',
      this.getFieldValue(transaction.operationType, 'transaction.operationType') || 'C',
      this.getFieldValue(transaction.documentNumber, 'transaction.documentNumber', true),
      this.getFieldValue(transaction.controlNumber, 'transaction.controlNumber'),
      this.getFieldValue(transaction.debitNoteNumber, 'transaction.debitNoteNumber'),
      this.getFieldValue(transaction.creditNoteNumber, 'transaction.creditNoteNumber'),
      this.getFieldValue(transaction.affectedInvoice, 'transaction.affectedInvoice'),
      this.formatRealAmount(this.getNumericValue(transaction.totalAmount, 'transaction.totalAmount')),
      this.formatRealAmount(this.getNumericValue(transaction.exemptAmount, 'transaction.exemptAmount')),
      this.formatRealAmount(taxableBase),
      ivaRate > 0 ? `${ivaRate},00` : '',
      this.formatRealAmount(ivaAmount),
      transaction.retentionPercentage > 0 ? `${transaction.retentionPercentage},00` : '',
      this.formatRealAmount(this.getNumericValue(transaction.retentionAmount, 'transaction.retentionAmount'))
    ];
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    
    columnasIVAConPos.forEach((col, index) => {
      const valor = datosIVA[index];
      if (valor && valor !== '-.--') { // Solo renderizar valores reales
        const xPos = col.align === 'center' ? col.x + col.ancho / 2 :
                     col.align === 'right' ? col.x + col.ancho - 1 :
                     col.x + 1;
        pdf.text(valor, xPos, yPos + 5, { align: col.align });
      }
      
      if (col.x > margin.left) {
        pdf.line(col.x, yPos, col.x, yPos + alturaFilaIVA);
      }
    });
    
    yPos += alturaFilaIVA;
    
    // ========== TOTALES REALES IVA ==========
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    
    // Solo mostrar totales con valores reales
    const showTotals = transaction.totalAmount > 0 || taxableBase > 0 || ivaAmount > 0 || transaction.retentionAmount > 0;
    
    if (showTotals) {
      pdf.text('TOTALES:', columnasIVAConPos[6].x, yPos);
      
      if (transaction.totalAmount > 0) {
        pdf.text(this.formatRealAmount(transaction.totalAmount), columnasIVAConPos[7].x + columnasIVAConPos[7].ancho - 1, yPos, { align: 'right' });
      }
      if (taxableBase > 0) {
        pdf.text(this.formatRealAmount(taxableBase), columnasIVAConPos[9].x + columnasIVAConPos[9].ancho - 1, yPos, { align: 'right' });
      }
      if (ivaAmount > 0) {
        pdf.text(this.formatRealAmount(ivaAmount), columnasIVAConPos[11].x + columnasIVAConPos[11].ancho - 1, yPos, { align: 'right' });
      }
      if (transaction.retentionAmount > 0) {
        pdf.text(this.formatRealAmount(transaction.retentionAmount), columnasIVAConPos[13].x + columnasIVAConPos[13].ancho - 1, yPos, { align: 'right' });
      }
    }
    
    // ========== FIRMAS ==========
    yPos = pageHeight - 40;
    const firmaAncho = 80;
    const firmaY = yPos + 20;
    
    pdf.line(margin.left + 30, firmaY, margin.left + 30 + firmaAncho, firmaY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Agente de Retención', margin.left + 30 + firmaAncho/2, firmaY + 5, { align: 'center' });
    pdf.text('Firma y Sello', margin.left + 30 + firmaAncho/2, firmaY + 9, { align: 'center' });
    
    pdf.line(pageWidth - margin.right - 30 - firmaAncho, firmaY, pageWidth - margin.right - 30, firmaY);
    pdf.text('Recibido por', pageWidth - margin.right - 30 - firmaAncho/2, firmaY + 5, { align: 'center' });
    pdf.text('Firma, Fecha y Sello', pageWidth - margin.right - 30 - firmaAncho/2, firmaY + 9, { align: 'center' });
    
    // ========== METADATOS ==========
    pdf.setFontSize(6);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Sistema de Gestión Tributaria - Generado: ${now.toISOString()}`, margin.left, pageHeight - 10);
    
    if (this.missingFields.size > 0) {
      console.warn('⚠️ Campos IVA sin datos:', Array.from(this.missingFields));
    }
    
    console.log('✅ Comprobante IVA generado con datos reales');
    
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
  }

  /**
   * Genera Libro Mayor con datos reales
   */
  async generateLedgerReport(
    transactions: Transaction[],
    period: string
  ): Promise<Blob> {
    this.missingFields.clear();
    this.generationLog = [];
    
    console.log('📚 Generando Libro Mayor con datos de producción');
    console.log(`📊 Total transacciones: ${transactions.length}`);
    console.log(`📅 Período: ${period}`);
    
    if (!transactions || transactions.length === 0) {
      throw new Error('No hay transacciones para generar el libro mayor');
    }
    
    const company = await this.loadCompanyDataStrict();
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const pageWidth = 297;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin.left - margin.right;
    
    let pageNum = 1;
    let yPos = margin.top;
    
    // ========== FUNCIÓN PARA ENCABEZADO DE PÁGINA ==========
    const drawPageHeader = () => {
      yPos = margin.top;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LIBRO MAYOR DE RETENCIONES', pageWidth / 2, yPos + 5, { align: 'center' });
      
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      if (company.name) {
        pdf.text(company.name, pageWidth / 2, yPos, { align: 'center' });
      }
      if (company.rif) {
        pdf.text(`RIF: ${company.rif}`, pageWidth / 2, yPos + 5, { align: 'center' });
      }
      
      yPos += 10;
      
      pdf.setFontSize(9);
      pdf.text(`Período: ${period}`, margin.left, yPos);
      pdf.text(`Página ${pageNum}`, pageWidth - margin.right, yPos, { align: 'right' });
      pdf.text(`Generado: ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      
      pdf.setLineWidth(0.5);
      pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
      
      yPos += 5;
    };
    
    drawPageHeader();
    
    // ========== TABLA DE TRANSACCIONES ==========
    const columnas = [
      { titulo: 'Fecha', ancho: 18, align: 'center' },
      { titulo: 'Tipo', ancho: 12, align: 'center' },
      { titulo: 'N° Doc.', ancho: 22, align: 'left' },
      { titulo: 'N° Control', ancho: 22, align: 'left' },
      { titulo: 'Proveedor/Cliente', ancho: 55, align: 'left' },
      { titulo: 'RIF', ancho: 22, align: 'center' },
      { titulo: 'Concepto', ancho: 50, align: 'left' },
      { titulo: 'Base Imp.', ancho: 25, align: 'right' },
      { titulo: '% Ret.', ancho: 15, align: 'center' },
      { titulo: 'Monto Ret.', ancho: 25, align: 'right' },
      { titulo: 'Estado', ancho: 20, align: 'center' }
    ];
    
    let xActual = margin.left;
    const columnasConPos = columnas.map(col => {
      const colConPos = { ...col, x: xActual };
      xActual += col.ancho;
      return colConPos;
    });
    
    // Función para dibujar encabezados de tabla
    const drawTableHeaders = () => {
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin.left, yPos, contentWidth, 8, 'F');
      pdf.setLineWidth(0.3);
      pdf.rect(margin.left, yPos, contentWidth, 8);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      
      columnasConPos.forEach(col => {
        const xPos = col.align === 'center' ? col.x + col.ancho / 2 :
                     col.align === 'right' ? col.x + col.ancho - 1 :
                     col.x + 1;
        pdf.text(col.titulo, xPos, yPos + 5, { align: col.align });
        
        if (col.x > margin.left) {
          pdf.line(col.x, yPos, col.x, yPos + 8);
        }
      });
      
      yPos += 8;
    };
    
    drawTableHeaders();
    
    // Variables para totales reales
    let totalBase = 0;
    let totalRetenido = 0;
    let transaccionesProcesadas = 0;
    let transaccionesConErrores = 0;
    
    // Dibujar transacciones con datos reales
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    transactions.forEach((transaction, index) => {
      try {
        // Verificar si necesita nueva página
        if (yPos > pageHeight - 30) {
          pdf.setLineWidth(0.5);
          pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
          yPos += 3;
          
          pdf.setFont('helvetica', 'bold');
          pdf.text('Subtotal página:', columnasConPos[6].x, yPos + 3);
          pdf.text(this.formatRealAmount(totalBase), columnasConPos[7].x + columnasConPos[7].ancho - 1, yPos + 3, { align: 'right' });
          pdf.text(this.formatRealAmount(totalRetenido), columnasConPos[9].x + columnasConPos[9].ancho - 1, yPos + 3, { align: 'right' });
          
          pdf.addPage();
          pageNum++;
          drawPageHeader();
          drawTableHeaders();
          pdf.setFont('helvetica', 'normal');
        }
        
        // Fila alternada
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin.left, yPos, contentWidth, 6, 'F');
        }
        
        // Extraer solo datos reales
        const rowData = [
          transaction.date ? formatDate(transaction.date) : '',
          this.getFieldValue(transaction.type, `transaction[${index}].type`),
          this.getFieldValue(transaction.documentNumber, `transaction[${index}].documentNumber`),
          this.getFieldValue(transaction.controlNumber, `transaction[${index}].controlNumber`),
          transaction.providerName ? 
            (transaction.providerName.length > 30 ? 
              transaction.providerName.substring(0, 27) + '...' : 
              transaction.providerName) : '',
          transaction.providerRif ? formatRIF(transaction.providerRif) : '',
          transaction.concept ? 
            (transaction.concept.length > 28 ? 
              transaction.concept.substring(0, 25) + '...' : 
              transaction.concept) : '',
          this.formatRealAmount(transaction.taxableBase),
          transaction.retentionPercentage > 0 ? `${transaction.retentionPercentage}` : '',
          this.formatRealAmount(transaction.retentionAmount),
          this.getStatusLabel(transaction.status)
        ];
        
        // Dibujar solo datos existentes
        columnasConPos.forEach((col, i) => {
          const valor = rowData[i];
          if (valor && valor !== '-.--' && valor !== '') {
            const xPos = col.align === 'center' ? col.x + col.ancho / 2 :
                         col.align === 'right' ? col.x + col.ancho - 1 :
                         col.x + 1;
            pdf.text(valor, xPos, yPos + 4, { align: col.align });
          }
        });
        
        // Actualizar totales solo con valores reales
        if (!isNaN(transaction.taxableBase) && transaction.taxableBase > 0) {
          totalBase += transaction.taxableBase;
        }
        if (!isNaN(transaction.retentionAmount) && transaction.retentionAmount > 0) {
          totalRetenido += transaction.retentionAmount;
        }
        
        transaccionesProcesadas++;
        yPos += 6;
        
      } catch (error) {
        console.error(`Error procesando transacción ${index}:`, error);
        transaccionesConErrores++;
      }
    });
    
    // ========== RESUMEN FINAL CON DATOS REALES ==========
    yPos += 5;
    pdf.setLineWidth(0.5);
    pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    
    // Solo mostrar totales si hay valores reales
    if (totalBase > 0 || totalRetenido > 0) {
      pdf.text('TOTALES GENERALES:', columnasConPos[6].x - 20, yPos);
      
      if (totalBase > 0) {
        pdf.text(this.formatRealAmount(totalBase), columnasConPos[7].x + columnasConPos[7].ancho - 1, yPos, { align: 'right' });
      }
      if (totalRetenido > 0) {
        pdf.text(this.formatRealAmount(totalRetenido), columnasConPos[9].x + columnasConPos[9].ancho - 1, yPos, { align: 'right' });
      }
    }
    
    yPos += 10;
    
    // Estadísticas del procesamiento
    pdf.setFontSize(9);
    pdf.text('RESUMEN DEL PROCESAMIENTO', margin.left, yPos);
    yPos += 6;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Transacciones procesadas: ${transaccionesProcesadas}`, margin.left + 10, yPos);
    yPos += 4;
    
    if (transaccionesConErrores > 0) {
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Transacciones con errores: ${transaccionesConErrores}`, margin.left + 10, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 4;
    }
    
    if (this.missingFields.size > 0) {
      pdf.text(`Campos sin datos: ${this.missingFields.size}`, margin.left + 10, yPos);
      yPos += 4;
    }
    
    // ========== METADATOS DE GENERACIÓN ==========
    yPos = pageHeight - 20;
    pdf.setLineWidth(0.3);
    pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
    yPos += 5;
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    
    const timestamp = new Date();
    pdf.text(`Documento generado el ${timestamp.toLocaleDateString()} a las ${timestamp.toLocaleTimeString()}`, margin.left, yPos);
    yPos += 3;
    pdf.text(`Sistema de Gestión Tributaria - Ambiente de Producción`, margin.left, yPos);
    yPos += 3;
    pdf.text(`Hash del documento: ${this.generateDocumentHash(transactions)}`, margin.left, yPos);
    
    // Log final
    console.log('✅ Libro Mayor generado exitosamente');
    console.log(`📊 Estadísticas:`);
    console.log(`   - Transacciones procesadas: ${transaccionesProcesadas}`);
    console.log(`   - Transacciones con errores: ${transaccionesConErrores}`);
    console.log(`   - Total Base Imponible: ${totalBase}`);
    console.log(`   - Total Retenido: ${totalRetenido}`);
    console.log(`   - Campos faltantes: ${this.missingFields.size}`);
    
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
  }

  /**
   * Carga datos de empresa con validación estricta
   */
  private async loadCompanyDataStrict(): Promise<CompanyInfo> {
    try {
      const company = await companyDataProvider.getCompanyForPDF();
      
      // Validación estricta - no permitir valores por defecto
      if (!company?.rif) {
        throw new Error('RIF de empresa no encontrado en base de datos');
      }
      if (!company?.name) {
        throw new Error('Razón social no encontrada en base de datos');
      }
      
      // Retornar solo datos validados
      return {
        rif: company.rif,
        name: company.name,
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        nit: company.nit || '',
        fiscalYear: company.fiscalYear || new Date().getFullYear().toString()
      };
      
    } catch (error) {
      console.error('❌ Error crítico obteniendo datos de empresa:', error);
      throw error;
    }
  }

  /**
   * Obtiene etiqueta de estado real
   */
  private getStatusLabel(status: string | undefined): string {
    if (!status) return '';
    
    const statusMap: Record<string, string> = {
      'PENDING': 'Pendiente',
      'PAID': 'Pagado',
      'DECLARED': 'Declarado',
      'CANCELLED': 'Anulado',
      'PARTIAL': 'Parcial'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Genera hash único del documento para auditoría
   */
  private generateDocumentHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  }

  /**
   * Obtiene registro de campos faltantes
   */
  getMissingFieldsReport(): {
    fields: string[],
    count: number,
    log: Array<{field: string, reason: string}>
  } {
    return {
      fields: Array.from(this.missingFields),
      count: this.missingFields.size,
      log: this.generationLog
    };
  }

  /**
   * Descarga el archivo PDF
   */
  downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`📥 Archivo descargado: ${fileName}`);
  }
}

export const pdfGenerator = PDFGenerator.getInstance();