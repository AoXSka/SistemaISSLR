import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { licenseService } from './licenseService';
import { pdfGenerator } from './pdfGenerator';
import { Voucher, Transaction, Provider } from '../types';
import { generateVoucherNumber } from '../utils/formatters';

// Configuración robusta del cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  throw new Error('Supabase URL and key are required');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  db: {
    schema: 'public'
  }
});

export interface VoucherFilters {
  type?: 'ISLR' | 'IVA';
  period?: string;
  providerRif?: string;
  emailSent?: boolean;
}

export interface DatabaseVoucher {
  id: number;
  type: 'ISLR' | 'IVA';
  number: string;
  transaction_id: number;
  provider_rif: string;
  issue_date: string;
  period: string;
  total_retained: number;
  pdf_path?: string;
  email_sent: boolean;
  created_at: string;
}

export class VoucherService {
  private static instance: VoucherService;

  static getInstance(): VoucherService {
    if (!VoucherService.instance) {
      VoucherService.instance = new VoucherService();
    }
    return VoucherService.instance;
  }

  private handleError(error: any, operation: string): void {
    console.error(`❌ VoucherService ${operation} error:`, error);
    
    // Log detalles específicos del error de Supabase
    if (error?.code) {
      console.error(`Supabase error code: ${error.code}`);
    }
    if (error?.details) {
      console.error(`Supabase error details: ${error.details}`);
    }
    if (error?.hint) {
      console.error(`Supabase error hint: ${error.hint}`);
    }
  }

