// components/Forms/TransactionForm.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Calculator, Building2, FileText, Calendar, DollarSign, Receipt, Save, X, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useLicenseProtection } from '../../hooks/useLicense';
import LicenseProtection from '../UI/LicenseProtection';

import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import FormField from '../UI/FormField';
import CurrencyInput from '../UI/CurrencyInput';
import { useToast } from '../UI/Toast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { formatters, validators, validateForm, commonValidationRules } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';
import { taxCalculators } from '../../utils/taxCalculators';
import { providerService } from '../../services/providerService';
import { Transaction } from '../../types';
import { transactionService } from '../../services/transactionService';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { companyDataProvider } from '../../utils/companyDataProvider';

// Hook mejorado para focus management
function useTransactionFormFocus(
  isOpen: boolean,
  type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE',
  modalContentRef?: React.RefObject<HTMLElement>
) {
  const [focusReady, setFocusReady] = useState(false);
  const focusAttempts = useRef(0);
  const maxAttempts = 10;
  const attemptInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) {
      setFocusReady(false);
      focusAttempts.current = 0;
      if (attemptInterval.current) {
        clearInterval(attemptInterval.current);
      }
      return;
    }

    // Estrategia agresiva de focus para formularios ISLR/IVA
    attemptInterval.current = setInterval(() => {
      focusAttempts.current++;
      
      const container = modalContentRef?.current || document.body;
      const focusableSelectors = [
        'input:not([disabled]):not([readonly]):not([type="hidden"])',
        'select:not([disabled]):not([readonly])',
        'textarea:not([disabled]):not([readonly])'
      ].join(', ');
      
      const firstField = container.querySelector(focusableSelectors) as HTMLElement;
      
      if (firstField && document.body.contains(firstField)) {
        const rect = firstField.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        if (isVisible) {
          firstField.focus();
          
          if (firstField instanceof HTMLInputElement && 
              ['text', 'number', 'tel', 'email'].includes(firstField.type)) {
            firstField.select();
          }
          
          setFocusReady(true);
          clearInterval(attemptInterval.current);
          return;
        }
      }
      
      if (focusAttempts.current >= maxAttempts) {
        clearInterval(attemptInterval.current);
      }
    }, 50);

    return () => {
      if (attemptInterval.current) {
        clearInterval(attemptInterval.current);
      }
    };
  }, [isOpen, type, modalContentRef]);

  return { focusReady };
}


// Componente Input optimizado con focus mejorado
const FocusableInput = memo(React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    shouldAutoFocus?: boolean;
    focusDelay?: number;
    onFocusReady?: () => void;
    error?: boolean;
    leftIcon?: any;
  }
>(({ shouldAutoFocus = false, focusDelay = 0, onFocusReady, error = false, leftIcon, ...props }, ref) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as any) || internalRef;
  const [hasFocused, setHasFocused] = useState(false);

  useEffect(() => {
    if (shouldAutoFocus && !hasFocused && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current && document.body.contains(inputRef.current)) {
          const isInteractive = !inputRef.current.disabled && 
                               !inputRef.current.readOnly &&
                               inputRef.current.offsetParent !== null;
          
          if (isInteractive) {
            inputRef.current.focus();
            setHasFocused(true);
            onFocusReady?.();
          }
        }
      }, focusDelay);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoFocus, focusDelay, hasFocused, onFocusReady, inputRef]);

  return (
    <Input
      ref={inputRef}
      {...props}
      error={error}
      leftIcon={leftIcon}
      className="input-focus-animation focus-visible:focus"
    />
  );
}));

FocusableInput.displayName = 'FocusableInput';

// Componente Select optimizado
const FocusableSelect = memo(React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: Array<{value: string, label: string}>;
    shouldAutoFocus?: boolean;
  }
