import { db } from './databaseService';
import { licenseService } from './licenseService';
import { auditService } from './auditService';
import { authService } from './authService';
import { Purchase, PurchaseCategory, PurchaseStatistics } from '../types';
import { rifValidator } from '../utils/rifValidator';

export class PurchaseService {
  private static instance: PurchaseService;
  private readonly CATEGORIES_KEY = 'contave-purchase-categories-v2';

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  // ==================== CRUD Operations ====================

  async createPurchase(purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      // Temporalmente desactivar verificación de licencia para desarrollo
      // if (!licenseService.hasFeature('manage_purchases')) {
      //   throw new Error('La gestión de compras no está disponible en su licencia actual.');
      // }

      // Validate purchase data
      this.validatePurchase(purchaseData);

      // Calculate derived fields
      const calculatedData = this.calculatePurchaseAmounts(purchaseData);

      // Crear transacción en Supabase como tipo EXPENSE
      const transactionId = await db.createTransaction({
        date: purchaseData.date,
        type: 'EXPENSE',
        document_number: purchaseData.invoiceNumber,
        control_number: purchaseData.controlNumber,
        provider_rif: purchaseData.providerRif,
        provider_name: purchaseData.providerName,
        concept: purchaseData.concept,
        total_amount: calculatedData.totalAmount,
        taxable_base: calculatedData.netAmount || 0,
        retention_percentage: 0,
        retention_amount: 0,
        status: (purchaseData.status?.toUpperCase() || 'PENDING') as 'PENDING' | 'PAID' | 'DECLARED',
        period: purchaseData.period,
        created_by: authService.getCurrentUser()?.id
      });

      console.log('✅ Purchase created in Supabase with ID:', transactionId);
      return transactionId;
    } catch (error) {
      console.error('❌ Error creating purchase:', error);
      throw error;
    }
  }

  async updatePurchase(id: number, updates: Partial<Purchase>): Promise<void> {
    try {
      const oldPurchase = await this.getPurchase(id);
      if (!oldPurchase) {
        throw new Error('Compra no encontrada');
      }

      // Validate updates
      this.validatePurchaseUpdates(updates);

      // Recalculate amounts if financial fields changed
      const calculatedUpdates = this.hasFinancialChanges(updates) 
        ? this.calculatePurchaseAmounts({ ...oldPurchase, ...updates })
        : updates;

      // Actualizar en Supabase
      const updateData: any = {};
      
      if (calculatedUpdates.date !== undefined) updateData.date = calculatedUpdates.date;
      if (calculatedUpdates.invoiceNumber !== undefined) updateData.document_number = calculatedUpdates.invoiceNumber;
      if (calculatedUpdates.controlNumber !== undefined) updateData.control_number = calculatedUpdates.controlNumber;
      if (calculatedUpdates.providerRif !== undefined) updateData.provider_rif = calculatedUpdates.providerRif;
      if (calculatedUpdates.providerName !== undefined) updateData.provider_name = calculatedUpdates.providerName;
      if (calculatedUpdates.concept !== undefined) updateData.concept = calculatedUpdates.concept;
      if (calculatedUpdates.totalAmount !== undefined) updateData.total_amount = calculatedUpdates.totalAmount;
      if (calculatedUpdates.netAmount !== undefined) updateData.taxable_base = calculatedUpdates.netAmount;
      if (calculatedUpdates.status !== undefined) updateData.status = calculatedUpdates.status.toUpperCase();
      if (calculatedUpdates.period !== undefined) updateData.period = calculatedUpdates.period;

      await db.updateTransaction(id, updateData);
      console.log('✅ Purchase updated in Supabase:', id);
    } catch (error) {
      console.error('❌ Error updating purchase:', error);
      throw error;
    }
  }

  async getPurchase(id: number): Promise<Purchase | null> {
    try {
      const transaction = await db.getTransaction(id);
      if (!transaction || transaction.type !== 'EXPENSE') {
        return null;
      }

      return this.transactionToPurchase(transaction);
    } catch (error) {
      console.error('❌ Error getting purchase:', error);
      return null;
    }
  }

  async getPurchases(filters?: {
    startDate?: string;
    endDate?: string;
    providerRif?: string;
    category?: string;
    status?: string;
    paymentMethod?: string;
    period?: string;
  }): Promise<Purchase[]> {
    try {
      await db.connect();
      
      // Obtener transacciones tipo EXPENSE de Supabase
      const transactions = await db.getTransactions({
        ...filters,
        type: 'EXPENSE'
      });

      // Convertir transacciones a formato Purchase
      const purchases = transactions.map(t => this.transactionToPurchase(t));
      
      console.log(`📦 Retrieved ${purchases.length} purchases from Supabase`);
      return purchases;
    } catch (error) {
      console.error('❌ Error getting purchases from Supabase:', error);
      return [];
    }
  }

  async deletePurchase(id: number): Promise<void> {
    try {
      await db.deleteTransaction(id);
      console.log('✅ Purchase deleted from Supabase:', id);
    } catch (error) {
      console.error('❌ Error deleting purchase:', error);
      throw error;
    }
  }

  // ==================== Conversión de formatos ====================

  private transactionToPurchase(transaction: any): Purchase {
    return {
      id: transaction.id,
      date: transaction.date,
      invoiceNumber: transaction.document_number || '',
      controlNumber: transaction.control_number || '',
      providerRif: transaction.provider_rif || '',
      providerName: transaction.provider_name || '',
      concept: transaction.concept,
      category: transaction.category || 'GENERAL',
      netAmount: transaction.taxable_base || 0,
      exemptAmount: transaction.exempt_amount || 0,
      taxableBase: transaction.taxable_base || 0,
      ivaRate: transaction.iva_rate || 16,
      ivaAmount: transaction.iva_amount || (transaction.taxable_base || 0) * 0.16,
      totalAmount: transaction.total_amount,
      paymentMethod: transaction.payment_method || 'transfer',
      currency: transaction.currency || 'VES',
      exchangeRate: transaction.exchange_rate || 1,
      status: transaction.status?.toLowerCase() || 'pending',
      period: transaction.period,
      createdAt: transaction.created_at,
      createdBy: transaction.created_by || 'system',
      observations: transaction.observations || ''
    };
  }

  // ==================== Validaciones corregidas ====================
  
  private validatePurchase(purchase: Partial<Purchase>): void {
    const errors: string[] = [];

    if (!purchase.date) errors.push('La fecha es obligatoria');
    if (!purchase.invoiceNumber) errors.push('El número de factura es obligatorio');
    if (!purchase.providerRif) errors.push('El RIF del proveedor es obligatorio');
    if (!purchase.providerName) errors.push('El nombre del proveedor es obligatorio');
    if (!purchase.concept) errors.push('El concepto es obligatorio');

    // Validación actualizada del número de control - acepta XX-XXXXXX o XX-XXXXXXXX
    if (purchase.controlNumber) {
      const controlNumberRegex = /^\d{2}-\d{6,8}$/;
      if (!controlNumberRegex.test(purchase.controlNumber)) {
        errors.push('Formato de número de control inválido (debe ser XX-XXXXXX o XX-XXXXXXXX)');
      }
    }

    // Validación del RIF si está presente
    if (purchase.providerRif && !rifValidator.validate(purchase.providerRif)) {
      errors.push('El RIF del proveedor es inválido');
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación:\n${errors.join('\n')}`);
    }
  }

  private validatePurchaseUpdates(updates: Partial<Purchase>): void {
    if (updates.providerRif && !rifValidator.validate(updates.providerRif)) {
      throw new Error('El RIF del proveedor es inválido');
    }

    if (updates.date) {
      const purchaseDate = new Date(updates.date);
      const now = new Date();
      if (purchaseDate > now) {
        throw new Error('La fecha de la factura no puede ser futura');
      }
    }

    // Validación actualizada del número de control
    if (updates.controlNumber) {
      const controlNumberRegex = /^\d{2}-\d{6,8}$/;
      if (!controlNumberRegex.test(updates.controlNumber)) {
        throw new Error('Formato de número de control inválido (debe ser XX-XXXXXX o XX-XXXXXXXX)');
      }
    }
  }

  // ==================== Statistics & Reports ====================

  async getPurchaseStatistics(period?: string): Promise<PurchaseStatistics> {
    try {
      const purchases = await this.getPurchases(period ? { period } : {});
      
      const totalPurchases = purchases.length;
      const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalIVA = purchases.reduce((sum, p) => sum + p.ivaAmount, 0);
      const totalNet = purchases.reduce((sum, p) => sum + p.netAmount, 0);
      const averageAmount = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

      // Group by category
      const byCategory = purchases.reduce((acc, p) => {
        if (!acc[p.category]) {
          acc[p.category] = { count: 0, amount: 0 };
        }
        acc[p.category].count++;
        acc[p.category].amount += p.totalAmount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // Group by payment method
      const byPaymentMethod = purchases.reduce((acc, p) => {
        if (!acc[p.paymentMethod]) {
          acc[p.paymentMethod] = { count: 0, amount: 0 };
        }
        acc[p.paymentMethod].count++;
        acc[p.paymentMethod].amount += p.totalAmount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // Group by status
      const byStatus = purchases.reduce((acc, p) => {
        if (!acc[p.status]) {
          acc[p.status] = { count: 0, amount: 0 };
        }
        acc[p.status].count++;
        acc[p.status].amount += p.totalAmount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // Monthly trend
      const monthlyTrend = this.calculateMonthlyTrend(purchases);

      return {
        totalPurchases,
        totalAmount,
        totalIVA,
        totalNet,
        averageAmount,
        byCategory,
        byPaymentMethod,
        byStatus,
        monthlyTrend
      };
    } catch (error) {
      console.error('❌ Error getting purchase statistics:', error);
      return {
        totalPurchases: 0,
        totalAmount: 0,
        totalIVA: 0,
        totalNet: 0,
        averageAmount: 0,
        byCategory: {},
        byPaymentMethod: {},
        byStatus: {},
        monthlyTrend: []
      };
    }
  }

  // ==================== Métodos de exportación e importación ====================
  
  async exportToCSV(filters?: any): Promise<string> {
    try {
      const purchases = await this.getPurchases(filters);
      const headers = [
        'ID', 'Fecha', 'Número Factura', 'Número Control', 'RIF Proveedor',
        'Nombre Proveedor', 'Concepto', 'Categoría', 'Monto Neto', 
        'Monto Exento', 'Base Imponible', 'Tasa IVA', 'Monto IVA', 
        'Total', 'Método Pago', 'Moneda', 'Tasa Cambio', 'Estado', 
        'Período', 'Observaciones'
      ];

      const rows = purchases.map(p => [
        p.id,
        p.date,
        p.invoiceNumber,
        p.controlNumber,
        p.providerRif,
        p.providerName,
        p.concept,
        p.category,
        p.netAmount,
        p.exemptAmount,
        p.taxableBase,
        p.ivaRate,
        p.ivaAmount,
        p.totalAmount,
        p.paymentMethod,
        p.currency,
        p.exchangeRate,
        p.status,
        p.period,
        p.observations || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('❌ Error exporting to CSV:', error);
      throw error;
    }
  }

  async exportToJSON(filters?: any): Promise<string> {
    try {
      const purchases = await this.getPurchases(filters);
      return JSON.stringify(purchases, null, 2);
    } catch (error) {
      console.error('❌ Error exporting to JSON:', error);
      throw error;
    }
  }

  // ==================== Métodos auxiliares ====================
  
  private calculatePurchaseAmounts(purchase: Partial<Purchase>): Partial<Purchase> {
    const netAmount = purchase.netAmount || 0;
    const exemptAmount = purchase.exemptAmount || 0;
    const ivaRate = purchase.ivaRate || 16;
    const exchangeRate = purchase.exchangeRate || 1;

    const taxableBase = netAmount - exemptAmount;
    const ivaAmount = taxableBase * (ivaRate / 100);
    const totalAmount = netAmount + ivaAmount;
    const finalAmount = purchase.currency !== 'VES' 
      ? totalAmount * exchangeRate 
      : totalAmount;

    return {
      ...purchase,
      taxableBase,
      ivaAmount,
      totalAmount: finalAmount
    };
  }

  private hasFinancialChanges(updates: Partial<Purchase>): boolean {
    const financialFields = ['netAmount', 'exemptAmount', 'ivaRate', 'exchangeRate', 'currency'];
    return financialFields.some(field => field in updates);
  }

  private calculateMonthlyTrend(purchases: Purchase[]): Array<{ month: string; amount: number; count: number }> {
    const monthlyData: Record<string, { amount: number; count: number }> = {};

    purchases.forEach(p => {
      const month = p.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { amount: 0, count: 0 };
      }
      monthlyData[month].amount += p.totalAmount;
      monthlyData[month].count++;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  // Métodos de categorías permanecen igual usando localStorage
  async getCategories(): Promise<PurchaseCategory[]> {
    try {
      const categories = localStorage.getItem(this.CATEGORIES_KEY);
      return categories ? JSON.parse(categories) : this.getDefaultCategories();
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      return this.getDefaultCategories();
    }
  }

  private getDefaultCategories(): PurchaseCategory[] {
    return [
      { id: 1, code: 'INV', name: 'Inventario', description: 'Compras de mercancía para inventario', accountCode: '1.1.3', isActive: true, createdAt: new Date().toISOString() },
      { id: 2, code: 'SRV', name: 'Servicios', description: 'Servicios profesionales y técnicos', accountCode: '5.1.1', isActive: true, createdAt: new Date().toISOString() },
      { id: 3, code: 'ALQ', name: 'Alquileres', description: 'Alquileres de locales y equipos', accountCode: '5.1.2', isActive: true, createdAt: new Date().toISOString() },
      { id: 4, code: 'PUB', name: 'Publicidad', description: 'Gastos de publicidad y mercadeo', accountCode: '5.1.3', isActive: true, createdAt: new Date().toISOString() },
      { id: 5, code: 'MNT', name: 'Mantenimiento', description: 'Mantenimiento y reparaciones', accountCode: '5.1.4', isActive: true, createdAt: new Date().toISOString() },
      { id: 6, code: 'SUM', name: 'Suministros', description: 'Suministros de oficina', accountCode: '5.1.5', isActive: true, createdAt: new Date().toISOString() },
      { id: 7, code: 'TRN', name: 'Transporte', description: 'Gastos de transporte y fletes', accountCode: '5.1.6', isActive: true, createdAt: new Date().toISOString() },
      { id: 8, code: 'UTI', name: 'Servicios Básicos', description: 'Electricidad, agua, teléfono, internet', accountCode: '5.1.7', isActive: true, createdAt: new Date().toISOString() },
      { id: 9, code: 'SEG', name: 'Seguros', description: 'Pólizas de seguros', accountCode: '5.1.8', isActive: true, createdAt: new Date().toISOString() },
      { id: 10, code: 'IMP', name: 'Impuestos', description: 'Impuestos y tasas', accountCode: '5.2.1', isActive: true, createdAt: new Date().toISOString() },
      { id: 11, code: 'OTR', name: 'Otros', description: 'Otros gastos operativos', accountCode: '5.9.9', isActive: true, createdAt: new Date().toISOString() }
    ];
  }
}

export const purchaseService = PurchaseService.getInstance();