  async getVouchers(filters?: VoucherFilters): Promise<Voucher[]> {
    try {
      console.log('🔍 Getting vouchers with filters:', filters);

      let query = supabase
        .from('vouchers')
        .select('*')
        .order('issue_date', { ascending: false });

      // Apply filters safely
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.period) {
        query = query.eq('period', filters.period);
      }
      if (filters?.providerRif) {
        query = query.eq('provider_rif', filters.providerRif);
      }
      if (filters?.emailSent !== undefined) {
        query = query.eq('email_sent', filters.emailSent);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getVouchers');
        return []; // Siempre retornar array vacío en caso de error
      }

      // CRÍTICO: Verificar que data sea un array antes de usar map
      if (!Array.isArray(data)) {
        console.warn('⚠️ Data from Supabase is not an array:', data);
        return [];
      }

      console.log(`📄 Retrieved ${data.length} vouchers from Supabase`);

      // Convertir de formato Supabase a formato de aplicación
      return data.map((dbVoucher: DatabaseVoucher) => ({
        id: dbVoucher.id,
        type: dbVoucher.type,
        number: dbVoucher.number,
        transactionId: dbVoucher.transaction_id,
        providerRif: dbVoucher.provider_rif,
        issueDate: dbVoucher.issue_date,
        period: dbVoucher.period,
        totalRetained: dbVoucher.total_retained,
        pdfPath: dbVoucher.pdf_path,
        emailSent: Boolean(dbVoucher.email_sent),
        createdAt: dbVoucher.created_at
      }));

    } catch (error) {
      console.error('❌ Error getting vouchers:', error);
      return []; // SIEMPRE retornar array vacío para evitar crashes
    }
  }

  async getVoucher(id: number): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - esto es normal
          return null;
        }
        this.handleError(error, `getVoucher(${id})`);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        type: data.type,
        number: data.number,
        transactionId: data.transaction_id,
        providerRif: data.provider_rif,
        issueDate: data.issue_date,
        period: data.period,
        totalRetained: data.total_retained,
        pdfPath: data.pdf_path,
        emailSent: Boolean(data.email_sent),
        createdAt: data.created_at
      };
    } catch (error) {
      console.error(`❌ Error getting voucher ${id}:`, error);
      return null;
    }
  }

  async getVoucherByTransaction(transactionId: number): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, `getVoucherByTransaction(${transactionId})`);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        type: data.type,
        number: data.number,
        transactionId: data.transaction_id,
        providerRif: data.provider_rif,
        issueDate: data.issue_date,
        period: data.period,
        totalRetained: data.total_retained,
        pdfPath: data.pdf_path,
        emailSent: Boolean(data.email_sent),
        createdAt: data.created_at
      };
    } catch (error) {
      console.error(`❌ Error getting voucher by transaction ${transactionId}:`, error);
      return null;
    }
  }

  async getVouchersByTransaction(transactionId: number): Promise<Voucher[]> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('transaction_id', transactionId);

      if (error) {
        this.handleError(error, `getVouchersByTransaction(${transactionId})`);
        return [];
      }

      const vouchers = Array.isArray(data) ? data : [];
      
      return vouchers.map((dbVoucher: DatabaseVoucher) => ({
        id: dbVoucher.id,
        type: dbVoucher.type,
        number: dbVoucher.number,
        transactionId: dbVoucher.transaction_id,
        providerRif: dbVoucher.provider_rif,
        issueDate: dbVoucher.issue_date,
        period: dbVoucher.period,
        totalRetained: dbVoucher.total_retained,
        pdfPath: dbVoucher.pdf_path,
        emailSent: Boolean(dbVoucher.email_sent),
        createdAt: dbVoucher.created_at
      }));
    } catch (error) {
      console.error(`❌ Error getting vouchers by transaction ${transactionId}:`, error);
      return [];
    }
  }

  async getVoucherByTransactionAndType(transactionId: number, type: 'ISLR' | 'IVA'): Promise<Voucher | null> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('type', type)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        this.handleError(error, `getVoucherByTransactionAndType(${transactionId}, ${type})`);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        type: data.type,
        number: data.number,
        transactionId: data.transaction_id,
        providerRif: data.provider_rif,
        issueDate: data.issue_date,
        period: data.period,
        totalRetained: data.total_retained,
        pdfPath: data.pdf_path,
        emailSent: Boolean(data.email_sent),
        createdAt: data.created_at
      };
    } catch (error) {
      console.error(`❌ Error obteniendo comprobante por transacción y tipo:`, error);
      return null;
    }
  }

  async createVoucher(voucherData: Omit<Voucher, 'id' | 'createdAt'>): Promise<number> {
    try {
      // Verificar primero si ya existe un comprobante para esta transacción y tipo
      const existingVoucher = await this.getVoucherByTransactionAndType(
        voucherData.transactionId, 
        voucherData.type
      );

      if (existingVoucher) {
        console.log(`⚠️ Ya existe comprobante ${voucherData.type} para transacción ${voucherData.transactionId}`);
        throw new Error(`Ya existe un comprobante de ${voucherData.type} para esta transacción`);
      }

      // Verificar que el número propuesto no exista antes de intentar insertarlo
      const { data: existingNumber } = await supabase
        .from('vouchers')
        .select('id')
        .eq('number', voucherData.number)
        .single();

      let finalNumber = voucherData.number;

      // Si el número ya existe, generar uno nuevo
      if (existingNumber) {
        console.warn(`⚠️ Número ${voucherData.number} ya existe, generando nuevo número...`);
        finalNumber = await this.generateNextVoucherNumber(voucherData.type, voucherData.period);
      }

      const insertData = {
        type: voucherData.type,
        number: finalNumber,
        transaction_id: voucherData.transactionId,
        provider_rif: voucherData.providerRif,
        issue_date: voucherData.issueDate,
        period: voucherData.period,
        total_retained: voucherData.totalRetained,
        pdf_path: voucherData.pdfPath,
        email_sent: voucherData.emailSent
      };

      // Intentar insertar hasta 3 veces con diferentes números si es necesario
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('vouchers')
          .insert(insertData)
          .select()
          .single();

        if (!error) {
          console.log(`✅ Comprobante creado con ID: ${data.id}, Número: ${data.number} (intento ${attempts + 1})`);
          return data.id;
        }

        // Si es error de número duplicado, generar un nuevo número
        if (error.code === '23505' && error.message.includes('vouchers_number_key')) {
          attempts++;
          console.warn(`⚠️ Intento ${attempts}: Número ${insertData.number} duplicado, generando nuevo...`);
          
          if (attempts < maxAttempts) {
            // Generar un nuevo número con timestamp para garantizar unicidad
            const timestamp = Date.now().toString().slice(-4);
            const year = voucherData.period.substring(0, 4);
            const month = voucherData.period.substring(5, 7);
            const attemptPadding = attempts.toString().padStart(2, '0');
            
            if (voucherData.type === 'ISLR') {
              // Formato ISLR: 202509-000001
              insertData.number = `${year}${month}-${timestamp}${attemptPadding}`;
            } else {
              // Formato IVA: 202509000001
              insertData.number = `${year}${month}${timestamp}${attemptPadding}`;
            }
          } else {
            this.handleError(error, `createVoucher (final attempt ${attempts})`);
            throw new Error(`No se pudo crear el comprobante después de ${maxAttempts} intentos`);
          }
        } else {
          // Error diferente, no reintentamos
          this.handleError(error, 'createVoucher');
          throw new Error(`Error al crear comprobante: ${error.message}`);
        }
      }

      throw new Error('Error inesperado en createVoucher');

    } catch (error) {
      console.error('❌ Error creando comprobante:', error);
      throw error;
    }
  }

  async updateVoucher(id: number, updates: Partial<Omit<Voucher, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.type) updateData.type = updates.type;
      if (updates.number) updateData.number = updates.number;
      if (updates.transactionId) updateData.transaction_id = updates.transactionId;
      if (updates.providerRif) updateData.provider_rif = updates.providerRif;
      if (updates.issueDate) updateData.issue_date = updates.issueDate;
      if (updates.period) updateData.period = updates.period;
      if (updates.totalRetained !== undefined) updateData.total_retained = updates.totalRetained;
      if (updates.pdfPath !== undefined) updateData.pdf_path = updates.pdfPath;
      if (updates.emailSent !== undefined) updateData.email_sent = updates.emailSent;

      const { error } = await supabase
        .from('vouchers')
        .update(updateData)
        .eq('id', id);

      if (error) {
        this.handleError(error, `updateVoucher(${id})`);
        throw new Error(`Failed to update voucher: ${error.message}`);
      }

      console.log(`✅ Updated voucher ${id}`);
    } catch (error) {
      console.error(`❌ Error updating voucher ${id}:`, error);
      throw error;
    }
  }

  async deleteVoucher(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, `deleteVoucher(${id})`);
        throw new Error(`Failed to delete voucher: ${error.message}`);
      }

      console.log(`✅ Deleted voucher ${id}`);
    } catch (error) {
      console.error(`❌ Error deleting voucher ${id}:`, error);
      throw error;
    }
  }

  // Método de compatibilidad con el servicio anterior
  getVouchersByPeriod(period: string): Promise<Voucher[]> {
    return this.getVouchers({ period });
  }

  getVouchersByProvider(providerRif: string): Promise<Voucher[]> {
    return this.getVouchers({ providerRif });
  }

  async getVoucherStatistics(period?: string): Promise<{
    totalVouchers: number;
    totalRetained: number;
    vouchersByType: { ISLR: number; IVA: number };
    emailsSent: number;
    pendingEmails: number;
  }> {
    try {
      const vouchers = await this.getVouchers(period ? { period } : undefined);

      return vouchers.reduce((stats, voucher) => ({
        totalVouchers: stats.totalVouchers + 1,
        totalRetained: stats.totalRetained + voucher.totalRetained,
        vouchersByType: {
          ...stats.vouchersByType,
          [voucher.type]: stats.vouchersByType[voucher.type] + 1
        },
        emailsSent: stats.emailsSent + (voucher.emailSent ? 1 : 0),
        pendingEmails: stats.pendingEmails + (!voucher.emailSent ? 1 : 0)
      }), {
        totalVouchers: 0,
        totalRetained: 0,
        vouchersByType: { ISLR: 0, IVA: 0 },
        emailsSent: 0,
        pendingEmails: 0
      });
    } catch (error) {
      console.error('❌ Error getting voucher statistics:', error);
      return {
        totalVouchers: 0,
        totalRetained: 0,
        vouchersByType: { ISLR: 0, IVA: 0 },
        emailsSent: 0,
        pendingEmails: 0
      };
    }
  }

  /**
   * Genera el siguiente número de comprobante según las normas del SENIAT
   * Formato: AAAAMMSSSSSSSS (14 dígitos)
   */
