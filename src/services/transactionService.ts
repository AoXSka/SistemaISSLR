import { db } from './databaseService';
import { Transaction } from '../types';
import { rifValidator } from '../utils/rifValidator';

export class TransactionService {
  private static instance: TransactionService;

  private convertDbTransactionToTransaction(dbTransaction: any): Transaction {
    return {
      id: dbTransaction.id,
      date: dbTransaction.date,
      type: dbTransaction.type,
      documentNumber: dbTransaction.documentNumber || dbTransaction.document_number || '',
      controlNumber: dbTransaction.controlNumber || dbTransaction.control_number || '',
      providerRif: dbTransaction.providerRif || dbTransaction.provider_rif || '',
      providerName: dbTransaction.providerName || dbTransaction.provider_name || '',
      concept: dbTransaction.concept,
      totalAmount: dbTransaction.totalAmount || dbTransaction.total_amount || 0,
      taxableBase: dbTransaction.taxableBase || dbTransaction.taxable_base || 0,
      retentionPercentage: dbTransaction.retentionPercentage || dbTransaction.retention_percentage || 0,
      retentionAmount: dbTransaction.retentionAmount || dbTransaction.retention_amount || 0,
      status: dbTransaction.status,
      period: dbTransaction.period,
      createdAt: dbTransaction.createdAt || dbTransaction.created_at || new Date().toISOString()
    };
  }

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<{
    success: boolean;
    data: Transaction;
    id: number;
  }> {
    // Validate transaction data
    this.validateTransaction(transaction);

    try {
      await db.connect();

      // CORRECCIÓN: Validación de coherencia contable antes de guardar
      const coherenceCheck = this.validateTransactionCoherence(transaction);
      if (!coherenceCheck.isValid) {
        throw new Error(`Errores de coherencia contable: ${coherenceCheck.errors.join(', ')}`);
      }

      // Ensure all required fields have proper defaults
      const transactionData = {
        ...transaction,
        documentNumber: transaction.documentNumber || '',
        controlNumber: transaction.controlNumber || '',
        providerRif: transaction.providerRif || '',
        providerName: transaction.providerName || '',
        // CORRECCIÓN: Aplicar redondeo contable a todos los montos
        totalAmount: Math.round((transaction.totalAmount || 0) * 100) / 100,
        taxableBase: Math.round((transaction.taxableBase || 0) * 100) / 100,
        retentionPercentage: Math.round((transaction.retentionPercentage || 0) * 100) / 100,
        retentionAmount: Math.round((transaction.retentionAmount || 0) * 100) / 100
      };

      // NUEVO: Convertir a formato de base de datos (snake_case)
      const dbTransactionData = {
        date: transactionData.date,
        type: transactionData.type,
        document_number: transactionData.documentNumber,
        control_number: transactionData.controlNumber,
        provider_rif: transactionData.providerRif,
        provider_name: transactionData.providerName,
        concept: transactionData.concept,
        total_amount: transactionData.totalAmount,
        taxable_base: transactionData.taxableBase,
        retention_percentage: transactionData.retentionPercentage,
        retention_amount: transactionData.retentionAmount,
        status: transactionData.status,
        period: transactionData.period
      };

      const id = await db.createTransaction(dbTransactionData);

      // 🔥 FIX CRÍTICO: Crear objeto de transacción completo para retornar
      const completeTransaction: Transaction = {
        id,
        date: transactionData.date,
        type: transactionData.type,
        documentNumber: transactionData.documentNumber,
        controlNumber: transactionData.controlNumber,
        providerRif: transactionData.providerRif,
        providerName: transactionData.providerName,
        concept: transactionData.concept,
        totalAmount: transactionData.totalAmount,
        taxableBase: transactionData.taxableBase,
        retentionPercentage: transactionData.retentionPercentage,
        retentionAmount: transactionData.retentionAmount,
        status: transactionData.status,
        period: transactionData.period,
        createdAt: new Date().toISOString()
      };

      // Create audit log entry
      await this.logAuditAction('CREATE', 'transaction', id, null, transactionData);

      console.log('✅ Transaction created successfully:', { 
        id, 
        type: transactionData.type, 
        amount: transactionData.totalAmount,
        provider: transactionData.providerName
      });

      // 🔥 FIX CRÍTICO: Retornar objeto completo con la transacción
      return {
        success: true,
        data: completeTransaction,
        id
      };
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

async updateTransaction(id: number, updates: Partial<Transaction>): Promise<{
  success: boolean;
  data: Transaction;
}> {
  const oldTransaction = await this.getTransaction(id);
  if (!oldTransaction) {
    throw new Error('Transaction not found');
  }

  console.log('🔧 TransactionService - Updating transaction:', { 
    id, 
    updates, 
    oldStatus: oldTransaction.status,
    newStatus: updates.status
  });

  // Validate updates
  this.validateTransactionUpdates(updates);

  try {
    await db.connect();

    // Validate that the transaction exists
    const existingTransaction = await db.getTransaction(id);
    if (!existingTransaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    // NUEVO: Convertir updates a snake_case para la base de datos
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.documentNumber !== undefined) dbUpdates.document_number = updates.documentNumber;
    if (updates.controlNumber !== undefined) dbUpdates.control_number = updates.controlNumber;
    if (updates.providerRif !== undefined) dbUpdates.provider_rif = updates.providerRif;
    if (updates.providerName !== undefined) dbUpdates.provider_name = updates.providerName;
    if (updates.concept !== undefined) dbUpdates.concept = updates.concept;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.taxableBase !== undefined) dbUpdates.taxable_base = updates.taxableBase;
    if (updates.retentionPercentage !== undefined) dbUpdates.retention_percentage = updates.retentionPercentage;
    if (updates.retentionAmount !== undefined) dbUpdates.retention_amount = updates.retentionAmount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.period !== undefined) dbUpdates.period = updates.period;

    // Usar dbUpdates en lugar de updates
    await db.updateTransaction(id, dbUpdates);

    // 🔥 FIX CRÍTICO: Obtener la transacción actualizada completa
    const updatedTransaction = await db.getTransaction(id);
    if (!updatedTransaction) {
      throw new Error('Failed to retrieve updated transaction');
    }

    // Convertir al formato Transaction
    const completeUpdatedTransaction: Transaction = {
      id: updatedTransaction.id,
      date: updatedTransaction.date,
      type: updatedTransaction.type,
      documentNumber: updatedTransaction.document_number || updatedTransaction.documentNumber || '',
      controlNumber: updatedTransaction.control_number || updatedTransaction.controlNumber || '',
      providerRif: updatedTransaction.provider_rif || updatedTransaction.providerRif || '',
      providerName: updatedTransaction.provider_name || updatedTransaction.providerName || '',
      concept: updatedTransaction.concept,
      totalAmount: updatedTransaction.total_amount || updatedTransaction.totalAmount,
      taxableBase: updatedTransaction.taxable_base || updatedTransaction.taxableBase || 0,
      retentionPercentage: updatedTransaction.retention_percentage || updatedTransaction.retentionPercentage || 0,
      retentionAmount: updatedTransaction.retention_amount || updatedTransaction.retentionAmount || 0,
      status: updatedTransaction.status,
      period: updatedTransaction.period,
      createdAt: updatedTransaction.created_at || updatedTransaction.createdAt
    };

    // Create audit log entry
    await this.logAuditAction('UPDATE', 'transaction', id, existingTransaction, updates);

    console.log('✅ TransactionService - Transaction updated successfully:', {
      id,
      oldStatus: oldTransaction.status,
      newStatus: completeUpdatedTransaction.status
    });

    // 🔥 FIX CRÍTICO: Retornar la transacción actualizada completa
    return {
      success: true,
      data: completeUpdatedTransaction
    };
  } catch (error) {
    console.error('❌ TransactionService - Update failed:', error);
    throw new Error(`Failed to update transaction: ${error}`);
  }
}
  async getTransaction(id: number): Promise<Transaction | null> {
    try {
      return await db.getTransaction(id);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  async getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  providerRif?: string;
  searchTerm?: string;
  period?: string;
}): Promise<Transaction[]> {
  try {
    await db.connect();
    const dbTransactions = await db.getTransactions(filters);
    
    console.log('📊 TransactionService - Retrieved transactions:', {
      total: dbTransactions.length,
      filters,
      sample: dbTransactions.slice(0, 2).map(t => ({ 
        id: t.id, 
        type: t.type, 
        provider: t.provider_name || t.providerName  // ← Verificar ambos formatos
      }))
    });
    
    // Convert database format to Transaction type with validation
    return dbTransactions
      .filter(dbTx => dbTx && typeof dbTx === 'object')
      .map(dbTx => ({
        id: dbTx.id,
        date: dbTx.date,
        type: dbTx.type,
        // Mapear tanto snake_case como camelCase para compatibilidad
        documentNumber: dbTx.document_number || dbTx.documentNumber || '',
        controlNumber: dbTx.control_number || dbTx.controlNumber || '',
        providerRif: dbTx.provider_rif || dbTx.providerRif || '',
        providerName: dbTx.provider_name || dbTx.providerName || '',
        concept: dbTx.concept,
        totalAmount: dbTx.total_amount || dbTx.totalAmount || 0,
        taxableBase: dbTx.taxable_base || dbTx.taxableBase || 0,
        retentionPercentage: dbTx.retention_percentage || dbTx.retentionPercentage || 0,
        retentionAmount: dbTx.retention_amount || dbTx.retentionAmount || 0,
        status: dbTx.status,
        period: dbTx.period,
        createdAt: dbTx.created_at || dbTx.createdAt
      }))
      .filter(tx => tx.date); // Solo filtrar por fecha, no por campos que pueden estar vacíos
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
}

  async deleteTransaction(id: number): Promise<void> {
    const transaction = this.getTransaction(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    console.log('🗑️ TransactionService - Deleting transaction:', { id, provider: transaction.providerName });

    try {
      await db.deleteTransaction(id);
      
      console.log('✅ TransactionService - Transaction deleted successfully:', id);
      await this.logAuditAction('DELETE', 'transaction', id, transaction, null);
    } catch (error) {
      console.error('❌ TransactionService - Delete failed:', error);
      throw new Error(`Failed to delete transaction: ${error}`);
    }
  }

  async getTransactionsByPeriod(period: string): Promise<Transaction[]> {
    return await this.getTransactions({ period });
  }

  async getTransactionsByProvider(providerRif: string): Promise<Transaction[]> {
    return await this.getTransactions({ providerRif });
  }

  calculatePeriodTotals(period: string): {
    totalAmount: number;
    totalRetained: number;
    totalISLR: number;
    totalIVA: number;
    transactionCount: number;
  } {
    const transactions = this.getTransactionsByPeriod(period);
    
    return transactions.reduce((totals, transaction) => ({
      totalAmount: totals.totalAmount + transaction.totalAmount,
      totalRetained: totals.totalRetained + transaction.retentionAmount,
      totalISLR: totals.totalISLR + (transaction.type === 'ISLR' ? transaction.retentionAmount : 0),
      totalIVA: totals.totalIVA + (transaction.type === 'IVA' ? transaction.retentionAmount : 0),
      transactionCount: totals.transactionCount + 1
    }), {
      totalAmount: 0,
      totalRetained: 0,
      totalISLR: 0,
      totalIVA: 0,
      transactionCount: 0
    });
  }

  private validateTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): void {
    const errors: string[] = [];

    // RIF validation
    if (!rifValidator.isValid(transaction.providerRif)) {
      errors.push('RIF del proveedor inválido');
    }

    // Required fields
    if (!transaction.documentNumber) {
      errors.push('Número de documento es requerido');
    }

    if (!transaction.providerName) {
      errors.push('Nombre del proveedor es requerido');
    }

    if (transaction.taxableBase <= 0) {
      errors.push('Base imponible debe ser mayor a 0');
    }

    if (transaction.retentionAmount < 0) {
      errors.push('Monto de retención no puede ser negativo');
    }

    // Date validation
    const transactionDate = new Date(transaction.date);
    if (isNaN(transactionDate.getTime())) {
      errors.push('Fecha de transacción inválida');
    }

    // Period validation
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(transaction.period)) {
      errors.push('Formato de período inválido (YYYY-MM)');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  private validateTransactionUpdates(updates: Partial<Transaction>): void {
    const errors: string[] = [];

    if (updates.providerRif && !rifValidator.isValid(updates.providerRif)) {
      errors.push('RIF del proveedor inválido');
    }

    if (updates.taxableBase !== undefined && updates.taxableBase <= 0) {
      errors.push('Base imponible debe ser mayor a 0');
    }

    if (updates.retentionAmount !== undefined && updates.retentionAmount < 0) {
      errors.push('Monto de retención no puede ser negativo');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  // NUEVO: Validador de coherencia contable para transacciones
  private validateTransactionCoherence(transaction: Partial<Transaction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar montos no negativos
    if ((transaction.totalAmount || 0) < 0) {
      errors.push('Monto total no puede ser negativo');
    }
    if ((transaction.taxableBase || 0) < 0) {
      errors.push('Base imponible no puede ser negativa');
    }
    if ((transaction.retentionAmount || 0) < 0) {
      errors.push('Monto de retención no puede ser negativo');
    }
    
    // Validar coherencia IVA
    if (transaction.type === 'IVA' && transaction.taxableBase && transaction.retentionAmount) {
      const expectedIVA = (transaction.taxableBase * 16) / 100;
      const maxRetention = Math.max(
        (expectedIVA * 75) / 100,  // 75%
        (expectedIVA * 100) / 100  // 100%
      );
      
      if (transaction.retentionAmount > maxRetention + 0.01) {
        errors.push(`Retención IVA excede el máximo permitido: ${transaction.retentionAmount} > ${maxRetention.toFixed(2)}`);
      }
    }
    
    // Validar coherencia ISLR
    if (transaction.type === 'ISLR' && transaction.taxableBase && transaction.retentionPercentage && transaction.retentionAmount) {
      const expectedRetention = (transaction.taxableBase * transaction.retentionPercentage) / 100;
      const difference = Math.abs(expectedRetention - transaction.retentionAmount);
      
      if (difference > 0.01) {
        errors.push(`Retención ISLR calculada incorrectamente: Esperado ${expectedRetention.toFixed(2)}, Actual ${transaction.retentionAmount}`);
      }
    }
    
    // Validar período fiscal
    if (transaction.period && !/^\d{4}-\d{2}$/.test(transaction.period)) {
      errors.push('Formato de período inválido (debe ser YYYY-MM)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async logAuditAction(
    action: string,
    entityType: string,
    entityId: number,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    try {
      // In a real app, this would use the audit service
      console.log(`Audit: ${action} ${entityType} ${entityId}`, { oldValues, newValues });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }
}

export const transactionService = TransactionService.getInstance();