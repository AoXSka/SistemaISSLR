import React, { useState, useEffect } from 'react';
import { useToast } from '../UI/Toast';
import TransactionForm from './TransactionForm';
import { transactionService } from '../../services/transactionService';
import { taxCalculators } from '../../utils/taxCalculators';
import { Transaction } from '../../types';

interface ISLRFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
  transaction?: Transaction;
}

export default function ISLRForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  transaction 
}: ISLRFormProps) {
  const { addToast } = useToast();

  const handleSubmit = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      console.log('🧾 ISLRForm - Creating ISLR transaction:', {
        isEditing: !!transaction,
        transactionId: transaction?.id,
        amount: transactionData.retentionAmount,
        concept: transactionData.concept,
        customRetentionPercentage: transactionData.retentionPercentage
      });
      
      // Validate ISLR specific business rules
      const conceptCode = (transactionData as any).conceptCode || '001';
      const concept = taxCalculators.getISLRConcept(conceptCode);
      
      if (!concept) {
        throw new Error('Concepto ISLR inválido');
      }

      // Get default calculation for reference
      const defaultCalculation = taxCalculators.calculateISLR(
        conceptCode,
        transactionData.taxableBase,
        (transactionData as any).exemptAmount || 0
      );

      // Use user's custom percentage if different from default
      const userRetentionPercentage = transactionData.retentionPercentage;
      const isCustomPercentage = userRetentionPercentage !== defaultCalculation.retentionRate;
      
      // Calculate retention amount based on user's percentage
      const retentionAmount = isCustomPercentage 
        ? (transactionData.taxableBase * userRetentionPercentage) / 100
        : defaultCalculation.retentionAmount;

      const finalTransaction = {
        ...transactionData,
        type: 'ISLR' as const,
        concept: defaultCalculation.conceptName,
        retentionPercentage: userRetentionPercentage, // ✅ Mantener el porcentaje del usuario
        retentionAmount: retentionAmount               // ✅ Calcular basado en el porcentaje del usuario
      };

      console.log('💾 ISLRForm - Final transaction data:', {
        ...finalTransaction,
        isCustomPercentage,
        defaultPercentage: defaultCalculation.retentionRate
      });
      
      let savedTransaction: Transaction | null = null;
      
      if (transaction) {
        // Update existing transaction
        const updateResult = await transactionService.updateTransaction(transaction.id, finalTransaction);
        savedTransaction = updateResult.data;
        console.log('✅ ISLRForm - Transaction updated with ID:', transaction.id);
      } else {
        // Create new transaction
        const createResult = await transactionService.createTransaction(finalTransaction);
        savedTransaction = createResult.data; // Usar directamente la data del resultado
        console.log('✅ ISLRForm - Transaction created with ID:', createResult.id);
      }
      
      if (savedTransaction) {
        if (onSuccess) {
          onSuccess(savedTransaction);
        }
        
        addToast({
          type: 'success',
          title: `Retención ISLR ${transaction ? 'actualizada' : 'creada'}`,
          message: `Retención de ${defaultCalculation.conceptName} al ${userRetentionPercentage}% ${transaction ? 'actualizada' : 'guardada'} exitosamente`
        });
      } else {
        throw new Error(`No se pudo recuperar la transacción ${transaction ? 'actualizada' : 'guardada'}`);
      }

    } catch (error) {
      console.error('❌ ISLRForm - Error saving transaction:', error);
      throw new Error(`Error al ${transaction ? 'actualizar' : 'guardar'} retención ISLR: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      transaction={transaction}
      type="ISLR"
    />
  );
}