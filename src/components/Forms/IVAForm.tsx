import React from 'react';
import { useToast } from '../UI/Toast';
import TransactionForm from './TransactionForm';
import { transactionService } from '../../services/transactionService';
import { taxCalculators } from '../../utils/taxCalculators';
import { Transaction } from '../../types';

interface IVAFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
  transaction?: Transaction;
}

export default function IVAForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  transaction 
}: IVAFormProps) {
  const { addToast } = useToast();

  const handleSubmit = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      console.log('📄 IVAForm - Creating IVA transaction:', {
        isEditing: !!transaction,
        transactionId: transaction?.id,
        amount: transactionData.retentionAmount,
        percentage: transactionData.retentionPercentage
      });
      
      // Validate IVA specific business rules - MUST be 75% or 100%
      if (transactionData.retentionPercentage !== 75 && transactionData.retentionPercentage !== 100) {
        throw new Error('Porcentaje de retención IVA debe ser 75% o 100%');
      }

      // Get user values
      const userRetentionPercentage = transactionData.retentionPercentage;
      const exemptAmount = (transactionData as any).exemptAmount || 0;
      const taxRate = (transactionData as any).taxRate || 16;
      
      // Calculate retention amount based on user's selected percentage
      // The retention is applied to the IVA amount, not the total
      const ivaAmount = (transactionData.taxableBase * taxRate) / 100;
      const retentionAmount = (ivaAmount * userRetentionPercentage) / 100;
      
      // Total amount includes base + IVA + exempt
      const totalAmount = transactionData.taxableBase + ivaAmount + exemptAmount;

      const finalTransaction = {
        ...transactionData,
        type: 'IVA' as const,
        concept: `IVA ${userRetentionPercentage}% - ${transactionData.concept}`,
        totalAmount: totalAmount,
        taxableBase: transactionData.taxableBase,
        retentionPercentage: userRetentionPercentage,
        retentionAmount: retentionAmount
      };

      console.log('💾 IVAForm - Final transaction data:', finalTransaction);
      
      let savedTransaction: Transaction | null = null;
      
      if (transaction) {
        // Update existing transaction
        await transactionService.updateTransaction(transaction.id, finalTransaction);
        savedTransaction = await transactionService.getTransaction(transaction.id);
        console.log('✅ IVAForm - Transaction updated:', savedTransaction);
      } else {
        // Create new transaction
        const response = await transactionService.createTransaction(finalTransaction);
        
        // Extract ID from response object
        const transactionId = response.id || response.data?.id;
        
        if (!transactionId) {
          console.error('❌ IVAForm - Invalid response from createTransaction:', response);
          throw new Error('No se recibió ID de la transacción creada');
        }
        
        console.log('✅ IVAForm - Transaction created with ID:', transactionId);
        
        // Get the saved transaction using the correct ID
        savedTransaction = await transactionService.getTransaction(transactionId);
        console.log('📦 IVAForm - Retrieved saved transaction:', savedTransaction);
      }
      
      // Validate that we have a saved transaction
      if (!savedTransaction) {
        console.error('❌ IVAForm - No saved transaction retrieved');
        throw new Error(`No se pudo recuperar la transacción ${transaction ? 'actualizada' : 'guardada'}`);
      }
      
      // Log what we're passing to onSuccess
      console.log('🎯 IVAForm - Calling onSuccess with:', savedTransaction);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(savedTransaction);
      }
      
      const retentionType = userRetentionPercentage === 75 
        ? 'Contribuyente Ordinario' 
        : 'Contribuyente Especial';
      
      addToast({
        type: 'success',
        title: `Retención IVA ${transaction ? 'actualizada' : 'creada'}`,
        message: `Retención IVA ${userRetentionPercentage}% (${retentionType}) ${transaction ? 'actualizada' : 'guardada'} exitosamente`
      });

      onClose();

    } catch (error) {
      console.error('❌ IVAForm - Error saving transaction:', error);
      throw new Error(`Error al ${transaction ? 'actualizar' : 'guardar'} retención IVA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      transaction={transaction}
      type="IVA"
    />
  );
}