>(({ options, shouldAutoFocus = false, ...props }, ref) => {
  const internalRef = useRef<HTMLSelectElement>(null);
  const selectRef = (ref as any) || internalRef;

  useEffect(() => {
    if (shouldAutoFocus && selectRef.current) {
      const timer = setTimeout(() => {
        if (selectRef.current && document.body.contains(selectRef.current)) {
          selectRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoFocus, selectRef]);

  return (
    <Select
      ref={selectRef}
      options={options}
      {...props}
      className="input-focus-animation focus-visible:focus"
    />
  );
}));

FocusableSelect.displayName = 'FocusableSelect';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: any) => Promise<void>; // ← CAMBIO: era onSuccess
  transaction?: Transaction;
  type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE';
}

export default function TransactionForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  transaction, 
  type 
}: TransactionFormProps) {
  const { addToast } = useToast();
  const { fiscalYear, currency } = useFiscalConfig();
  const isEditing = !!transaction;
  const { canAccess, blockedMessage } = useLicenseProtection('create_transactions');
  
  // Referencias para focus management
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { focusReady } = useTransactionFormFocus(isOpen, type, modalContentRef);
  
  // Estado optimizado
  const currentPeriod = useMemo(() => 
    `${fiscalYear || new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
    [fiscalYear]
  );

  const [islrConcepts, setIslrConcepts] = useState<Array<{code: string; name: string; rate: number}>>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [providerOptions, setProviderOptions] = useState<Array<{value: string, label: string}>>([]);
  const [manualPercentageOverride, setManualPercentageOverride] = useState(false);
  const [manualAmountOverride, setManualAmountOverride] = useState(false);
  
  // Estados adicionales para compras
  const [category, setCategory] = useState(transaction?.category || 'GENERAL');
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || 'transfer');
  const [selectedCurrency, setSelectedCurrency] = useState(transaction?.currency || 'VES');
  const [exchangeRate, setExchangeRate] = useState(transaction?.exchangeRate || 1);

  // Hook de validación optimizado
  const {
    values,
    errors,
    isSubmitting,
    setValue,
    markTouched,
    handleSubmit,
    reset,
    getFieldError
  } = useFormValidation({
    initialValues: {
      providerRif: transaction?.providerRif || '',
      providerName: transaction?.providerName || '',
      documentNumber: transaction?.documentNumber || '',
      controlNumber: transaction?.controlNumber || '',
      date: transaction?.date || new Date().toISOString().split('T')[0],
      concept: transaction?.concept || '',
      conceptCode: type === 'ISLR' ? '001' : '',
      operationType: 'C' as 'C' | 'V',
      documentType: '01' as '01' | '02' | '03',
      totalAmount: transaction?.totalAmount || 0,
      exemptAmount: 0,
      taxableBase: transaction?.taxableBase || 0,
      taxRate: 16,
      retentionPercentage: transaction?.retentionPercentage || (type === 'ISLR' ? 6 : type === 'IVA' ? 75 : 0),
      retentionAmount: transaction?.retentionAmount || 0,
      period: transaction?.period || currentPeriod,
      status: transaction?.status || 'PENDING' as const,
      notes: ''
    },
    validationRules: {
      providerRif: commonValidationRules.rif,
      providerName: commonValidationRules.providerName,
      documentNumber: commonValidationRules.documentNumber,
      date: commonValidationRules.date,
      concept: [
        { validator: validators.required, message: 'El concepto es obligatorio' },
        { validator: validators.minLength(3), message: 'El concepto debe tener al menos 3 caracteres' }
      ],
      taxableBase: commonValidationRules.amount,
      retentionPercentage: type === 'EXPENSE' ? [] : commonValidationRules.percentage
    },
    validateOnChange: false, // Solo validar en blur/submit para mejor performance
    validateOnBlur: true,
    onSubmit: async (formData) => {
      try {
        const transactionData = {
          ...(isEditing && transaction ? { id: transaction.id } : {}),
          date: formData.date,
          type,
          documentNumber: formData.documentNumber,
          controlNumber: formData.controlNumber,
          providerRif: formData.providerRif,
          providerName: formData.providerName,
          concept: formData.concept,
          totalAmount: formData.totalAmount,
          taxableBase: formData.taxableBase,
          retentionPercentage: type === 'EXPENSE' ? 0 : formData.retentionPercentage,
          retentionAmount: type === 'EXPENSE' ? 0 : formData.retentionAmount,
          status: formData.status,
          period: formData.period,
          ...(type === 'EXPENSE' && {
            category,
            paymentMethod,
            currency: selectedCurrency,
            exchangeRate,
            ivaRate: formData.taxRate || 16,
            ivaAmount: formData.taxableBase * (formData.taxRate || 16) / 100
          })
        };
      
        await onSubmit(transactionData);
        
        } catch (error) {
    console.error('Submit error:', error);
    throw error;
  }
}
  });

  // Callbacks memoizados para evitar re-renders
  const handleProviderRifChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('providerRif', formatters.rif.format(e.target.value));
  }, [setValue]);

  const handleProviderNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('providerName', e.target.value);
  }, [setValue]);

  const handleDocumentNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('documentNumber', e.target.value);
  }, [setValue]);

  const handleConceptChange = useCallback((conceptCode: string) => {
    const concept = islrConcepts.find(c => c.code === conceptCode);
    if (concept) {
      setValue('conceptCode', conceptCode);
      setValue('concept', concept.name);
      if (!manualPercentageOverride) {
        setValue('retentionPercentage', concept.rate);
      }
    }
  }, [islrConcepts, manualPercentageOverride, setValue]);

  const handleProviderChange = useCallback((rif: string) => {
    const provider = providers.find(p => p.rif === rif);
    if (provider) {
      setValue('providerRif', provider.rif);
      setValue('providerName', provider.name);
      
      if (type === 'ISLR' && provider.retentionISLRPercentage) {
        setValue('retentionPercentage', provider.retentionISLRPercentage);
      } else if (type === 'IVA' && provider.retentionIVAPercentage) {
        setValue('retentionPercentage', provider.retentionIVAPercentage);
      }
    }
  }, [providers, type, setValue]);

  // SOLUCIÓN: useEffect corregido sin calculateAmounts en las dependencias
  useEffect(() => {
    // Solo ejecutar si tenemos valores válidos
    if (values.taxableBase > 0 && values.retentionPercentage > 0) {
      // Cálculo directo dentro del useEffect para evitar dependencias circulares
      if (type === 'EXPENSE') {
        const taxRate = values.taxRate || 16;
        const ivaAmount = values.taxableBase * (taxRate / 100);
        const totalAmount = values.taxableBase + ivaAmount;
        
        // Solo actualizar si el valor cambió
        if (Math.abs(values.totalAmount - totalAmount) > 0.01) {
          setValue('totalAmount', totalAmount);
        }
      } else if (type === 'ISLR' && values.conceptCode) {
        try {
          const calculation = taxCalculators.calculateISLR(
            values.conceptCode,
            values.taxableBase,
            values.exemptAmount
          );
          
          // Solo actualizar si los valores cambiaron
          if (Math.abs(values.retentionAmount - calculation.retentionAmount) > 0.01) {
            setValue('retentionAmount', calculation.retentionAmount);
          }
          
          const newTotalAmount = values.taxableBase + values.exemptAmount;
          if (Math.abs(values.totalAmount - newTotalAmount) > 0.01) {
            setValue('totalAmount', newTotalAmount);
          }
        } catch (error) {
          console.error('ISLR calculation error:', error);
        }
      } else if (type === 'IVA') {
        try {
          const calculation = taxCalculators.calculateIVA(
            values.taxableBase + (values.taxableBase * (values.taxRate || 16) / 100) + (values.exemptAmount || 0),
            values.exemptAmount,
            values.taxRate || 16,
            values.retentionPercentage
          );
          
          // Solo actualizar si los valores cambiaron
          if (Math.abs(values.totalAmount - calculation.totalAmount) > 0.01) {
            setValue('totalAmount', calculation.totalAmount);
          }
          
          if (Math.abs(values.retentionAmount - calculation.retentionAmount) > 0.01) {
            setValue('retentionAmount', calculation.retentionAmount);
          }
        } catch (error) {
          console.error('IVA calculation error:', error);
        }
      }
    }
    // Dependencias sin incluir setValue para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.taxableBase, values.retentionPercentage, values.taxRate, values.conceptCode, values.exemptAmount, type]);

  // Cargar conceptos ISLR y proveedores
  useEffect(() => {
    if (type === 'ISLR') {
      const concepts = taxCalculators.getISLRConcepts();
      setIslrConcepts(concepts);
    }
    
    const loadProviders = async () => {
      try {
        const providersData = await providerService.getProviders();
        
        if (Array.isArray(providersData)) {
          setProviders(providersData);
          setProviderOptions(providersData.map(p => ({
            value: p.rif,
            label: `${p.rif} - ${p.name}`
          })));
        } else {
          console.warn('Providers data is not an array:', providersData);
          setProviders([]);
          setProviderOptions([]);
        }
      } catch (error) {
        console.error('Error loading providers:', error);
        setProviders([]); 
        setProviderOptions([]);
      }
    };
    
    loadProviders();
  }, [type]);

  // Reset form cuando cambia la transacción
  useEffect(() => {
    if (transaction && isOpen) {
      const transactionData = {
        providerRif: transaction.providerRif,
        providerName: transaction.providerName,
        documentNumber: transaction.documentNumber,
        controlNumber: transaction.controlNumber || '',
        date: transaction.date,
        concept: transaction.concept,
        conceptCode: type === 'ISLR' ? ((transaction as any).conceptCode || '001') : '',
        operationType: 'C' as 'C' | 'V',
        documentType: '01' as '01' | '02' | '03',
        totalAmount: transaction.totalAmount,
        exemptAmount: 0,
        taxableBase: transaction.taxableBase,
        taxRate: (transaction as any).ivaRate || 16,
        retentionPercentage: transaction.retentionPercentage,
        retentionAmount: transaction.retentionAmount,
        period: transaction.period,
        status: transaction.status,
        notes: ''
      };
      
      Object.entries(transactionData).forEach(([key, value]) => {
        setValue(key as any, value);
      });

      if (type === 'EXPENSE') {
        setCategory((transaction as any).category || 'GENERAL');
        setPaymentMethod((transaction as any).paymentMethod || 'transfer');
        setSelectedCurrency((transaction as any).currency || 'VES');
        setExchangeRate((transaction as any).exchangeRate || 1);
      }
    }
  }, [transaction, isOpen, type, setValue]);

  const handleClose = useCallback(() => {
    const hasChanges = !isEditing && (values.providerName || values.documentNumber || values.concept);
    
    if (hasChanges && !confirm('¿Desea cerrar sin guardar? Se perderán los cambios.')) {
      return;
    }
    
    onClose();
  }, [isEditing, values.providerName, values.documentNumber, values.concept, onClose]);

  // Opciones memoizadas
  const purchaseCategories = useMemo(() => [
    { value: 'GENERAL', label: 'General' },
    { value: 'INV', label: 'Inventario' },
    { value: 'SER', label: 'Servicios' },
    { value: 'ALQ', label: 'Alquileres' },
    { value: 'PUB', label: 'Publicidad y Mercadeo' },
    { value: 'MAN', label: 'Mantenimiento' },
    { value: 'SUP', label: 'Suministros de Oficina' },
    { value: 'TEC', label: 'Tecnología' },
    { value: 'OTR', label: 'Otros Gastos' }
  ], []);

  const paymentMethods = useMemo(() => [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'check', label: 'Cheque' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'other', label: 'Otro' }
  ], []);

  const currencies = useMemo(() => [
    { value: 'VES', label: 'VES - Bolívares' },
    { value: 'USD', label: 'USD - Dólares' },
    { value: 'EUR', label: 'EUR - Euros' }
  ], []);

  const ivaRates = useMemo(() => [
    { value: 0, label: 'Exento (0%)' },
    { value: 8, label: 'Reducida (8%)' },
    { value: 16, label: 'General (16%)' },
    { value: 31, label: 'Lujo (31%)' }
  ], []);

  const operationTypes = useMemo(() => [
    { value: 'C', label: 'C - Compra' },
    { value: 'V', label: 'V - Venta' }
  ], []);

  const documentTypes = useMemo(() => [
    { value: '01', label: '01 - Factura' },
    { value: '02', label: '02 - Nota de Débito' },
    { value: '03', label: '03 - Nota de Crédito' }
  ], []);

  const ivaRetentionTypes = useMemo(() => [
    { value: 75, label: '75% - Contribuyente Ordinario' },
    { value: 100, label: '100% - Contribuyente Especial' }
  ], []);

  if (!canAccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Función Restringida" size="lg">
        <LicenseProtection 
          feature="create_transactions"
          fallback={
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-warning-700 dark:text-warning-300">{blockedMessage}</p>
            </div>
          }
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isEditing ? 'Editar' : type === 'EXPENSE' ? 'Registrar Compra' : 'Nueva Retención'} ${type === 'EXPENSE' ? '' : type}`}
      size="4xl"
    >
      <div ref={modalContentRef}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Information */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 p-6 rounded-xl border border-primary-200 dark:border-primary-700">
            <h3 className="flex items-center text-lg font-bold text-primary-900 dark:text-primary-100 mb-4">
              <Building2 className="h-5 w-5 mr-2 text-primary-600" />
              Información del Proveedor
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="RIF del Proveedor"
                required
                error={getFieldError('providerRif')}
              >
                <div className="space-y-2">
                  {providerOptions.length > 0 ? (
                    <FocusableSelect
                      value={values.providerRif}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setValue('providerRif', e.target.value);
                        handleProviderChange(e.target.value);
                      }}
                      options={[
                        { value: '', label: 'Seleccionar proveedor existente...' },
                        ...providerOptions,
                        { value: 'NEW_PROVIDER', label: '➕ Crear nuevo proveedor' }
                      ]}
                      shouldAutoFocus={focusReady}
                    />
                  ) : (
                    <FocusableInput
                      value={values.providerRif}
                      onChange={handleProviderRifChange}
                      onBlur={() => markTouched('providerRif')}
                      placeholder="V-12345678-9"
                      leftIcon={Building2}
                      error={!!getFieldError('providerRif')}
                      shouldAutoFocus={focusReady}
                      focusDelay={100}
                    />
                  )}
                  
                  {providerOptions.length > 0 && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      💡 {providerOptions.length} proveedores disponibles. Seleccione de la lista o cree uno nuevo.
                    </p>
                  )}
                </div>
              </FormField>
              
              <FormField 
                label="Nombre del Proveedor"
                required
                error={getFieldError('providerName')}
              >
                <FocusableInput
                  value={values.providerName}
                  onChange={handleProviderNameChange}
                  onBlur={() => markTouched('providerName')}
                  placeholder="Nombre o Razón Social"
                  error={!!getFieldError('providerName')}
                  tabIndex={2}
                />
              </FormField>
            </div>
          </div>

          {/* Document Information */}
          <div className="bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/10 p-6 rounded-xl border border-accent-200 dark:border-accent-700">
            <h3 className="flex items-center text-lg font-bold text-accent-900 dark:text-accent-100 mb-4">
              <FileText className="h-5 w-5 mr-2 text-accent-600" />
              Información del Documento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {type === 'IVA' && (
                <div className="md:col-span-3 grid grid-cols-2 gap-4 mb-4">
                  <FormField label="Tipo de Operación">
                    <FocusableSelect
                      value={values.operationType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('operationType', e.target.value)}
                      options={operationTypes}
                    />
                  </FormField>
                  
                  <FormField label="Tipo de Documento">
                    <FocusableSelect
                      value={values.documentType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('documentType', e.target.value)}
                      options={documentTypes}
                    />
                  </FormField>
                </div>
              )}
              
              <FormField 
                label="Número de Documento"
                required
                error={getFieldError('documentNumber')}
              >
                <FocusableInput
                  value={values.documentNumber}
                  onChange={handleDocumentNumberChange}
                  onBlur={() => markTouched('documentNumber')}
                  placeholder="FAC-001234"
                  error={!!getFieldError('documentNumber')}
                  tabIndex={5}
                />
              </FormField>
              
              <FormField label="Número de Control">
                <FocusableInput
                  value={values.controlNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('controlNumber', e.target.value)}
                  placeholder="00-00000001"
                  tabIndex={6}
                />
              </FormField>
              
              <FormField 
                label="Fecha de Operación"
                required
                error={getFieldError('date')}
              >
                <FocusableInput
                  type="date"
                  value={values.date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('date', e.target.value)}
                  onBlur={() => markTouched('date')}
                  leftIcon={Calendar}
                  error={!!getFieldError('date')}
                  tabIndex={7}
                />
              </FormField>
            </div>
          </div>

          {/* Concept and Calculation - Different for EXPENSE */}
          {type === 'EXPENSE' ? (
            <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/10 p-6 rounded-xl border border-success-200 dark:border-success-700">
              <h3 className="flex items-center text-lg font-bold text-success-900 dark:text-success-100 mb-4">
                <ShoppingCart className="h-5 w-5 mr-2 text-success-600" />
                Detalles de la Compra
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField label="Categoría de Compra" required>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={purchaseCategories}
                  />
                </FormField>
                
                <FormField label="Concepto Detallado" required error={getFieldError('concept')}>
                  <FocusableInput
                    value={values.concept}
                    onChange={(e) => setValue('concept', e.target.value)}
                    onBlur={() => markTouched('concept')}
                    placeholder="Descripción de la compra"
                    error={!!getFieldError('concept')}
                  />
                </FormField>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Monto Neto" required error={getFieldError('taxableBase')} helperText="Monto sin IVA">
                  <CurrencyInput
                    value={values.taxableBase}
                    onChange={(value) => {
                      setValue('taxableBase', value);
                      const ivaAmount = value * (values.taxRate / 100);
                      setValue('totalAmount', value + ivaAmount);
                    }}
                    error={getFieldError('taxableBase')}
                    currency={selectedCurrency}
                    showSymbol={true}
                  />
                </FormField>
                
                <FormField label="Tasa IVA">
                  <Select
                    value={values.taxRate}
                    onChange={(e) => {
                      const rate = parseInt(e.target.value);
                      setValue('taxRate', rate);
                      const ivaAmount = values.taxableBase * (rate / 100);
                      setValue('totalAmount', values.taxableBase + ivaAmount);
                    }}
                    options={ivaRates}
                  />
                </FormField>
                
                <FormField label="Monto Total">
                  <CurrencyInput
                    value={values.totalAmount}
                    onChange={(value) => {
                      setValue('totalAmount', value);
                      const taxRate = values.taxRate || 16;
                      const taxableBase = value / (1 + (taxRate / 100));
                      setValue('taxableBase', Math.round(taxableBase * 100) / 100);
                    }}
                    currency={selectedCurrency}
                    showSymbol={true}
                  />
                </FormField>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField label="Método de Pago">
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={paymentMethods}
                  />
                </FormField>
                
                <FormField label="Moneda">
                  <Select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    options={currencies}
                  />
                </FormField>
                
                {selectedCurrency !== 'VES' && (
                  <FormField label="Tasa de Cambio" helperText="Respecto a VES">
                    <FocusableInput
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                      step="0.01"
                      min="0.01"
                    />
                  </FormField>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/10 p-6 rounded-xl border border-success-200 dark:border-success-700">
              <h3 className="flex items-center text-lg font-bold text-success-900 dark:text-success-100 mb-4">
                <Calculator className="h-5 w-5 mr-2 text-success-600" />
                Concepto y Cálculo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {type === 'ISLR' ? (
                  <FormField label="Concepto ISLR" required>
                    <Select
                      value={values.conceptCode}
                      onChange={(e) => handleConceptChange(e.target.value)}
                      options={islrConcepts.map(c => ({ 
                        value: c.code, 
                        label: `${c.code} - ${c.name} (${c.rate}%)` 
                      }))}
                    />
                  </FormField>
                ) : (
                  <FormField label="Tipo de Retención IVA">
                    <Select
                      value={values.retentionPercentage}
                      onChange={(e) => setValue('retentionPercentage', parseInt(e.target.value))}
                      options={ivaRetentionTypes}
                    />
                  </FormField>
                )}
                
                <FormField label="Concepto Detallado" required error={getFieldError('concept')}>
                  <FocusableInput
                    value={values.concept}
                    onChange={(e) => setValue('concept', e.target.value)}
                    onBlur={() => markTouched('concept')}
                    placeholder="Descripción del servicio"
                    error={!!getFieldError('concept')}
                  />
                </FormField>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField 
                  label="Base Imponible" 
                  required 
                  error={getFieldError('taxableBase')}
                  helperText="Monto sobre el cual se calcula la retención"
                >
                  <CurrencyInput
                    value={values.taxableBase}
                    onChange={(value) => {
                      setValue('taxableBase', value);
                      setManualAmountOverride(true);
                    }}
                    error={getFieldError('taxableBase')}
                    currency="VES"
                    showSymbol={true}
                  />
                </FormField>
                
                {type === 'IVA' && (
                  <FormField label="Monto Exento">
                    <CurrencyInput
                      value={values.exemptAmount}
                      onChange={(value) => setValue('exemptAmount', value)}
                      currency="VES"
                      showSymbol={true}
                    />
                  </FormField>
                )}
                
                <FormField label="Monto Total de la Factura">
                  <CurrencyInput
                    value={values.totalAmount}
                    onChange={(value) => {
                      setValue('totalAmount', value);
                      if (type === 'IVA' && value > 0) {
                        const taxableBase = value / (1 + ((values.taxRate || 16) / 100));
                        setValue('taxableBase', Math.round(taxableBase * 100) / 100);
                      }
                    }}
                    disabled={type === 'ISLR'}
                    currency="VES"
                    showSymbol={true}
                    className={type === 'ISLR' ? 'bg-neutral-100 dark:bg-neutral-700' : ''}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Calculation Summary */}
          {type === 'EXPENSE' ? (
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 p-6 rounded-xl border-l-4 border-primary-500">
              <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-4 text-lg">
                📊 Resumen de Compra
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-primary-200 dark:border-primary-700 shadow-lg">
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider mb-1">Monto Neto</p>
                  <p className="text-xl font-bold text-primary-900 dark:text-primary-100">
                    {formatters.decimal.format(values.taxableBase)}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-accent-200 dark:border-accent-700 shadow-lg">
                  <p className="text-xs text-accent-600 dark:text-accent-400 font-semibold uppercase tracking-wider mb-1">IVA {values.taxRate}%</p>
                  <p className="text-xl font-bold text-accent-900 dark:text-accent-100">
                    {formatters.decimal.format(values.taxableBase * values.taxRate / 100)}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white dark:bg-neutral-800 rounded-xl border border-warning-200 dark:border-warning-700 shadow-lg">
                  <p className="text-xs text-warning-600 dark:text-warning-400 font-semibold uppercase tracking-wider mb-1">Categoría</p>
                  <p className="text-lg font-bold text-warning-900 dark:text-warning-100">
                    {purchaseCategories.find(c => c.value === category)?.label || 'General'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white dark:bg-neutral-800 rounded-xl border-l-4 border-success-500 shadow-xl">
                  <p className="text-xs text-success-600 dark:text-success-400 font-semibold uppercase tracking-wider mb-1">Total a Pagar</p>
                  <p className="text-2xl font-bold text-success-900 dark:text-success-100">
                    {formatCurrency(values.totalAmount)}
                  </p>
                  <p className="text-xs text-success-700 dark:text-success-300 mt-2 font-medium">
                    {paymentMethods.find(m => m.value === paymentMethod)?.label || 'Transferencia'}
                  </p>
                </div>
              </div>
              
              {selectedCurrency !== 'VES' && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    💱 Total en VES: {formatCurrency(values.totalAmount * exchangeRate)} (Tasa: {exchangeRate} VES/{selectedCurrency})
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 p-6 rounded-2xl border-l-4 border-primary-500 shadow-inner">
              <h4 className="font-bold text-primary-900 dark:text-primary-100 mb-6 text-xl flex items-center gap-2">
                📊 <span>Resumen de Cálculo</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-5 bg-white dark:bg-neutral-800 rounded-xl border border-primary-200 dark:border-primary-700 shadow-md hover:shadow-lg transition-all">
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider mb-1">
                    Base Imponible
                  </p>
                  <p className="text-2xl font-extrabold text-primary-900 dark:text-primary-100">
                    {formatters.decimal.format(values.taxableBase)}
                  </p>
                </div>

                <div className="flex flex-col items-center p-5 bg-white dark:bg-neutral-800 rounded-xl border border-warning-200 dark:border-warning-700 shadow-md hover:shadow-lg transition-all">
                  <p className="text-xs text-warning-600 dark:text-warning-400 font-semibold uppercase tracking-wider mb-1">
                    % Retención
                  </p>
                  <input
                    type="number"
                    value={values.retentionPercentage}
                    onChange={(e) => {
                      const newPercentage = parseFloat(e.target.value) || 0;
                      setValue('retentionPercentage', newPercentage);
                      setManualPercentageOverride(true);
                    }}
                    step="0.1"
                    min="0"
                    max="100"
                    className="mt-2 w-20 text-center text-sm border border-warning-300 rounded-lg px-2 py-1 bg-yellow-50 focus:ring-2 focus:ring-warning-400 outline-none"
                  />
                  <p className="text-xs text-warning-600 mt-1">Editable</p>
                </div>
                
                <div className="flex flex-col items-center p-5 bg-white dark:bg-neutral-800 rounded-xl border-l-4 border-success-500 shadow-lg hover:shadow-xl transition-all">
                  <p className="text-xs text-success-600 dark:text-success-400 font-semibold uppercase tracking-wider mb-1">
                    Monto a Retener
                  </p>
                  <input
                    type="text"
                    value={formatCurrency(values.retentionAmount)}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                      const newAmount = parseFloat(cleanValue) || 0;
                      setValue('retentionAmount', newAmount);
                      setManualAmountOverride(true);
                      if (values.taxableBase > 0) {
                        const calculatedPercentage = (newAmount / values.taxableBase) * 100;
                        setValue('retentionPercentage', Math.round(calculatedPercentage * 100) / 100);
                      }
                    }}
                    className="mt-2 w-28 text-center text-sm border border-success-300 rounded-lg px-2 py-1 bg-green-50 focus:ring-2 focus:ring-success-400 outline-none"
                  />
                  <p className="text-xs text-success-700 dark:text-success-300 mt-2 font-medium">
                    Retención {type} ({values.retentionPercentage}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Período Fiscal" helperText={`Año fiscal actual: ${fiscalYear}`}>
                <FocusableInput
                  type="month"
                  value={values.period}
                  onChange={(e) => setValue('period', e.target.value)}
                  min={`${fiscalYear}-01`}
                  max={`${fiscalYear}-12`}
                />
              </FormField>
              
              <FormField label="Estado">
                <Select
                  value={values.status}
                  onChange={(e) => setValue('status', e.target.value)}
                  options={[
                    { value: 'PENDING', label: 'Pendiente' },
                    { value: 'PAID', label: 'Pagado' },
                    { value: 'DECLARED', label: 'Declarado' }
                  ]}
                />
              </FormField>
            </div>
            
            <FormField label="Notas Adicionales" className="mt-4">
              <textarea
                value={values.notes}
                onChange={(e) => setValue('notes', e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                rows={3}
                placeholder="Información adicional sobre la transacción..."
              />
            </FormField>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              icon={X}
              type="button"
              tabIndex={100}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={Save}
              disabled={!values.providerName || !values.documentNumber || !values.concept}
              tabIndex={101}
            >
              {isEditing ? 'Actualizar' : 'Guardar'} {type === 'EXPENSE' ? 'Compra' : type}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}