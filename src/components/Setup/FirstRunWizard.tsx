import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Shield, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Key,
  Globe,
  Database,
  Zap,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Lock,
  AlertCircle,
  Rocket,
  Trophy,
  Star,
  ArrowRight,
  Check,
  X,
  Eye,
  EyeOff,
  HelpCircle,
  Upload,
  Gift,
  Crown,
  Clock,
  FileText
} from 'lucide-react';

import { authService } from '../../services/authService';
import { syncService } from '../../services/syncService';
import { licenseService } from '../../services/licenseService';
import { supabase } from '../../config/database';  

// Toast Component
const Toast = ({ type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <X className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />
  };

  const colors = {
    success: 'from-emerald-500 to-green-600',
    error: 'from-red-500 to-rose-600',
    warning: 'from-amber-500 to-orange-600'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 
      bg-gradient-to-r ${colors[type]} 
      text-white rounded-2xl p-4 pr-12
      shadow-2xl backdrop-blur-xl
      animate-slide-in min-w-[320px]
      border border-white/20
    `}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-1 text-white/90">{message}</p>
        </div>
      </div>
    </div>
  );
};

// License Modal Component
const LicenseModal = ({ isOpen, onClose, onActivate, companyData }) => {
  const [activeTab, setActiveTab] = useState('demo'); // 'demo', 'file', 'key'
  const [activationKey, setActivationKey] = useState('');
  const [licenseFile, setLicenseFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDemoActivation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Generate demo license key
      const demoKey = `DEMO-${Date.now()}-TRIAL`;
      
      // Activate demo license using the license service
      const result = await licenseService.activateLicense(demoKey, {
        name: companyData.name || 'Demo Company',
        email: companyData.email || 'demo@contave.com',
        rif: companyData.rif || 'J-00000000-0'
      });
      
      if (result) {
        onActivate({
          type: 'demo',
          message: 'Licencia demo de 7 días activada exitosamente'
        });
        onClose();
      } else {
        setError('No se pudo activar la licencia demo');
      }
    } catch (err) {
      setError('Error al activar la licencia demo');
      console.error('Demo activation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!licenseFile) {
      setError('Por favor seleccione un archivo de licencia');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await licenseService.loadLicenseFromFile(licenseFile);
      
      if (result.isValid) {
        onActivate({
          type: 'file',
          message: 'Licencia cargada exitosamente desde archivo'
        });
        onClose();
      } else {
        setError(result.error || 'Archivo de licencia inválido');
      }
    } catch (err) {
      setError('Error al cargar el archivo de licencia');
      console.error('File upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyActivation = async () => {
    if (!activationKey.trim()) {
      setError('Por favor ingrese una clave de activación');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await licenseService.activateLicense(activationKey, {
        name: companyData.name || 'Company',
        email: companyData.email || 'contact@company.com',
        rif: companyData.rif || ''
      });
      
      if (result) {
        onActivate({
          type: 'key',
          message: 'Licencia activada exitosamente'
        });
        onClose();
      } else {
        setError('Clave de activación inválida');
      }
    } catch (err) {
      setError('Error al activar la licencia');
      console.error('Key activation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Key className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Activar Licencia</h2>
                <p className="text-blue-100 mt-1">Elija cómo activar ContaVe Pro</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'demo'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-4 w-4" />
                <span>Prueba Gratis</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'file'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Archivo de Licencia</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('key')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'key'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Key className="h-4 w-4" />
                <span>Clave de Activación</span>
              </div>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Demo Tab */}
            {activeTab === 'demo' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
                    <Gift className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Prueba Gratis de 7 Días
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Acceda a todas las funciones de ContaVe Pro sin compromiso
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                    Incluye en su período de prueba:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Usuarios ilimitados',
                      'Todas las funciones premium',
                      'Soporte técnico completo',
                      'Exportación de datos',
                      'Backup automático',
                      'Sin tarjeta de crédito'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Después de 7 días
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                        Podrá actualizar a una licencia completa o el sistema entrará en modo de solo lectura
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleDemoActivation}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Rocket className="h-5 w-5" />
                      Activar Prueba Gratis
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* File Tab */}
            {activeTab === 'file' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                    <FileText className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Cargar Archivo de Licencia
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Si ya tiene un archivo de licencia (.json), cárguelo aquí
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setLicenseFile(e.target.files[0])}
                    className="hidden"
                    id="license-file-input"
                  />
                  <label
                    htmlFor="license-file-input"
                    className="cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {licenseFile ? licenseFile.name : 'Haga clic para seleccionar archivo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Formato soportado: .json
                    </p>
                  </label>
                </div>
                
                <button
                  onClick={handleFileUpload}
                  disabled={!licenseFile || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Cargar Archivo
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Key Tab */}
            {activeTab === 'key' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4">
                    <Key className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Clave de Activación
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ingrese su clave de licencia para activar ContaVe Pro
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Clave de Activación
                    </label>
                    <input
                      type="text"
                      value={activationKey}
                      onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-center font-mono text-lg"
                    />
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          ¿Dónde encuentro mi clave?
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                          La clave fue enviada a su email después de la compra. Si no la encuentra, contacte a soporte.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleKeyActivation}
                  disabled={!activationKey.trim() || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Crown className="h-5 w-5" />
                      Activar Licencia
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>¿Necesita ayuda?</span>
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Contactar Soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Enhanced Input Component
const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  error = false,
  className = '',
  helper
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="space-y-1">
      <div className="relative group">
        {LeftIcon && (
          <LeftIcon className={`
            absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5
            ${error ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'}
            transition-all duration-200
          `} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3.5 
            ${LeftIcon ? 'pl-12' : ''}
            ${RightIcon ? 'pr-12' : ''}
            bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
            border-2 rounded-xl
            ${error 
              ? 'border-red-400 focus:border-red-500' 
              : isFocused 
                ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }
            focus:outline-none
            transition-all duration-200
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            ${isFocused ? 'transform scale-[1.02]' : ''}
            ${className}
          `}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <RightIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {helper && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">{helper}</p>
      )}
    </div>
  );
};

