import React, { useState, useEffect } from 'react';
import { Building2, Globe, Mail, Phone, User, MapPin, Save, X, Calculator } from 'lucide-react';
import { useLicenseProtection } from '../../hooks/useLicense';
import LicenseProtection from '../UI/LicenseProtection';
import FormField from '../UI/FormField';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { useFormValidation } from '../../hooks/useFormValidation';
import { commonValidationRules } from '../../utils/validators';
import { rifValidator } from '../../utils/rifValidator';
import { providerService } from '../../services/providerService';
import { Provider } from '../../types';

interface ProviderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (provider: Provider) => void;
  provider?: Provider;
}

export default function ProviderForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  provider 
}: ProviderFormProps) {
  const { addToast } = useToast();
  const isEditing = !!provider;

  const { canAccess, blockedMessage } = useLicenseProtection('manage_providers');
  
  // License protection
  if (!canAccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Función Restringida" size="lg">
        <LicenseProtection 
          feature="manage_providers"
          fallback={
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-warning-700 dark:text-warning-300">{blockedMessage}</p>
            </div>
          }
        />
      </Modal>
    );
  }

  const {
    values,
    errors,
    isSubmitting,
    setValue,
    handleSubmit,
    reset,
    getFieldError,
    markTouched
  } = useFormValidation({
    initialValues: {
      rif: provider?.rif || '',
      name: provider?.name || '',
      address: provider?.address || '',
      phone: provider?.phone || '',
      email: provider?.email || '',
      contactPerson: provider?.contactPerson || '',
      retentionISLRPercentage: provider?.retentionISLRPercentage || 6,
      retentionIVAPercentage: provider?.retentionIVAPercentage || 75,
      website: provider?.website || '',
      taxType: provider?.taxType || 'ordinary',
      notes: provider?.notes || ''
    },
    validationRules: {
      rif: commonValidationRules.rif,
      name: commonValidationRules.providerName,
      email: [
        { 
          validator: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 
          message: 'Email es opcional, pero si se proporciona debe ser válido' 
        }
      ],
      retentionISLRPercentage: [
        { validator: (value: number) => value >= 0 && value <= 100, message: 'Porcentaje ISLR debe estar entre 0% y 100%' }
      ],
      retentionIVAPercentage: [
        { validator: (value: number) => value === 75 || value === 100, message: 'Porcentaje IVA debe ser 75% o 100%' }
      ]
    },
    onSubmit: async (formData) => {
      try {
        console.log('💾 ProviderForm - Submitting provider:', { isEditing, providerId: provider?.id });
        
        if (isEditing && provider) {
          await providerService.updateProvider(provider.id, formData);
          
          const updatedProvider = providerService.getProvider(provider.id);
          console.log('✅ ProviderForm - Provider updated:', updatedProvider);
          if (updatedProvider && onSuccess) {
            onSuccess(updatedProvider);
          }
        } else {
          const providerId = await providerService.createProvider(formData);
          const newProvider = providerService.getProvider(providerId);
          console.log('✅ ProviderForm - Provider created:', newProvider);
          
          if (newProvider && onSuccess) {
            onSuccess(newProvider);
          }
        }
        
        addToast({
          type: 'success',
          title: `Proveedor ${isEditing ? 'actualizado' : 'creado'}`,
          message: `${formData.name} ha sido ${isEditing ? 'actualizado' : 'registrado'} exitosamente`
        });
        
        reset();
        onClose();
      } catch (error) {
        throw new Error(`Error al ${isEditing ? 'actualizar' : 'crear'} proveedor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  });

  // Reset form when provider changes (for edit mode)
  useEffect(() => {
    if (provider && isOpen) {
      console.log('🔄 ProviderForm - Loading provider data for editing:', provider);
      
      // Create provider data object for batch update
      const providerData = {
        rif: provider.rif,
        name: provider.name,
        address: provider.address,
        phone: provider.phone,
        email: provider.email,
        contactPerson: provider.contactPerson,
        retentionISLRPercentage: provider.retentionISLRPercentage,
        retentionIVAPercentage: provider.retentionIVAPercentage,
        website: provider.website || '',
        taxType: provider.taxType || 'ordinary',
        notes: provider.notes || ''
      };
      
      // Use reset with new values instead of setValue loop
      reset(providerData);
      
      console.log('✅ ProviderForm - All provider data loaded:', providerData);
    }
  }, [provider, isOpen, reset]);

  const [rifValidation, setRifValidation] = useState<{ isValid: boolean; type: string; warnings: string[] }>({
    isValid: false,
    type: '',
    warnings: []
  });

  const [isValidatingWithSENIAT, setIsValidatingWithSENIAT] = useState(false);

  // Handle close with confirmation for unsaved changes
  const handleClose = () => {
    const hasChanges = !isEditing && (values.name || values.rif || values.email);
    
    if (hasChanges && !confirm('¿Desea cerrar sin guardar? Se perderán los cambios.')) {
      return;
    }
    
    onClose();
  };

  // Real-time RIF validation with enhanced UX
  useEffect(() => {
    if (values.rif) {
      const validation = rifValidator.validate(values.rif);
      setRifValidation({
        isValid: validation.isValid,
        type: validation.type,
        warnings: validation.errors
      });
    }
  }, [values.rif]);

  const handleRIFValidation = async () => {
    if (!rifValidation.isValid) {
      addToast({
        type: 'error',
        title: 'RIF inválido',
        message: 'Corrija el formato del RIF antes de validar con SENIAT'
      });
      return;
    }

    setIsValidatingWithSENIAT(true);
    
    try {
      const validation = await providerService.validateProviderRIFWithSENIAT(rifValidator.clean(values.rif));
      
      if (validation.isValid && validation.name) {
        setValue('name', validation.name);
        addToast({
          type: 'success',
          title: 'RIF validado con SENIAT',
          message: `Contribuyente encontrado: ${validation.name}`
        });
      } else {
        addToast({
          type: 'warning',
          title: 'RIF no encontrado en SENIAT',
          message: validation.error || 'Verifique el RIF o continúe manualmente'
        });
      }
    } catch (error) {
      console.error('❌ ProviderForm - SENIAT validation error:', error);
      addToast({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo conectar con SENIAT. Intente más tarde.'
      });
    } finally {
      setIsValidatingWithSENIAT(false);
    }
  };

  const taxTypeOptions = [
    { value: 'ordinary', label: 'Contribuyente Ordinario' },
    { value: 'special', label: 'Contribuyente Especial' },
    { value: 'formal', label: 'Contribuyente Formal' }
  ];

  const islrPercentageOptions = [
    { value: 2, label: '2% - Servicios de construcción, limpieza, transporte' },
    { value: 3, label: '3% - Servicios técnicos, publicidad, informática' },
    { value: 6, label: '6% - Honorarios profesionales, arrendamientos' }
  ];

  const ivaPercentageOptions = [
    { value: 75, label: '75% - Contribuyente Ordinario' },
    { value: 100, label: '100% - Contribuyente Especial' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isEditing ? 'Editar' : 'Nuevo'} Proveedor`}
      size="2xl"
      className="animate-scale-in"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 p-6 rounded-xl border border-primary-200 dark:border-primary-700">
          <h3 className="flex items-center text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            <Building2 className="h-5 w-5 mr-2 text-primary-600" />
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="RIF"
              required 
              error={getFieldError('rif') || (rifValidation.warnings.length > 0 ? rifValidation.warnings[0] : undefined)}
              helperText={rifValidation.isValid ? rifValidation.type : 'Formato: V-12345678-9'}
            >
              <div className="flex space-x-2">
                <Input
                  value={values.rif}
                  onChange={(e) => setValue('rif', rifValidator.format(e.target.value))}
                  onBlur={() => markTouched('rif')}
                  placeholder="V-12345678-9"
                  className="flex-1"
                  error={!!getFieldError('rif') || rifValidation.warnings.length > 0}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRIFValidation}
                  loading={isValidatingWithSENIAT}
                  disabled={!rifValidation.isValid}
                >
                  Validar SENIAT
                </Button>
              </div>
            </FormField>
            
            <FormField 
              label="Nombre / Razón Social"
              required
              error={getFieldError('name')}
            >
              <Input
                value={values.name}
                onChange={(e) => setValue('name', e.target.value)}
                onBlur={() => markTouched('name')}
                placeholder="Nombre del proveedor o razón social"
                error={!!getFieldError('name')}
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField 
              label="Dirección"
              error={getFieldError('address')}
            >
              <textarea
                value={values.address}
                onChange={(e) => setValue('address', e.target.value)}
                onBlur={() => markTouched('address')}
                className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                rows={3}
                placeholder="Dirección completa del proveedor"
              />
            </FormField>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/10 p-6 rounded-xl border border-accent-200 dark:border-accent-700">
          <h3 className="flex items-center text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            <User className="h-5 w-5 mr-2 text-accent-600" />
            Información de Contacto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Teléfono"
              error={getFieldError('phone')}
            >
              <Input
                value={values.phone}
                onChange={(e) => setValue('phone', e.target.value)}
                placeholder="0212-1234567"
                leftIcon={Phone}
                error={!!getFieldError('phone')}
              />
            </FormField>
            
            <FormField 
              label="Email"
              error={getFieldError('email')}
            >
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setValue('email', e.target.value)}
                onBlur={() => markTouched('email')}
                placeholder="correo@proveedor.com"
                leftIcon={Mail}
                error={!!getFieldError('email')}
              />
            </FormField>
            
            <FormField 
              label="Persona de Contacto"
              error={getFieldError('contactPerson')}
            >
              <Input
                value={values.contactPerson}
                onChange={(e) => setValue('contactPerson', e.target.value)}
                placeholder="Nombre del contacto principal"
                leftIcon={User}
                error={!!getFieldError('contactPerson')}
              />
            </FormField>
            
            <FormField 
              label="Sitio Web"
            >
              <Input
                value={values.website}
                onChange={(e) => setValue('website', e.target.value)}
                placeholder="www.proveedor.com"
                leftIcon={Globe}
              />
            </FormField>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/10 p-6 rounded-xl border border-success-200 dark:border-success-700">
          <h3 className="flex items-center text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            <Calculator className="h-5 w-5 mr-2 text-success-600" />
            Configuración Fiscal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tipo de Contribuyente">
              <Select
                value={values.taxType}
                onChange={(e) => setValue('taxType', e.target.value)}
                options={taxTypeOptions}
                className="dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
              />
            </FormField>
            
            <FormField 
              label="% Retención ISLR"
              error={getFieldError('retentionISLRPercentage')}
              helperText="Porcentaje según concepto de servicios"
            >
              <Select
                value={values.retentionISLRPercentage}
                onChange={(e) => setValue('retentionISLRPercentage', parseFloat(e.target.value))}
                options={islrPercentageOptions}
                className="dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
              />
            </FormField>
            
            <FormField 
              label="% Retención IVA"
              error={getFieldError('retentionIVAPercentage')}
              helperText="75% ordinario, 100% especial"
            >
              <Select
                value={values.retentionIVAPercentage}
                onChange={(e) => setValue('retentionIVAPercentage', parseFloat(e.target.value))}
                options={ivaPercentageOptions}
                className="dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
              />
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <FormField 
            label="Notas Adicionales"
          >
            <textarea
              value={values.notes}
              onChange={(e) => setValue('notes', e.target.value)}
              className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
              rows={3}
              placeholder="Información adicional sobre el proveedor..."
            />
          </FormField>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Button
            variant="outline"
            onClick={handleClose}
            icon={X}
            type="button"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={Save}
            disabled={!values.name || !values.rif}
          >
            {isEditing ? 'Actualizar' : 'Guardar'} Proveedor
          </Button>
        </div>
      </form>
    </Modal>
  );
}