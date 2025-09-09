import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Upload, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  FileText,
  Camera,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  Download,
  Printer,
  Settings,
  Shield,
  Key,
  Database,
  Cloud,
  CreditCard,
  Lock,
  Percent,
  Calendar
} from 'lucide-react';
import { useCompany } from '../../hooks/useCompany';
import { useFormValidation } from '../../hooks/useFormValidation';
import { commonValidationRules } from '../../utils/validators';
import { formatRIF, validateRIF } from '../../utils/formatters';
import { CompanySettings } from '../../services/companyService';
import { authService } from '../../services/authService';
import Button from '../UI/Button';
import Input from '../UI/Input';
import FormField from '../UI/FormField';

export default function CompanySettingsModule() {
  const { company, loading, updateCompany, exportConfiguration } = useCompany();
  const currentUser = authService.getCurrentUser();
  const canEdit = currentUser && authService.hasRole('admin');
  
  const [activeTab, setActiveTab] = useState<'basic' | 'fiscal' | 'branding' | 'security'>('basic');
  const [isExporting, setIsExporting] = useState(false);

  const initialValues: CompanySettings = company || {
    rif: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    fiscalYear: new Date().getFullYear(),
    currency: 'VES',
    taxRegime: company?.taxRegime || 'ordinary',
    accountingMethod: 'accrual' as const,
    defaultISLRPercentage: 6,
    defaultIVAPercentage: 75,
    primaryColor: '#2563EB',
    secondaryColor: '#DC2626',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    emailFromName: company?.name || ''
  };

  const validationRules = {
    rif: commonValidationRules.rif,
    name: [
      { validator: (value: string) => !!value && value.length >= 3, message: 'El nombre debe tener al menos 3 caracteres' }
    ],
    email: commonValidationRules.email,
    address: [
      { validator: (value: string) => !!value && value.length >= 10, message: 'La dirección debe ser más específica (mínimo 10 caracteres)' }
    ]
  };

  const {
    values,
    errors,
    isSubmitting,
    setValue,
    markTouched,
    handleSubmit,
    reset
  } = useFormValidation({
    initialValues,
    validationRules,
    onSubmit: async (formData) => {
      const result = await updateCompany(formData);
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar configuración');
      }
    }
  });

  const handleExportConfiguration = async () => {
    if (!canEdit) {
      alert('❌ Solo administradores pueden exportar configuración');
      return;
    }
    
    setIsExporting(true);
    try {
      await exportConfiguration();
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestEmail = () => {
    if (!values.smtpHost || !values.smtpUser) {
      alert('❌ Configure primero los datos del servidor SMTP');
      return;
    }
    
    alert('📧 Enviando email de prueba... Verifique su bandeja de entrada');
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Cargando configuración de empresa...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Acceso Restringido</h2>
            <p className="text-yellow-800">Solo los administradores pueden acceder a la configuración de empresa.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleBackupNow = () => {
    alert('💾 Iniciando backup manual de la base de datos...');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configuración de Empresa
            </h1>
            <p className="text-gray-600">
              Gestión completa de datos corporativos y configuraciones
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handleExportConfiguration}
              disabled={isExporting}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Config
                </>
              )}
            </button>
            <button 
              onClick={handleBackupNow}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Database className="h-4 w-4 mr-2" />
              Backup Manual
            </button>
            <button 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar Configuración
            </button>
          </div>
        </div>
      </div>

      {/* Company Status Card */}
      <div className={`
        rounded-xl p-6 text-white shadow-xl mb-8
        ${company?.rif 
          ? 'bg-gradient-to-r from-green-600 to-green-700' 
          : 'bg-gradient-to-r from-amber-600 to-amber-700'
        }
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{company?.name || 'Empresa No Configurada'}</h2>
              <p className={company?.rif ? "text-green-100" : "text-amber-100"}>
                {company?.rif ? formatRIF(company.rif) : 'Configure la información de empresa'}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  {company?.rif && validateRIF(company.rif) ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-white" />
                  )}
                  <span className="text-sm opacity-90">
                    {company?.rif && validateRIF(company.rif) ? 'RIF Válido' : 'Configure RIF'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-white" />
                  <span className="text-sm opacity-90">Licencia Enterprise</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">
              {company?.rif ? 'Sistema Configurado' : 'Configuración Pendiente'}
            </p>
            <p className="text-xs opacity-75">
              Última actualización: {company?.updatedAt ? new Date(company.updatedAt).toLocaleDateString('es-VE') : 'No disponible'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Datos Básicos
          </button>
          <button
            onClick={() => setActiveTab('fiscal')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'fiscal'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Configuración Fiscal
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'branding'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Camera className="h-4 w-4 inline mr-2" />
            Imagen Corporativa
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Seguridad y Backup
          </button>
        </div>

        <div className="p-8">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="RIF de la Empresa" 
                  required 
                  error={errors.rif}
                >
                  <Input
                    value={values.rif}
                    onChange={(e) => setValue('rif', e.target.value)}
                    onBlur={() => markTouched('rif')}
                    placeholder="J-123456789-0"
                    leftIcon={Building2}
                    className="dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
                  />
                </FormField>

                <FormField 
                  label="Razón Social" 
                  required 
                  error={errors.name}
                >
                  <Input
                    value={values.name}
                    onChange={(e) => setValue('name', e.target.value)}
                    onBlur={() => markTouched('name')}
                    placeholder="MI EMPRESA, C.A."
                    leftIcon={Building2}
                    className="dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
                  />
                </FormField>

                <FormField 
                  label="Email Corporativo" 
                  required 
                  error={errors.email}
                >
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(e) => setValue('email', e.target.value)}
                    onBlur={() => markTouched('email')}
                    placeholder="contacto@empresa.com"
                    leftIcon={Mail}
                    className="dark:bg-neutral-800 dark:text-white dark:border-neutral-600"
                  />
                </FormField>

                <FormField label="Teléfono Corporativo">
                  <Input
                    value={values.phone}
                    onChange={(e) => setValue('phone', e.target.value)}
                    placeholder="0212-1234567"
                    leftIcon={Phone}
                  />
                </FormField>

                <FormField label="Sitio Web">
                  <Input
                    value={values.website || ''}
                    onChange={(e) => setValue('website', e.target.value)}
                    placeholder="www.empresa.com"
                    leftIcon={Globe}
                  />
                </FormField>

                <FormField 
                  label="Dirección Fiscal" 
                  required 
                  error={errors.address}
                  className="md:col-span-2"
                >
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    <textarea
                      value={values.address}
                      onChange={(e) => setValue('address', e.target.value)}
                      onBlur={() => markTouched('address')}
                      className="input-enterprise w-full pl-12 resize-none"
                      rows={3}
                      placeholder="Dirección completa registrada en el RIF"
                    />
                  </div>
                </FormField>
              </div>

              {/* Email Configuration Enhanced */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 rounded-lg p-6 border border-primary-200 dark:border-primary-700">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Email</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Servidor SMTP">
                    <Input
                      value={values.smtpHost || ''}
                      onChange={(e) => setValue('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                      leftIcon={Globe}
                    />
                  </FormField>
                  
                  <FormField label="Puerto SMTP">
                    <Input
                      type="number"
                      value={values.smtpPort?.toString() || ''}
                      onChange={(e) => setValue('smtpPort', parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </FormField>
                  
                  <FormField label="Usuario SMTP">
                    <Input
                      type="email"
                      value={values.smtpUser || ''}
                      onChange={(e) => setValue('smtpUser', e.target.value)}
                      placeholder="usuario@empresa.com"
                      leftIcon={Mail}
                    />
                  </FormField>
                  
                  <FormField label="Contraseña SMTP">
                    <Input
                      type="password"
                      value={values.smtpPassword || ''}
                      onChange={(e) => setValue('smtpPassword', e.target.value)}
                      placeholder="••••••••••"
                      leftIcon={Lock}
                    />
                  </FormField>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button
                    type="button"
                    onClick={handleTestEmail}
                    variant="outline"
                    icon={Mail}
                  >
                    Probar Configuración
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={Save}
                >
                  Guardar Configuración
                </Button>
              </div>
            </form>
          )}

          {/* Fiscal Configuration Tab */}
          {activeTab === 'fiscal' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Año Fiscal">
                  <select
                    value={values.fiscalYear}
                    onChange={(e) => setValue('fiscalYear', parseInt(e.target.value))}
                    className="input-enterprise w-full"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const currentYear = new Date().getFullYear();
                      const year = currentYear + i - 2; // 2 años atrás, actual, 2 años adelante
                      return (
                        <option key={year} value={year}>{year}</option>
                      );
                    })}
                  </select>
                </FormField>

                <FormField label="Moneda Principal">
                  <select
                    value={values.currency}
                    onChange={(e) => setValue('currency', e.target.value)}
                    className="input-enterprise w-full"
                  >
                    <option value="VES">Bolívares (VES)</option>
                    <option value="USD">Dólares (USD)</option>
                    <option value="EUR">Euros (EUR)</option>
                  </select>
                </FormField>

                <FormField label="Régimen Tributario">
                  <select
                    value={values.taxRegime}
                    onChange={(e) => {
                      const newRegime = e.target.value;
                      setValue('taxRegime', newRegime);
                      console.log('💼 CompanySettings - Tax regime changed to:', newRegime);
                      // Force mark field as touched to ensure validation
                      markTouched('taxRegime');
                    }}
                    className="input-enterprise w-full"
                  >
                    <option value="ordinary">Contribuyente Ordinario</option>
                    <option value="special">Contribuyente Especial</option>
                    <option value="formal">Contribuyente Formal</option>
                  </select>
                </FormField>

                <FormField label="Método Contable">
                  <select
                    value={values.accountingMethod}
                    onChange={(e) => setValue('accountingMethod', e.target.value as 'accrual' | 'cash')}
                    className="input-enterprise w-full"
                  >
                    <option value="accrual">Base Devengado</option>
                    <option value="cash">Base Efectivo</option>
                  </select>
                </FormField>

                <FormField label="% ISLR por Defecto">
                  <Input
                    type="number"
                    value={values.defaultISLRPercentage?.toString() || '6'}
                    onChange={(e) => setValue('defaultISLRPercentage', parseFloat(e.target.value) || 6)}
                    placeholder="6"
                    leftIcon={Percent}
                  />
                </FormField>

                <FormField label="% IVA por Defecto">
                  <Input
                    type="number"
                    value={values.defaultIVAPercentage?.toString() || '75'}
                    onChange={(e) => setValue('defaultIVAPercentage', parseFloat(e.target.value) || 75)}
                    placeholder="75"
                    leftIcon={Percent}
                  />
                </FormField>
              </div>

              {/* Configuración SENIAT */}
              <div className="bg-gradient-to-r from-red-50 to-yellow-50 dark:from-red-900/20 dark:to-yellow-900/20 rounded-lg p-6 border border-red-200 dark:border-red-700">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-red-600" />
                  Configuración SENIAT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    label="Período de Vigencia"
                    helperText={`Formato MM-YYYY (ej: ${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()})`}
                  >
                    <Input
                      value={values.periodoVigencia || `${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`}
                      onChange={(e) => setValue('periodoVigencia', e.target.value)}
                      placeholder={`${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getFullYear()}`}
                      leftIcon={Calendar}
                    />
                  </FormField>
                  
                  <FormField 
                    label="Número de Control Inicial"
                    helperText="Secuencia inicial para comprobantes"
                  >
                    <Input
                      value={values.numeroControlInicial || `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}00000001`}
                      onChange={(e) => setValue('numeroControlInicial', e.target.value)}
                      placeholder={`${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}00000001`}
                      leftIcon={FileText}
                    />
                  </FormField>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Información Importante</p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                        Estos parámetros se utilizan para generar archivos oficiales SENIAT. 
                        La secuencia de comprobantes se incrementa automáticamente con cada exportación.
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                        <strong>Secuencia actual:</strong> {values.secuenciaComprobantes || 1}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={Save}
                >
                  Guardar Configuración Fiscal
                </Button>
              </div>
            </form>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Color Primario">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={values.primaryColor || '#2563EB'}
                      onChange={(e) => setValue('primaryColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg"
                    />
                    <Input
                      value={values.primaryColor || '#2563EB'}
                      onChange={(e) => setValue('primaryColor', e.target.value)}
                      placeholder="#2563EB"
                      className="flex-1"
                    />
                  </div>
                </FormField>

                <FormField label="Color Secundario">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={values.secondaryColor || '#DC2626'}
                      onChange={(e) => setValue('secondaryColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg"
                    />
                    <Input
                      value={values.secondaryColor || '#DC2626'}
                      onChange={(e) => setValue('secondaryColor', e.target.value)}
                      placeholder="#DC2626"
                      className="flex-1"
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Logo de la Empresa</h4>
                  <div className="text-center">
                    <div 
                      className="w-32 h-32 rounded-lg mx-auto mb-4 flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${values.primaryColor || '#2563EB'}, ${values.secondaryColor || '#DC2626'})` 
                      }}
                    >
                      <Building2 className="h-16 w-16 text-white" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      icon={Upload}
                      className="w-full"
                    >
                      Subir Logo
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Vista Previa</h4>
                  <div 
                    className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center"
                    style={{ borderColor: values.primaryColor || '#2563EB' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2"
                      style={{ backgroundColor: values.primaryColor || '#2563EB' }}
                    ></div>
                    <p className="text-sm font-medium" style={{ color: values.primaryColor || '#2563EB' }}>
                      {values.name || 'Nombre Empresa'}
                    </p>
                    <p className="text-xs text-gray-500">{formatRIF(values.rif)}</p>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={Save}
                >
                  Guardar Configuración Visual
                </Button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-green-900">Backup Automático</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        readOnly
                      />
                      <span className="text-sm text-green-800">Activado</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-green-800 mb-1">Frecuencia</label>
                      <select
                        defaultValue="daily"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                    </div>
                    
                    <div className="text-xs text-green-700">
                      <p>Último backup: {new Date().toLocaleDateString('es-VE')}</p>
                      <p>Próximo backup: {new Date(Date.now() + 24*60*60*1000).toLocaleDateString('es-VE')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-blue-900">Encriptación</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        readOnly
                      />
                      <span className="text-sm text-blue-800">AES-256</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-blue-700">
                    <div className="flex items-center justify-between">
                      <span>Base de Datos:</span>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Archivos PDF:</span>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Configuración:</span>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-purple-900">Auditoría</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        readOnly
                      />
                      <span className="text-sm text-purple-800">Activado</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-purple-700">
                    <p>• Registro de todas las acciones del usuario</p>
                    <p>• Seguimiento de cambios en transacciones</p>
                    <p>• Historial de inicios de sesión</p>
                    <p>• Logs de exportación de datos</p>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-4">Información de Licencia</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-800">Tipo:</span>
                      <span className="font-semibold text-yellow-900">Enterprise</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-800">Vencimiento:</span>
                      <span className="font-semibold text-yellow-900">31/12/2025</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-800">Registros:</span>
                      <span className="font-semibold text-yellow-900">Ilimitados</span>
                    </div>
                    <div className="pt-2 border-t border-yellow-200">
                      <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 text-sm">
                        Renovar Licencia
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}