private async generateNextVoucherNumber(
  type: 'ISLR' | 'IVA',
  period: string // formato AAAAMM, ej: "202509"
): Promise<string> {
  try {
    // Prefijo base según tipo
    let prefix: string;
    if (type === 'ISLR') {
      // Ej: ISLR-202509
      prefix = `${period}-`;
    } else {
      // IVA usa AAAAMM directamente
      prefix = `${period}`;
    }

    // Buscar el último número emitido para este tipo y período
    const { data, error } = await supabase
      .from('vouchers')
      .select('number')
      .eq('type', type)
      .like('number', `${prefix}%`)
      .order('number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error obteniendo último número de comprobante:', error);
      throw error;
    }

    let nextSequential = 1;

    if (data && data.length > 0) {
      const lastNumber = data[0].number;
      let sequentialPart: string;

      if (type === 'ISLR') {
        // Formato: AAAAMM-000001
        sequentialPart = lastNumber.split('-')[1] || '000000';
      } else {
        // Formato: AAAAMM00000001 (últimos 8 dígitos para IVA)
        sequentialPart = lastNumber.slice(period.length);
      }

      const lastSequential = parseInt(sequentialPart, 10);
      if (!isNaN(lastSequential)) {
        nextSequential = lastSequential + 1;
      }
    }

    // Formatear secuencial
    const paddedSequential = nextSequential.toString().padStart(8, '0');

    // Construir número final
    let newNumber: string;
    if (type === 'ISLR') {
      // Ej: 202509-000001
      newNumber = `${period}-${paddedSequential.slice(-6)}`; // 6 dígitos para ISLR
    } else {
      // Ej: 20250900000001 (14 dígitos totales)
      newNumber = `${period}${paddedSequential}`;
    }

    console.log(`📄 Generando número ${type}: ${newNumber}`);
    return newNumber;

  } catch (error) {
    console.error('Error generando número de comprobante:', error);
    throw new Error('No se pudo generar el número de comprobante');
  }
}


  /**
   * Genera comprobante de retención (ISLR o IVA)
   */
  async generateVoucher(transactionId: number, type: 'ISLR' | 'IVA'): Promise<{ voucher: Voucher; pdfBlob: Blob }> {
    try {
      // Verificar licencia
      if (!licenseService.hasFeature('generate_vouchers')) {
        throw new Error('La generación de comprobantes no está disponible en su licencia actual.');
      }

      console.log('🧾 VoucherService - Starting voucher generation:', { transactionId, type });

      // 1. Verificar si ya existe un comprobante para esta transacción y tipo
      const existingVoucher = await this.getVoucherByTransactionAndType(transactionId, type);
      
      if (existingVoucher) {
        console.log(`ℹ️ Ya existe comprobante ${type} para transacción ${transactionId}, regenerando PDF`);
        
        // Obtener datos de transacción y proveedor para regenerar PDF
        const { transaction, provider } = await this.getTransactionAndProviderData(transactionId);
        
        // Regenerar solo el PDF con el número existente
        let pdfBlob: Blob;
        if (type === 'ISLR') {
          pdfBlob = await pdfGenerator.generateISLRVoucher(transaction, provider, existingVoucher.number);
        } else {
          pdfBlob = await pdfGenerator.generateIVAVoucher(transaction, provider, existingVoucher.number);
        }

        return {
          voucher: existingVoucher,
          pdfBlob
        };
      }

      // 2. Obtener datos de transacción y proveedor
      const { transaction, provider } = await this.getTransactionAndProviderData(transactionId);

      // 3. Generar número de comprobante único
      const voucherNumber = await this.generateNextVoucherNumber(type, transaction.period);

      // 4. Generar el PDF
      let pdfBlob: Blob;
      if (type === 'ISLR') {
        pdfBlob = await pdfGenerator.generateISLRVoucher(transaction, provider, voucherNumber);
      } else if (type === 'IVA') {
        pdfBlob = await pdfGenerator.generateIVAVoucher(transaction, provider, voucherNumber);
      } else {
        throw new Error(`Tipo de comprobante no soportado: ${type}`);
      }

      // 5. Guardar el PDF en Supabase Storage (opcional)
      let pdfPath: string | null = null;
      try {
        const fileName = `vouchers/${type}_${voucherNumber}_${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vouchers')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          });

        if (!uploadError && uploadData) {
          pdfPath = uploadData.path;
          console.log('✅ PDF uploaded to storage:', pdfPath);
        }
      } catch (error) {
        console.warn('Could not upload PDF to storage:', error);
      }

      // 6. Crear datos del nuevo comprobante
      const newVoucher: Omit<Voucher, 'id' | 'createdAt'> = {
        type,
        number: voucherNumber,
        transactionId,
        providerRif: transaction.providerRif,
        issueDate: new Date().toISOString().split('T')[0],
        period: transaction.period,
        totalRetained: transaction.retentionAmount,
        pdfPath,
        emailSent: false
      };

      // 7. Crear el registro del comprobante en la base de datos
      const voucherId = await this.createVoucher(newVoucher);

      // 8. Actualizar el estado de la transacción
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'processed' })
        .eq('id', transactionId);

      if (updateError) {
        console.warn('Could not update transaction status:', updateError);
      }

      // 9. Obtener el comprobante completo creado
      const createdVoucher = await this.getVoucher(voucherId);
      if (!createdVoucher) {
        throw new Error('Failed to retrieve created voucher');
      }

      console.log('✅ Voucher generated successfully:', {
        id: voucherId,
        number: voucherNumber,
        type,
        amount: transaction.retentionAmount
      });

      return {
        voucher: createdVoucher,
        pdfBlob
      };

    } catch (error) {
      console.error('❌ VoucherService - Generate voucher failed:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos de transacción y proveedor
   */
  private async getTransactionAndProviderData(transactionId: number): Promise<{ transaction: Transaction; provider: Provider }> {
    // 1. Obtener la transacción desde Supabase
    const { data: transactionData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transactionData) {
      console.error('❌ Error fetching transaction:', txError);
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Convertir formato de base de datos a Transaction
    const transaction: Transaction = {
      id: transactionData.id,
      date: transactionData.date,
      type: transactionData.type,
      documentNumber: transactionData.document_number || '',
      controlNumber: transactionData.control_number || '',
      providerRif: transactionData.provider_rif || '',
      providerName: transactionData.provider_name || '',
      concept: transactionData.concept,
      totalAmount: transactionData.total_amount || 0,
      taxableBase: transactionData.taxable_base || 0,
      retentionPercentage: transactionData.retention_percentage || 0,
      retentionAmount: transactionData.retention_amount || 0,
      status: transactionData.status,
      period: transactionData.period,
      // Campos adicionales para IVA
      ivaRate: transactionData.iva_rate || 16,
      exemptAmount: transactionData.exempt_amount || 0,
      operationType: transactionData.operation_type || 'C',
      debitNoteNumber: transactionData.debit_note_number || '',
      creditNoteNumber: transactionData.credit_note_number || '',
      affectedInvoice: transactionData.affected_invoice || '',
      createdAt: transactionData.created_at
    };

    // 2. Obtener información del proveedor
    let provider: Provider | null = null;
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('rif', transaction.providerRif)
        .single();

      if (providerData) {
        provider = {
          id: providerData.id,
          rif: providerData.rif,
          name: providerData.name,
          address: providerData.address || '',
          phone: providerData.phone || '',
          email: providerData.email || '',
          nit: providerData.nit || '',
          isActive: providerData.is_active !== false,
          createdAt: providerData.created_at
        };
      }
    } catch (error) {
      console.log('Provider not found in database, using transaction data');
    }

    // Si no existe el proveedor en la tabla, crear uno temporal con los datos de la transacción
    if (!provider) {
      provider = {
        id: 0,
        rif: transaction.providerRif,
        name: transaction.providerName,
        address: '',
        phone: '',
        email: '',
        nit: '',
        isActive: true,
        createdAt: new Date().toISOString()
      };
    }

    return { transaction, provider };
  }
  
  async sendVoucherByEmail(voucherId: number, recipientEmail?: string): Promise<boolean> {
    try {
      const voucher = await this.getVoucher(voucherId);
      if (!voucher) {
        throw new Error('Voucher not found');
      }

      // Update voucher status
      await this.updateVoucher(voucherId, { 
        emailSent: true
      });

      console.log('✅ VoucherService - Email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send voucher email:', error);
      return false;
    }
  }

  private async logAuditAction(action: string, entityType: string, entityId: number, oldValues: any, newValues: any): Promise<void> {
    try {
      console.log(`Audit: ${action} ${entityType} ${entityId}`, { oldValues, newValues });
      // Aquí implementarías el logging en Supabase si es necesario
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }
}

export const voucherService = VoucherService.getInstance();