// FormField Component
const FormField = ({ label, error, children, required = false, helper }) => (
  <div className="space-y-2">
    {label && (
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
        {helper && (
          <div className="group relative">
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {helper}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </label>
    )}
    {children}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-shake pl-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

// Button Component
const Button = ({ 
  variant = 'primary', 
  size = 'md',
  loading = false, 
  icon: Icon, 
  iconPosition = 'left',
  children, 
  onClick,
  disabled = false,
  className = '' 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700',
    outline: 'bg-transparent text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-semibold rounded-xl
        transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
        ${className}
      `}
    >
      {loading ? (
        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
        </>
      )}
    </button>
  );
};

// Progress Step Component
const ProgressStep = ({ step, currentStep, index, totalSteps, onClick }) => {
  const isActive = currentStep === step.id;
  const isCompleted = currentStep > step.id;
  const isClickable = step.id < currentStep;
  
  const Icon = step.icon;
  
  return (
    <>
      <div 
        className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
          isClickable ? 'hover:scale-105' : ''
        }`}
        onClick={() => isClickable && onClick(step.id)}
      >
        {/* Step Circle */}
        <div className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-500 transform
          ${isActive 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 scale-110 shadow-xl shadow-blue-500/30' 
            : isCompleted
              ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg'
              : 'bg-gray-700 border-2 border-gray-600'
          }
        `}>
          {isCompleted ? (
            <CheckCircle2 className="h-7 w-7 text-white animate-scale-in" />
          ) : (
            <Icon className={`h-6 w-6 ${isActive || isCompleted ? 'text-white' : 'text-gray-400'}`} />
          )}
          {isActive && (
            <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30" />
          )}
        </div>
        
        {/* Step Info */}
        <div className="mt-3 text-center">
          <p className={`text-sm font-bold transition-colors ${
            isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'
          }`}>
            Paso {step.id}
          </p>
          <p className={`text-xs mt-1 transition-colors ${
            isActive ? 'text-blue-200' : isCompleted ? 'text-green-300' : 'text-gray-500'
          }`}>
            {step.title}
          </p>
        </div>
      </div>
      
      {/* Connector Line */}
      {index < totalSteps - 1 && (
        <div className={`
          flex-1 h-1 mx-2 rounded-full transition-all duration-500
          ${currentStep > step.id 
            ? 'bg-gradient-to-r from-green-500 to-green-400' 
            : 'bg-gray-700'
          }
        `}>
          {currentStep > step.id && (
            <div className="h-full bg-gradient-to-r from-green-400 to-green-300 rounded-full animate-pulse" />
          )}
        </div>
      )}
    </>
  );
};

// Main Component
export default function FirstRunWizard({ onComplete = () => {} }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [errors, setErrors] = useState({});
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [hasActiveLicense, setHasActiveLicense] = useState(false);

  const [companyData, setCompanyData] = useState({
    rif: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const [adminData, setAdminData] = useState({
    fullName: '',
    username: 'admin',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [systemData, setSystemData] = useState({
    fiscalYear: new Date().getFullYear(),
    currency: 'VES',
    taxRegime: 'ordinary',
    backupEnabled: true,
    cloudSync: false,
    twoFactorAuth: false
  });

  const steps = [
    {
      id: 1,
      title: 'Empresa',
      description: 'Información de la empresa',
      icon: Building2,
      color: 'blue'
    },
    {
      id: 2, 
      title: 'Administrador',
      description: 'Cuenta principal',
      icon: User,
      color: 'purple'
    },
    {
      id: 3,
      title: 'Sistema',
      description: 'Configuración fiscal',
      icon: Shield,
      color: 'amber'
    },
    {
      id: 4,
      title: 'Confirmación',
      description: 'Revisar y finalizar',
      icon: Trophy,
      color: 'green'
    }
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!companyData.rif) newErrors.rif = 'RIF es requerido';
        if (!companyData.name) newErrors.name = 'Razón social es requerida';
        if (!companyData.email) newErrors.email = 'Email es requerido';
        if (!companyData.address) newErrors.address = 'Dirección es requerida';
        break;
      case 2:
        if (!adminData.fullName) newErrors.fullName = 'Nombre completo es requerido';
        if (!adminData.username) newErrors.username = 'Usuario es requerido';
        if (!adminData.email) newErrors.email = 'Email es requerido';
        if (!adminData.password || adminData.password.length < 8) {
          newErrors.password = 'Mínimo 8 caracteres';
        }
        if (adminData.password !== adminData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const changeStep = (newStep) => {
    if (newStep < currentStep || validateStep(currentStep)) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(newStep);
        setIsTransitioning(false);
        setErrors({});
      }, 300);
    } else {
      setToast({
        type: 'warning',
        title: 'Campos incompletos',
        message: 'Complete todos los campos requeridos'
      });
    }
  };

  const nextStep = () => changeStep(Math.min(4, currentStep + 1));
  const prevStep = () => changeStep(Math.max(1, currentStep - 1));

  const handleLicenseActivation = (result) => {
    setHasActiveLicense(true);
    setToast({
      type: 'success',
      title: 'Licencia Activada',
      message: result.message
    });
  };

  const completeSetup = async () => {
    setIsLoading(true);
    
    try {
      // 1. GUARDAR EMPRESA EN SUPABASE
      console.log('🏢 Saving company to Supabase:', companyData);
      
      const { data: companyResult, error: companyError } = await supabase
        .from('companies')
        .insert({
          rif: companyData.rif,
          name: companyData.name,
          address: companyData.address || '',
          phone: companyData.phone || '',
          email: companyData.email,
          website: companyData.website || '',
          fiscal_year: systemData.fiscalYear,
          currency: systemData.currency,
          tax_regime: systemData.taxRegime,
          accounting_method: 'accrual',
          default_islr_percentage: 3.0,
          default_iva_percentage: 16.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (companyError) {
        console.error('❌ Error saving company:', companyError);
        
        // Si es error de duplicado, intentar obtener la empresa existente
        if (companyError.code === '23505') { // Duplicate key
          const { data: existingCompany } = await supabase
            .from('companies')
            .select()
            .eq('rif', companyData.rif)
            .single();
            
          if (existingCompany) {
            console.log('✅ Using existing company:', existingCompany);
          }
        } else {
          throw new Error(`Error al guardar empresa: ${companyError.message}`);
        }
      } else {
        console.log('✅ Company saved to Supabase:', companyResult);
      }
      
      // También guardar en localStorage como respaldo
      localStorage.setItem('contave-company-v2', JSON.stringify({
        ...companyData,
        fiscalYear: systemData.fiscalYear,
        currency: systemData.currency,
        taxRegime: systemData.taxRegime
      }));
    
      // 2. CREAR USUARIO ADMIN
      console.log('🔄 Creating admin user...');
      
      const adminResult = await authService.register({
        fullName: adminData.fullName,
        username: adminData.username,
        email: adminData.email,
        password: adminData.password,
        role: 'admin'
      });
    
      if (!adminResult || !adminResult.success) {
        const errorMessage = adminResult?.error || 'Failed to create admin user';
        console.error('❌ Admin creation failed:', errorMessage);
        
        // Si el usuario ya existe, intentar continuar
        if (errorMessage.includes('ya está registrado') || errorMessage.includes('ya existe')) {
          console.log('⚠️ User might already exist, continuing setup...');
        } else {
          throw new Error(errorMessage);
        }
      } else {
        console.log('✅ Admin user created successfully:', adminResult.user);
      }
    
      // 3. GUARDAR CONFIGURACIÓN DEL SISTEMA EN SUPABASE
      console.log('💾 Saving system configuration...');
      
      const { error: configError } = await supabase
        .from('system_config')
        .insert({
          is_initialized: true,
          setup_completed_at: new Date().toISOString(),
          company_configured: true,
          admin_created: true,
          license_activated: hasActiveLicense,
          deployment_url: window.location.origin,
          config_version: '1.0.0',
          fiscal_year: systemData.fiscalYear,
          currency: systemData.currency,
          tax_regime: systemData.taxRegime,
          backup_enabled: systemData.backupEnabled,
          cloud_sync: systemData.cloudSync,
          two_factor_auth: systemData.twoFactorAuth,
          created_at: new Date().toISOString()
        });
      
      if (configError && configError.code !== '23505') { // Ignorar si ya existe
        console.error('⚠️ Error saving system config:', configError);
        // No lanzar error, continuar con el proceso
      } else {
        console.log('✅ System configuration saved');
      }
      
      // 4. GUARDAR CONFIGURACIÓN EN LOCAL STORAGE (backup)
      Object.entries(systemData).forEach(([key, value]) => {
        localStorage.setItem(`system.${key}`, String(value));
      });
      
      // 5. INICIALIZAR SERVICIOS
      if (systemData.cloudSync) {
        await syncService.initializeOfflineMode();
      }
      
      // 6. MARCAR COMO COMPLETADO
      localStorage.setItem('system.first_run', 'false');
      localStorage.setItem('system.setup_completed', new Date().toISOString());
      
      // 7. ACTUALIZAR EL SERVICIO DE INICIALIZACIÓN
      if (window.initializationService) {
        await window.initializationService.markAsInitialized({
          company_configured: true,
          admin_created: true,
          license_activated: hasActiveLicense
        });
      }
      
      // 8. VERIFICAR QUE TODO SE GUARDÓ CORRECTAMENTE
      console.log('🔍 Verifying setup...');
      
      // Verificar empresa
      const { data: verifyCompany } = await supabase
        .from('companies')
        .select('id, rif, name')
        .eq('rif', companyData.rif)
        .single();
      
      if (verifyCompany) {
        console.log('✅ Company verified:', verifyCompany);
      } else {
        console.warn('⚠️ Could not verify company');
      }
      
      // Verificar usuario
      const { data: verifyUser } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('username', adminData.username)
        .single();
      
      if (verifyUser) {
        console.log('✅ User verified:', verifyUser);
      } else {
        console.warn('⚠️ Could not verify user');
      }
      
      setToast({
        type: 'success',
        title: '¡Configuración Completa!',
        message: 'ContaVe Pro está listo para usar'
      });
    
      setTimeout(() => {
        onComplete();
      }, 2000);
    
    } catch (error) {
      console.error('💥 Setup error:', error);
      
      const errorMessage = error?.message || error?.toString() || 'No se pudo completar la configuración';
      
      setToast({
        type: 'error',
        title: 'Error en la configuración',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const stepContent = {
      1: (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-xl">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Información de la Empresa
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure los datos fiscales y de contacto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="RIF de la Empresa" 
              required 
              error={errors.rif}
              helper="Formato: J-12345678-9"
            >
              <Input
                value={companyData.rif}
                onChange={(e) => setCompanyData({ ...companyData, rif: e.target.value })}
                placeholder="J-12345678-9"
                leftIcon={CreditCard}
                error={!!errors.rif}
              />
            </FormField>

            <FormField 
              label="Razón Social" 
              required 
              error={errors.name}
            >
              <Input
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                placeholder="MI EMPRESA, C.A."
                leftIcon={Building2}
                error={!!errors.name}
              />
            </FormField>

            <FormField 
              label="Email Corporativo" 
              required 
              error={errors.email}
            >
              <Input
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                placeholder="contacto@empresa.com"
                leftIcon={Mail}
                error={!!errors.email}
              />
            </FormField>

            <FormField label="Teléfono">
              <Input
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                placeholder="0212-1234567"
                leftIcon={Phone}
              />
            </FormField>

            <FormField label="Sitio Web">
              <Input
                value={companyData.website}
                onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                placeholder="www.miempresa.com"
                leftIcon={Globe}
              />
            </FormField>

            <FormField 
              label="Dirección Fiscal" 
              required 
              error={errors.address}
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className={`
                    w-full pl-12 pr-4 py-3 
                    bg-white/95 dark:bg-gray-800/95
                    border-2 rounded-xl
                    ${errors.address ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}
                    focus:outline-none focus:border-blue-500
                    transition-all duration-200
                    text-gray-900 dark:text-white
                    placeholder-gray-400
                  `}
                  rows={3}
                  placeholder="Dirección completa"
                />
              </div>
            </FormField>
          </div>
        </div>
      ),
      
      2: (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-xl">
              <User className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cuenta de Administrador
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure el usuario principal del sistema
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  Cuenta con privilegios totales
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Este usuario tendrá acceso completo a todas las funciones del sistema
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Nombre Completo" 
              required 
              error={errors.fullName}
            >
              <Input
                value={adminData.fullName}
                onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })}
                placeholder="Juan Pérez"
                leftIcon={User}
                error={!!errors.fullName}
              />
            </FormField>

            <FormField 
              label="Nombre de Usuario" 
              required 
              error={errors.username}
              helper="Para iniciar sesión"
            >
              <Input
                value={adminData.username}
                onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                placeholder="admin"
                leftIcon={Shield}
                error={!!errors.username}
              />
            </FormField>

            <FormField 
              label="Email del Administrador" 
              required 
              error={errors.email}
            >
              <Input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                placeholder="admin@empresa.com"
                leftIcon={Mail}
                error={!!errors.email}
              />
            </FormField>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="Contraseña" 
                required 
                error={errors.password}
                helper="Mínimo 8 caracteres"
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={Lock}
                  rightIcon={showPassword ? EyeOff : Eye}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                  error={!!errors.password}
                />
              </FormField>

              <FormField 
                label="Confirmar Contraseña" 
                required 
                error={errors.confirmPassword}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={Lock}
                  error={!!errors.confirmPassword}
                />
              </FormField>
            </div>
          </div>

          {/* Password strength indicator */}
          {adminData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Fortaleza de contraseña</span>
                <span className={`font-semibold ${
                  adminData.password.length >= 12 ? 'text-green-500' :
                  adminData.password.length >= 8 ? 'text-amber-500' :
                  'text-red-500'
                }`}>
                  {adminData.password.length >= 12 ? 'Fuerte' :
                   adminData.password.length >= 8 ? 'Media' : 'Débil'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    adminData.password.length >= 12 ? 'bg-green-500 w-full' :
                    adminData.password.length >= 8 ? 'bg-amber-500 w-2/3' :
                    'bg-red-500 w-1/3'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      ),
      
      3: (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-xl">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Configuración del Sistema
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ajuste las opciones fiscales y de seguridad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Año Fiscal" helper="Período contable actual">
              <select
                value={systemData.fiscalYear}
                onChange={(e) => setSystemData({ ...systemData, fiscalYear: parseInt(e.target.value) })}
                className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() + i - 2;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </FormField>

            <FormField label="Moneda Principal">
              <select
                value={systemData.currency}
                onChange={(e) => setSystemData({ ...systemData, currency: e.target.value })}
                className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="VES">Bolívares (VES)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </FormField>

            <FormField label="Régimen Tributario">
              <select
                value={systemData.taxRegime}
                onChange={(e) => setSystemData({ ...systemData, taxRegime: e.target.value })}
                className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="ordinary">Contribuyente Ordinario</option>
                <option value="special">Contribuyente Especial</option>
                <option value="formal">Contribuyente Formal</option>
              </select>
            </FormField>
          </div>

          {/* Security Options */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-600" />
              Opciones de Seguridad
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={systemData.backupEnabled}
                  onChange={(e) => setSystemData({ ...systemData, backupEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Backup Automático
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Respaldo diario de la base de datos
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={systemData.cloudSync}
                  onChange={(e) => setSystemData({ ...systemData, cloudSync: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Sincronización en la Nube
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Acceda desde múltiples dispositivos
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={systemData.twoFactorAuth}
                  onChange={(e) => setSystemData({ ...systemData, twoFactorAuth: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Autenticación de Dos Factores
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Seguridad adicional para el acceso
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      ),
      
      4: (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-xl animate-bounce">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Todo Listo!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Revise la configuración antes de finalizar
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Card */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                Empresa Configurada
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-medium">RIF:</span> {companyData.rif}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  <span className="font-medium">Nombre:</span> {companyData.name}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="font-medium">Email:</span> {companyData.email}
                </div>
              </div>
            </div>

            {/* Admin Card */}
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                Administrador Creado
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span className="font-medium">Usuario:</span> {adminData.username}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span className="font-medium">Nombre:</span> {adminData.fullName}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="font-medium">Email:</span> {adminData.email}
                </div>
              </div>
            </div>

            {/* System Card */}
            <div className="group bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-700 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                Sistema Configurado
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">Año:</span> {systemData.fiscalYear}
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-medium">Moneda:</span> {systemData.currency}
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span className="font-medium">Backup:</span> {systemData.backupEnabled ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>

            {/* License Card */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Key className="h-5 w-5 text-white" />
                </div>
                {hasActiveLicense ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Star className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                {hasActiveLicense ? 'Licencia Activa' : 'Sin Licencia'}
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {hasActiveLicense ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Licencia activada correctamente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      <span>Todas las funciones disponibles</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Active una licencia para comenzar</span>
                    </div>
                    <button 
                      onClick={() => setShowLicenseModal(true)}
                      className="mt-2 text-xs text-green-600 hover:text-green-700 font-semibold"
                    >
                      Activar licencia ahora →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ready Message */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
                  ¡Sistema Listo para Iniciar!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Al hacer clic en "Iniciar Sistema", ContaVe Pro estará completamente configurado
                  y listo para registrar sus operaciones fiscales. 
                  {!hasActiveLicense && ' Recuerde activar una licencia para acceder a todas las funciones.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    };

    return stepContent[currentStep] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* License Modal */}
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        onActivate={handleLicenseActivation}
        companyData={companyData}
      />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="relative w-full max-w-5xl z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black text-white">
                ContaVe Pro
              </h1>
              <p className="text-blue-200 font-medium tracking-wide">
                Configuración Inicial del Sistema
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 px-8">
          {steps.map((step, index) => (
            <ProgressStep
              key={step.id}
              step={step}
              currentStep={currentStep}
              index={index}
              totalSteps={steps.length}
              onClick={changeStep}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className={`
          bg-white/10 backdrop-blur-2xl rounded-3xl p-8 
          shadow-2xl border border-white/20
          ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
          transition-all duration-300
        `}>
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/20">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1}
              icon={ChevronLeft}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Anterior
            </Button>

            <div className="flex gap-2">
              {[1, 2, 3, 4].map(step => (
                <button
                  key={step}
                  onClick={() => step < currentStep && changeStep(step)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${currentStep === step 
                      ? 'w-8 bg-white' 
                      : currentStep > step
                        ? 'bg-green-400 hover:bg-green-300'
                        : 'bg-gray-600'
                    }
                  `}
                />
              ))}
            </div>

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                variant="primary"
                icon={ChevronRight}
                iconPosition="right"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={completeSetup}
                loading={isLoading}
                variant="success"
                icon={Rocket}
                className="shadow-xl hover:shadow-2xl"
              >
                Iniciar Sistema
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}