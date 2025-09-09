import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Users, CreditCard, Check, AlertCircle, Plus, Trash2, Sparkles, Shield, Gift, Store, Clock, DollarSign, Zap, Star, Trophy, Phone, Building, Copy, X, Upload, FileText, Image, Mail, Info, CheckCircle } from 'lucide-react';

// ========== TIPOS Y CONSTANTES ==========
const PRICE_USD = 10;
const MAX_RUNNERS = 10;
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const PAYMENT_METHODS = {
  online: [
    { id: 'pago_movil_p2c', name: 'Pago Móvil P2C', icon: Phone, autoConfirm: true, color: 'blue' },
    { id: 'pago_movil', name: 'Pago Móvil', icon: Phone, autoConfirm: false, color: 'blue' },
    { id: 'transferencia_nacional', name: 'Transferencia Nacional', icon: Building, autoConfirm: false, color: 'orange' },
    { id: 'transferencia_internacional', name: 'Transferencia Internacional', icon: DollarSign, autoConfirm: false, color: 'purple' },
    { id: 'zelle', name: 'Zelle', icon: DollarSign, autoConfirm: false, color: 'green' },
    { id: 'paypal', name: 'PayPal', icon: CreditCard, autoConfirm: false, color: 'indigo' }
  ],
  store: [
    { id: 'tarjeta_debito', name: 'Tarjeta de Débito', icon: CreditCard, autoConfirm: true, color: 'blue' },
    { id: 'tarjeta_credito', name: 'Tarjeta de Crédito', icon: CreditCard, autoConfirm: true, color: 'blue' },
    { id: 'efectivo_bs', name: 'Efectivo (Bs)', icon: DollarSign, autoConfirm: true, color: 'green' },
    { id: 'efectivo_usd', name: 'Efectivo (USD)', icon: DollarSign, autoConfirm: true, color: 'green' }
  ],
  gift: [
    { id: 'obsequio_exonerado', name: 'Obsequio/Exonerado', icon: Gift, autoConfirm: true, color: 'pink' }
  ]
};

const BANKS = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0134', name: 'Banesco' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0105', name: 'Mercantil' },
  { code: '0114', name: 'Bancaribe' }
];

