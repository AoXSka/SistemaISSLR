import React from 'react';
import { useToast } from '../UI/Toast';
import TransactionForm from './TransactionForm';
import { transactionService } from '../../services/transactionService';
import { purchaseService } from '../../services/purchaseService';
import { Transaction } from '../../types';

interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
  transaction?: Transaction;
  purchase?: any; // For backward compatibility
  onSave?: (purchaseData: any) => Promise<void>; // For backward compatibility
}

export default function PurchaseForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  transaction,
  purchase, // For backward compatibility
  onSave // For backward compatibility
}: PurchaseFormProps) {
  const { addToast } = useToast();
  
  // Handle backward compatibility with old props
  const transactionData = transaction || purchase;

  const handleSubmit = async (formData: any) => {
    try {
      console.log('🛒 PurchaseForm - Creating purchase transaction:', {
        isEditing: !!transactionData,
        transactionId: transactionData?.id,
        totalAmount: formData.totalAmount,
        concept: formData.concept
      });
      
      // Validate Purchase specific business rules
      if (!formData.documentNumber && !formData.invoiceNumber) {
        throw new Error('El número de factura es obligatorio para registrar una compra');
      }

      if (!formData.controlNumber) {
        throw new Error('El número de control es obligatorio según normativa del SENIAT');
      }

      if (formData.totalAmount <= 0) {
        throw new Error('El monto total debe ser mayor a cero');
      }

      if (!formData.providerRif || !formData.providerName) {
        throw new Error('La información del proveedor es obligatoria');
      }

      // Validate control number format (XX-XXXXXX o XX-XXXXXXXX)
      const controlNumberRegex = /^\d{2}-\d{6,8}$/;
      if (formData.controlNumber && !controlNumberRegex.test(formData.controlNumber)) {
        throw new Error('Formato de número de control inválido (debe ser XX-XXXXXX o XX-XXXXXXXX)');
      }

      // Calculate amounts properly
      const ivaRate = formData.ivaRate || formData.taxRate || 16;
      let netAmount, ivaAmount, taxableBase;

      // If we have exemptAmount, calculate properly
      if (formData.exemptAmount && formData.exemptAmount > 0) {
        netAmount = formData.taxableBase || formData.netAmount || (formData.totalAmount / (1 + ivaRate / 100));
        taxableBase = netAmount - formData.exemptAmount;
        ivaAmount = taxableBase * (ivaRate / 100);
      } else {
        // Standard calculation without exempt amount
        netAmount = formData.taxableBase || formData.netAmount || (formData.totalAmount / (1 + ivaRate / 100));
        taxableBase = netAmount;
        ivaAmount = netAmount * (ivaRate / 100);
      }

      const totalAmount = netAmount + ivaAmount;

      // Build final transaction object
      const finalTransaction = {
        ...formData,
        type: 'EXPENSE' as const,
        // Map invoice number correctly
        documentNumber: formData.documentNumber || formData.invoiceNumber,
        invoiceNumber: formData.documentNumber || formData.invoiceNumber,
        // Ensure concept doesn't duplicate "Compra -"
        concept: formData.concept.startsWith('Compra - ') 
          ? formData.concept 
          : `Compra - ${formData.concept}`,
        // Financial amounts
        netAmount: netAmount,
        taxableBase: taxableBase,
        ivaRate: ivaRate,
        ivaAmount: ivaAmount,
        totalAmount: totalAmount,
        // Purchases don't have retention
        retentionPercentage: 0,
        retentionAmount: 0,
        // Status
        status: formData.status || 'PENDING' as const,
        // Additional purchase fields
        category: formData.category || 'GENERAL',
        paymentMethod: formData.paymentMethod || 'transfer',
        currency: formData.currency || 'VES',
        exchangeRate: formData.exchangeRate || 1,
        // Optional fields
        observations: formData.notes || formData.observations || '',
        period: formData.period || new Date().toISOString().substring(0, 7)
      };

      console.log('💾 PurchaseForm - Final transaction data:', finalTransaction);
      
      // Handle backward compatibility with onSave prop
      if (onSave) {
        // Old interface compatibility
        if (transactionData) {
          await onSave(transactionData.id, finalTransaction);
        } else {
          await onSave(finalTransaction);
        }
        
        addToast({
          type: 'success',
          title: `Compra ${transactionData ? 'actualizada' : 'registrada'}`,
          message: `La compra ${formData.documentNumber || formData.invoiceNumber} ha sido ${transactionData ? 'actualizada' : 'registrada'} exitosamente`
        });
        
        // Llamar onSuccess después del toast para cerrar el modal
        if (onSuccess) {
          // Crear un objeto Transaction mínimo para compatibilidad
          const mockTransaction: Transaction = {
            id: transactionData?.id || 'new',
            type: 'EXPENSE',
            date: finalTransaction.date,
            documentNumber: finalTransaction.documentNumber,
            controlNumber: finalTransaction.controlNumber || '',
            providerRif: finalTransaction.providerRif,
            providerName: finalTransaction.providerName,
            concept: finalTransaction.concept,
            totalAmount: finalTransaction.totalAmount,
            taxableBase: finalTransaction.taxableBase,
            retentionPercentage: 0,
            retentionAmount: 0,
            status: finalTransaction.status,
            period: finalTransaction.period,
            createdAt: new Date().toISOString()
          };
          console.log('✅ PurchaseForm - Calling onSuccess (backward compatibility)');
          onSuccess(mockTransaction);
        }
        return;
      }
      
      // New interface using transactionService
      let savedTransaction: Transaction | null = null;
      
      if (transactionData) {
        // Update existing transaction
        await transactionService.updateTransaction(transactionData.id, finalTransaction);
        savedTransaction = await transactionService.getTransaction(transactionData.id);
        console.log('✅ PurchaseForm - Transaction updated with ID:', transactionData.id);
        
        addToast({
          type: 'success',
          title: 'Compra actualizada',
          message: `La compra ${formData.documentNumber || formData.invoiceNumber} ha sido actualizada exitosamente`
        });
      } else {
        // Create new transaction using purchase service if available
        let savedId: number | undefined;
        
        try {
          if (purchaseService && purchaseService.createPurchase) {
            savedId = await purchaseService.createPurchase(finalTransaction);
            console.log('✅ PurchaseForm - Purchase created via purchaseService with ID:', savedId);
          } else {
            // Fallback to transactionService
            savedId = await transactionService.createTransaction(finalTransaction);
            console.log('✅ PurchaseForm - Transaction created via transactionService with ID:', savedId);
          }
        } catch (serviceError) {
          console.warn('⚠️ PurchaseForm - Primary service failed, using fallback:', serviceError);
          // Fallback to transactionService if purchaseService fails
          savedId = await transactionService.createTransaction(finalTransaction);
          console.log('✅ PurchaseForm - Transaction created via fallback with ID:', savedId);
        }
        
        // Verificar que tenemos un ID válido antes de buscar la transacción
        if (savedId && typeof savedId === 'number') {
          try {
            savedTransaction = await transactionService.getTransaction(savedId);
            console.log('✅ PurchaseForm - Retrieved saved transaction:', savedTransaction);
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch saved transaction, creating minimal object:', fetchError);
            // Crear un objeto mínimo si no podemos obtener la transacción guardada
            savedTransaction = {
              id: savedId.toString(),
              type: 'EXPENSE',
              date: finalTransaction.date,
              documentNumber: finalTransaction.documentNumber,
              controlNumber: finalTransaction.controlNumber || '',
              providerRif: finalTransaction.providerRif,
              providerName: finalTransaction.providerName,
              concept: finalTransaction.concept,
              totalAmount: finalTransaction.totalAmount,
              taxableBase: finalTransaction.taxableBase,
              retentionPercentage: 0,
              retentionAmount: 0,
              status: finalTransaction.status,
              period: finalTransaction.period,
              createdAt: new Date().toISOString()
            };
          }
        }
        
        addToast({
          type: 'success',
          title: 'Compra registrada',
          message: `La compra ${formData.documentNumber || formData.invoiceNumber} ha sido registrada exitosamente`
        });
      }
      
      // Llamar onSuccess con la transacción guardada o un objeto mínimo
      if (onSuccess) {
        const transactionToReturn: Transaction = savedTransaction || {
          id: 'new',
          type: 'EXPENSE' as const,
          date: finalTransaction.date,
          documentNumber: finalTransaction.documentNumber,
          controlNumber: finalTransaction.controlNumber || '',
          providerRif: finalTransaction.providerRif,
          providerName: finalTransaction.providerName,
          concept: finalTransaction.concept,
          totalAmount: finalTransaction.totalAmount,
          taxableBase: finalTransaction.taxableBase,
          retentionPercentage: 0,
          retentionAmount: 0,
          status: finalTransaction.status,
          period: finalTransaction.period,
          createdAt: new Date().toISOString()
        };
        
        console.log('✅ PurchaseForm - Calling onSuccess with transaction:', transactionToReturn);
        onSuccess(transactionToReturn);
      }

    } catch (error) {
      console.error('❌ PurchaseForm - Error saving purchase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      addToast({
        type: 'error',
        title: `Error al ${transactionData ? 'actualizar' : 'registrar'} compra`,
        message: errorMessage
      });
      
      // Re-lanzar el error para que TransactionForm lo maneje
      throw error;
    }
  };

  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      transaction={transactionData}
      type="EXPENSE"
    />
  );
}