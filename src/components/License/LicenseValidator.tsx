import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Key, 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  Calendar,
  Building2,
  User,
  Star,
  FileText,
  Trash2,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import FormField from '../UI/FormField';
import StatusIndicator from '../UI/StatusIndicator';
import { useToast } from '../UI/Toast';
import { licenseService, LicenseData } from '../../services/licenseService';
import { useCompany } from '../../hooks/useCompany';
import { useLicense } from '../../hooks/useLicense';

export default function LicenseValidator() {
  const [licenseKey, setLicenseKey] = useState('');
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const { company } = useCompany();
  const { 
    currentLicense,
    isLoading,
    isExpired,
    isNearExpiry,
    remainingDays,
    expiryWarning,
    usageStats
  } = useLicense();

  // Show loading spinner while license data is being loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">Cargando información de licencia...</span>
      </div>
    );
  }

  const handleValidateLicenseKey = async () => {
    if (!licenseKey.trim()) {
      addToast({
        type: 'warning',
        title: 'Clave requerida',
        message: 'Ingrese una clave de licencia válida'
      });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      console.log('🔍 Validating license key:', licenseKey.substring(0, 10) + '...');
      
      const result = await licenseService.validateLicenseKey(licenseKey);
      setValidationResult(result);

      if (result.isValid) {
        addToast({
          type: 'success',
          title: 'Licencia válida',
          message: `Licencia ${result.data?.license.type} validada exitosamente`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Licencia inválida',
          message: result.error || 'La clave de licencia no es válida'
        });
      }
    } catch (error) {
      console.error('❌ License validation error:', error);
      addToast({
        type: 'error',
        title: 'Error de validación',
        message: 'No se pudo validar la licencia'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!validationResult?.isValid) {
      addToast({
        type: 'error',
        title: 'Licencia inválida',
        message: 'Valide la licencia antes de activarla'
      });
      return;
    }

    // Simplified company matching to prevent crashes
    const companyData = localStorage.getItem('contave-company-v2');
    const currentCompany = companyData ? JSON.parse(companyData) : null;
    
    if (currentCompany?.rif && validationResult.data && validationResult.data.client.rif !== currentCompany.rif) {
      addToast({
        type: 'error',
        title: 'RIF no coincide',
        message: `Esta licencia es para ${validationResult.data.client.rif}, pero su empresa tiene RIF ${currentCompany.rif}`
      });
      return;
    }

    try {
      setValidating(true);
      const result = await licenseService.activateLicense(licenseKey);
      
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Licencia activada',
          message: `Licencia ${validationResult.data.license.type} activada exitosamente`
        });
        
        setLicenseKey('');
        setValidationResult(null);
      } else {
        addToast({
          type: 'error',
          title: 'Error de activación',
          message: result.error || 'No se pudo activar la licencia'
        });
      }
    } catch (error) {
      console.error('License activation error:', error);
      addToast({
        type: 'error',
        title: 'Error del sistema',
        message: 'Ocurrió un error durante la activación. Intente nuevamente.'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    setSelectedFile(file);
    setLoading(true);

    try {
      const result = await licenseService.loadLicenseFromFile(file);
      
      if (result.isValid) {
        addToast({
          type: 'success',
          title: 'Licencia cargada',
          message: `Archivo de licencia ${result.data?.license.type} cargado exitosamente`
        });
        
        setSelectedFile(null);
      } else {
        addToast({
          type: 'error',
          title: 'Archivo inválido',
          message: result.error || 'El archivo de licencia no es válido'
        });
      }
    } catch (error) {
      console.error('❌ File loading error:', error);
      addToast({
        type: 'error',
        title: 'Error al cargar archivo',
        message: 'No se pudo procesar el archivo de licencia'
      });
    } finally {
      setLoading(false);
      setSelectedFile(null);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeactivateLicense = async () => {
    if (!currentLicense) return;

    const confirmMessage = `¿Está seguro de desactivar la licencia ${currentLicense.license.type}?

Esto bloqueará todas las funciones avanzadas del sistema.`;

    if (confirm(confirmMessage)) {
      try {
        await licenseService.deactivateLicense();
        
        addToast({
          type: 'info',
          title: 'Licencia desactivada',
          message: 'La licencia ha sido desactivada exitosamente'
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudo desactivar la licencia'
        });
      }
    }
  };

  const handleCopyLicenseKey = () => {
    if (currentLicense?.metadata.licenseKey) {
      navigator.clipboard.writeText(currentLicense.metadata.licenseKey);
      addToast({
        type: 'success',
        title: 'Copiado',
        message: 'Clave de licencia copiada al portapapeles'
      });
    }
  };

  const handleExportLicenseInfo = () => {
    try {
      const blob = licenseService.exportLicenseInfo();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `licencia-info-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Información exportada',
        message: 'Información de licencia exportada exitosamente'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al exportar',
        message: 'No se pudo exportar la información de licencia'
      });
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'enterprise': return 'from-purple-500 to-purple-600';
      case 'professional': return 'from-blue-500 to-blue-600';
      case 'basic': return 'from-green-500 to-green-600';
      case 'trial': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLicenseFeatures = (type: string): string[] => {
    return licenseService.getLicenseFeatures(type);
  };

  return (
    <div className="space-y-8">
      {/* Current License Status */}
      {currentLicense && currentLicense.client && (
        <div className={`bg-gradient-to-br ${getLicenseTypeColor(currentLicense.license.type)} rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <div className="w-full h-full bg-white rounded-full transform translate-x-20 -translate-y-20"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold capitalize">{currentLicense.license.type}</h2>
                  <p className="text-white/80 text-lg">{currentLicense.client.company}</p>
                </div>
              </div>
              
              <div className="text-right">
                <StatusIndicator
                  status={isExpired ? 'error' : isNearExpiry ? 'warning' : 'success'}
                  text={isExpired ? 'Expirada' : isNearExpiry ? `${remainingDays} días` : 'Activa'}
                  size="lg"
                  showIcon={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-5 w-5 text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Vencimiento</span>
                </div>
                <p className="text-xl font-bold">{new Date(currentLicense.license.expiryDate).toLocaleDateString('es-VE')}</p>
                <p className="text-xs text-white/70 mt-1">{remainingDays} días restantes</p>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="h-5 w-5 text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Empresa</span>
                </div>
                <p className="text-sm font-bold">{currentLicense.client?.company || 'N/A'}</p>
                <p className="text-xs text-white/70">{currentLicense.client?.rif || 'N/A'}</p>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <User className="h-5 w-5 text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Registros</span>
                </div>
                <p className="text-xl font-bold">
                  {currentLicense.limits.maxRecords === -1 
                    ? 'Ilimitados'
                    : `${usageStats.currentRecords}/${currentLicense.limits.maxRecords}`
                  }
                </p>
                <p className="text-xs text-white/70">
                  {currentLicense.limits.maxRecords > 0 ? `${usageStats.usagePercentage.toFixed(1)}% usado` : 'Sin límite'}
                </p>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="h-5 w-5 text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Estado</span>
                </div>
                <p className="text-xl font-bold">{isExpired ? 'Expirada' : 'Activa'}</p>
                <p className="text-xs text-white/70">
                  {currentLicense.license.status === 'active' ? 'Operacional' : 'Suspendida'}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm mb-6">
              <h3 className="text-lg font-bold mb-4">Características Incluidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getLicenseFeatures(currentLicense.license.type).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-300 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiry Warning */}
            {expiryWarning && (
              <div className="bg-amber-500/20 border border-amber-300/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-100 font-semibold text-sm">{expiryWarning}</p>
                    <div className="mt-3 flex space-x-2">
                      <button className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">
                        Renovar Licencia
                      </button>
                      <button className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors">
                        Contactar Ventas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* License Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLicenseKey}
                icon={Copy}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Copiar Clave
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLicenseInfo}
                icon={Download}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Exportar Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeactivateLicense}
                icon={Trash2}
                className="text-red-200 border-red-300/50 hover:bg-red-500/20"
              >
                Desactivar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* License Activation Card */}
      <div className="card-premium p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Gestión de Licencias
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">
              Active o valide licencias del sistema
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Method 1: License Key Input */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 p-6 rounded-xl border border-primary-200 dark:border-primary-700">
            <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-4">
              Método 1: Clave de Licencia
            </h3>
            
            <FormField label="Clave de Licencia">
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <Input
                    type={showLicenseKey ? "text" : "password"}
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    placeholder="ENT202412XXXX"
                    className="pr-20 font-mono"
                    leftIcon={Key}
                  />
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowLicenseKey(!showLicenseKey)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {showLicenseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.readText().then(text => setLicenseKey(text.toUpperCase()))}
                      className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      title="Pegar desde clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <Button
                  onClick={handleValidateLicenseKey}
                  loading={validating}
                  variant="outline"
                  icon={Shield}
                  disabled={!licenseKey.trim()}
                >
                  Validar
                </Button>
                
                {validationResult?.isValid && (
                  <Button
                    onClick={handleActivateLicense}
                    variant="primary"
                    icon={Zap}
                  >
                    Activar
                  </Button>
                )}
              </div>
            </FormField>

            {/* Validation Result */}
            {validationResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                validationResult.isValid 
                  ? 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-700' 
                  : 'bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-700'
              }`}>
                <div className="flex items-center space-x-3">
                  {validationResult.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      validationResult.isValid ? 'text-success-800 dark:text-success-100' : 'text-error-800 dark:text-error-100'
                    }`}>
                      {validationResult.isValid ? 'Licencia Válida' : 'Licencia Inválida'}
                    </p>
                    <p className={`text-sm ${
                      validationResult.isValid ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300'
                    }`}>
                      {validationResult.isValid 
                        ? `${validationResult.data?.license.type} - ${validationResult.remainingDays} días restantes`
                        : validationResult.error
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Method 2: File Upload */}
          <div className="bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/10 p-6 rounded-xl border border-accent-200 dark:border-accent-700">
            <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4">
              Método 2: Archivo de Licencia
            </h3>
            
            <div 
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                ${loading 
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20'
                }
              `}
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt,.license"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {loading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-12 w-12 text-primary-600 animate-spin mb-4" />
                  <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                    Procesando Licencia
                  </h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Validando archivo de licencia...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Importar Archivo de Licencia
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    Arrastre un archivo .json/.license o haga clic para seleccionar
                  </p>
                  <div className="text-xs text-neutral-400 dark:text-neutral-500">
                    Formatos soportados: JSON, TXT, LICENSE
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* License Help */}
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700">
            <h3 className="flex items-center font-bold text-primary-900 dark:text-primary-100 mb-3">
              <Star className="h-5 w-5 mr-2 text-primary-600" />
              ¿Necesita una Licencia?
            </h3>
            <p className="text-sm text-primary-800 dark:text-primary-200 mb-4">
              Contáctenos para obtener una licencia Enterprise de ContaVe Pro personalizada para su empresa.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2 text-xs text-primary-700 dark:text-primary-300">
                <div className="flex items-center space-x-2">
                  <span>📧</span>
                  <span className="font-medium">ventas@contavepro.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📱</span>
                  <span className="font-medium">WhatsApp: +58-212-555-0199</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-primary-700 dark:text-primary-300">
                <div className="flex items-center space-x-2">
                  <span>🌐</span>
                  <span className="font-medium">www.contavepro.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⏰</span>
                  <span className="font-medium">Lun-Vie 8AM-6PM GMT-4</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white/80 dark:bg-neutral-800/80 p-3 rounded-lg text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Trial</p>
                <p className="text-lg font-bold text-primary-700 dark:text-primary-300">Gratis</p>
                <p className="text-xs text-neutral-500">7 días</p>
              </div>
              <div className="bg-white/80 dark:bg-neutral-800/80 p-3 rounded-lg text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Básica</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">$99</p>
                <p className="text-xs text-neutral-500">por año</p>
              </div>
              <div className="bg-white/80 dark:bg-neutral-800/80 p-3 rounded-lg text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Profesional</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">$299</p>
                <p className="text-xs text-neutral-500">por año</p>
              </div>
              <div className="bg-white/80 dark:bg-neutral-800/80 p-3 rounded-lg text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Enterprise</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">$599</p>
                <p className="text-xs text-neutral-500">por año</p>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          {currentLicense && (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary-600" />
                Estadísticas de Uso
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Registros Usados:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {currentLicense.limits.maxRecords === -1 
                      ? `${usageStats.currentRecords} / Ilimitados`
                      : `${usageStats.currentRecords} / ${currentLicense.limits.maxRecords}`
                    }
                  </span>
                </div>
                
                {currentLicense.limits.maxRecords > 0 && (
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        usageStats.usagePercentage >= 90 ? 'bg-gradient-to-r from-error-500 to-error-600' :
                        usageStats.usagePercentage >= 70 ? 'bg-gradient-to-r from-warning-500 to-warning-600' :
                        'bg-gradient-to-r from-primary-500 to-primary-600'
                      }`}
                      style={{ width: `${Math.min(usageStats.usagePercentage, 100)}%` }}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Usuarios Activos:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {currentLicense.limits.maxUsers === -1 
                      ? `${usageStats.currentUsers} / Ilimitados`
                      : `${usageStats.currentUsers} / ${currentLicense.limits.maxUsers}`
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Empresas Permitidas:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {currentLicense.limits.maxCompanies === -1 ? 'Ilimitadas' : currentLicense.limits.maxCompanies}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">Cargada el:</span>
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                      {localStorage.getItem('contave-license-loaded-at') 
                        ? new Date(localStorage.getItem('contave-license-loaded-at')!).toLocaleString('es-VE')
                        : 'Información no disponible'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No License Warning */}
      {!currentLicense && (
        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-6 border-2 border-warning-200 dark:border-warning-700">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-warning-900 dark:text-warning-100 mb-2">
                Sin Licencia Activa
              </h3>
              <p className="text-sm text-warning-800 dark:text-warning-200 mb-4">
                El sistema está funcionando en modo de prueba limitado. Para acceder a todas las características enterprise, active una licencia válida usando uno de los métodos anteriores.
              </p>
              
              <div className="bg-warning-100 dark:bg-warning-900/40 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-2">Limitaciones Actuales:</h4>
                <ul className="text-sm text-warning-800 dark:text-warning-200 space-y-1">
                  <li>• Máximo 50 transacciones</li>
                  <li>• Solo funciones básicas</li>
                  <li>• Sin exportaciones SENIAT</li>
                  <li>• Sin soporte técnico</li>
                  <li>• Sin backup automático</li>
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="primary" size="sm">
                  Contactar Ventas
                </Button>
                <Button variant="outline" size="sm">
                  Más Información
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Development Tools */}
      {import.meta.env.DEV && (
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 border border-neutral-300 dark:border-neutral-600">
          <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            🔧 Herramientas de Desarrollo
          </h3>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => licenseService.debugLicenseState()}
              icon={Info}
            >
              Debug License
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('contave-license-data');
                localStorage.removeItem('contave-license-key');
                addToast({ type: 'info', title: 'Licencia limpiada', message: 'Datos de licencia eliminados para testing' });
              }}
              icon={Trash2}
            >
              Clear License
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}