// ========== COMPONENTE DE TOOLTIP ==========
const Tooltip = ({ children, content, visible }) => {
  return (
    <div className="relative inline-block">
      {children}
      {visible && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== COMPONENTE DE TOAST ==========
const Toast = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-xl p-4 flex items-start space-x-3 min-w-[300px] border-l-4 border-orange-500">
        <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Información de Confirmación</p>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ========== COMPONENTE PRINCIPAL ==========
const CLXRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [exchangeRate] = useState(38.50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Estado del formulario reorganizado
  const [formData, setFormData] = useState({
    // Corredores
    runners: [{
      id: Date.now(),
      fullName: '',
      idType: 'V',
      idNumber: '',
      birthDate: '',
      gender: '',
      email: '',
      phone: '',
      shirtSize: ''
    }],
    // Información de pago (incluye email de confirmación)
    payment: {
      method: '',
      confirmationEmail: '', // Email para confirmación de pago
      // Campos específicos de P2C
      p2c_idType: 'V',
      p2c_idNumber: '',
      p2c_phone: '',
      p2c_bank: '',
      // Otros campos de pago
      reference: '',
      accountHolder: '',
      transactionDate: '',
      terminalReference: '',
      employeeId: '',
      giftReason: '',
      paymentProof: null
    }
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState(new Set());

  // Cálculos
  const totalUSD = formData.runners.length * PRICE_USD;
  const totalBs = totalUSD * exchangeRate;

  // Validaciones
  const validateField = (fieldPath, value) => {
    const newErrors = { ...errors };
    
    // Validación de email
    if (fieldPath.includes('email') || fieldPath === 'payment.confirmationEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        newErrors[fieldPath] = 'El email es requerido';
      } else if (!emailRegex.test(value)) {
        newErrors[fieldPath] = 'Email inválido';
      } else {
        delete newErrors[fieldPath];
      }
    }
    
    // Validación de teléfono
    if (fieldPath.includes('phone') || fieldPath === 'payment.p2c_phone') {
      const phoneRegex = /^(0412|0414|0424|0416|0426)\d{7}$/;
      if (!value) {
        newErrors[fieldPath] = 'El teléfono es requerido';
      } else if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
        newErrors[fieldPath] = 'Formato: 04XX-XXXXXXX';
      } else {
        delete newErrors[fieldPath];
      }
    }
    
    // Validación de cédula
    if (fieldPath.includes('idNumber') || fieldPath === 'payment.p2c_idNumber') {
      if (!value) {
        newErrors[fieldPath] = 'La cédula es requerida';
      } else if (value.length < 6 || value.length > 9) {
        newErrors[fieldPath] = 'Cédula inválida';
      } else {
        delete newErrors[fieldPath];
      }
    }
    
    // Validación de fecha de nacimiento
    if (fieldPath.includes('birthDate')) {
      if (!value) {
        newErrors[fieldPath] = 'La fecha es requerida';
      } else {
        const birthDate = new Date(value);
        const today = new Date();
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 12) {
          newErrors[fieldPath] = 'Debe tener al menos 12 años';
        } else if (age > 100) {
          newErrors[fieldPath] = 'Verifique la fecha';
        } else {
          delete newErrors[fieldPath];
        }
      }
    }
    
    setErrors(newErrors);
    return !newErrors[fieldPath];
  };

  const handleFieldChange = (fieldPath, value) => {
    const paths = fieldPath.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < paths.length - 1; i++) {
        if (paths[i].includes('[') && paths[i].includes(']')) {
          const [arrayName, indexStr] = paths[i].split('[');
          const index = parseInt(indexStr.replace(']', ''));
          current = current[arrayName][index];
        } else {
          current = current[paths[i]];
        }
      }
      
      const lastPath = paths[paths.length - 1];
      current[lastPath] = value;
      
      return newData;
    });
    
    // Marcar campo como tocado y validar
    setTouchedFields(prev => new Set([...prev, fieldPath]));
    validateField(fieldPath, value);
  };

  const addRunner = () => {
    if (formData.runners.length < MAX_RUNNERS) {
      setFormData(prev => ({
        ...prev,
        runners: [...prev.runners, {
          id: Date.now(),
          fullName: '',
          idType: 'V',
          idNumber: '',
          birthDate: '',
          gender: '',
          email: '',
          phone: '',
          shirtSize: ''
        }]
      }));
    }
  };

  const removeRunner = (index) => {
    if (formData.runners.length > 1) {
      setFormData(prev => ({
        ...prev,
        runners: prev.runners.filter((_, i) => i !== index)
      }));
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    const newErrors = {};
    
    if (step === 1) {
      // Validar corredores
      formData.runners.forEach((runner, index) => {
        if (!runner.fullName) {
          newErrors[`runners[${index}].fullName`] = 'Nombre requerido';
          isValid = false;
        }
        if (!runner.idNumber) {
          newErrors[`runners[${index}].idNumber`] = 'Cédula requerida';
          isValid = false;
        }
        if (!runner.birthDate) {
          newErrors[`runners[${index}].birthDate`] = 'Fecha requerida';
          isValid = false;
        }
        if (!runner.gender) {
          newErrors[`runners[${index}].gender`] = 'Género requerido';
          isValid = false;
        }
        if (!runner.email) {
          newErrors[`runners[${index}].email`] = 'Email requerido';
          isValid = false;
        }
        if (!runner.phone) {
          newErrors[`runners[${index}].phone`] = 'Teléfono requerido';
          isValid = false;
        }
        if (!runner.shirtSize) {
          newErrors[`runners[${index}].shirtSize`] = 'Talla requerida';
          isValid = false;
        }
      });
    }
    
    if (step === 2) {
      // Validar email de confirmación
      if (!formData.payment.confirmationEmail) {
        newErrors['payment.confirmationEmail'] = 'Email de confirmación requerido';
        isValid = false;
      }
      
      if (!formData.payment.method) {
        newErrors['payment.method'] = 'Seleccione un método de pago';
        isValid = false;
      }
      
      // Validaciones específicas para P2C
      if (formData.payment.method === 'pago_movil_p2c') {
        if (!formData.payment.p2c_idNumber) {
          newErrors['payment.p2c_idNumber'] = 'Cédula del pagador requerida';
          isValid = false;
        }
        if (!formData.payment.p2c_phone) {
          newErrors['payment.p2c_phone'] = 'Teléfono bancario requerido';
          isValid = false;
        }
        if (!formData.payment.p2c_bank) {
          newErrors['payment.p2c_bank'] = 'Banco requerido';
          isValid = false;
        }
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        setShowSummary(true);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (showSummary) {
      setShowSummary(false);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('¡Registro exitoso! Se ha enviado un correo de confirmación.');
    setIsSubmitting(false);
    // Reset form
    window.location.reload();
  };

  // ========== COMPONENTES UI ==========
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2].map((step) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
              transition-all duration-300 transform
              ${currentStep >= step 
                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white scale-110 shadow-lg' 
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {currentStep > step ? <Check className="w-6 h-6" /> : step}
            </div>
            <span className={`mt-2 text-sm font-medium ${currentStep >= step ? 'text-orange-600' : 'text-gray-400'}`}>
              {step === 1 ? 'Datos de Corredores' : 'Método de Pago'}
            </span>
          </div>
          {step < 2 && (
            <div className={`w-24 h-1 mx-2 rounded-full transition-all duration-500 ${
              currentStep > step ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const FormField = ({ label, error, required, children, touched, helpText }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {touched && error && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );

  const RunnerCard = ({ runner, index }) => {
    const canRemove = formData.runners.length > 1;
    
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-orange-800 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Corredor {index + 1}
          </h3>
          {canRemove && (
            <button
              type="button"
              onClick={() => removeRunner(index)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="Nombre Completo" 
            required
            error={errors[`runners[${index}].fullName`]}
            touched={touchedFields.has(`runners[${index}].fullName`)}
          >
            <input
              type="text"
              value={runner.fullName}
              onChange={(e) => handleFieldChange(`runners[${index}].fullName`, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="Juan Pérez"
            />
          </FormField>
          
          <FormField 
            label="Identificación" 
            required
            error={errors[`runners[${index}].idNumber`]}
            touched={touchedFields.has(`runners[${index}].idNumber`)}
          >
            <div className="flex gap-2">
              <select
                value={runner.idType}
                onChange={(e) => handleFieldChange(`runners[${index}].idType`, e.target.value)}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="V">V</option>
                <option value="E">E</option>
              </select>
              <input
                type="text"
                value={runner.idNumber}
                onChange={(e) => handleFieldChange(`runners[${index}].idNumber`, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="12345678"
              />
            </div>
          </FormField>
          
          <FormField 
            label="Fecha de Nacimiento" 
            required
            error={errors[`runners[${index}].birthDate`]}
            touched={touchedFields.has(`runners[${index}].birthDate`)}
          >
            <input
              type="date"
              value={runner.birthDate}
              onChange={(e) => handleFieldChange(`runners[${index}].birthDate`, e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </FormField>
          
          <FormField 
            label="Género" 
            required
            error={errors[`runners[${index}].gender`]}
            touched={touchedFields.has(`runners[${index}].gender`)}
          >
            <div className="flex gap-4 mt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={`gender-${index}`}
                  value="M"
                  checked={runner.gender === 'M'}
                  onChange={(e) => handleFieldChange(`runners[${index}].gender`, e.target.value)}
                  className="mr-2 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm">Masculino</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={`gender-${index}`}
                  value="F"
                  checked={runner.gender === 'F'}
                  onChange={(e) => handleFieldChange(`runners[${index}].gender`, e.target.value)}
                  className="mr-2 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm">Femenino</span>
              </label>
            </div>
          </FormField>
          
          <FormField 
            label="Email" 
            required
            error={errors[`runners[${index}].email`]}
            touched={touchedFields.has(`runners[${index}].email`)}
          >
            <input
              type="email"
              value={runner.email}
              onChange={(e) => handleFieldChange(`runners[${index}].email`, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="corredor@email.com"
            />
          </FormField>
          
          <FormField 
            label="Teléfono" 
            required
            error={errors[`runners[${index}].phone`]}
            touched={touchedFields.has(`runners[${index}].phone`)}
          >
            <input
              type="tel"
              value={runner.phone}
              onChange={(e) => handleFieldChange(`runners[${index}].phone`, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="0414-1234567"
            />
          </FormField>
          
          <FormField 
            label="Talla de Camiseta" 
            required
            error={errors[`runners[${index}].shirtSize`]}
            touched={touchedFields.has(`runners[${index}].shirtSize`)}
          >
            <select
              value={runner.shirtSize}
              onChange={(e) => handleFieldChange(`runners[${index}].shirtSize`, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccionar talla</option>
              {SHIRT_SIZES.map(size => (
                <option key={size} value={size}>Talla {size}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>
    );
  };

  const PaymentMethodCard = ({ method, selected, onSelect }) => {
    const Icon = method.icon;
    const isSelected = selected === method.id;
    
    return (
      <button
        type="button"
        onClick={() => onSelect(method.id)}
        className={`
          relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
          ${isSelected 
            ? `border-${method.color}-500 bg-gradient-to-br from-${method.color}-50 to-${method.color}-100 shadow-lg` 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        {method.autoConfirm && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Zap className="w-3 h-3 mr-1" />
            Instantáneo
          </div>
        )}
        <Icon className={`w-8 h-8 mb-2 mx-auto ${isSelected ? `text-${method.color}-600` : 'text-gray-400'}`} />
        <p className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
          {method.name}
        </p>
      </button>
    );
  };

  const PaymentFormFields = () => {
    const selectedMethod = formData.payment.method;
    
    if (!selectedMethod) return null;
    
    // Formulario específico según método de pago
    if (selectedMethod === 'pago_movil_p2c') {
      return (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Pago Móvil P2C - Confirmación Instantánea
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Cédula del Pagador" 
              required
              error={errors['payment.p2c_idNumber']}
              touched={touchedFields.has('payment.p2c_idNumber')}
              helpText="Esta cédula se utilizará para el pago móvil"
            >
              <div className="flex gap-2">
                <select
                  value={formData.payment.p2c_idType}
                  onChange={(e) => handleFieldChange('payment.p2c_idType', e.target.value)}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                </select>
                <input
                  type="text"
                  value={formData.payment.p2c_idNumber}
                  onChange={(e) => handleFieldChange('payment.p2c_idNumber', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678"
                />
              </div>
            </FormField>
            
            <FormField 
              label="Teléfono Bancario" 
              required
              error={errors['payment.p2c_phone']}
              touched={touchedFields.has('payment.p2c_phone')}
              helpText="Teléfono registrado en su banco"
            >
              <input
                type="tel"
                value={formData.payment.p2c_phone}
                onChange={(e) => handleFieldChange('payment.p2c_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="04121234567"
              />
            </FormField>
            
            <FormField label="Tu Banco" required>
              <select
                value={formData.payment.p2c_bank}
                onChange={(e) => handleFieldChange('payment.p2c_bank', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar banco</option>
                {BANKS.map(bank => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Los datos del pagador serán utilizados para procesar el pago móvil P2C
            </p>
          </div>
        </div>
      );
    }
    
    if (selectedMethod === 'obsequio_exonerado') {
      return (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-4 flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            Registro de Obsequio Exonerado
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="ID del Empleado" required>
              <input
                type="text"
                value={formData.payment.employeeId}
                onChange={(e) => handleFieldChange('payment.employeeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="EMP-12345"
              />
            </FormField>
            <FormField label="Motivo de la Exoneración" required>
              <textarea
                value={formData.payment.giftReason}
                onChange={(e) => handleFieldChange('payment.giftReason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Ej: Empleado del mes, Premio por desempeño, etc."
              />
            </FormField>
          </div>
        </div>
      );
    }
    
    // Métodos de pago en tienda
    if (['tarjeta_debito', 'tarjeta_credito', 'efectivo_bs', 'efectivo_usd'].includes(selectedMethod)) {
      return (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
            <Store className="w-5 h-5 mr-2" />
            Pago en Tienda - Confirmación Inmediata
          </h4>
          {(selectedMethod === 'tarjeta_debito' || selectedMethod === 'tarjeta_credito') && (
            <FormField label="Número de Aprobación del Terminal">
              <input
                type="text"
                value={formData.payment.terminalReference}
                onChange={(e) => handleFieldChange('payment.terminalReference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123456"
              />
            </FormField>
          )}
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              ✓ El pago será confirmado inmediatamente al completar el registro.
            </p>
          </div>
        </div>
      );
    }
    
    // Otros métodos online
    return (
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Verificación Manual - 24-48 horas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Número de Referencia" required>
            <input
              type="text"
              value={formData.payment.reference}
              onChange={(e) => handleFieldChange('payment.reference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              placeholder="123456789"
            />
          </FormField>
          {selectedMethod === 'zelle' && (
            <FormField label="Nombre del Titular" required>
              <input
                type="text"
                value={formData.payment.accountHolder}
                onChange={(e) => handleFieldChange('payment.accountHolder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Juan Pérez"
              />
            </FormField>
          )}
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Comprobante de Pago
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Arrastra o haz clic para subir</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG o PDF (máx. 5MB)</p>
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
            />
          </div>
        </div>
      </div>
    );
  };

  const RegistrationSummary = () => (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
      <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center">
        <CheckCircle className="w-6 h-6 mr-2" />
        Resumen de Registro
      </h3>
      
      {/* Email de Confirmación */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Email de Confirmación</h4>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm"><span className="font-medium">Email:</span> {formData.payment.confirmationEmail}</p>
          <p className="text-xs text-gray-500 mt-1">Se enviará la confirmación de pago a este correo</p>
        </div>
      </div>
      
      {/* Corredores */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Corredores ({formData.runners.length})</h4>
        <div className="space-y-2">
          {formData.runners.map((runner, index) => (
            <div key={runner.id} className="bg-white rounded-lg p-3">
              <p className="text-sm font-medium">{index + 1}. {runner.fullName}</p>
              <p className="text-xs text-gray-600">
                {runner.idType}-{runner.idNumber} • Talla {runner.shirtSize} • {runner.gender === 'M' ? 'Masculino' : 'Femenino'}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Resumen de Pago */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Información de Pago</h4>
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Método:</span>
            <span className="font-medium">
              {PAYMENT_METHODS.online.concat(PAYMENT_METHODS.store, PAYMENT_METHODS.gift)
                .find(m => m.id === formData.payment.method)?.name}
            </span>
          </div>
          
          {/* Mostrar datos específicos de P2C si aplica */}
          {formData.payment.method === 'pago_movil_p2c' && (
            <div className="mt-3 pt-3 border-t space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cédula del pagador:</span>
                <span>{formData.payment.p2c_idType}-{formData.payment.p2c_idNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Teléfono bancario:</span>
                <span>{formData.payment.p2c_phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Banco:</span>
                <span>{BANKS.find(b => b.code === formData.payment.p2c_bank)?.name}</span>
              </div>
            </div>
          )}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Corredores:</span>
              <span className="font-medium">{formData.runners.length}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Precio por corredor:</span>
              <span className="font-medium">${PRICE_USD} USD</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total USD:</span>
                <span className="font-bold text-xl text-green-600">${totalUSD}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Bs:</span>
                <span className="font-bold text-lg">Bs. {totalBs.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">Tasa BCV: {exchangeRate.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Procesando...
          </>
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            Confirmar Registro
          </>
        )}
      </button>
    </div>
  );

  // ========== RENDER PRINCIPAL ==========
  return (
    <>
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
      
      <Toast 
        message="Este email recibirá la confirmación del pago y los detalles del registro"
        visible={showToast}
        onClose={() => setShowToast(false)}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              CLX Night Run 2025
            </h1>
            <p className="text-gray-600">Registro de Participantes</p>
          </div>
          
          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Precio header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-90">Precio por corredor</p>
                  <p className="text-3xl font-bold">${PRICE_USD} USD</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Total a pagar</p>
                  <p className="text-2xl font-bold">${totalUSD} USD</p>
                  <p className="text-sm opacity-90">Bs. {totalBs.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {/* Step Indicator */}
              {!showSummary && <StepIndicator />}
              
              {/* Contenido del paso */}
              {showSummary ? (
                <RegistrationSummary />
              ) : (
                <>
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      {/* Corredores */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-800">
                            Corredores ({formData.runners.length}/{MAX_RUNNERS})
                          </h3>
                          {formData.runners.length < MAX_RUNNERS && (
                            <button
                              type="button"
                              onClick={addRunner}
                              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar Corredor
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {formData.runners.map((runner, index) => (
                            <RunnerCard key={runner.id} runner={runner} index={index} />
                          ))}
                        </div>
                        
                        {formData.runners.length >= MAX_RUNNERS && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Has alcanzado el límite máximo de {MAX_RUNNERS} corredores por grupo.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      {/* Email de confirmación con tooltip/toast */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                          <Mail className="w-5 h-5 mr-2" />
                          Email para Confirmación
                        </h4>
                        <FormField 
                          label="Email de Confirmación" 
                          required
                          error={errors['payment.confirmationEmail']}
                          touched={touchedFields.has('payment.confirmationEmail')}
                        >
                          <div className="relative">
                            <input
                              type="email"
                              value={formData.payment.confirmationEmail}
                              onChange={(e) => handleFieldChange('payment.confirmationEmail', e.target.value)}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="confirmacion@email.com"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              onMouseEnter={() => setShowTooltip(true)}
                              onMouseLeave={() => setShowTooltip(false)}
                              onClick={() => setShowToast(true)}
                            >
                              <Tooltip 
                                content="Datos para envío de confirmación de pago"
                                visible={showTooltip}
                              >
                                <Info className="w-5 h-5" />
                              </Tooltip>
                            </button>
                          </div>
                        </FormField>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Selecciona el Método de Pago</h3>
                      
                      {/* Métodos Online */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pagos Online
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {PAYMENT_METHODS.online.map(method => (
                            <PaymentMethodCard
                              key={method.id}
                              method={method}
                              selected={formData.payment.method}
                              onSelect={(id) => handleFieldChange('payment.method', id)}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Métodos en Tienda */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                          <Store className="w-4 h-4 mr-2" />
                          Pagos en Tienda
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {PAYMENT_METHODS.store.map(method => (
                            <PaymentMethodCard
                              key={method.id}
                              method={method}
                              selected={formData.payment.method}
                              onSelect={(id) => handleFieldChange('payment.method', id)}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Obsequio */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                          <Gift className="w-4 h-4 mr-2" />
                          Especial
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {PAYMENT_METHODS.gift.map(method => (
                            <PaymentMethodCard
                              key={method.id}
                              method={method}
                              selected={formData.payment.method}
                              onSelect={(id) => handleFieldChange('payment.method', id)}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Formulario específico del método */}
                      <PaymentFormFields />
                      
                      {/* Resumen de pago */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-4">Resumen de Pago</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Corredores:</span>
                            <span className="font-medium">{formData.runners.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Precio por corredor:</span>
                            <span className="font-medium">${PRICE_USD} USD</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between text-lg">
                              <span className="font-semibold">Total USD:</span>
                              <span className="font-bold text-orange-600">${totalUSD}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold">Total Bs:</span>
                              <span className="font-bold">Bs. {totalBs.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">Tasa BCV: {exchangeRate.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Navegación */}
                  <div className="flex justify-between mt-8 pt-6 border-t">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="ml-auto px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 flex items-center"
                    >
                      {currentStep === 2 ? 'Ver Resumen' : 'Siguiente'}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </>
              )}
              
              {/* Botón volver si está en resumen */}
              {showSummary && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="mt-4 w-full px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Volver a editar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CLXRegistrationForm;