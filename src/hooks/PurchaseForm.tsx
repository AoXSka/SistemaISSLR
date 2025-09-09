import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, AlertCircle } from 'lucide-react';
import { Purchase, Provider, PurchaseCategory } from '../../types/index';
import { purchaseService } from '../../services/purchaseService';
import { providerService } from '../../services/providerService';
import { rifValidator } from '../../utils/rifValidator';
import { toast } from '../../utils/toast';

interface PurchaseFormProps {
  purchase?: Purchase | null;
  onSave: (purchaseData: any) => Promise<void>;
  onClose: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ purchase, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    date: purchase?.date || new Date().toISOString().split('T')[0],
    invoiceNumber: purchase?.invoiceNumber || '',
    controlNumber: purchase?.controlNumber || '',
    providerRif: purchase?.providerRif || '',
    providerName: purchase?.providerName || '',
    concept: purchase?.concept || '',
    category: purchase?.category || 'OTR',
    netAmount: purchase?.netAmount || 0,
    exemptAmount: purchase?.exemptAmount || 0,
    taxableBase: purchase?.taxableBase || 0,
    ivaRate: purchase?.ivaRate || 16,
    ivaAmount: purchase?.ivaAmount || 0,
    totalAmount: purchase?.totalAmount || 0,
    paymentMethod: purchase?.paymentMethod || 'transfer',
    currency: purchase?.currency || 'VES',
    exchangeRate: purchase?.exchangeRate || 1,
    status: purchase?.status || 'pending',
    observations: purchase?.observations || '',
    period: purchase?.period || new Date().toISOString().substring(0, 7)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // IVA rates used in Venezuela
  const ivaRates = [
    { value: 0, label: 'Exento (0%)' },
    { value: 8, label: 'Reducida (8%)' },
    { value: 16, label: 'General (16%)' },
    { value: 31, label: 'Lujo (31%)' }
  ];

  useEffect(() => {
    loadProviders();
    loadCategories();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [formData.netAmount, formData.exemptAmount, formData.ivaRate, formData.exchangeRate]);

  const loadProviders = async () => {
    try {
      const data = await providerService.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await purchaseService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));

    // Handle numeric fields
    if (['netAmount', 'exemptAmount', 'ivaRate', 'exchangeRate'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Auto-fill provider name when RIF is selected
    if (name === 'providerRif') {
      const provider = providers.find(p => p.rif === value);
      if (provider) {
        setFormData(prev => ({
          ...prev,
          providerName: provider.name
        }));
      }
    }
  };

  const calculateAmounts = () => {
    setCalculating(true);
    
    const netAmount = parseFloat(formData.netAmount.toString()) || 0;
    const exemptAmount = parseFloat(formData.exemptAmount.toString()) || 0;
    const ivaRate = parseFloat(formData.ivaRate.toString()) || 0;
    const exchangeRate = parseFloat(formData.exchangeRate.toString()) || 1;

    // Validate amounts
    if (exemptAmount > netAmount) {
      setErrors(prev => ({ ...prev, exemptAmount: 'El monto exento no puede ser mayor al monto neto' }));
      setCalculating(false);
      return;
    }

    // Calculate taxable base (net - exempt)
    const taxableBase = Math.max(0, netAmount - exemptAmount);

    // Calculate IVA
    const ivaAmount = taxableBase * (ivaRate / 100);

    // Calculate total
    const totalAmount = netAmount + ivaAmount;

    // Update form data
    setFormData(prev => ({
      ...prev,
      taxableBase,
      ivaAmount,
      totalAmount
    }));

    setCalculating(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }
    if (!formData.invoiceNumber) {
      newErrors.invoiceNumber = 'El número de factura es obligatorio';
    }
    if (!formData.controlNumber) {
      newErrors.controlNumber = 'El número de control es obligatorio';
    }
    if (!formData.providerRif) {
      newErrors.providerRif = 'El RIF del proveedor es obligatorio';
    }
    if (!formData.providerName) {
      newErrors.providerName = 'El nombre del proveedor es obligatorio';
    }
    if (!formData.concept) {
      newErrors.concept = 'El concepto es obligatorio';
    }

    // Validate RIF format
    if (formData.providerRif && !rifValidator.validate(formData.providerRif)) {
      newErrors.providerRif = 'Formato de RIF inválido (Ej: V-12345678-9)';
    }

    // Validate control number format (XX-XXXXXXXX)
    const controlNumberRegex = /^\d{2}-\d{6,8}$/;
    if (formData.controlNumber && !controlNumberRegex.test(formData.controlNumber)) {
      newErrors.controlNumber = 'Formato inválido (debe ser XX-XXXXXX o XX-XXXXXXXX)';
    }

// Validate amounts
if (formData.netAmount <= 0) {
  newErrors.netAmount = 'El monto neto debe ser mayor a 0';
}
if (formData.exemptAmount < 0) {
      newErrors.exemptAmount = 'El monto exento no puede ser negativo';
    }
    if (formData.exemptAmount > formData.netAmount) {
      newErrors.exemptAmount = 'El monto exento no puede ser mayor al monto neto';
    }
    if (formData.exchangeRate <= 0) {
      newErrors.exchangeRate = 'La tasa de cambio debe ser mayor a 0';
    }

    // Validate date not in future
    const purchaseDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (purchaseDate > today) {
      newErrors.date = 'La fecha no puede ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      if (purchase) {
        await onSave(purchase.id, formData);
      } else {
        await onSave(formData);
      }
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      toast.error(error.message || 'Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {purchase ? 'Editar Compra' : 'Nueva Compra'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-500">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Factura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="00000001"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.invoiceNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Control <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="controlNumber"
                value={formData.controlNumber}
                onChange={handleChange}
                placeholder="00-00000000"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.controlNumber ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.controlNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.controlNumber}</p>
              )}
            </div>
          </div>

          {/* Provider Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RIF del Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="providerRif"
                value={formData.providerRif}
                onChange={handleChange}
                placeholder="V-12345678-9"
                list="provider-rifs"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.providerRif ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              <datalist id="provider-rifs">
                {providers.map(p => (
                  <option key={p.id} value={p.rif}>{p.name}</option>
                ))}
              </datalist>
              {errors.providerRif && (
                <p className="mt-1 text-xs text-red-500">{errors.providerRif}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="providerName"
                value={formData.providerName}
                onChange={handleChange}
                placeholder="Nombre o Razón Social"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.providerName ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.providerName && (
                <p className="mt-1 text-xs text-red-500">{errors.providerName}</p>
              )}
            </div>
          </div>

          {/* Concept and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concepto <span className="text-red-500">*</span>
              </label>
              <textarea
                name="concept"
                value={formData.concept}
                onChange={handleChange}
                rows={2}
                placeholder="Descripción de la compra"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.concept ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.concept && (
                <p className="mt-1 text-xs text-red-500">{errors.concept}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Información Fiscal y Financiera
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Neto <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="netAmount"
                  value={formData.netAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${errors.netAmount ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.netAmount && (
                  <p className="mt-1 text-xs text-red-500">{errors.netAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Exento
                </label>
                <input
                  type="number"
                  name="exemptAmount"
                  value={formData.exemptAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${errors.exemptAmount ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.exemptAmount && (
                  <p className="mt-1 text-xs text-red-500">{errors.exemptAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Imponible
                </label>
                <input
                  type="number"
                  value={formData.taxableBase}
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa IVA (%)
                </label>
                <select
                  name="ivaRate"
                  value={formData.ivaRate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ivaRates.map(rate => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto IVA
                </label>
                <input
                  type="number"
                  value={formData.ivaAmount}
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-bold"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="check">Cheque</option>
                <option value="card">Tarjeta</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VES">VES - Bolívares</option>
                <option value="USD">USD - Dólares</option>
                <option value="EUR">EUR - Euros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Cambio
              </label>
              <input
                type="number"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${errors.exchangeRate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.exchangeRate && (
                <p className="mt-1 text-xs text-red-500">{errors.exchangeRate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Anulado</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={3}
              placeholder="Notas adicionales (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || calculating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {purchase ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>

          {/* Fiscal Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Recordatorio Fiscal</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El número de control es obligatorio según normativa del SENIAT</li>
                <li>Verifique que el RIF del proveedor esté registrado correctamente</li>
                <li>Los montos deben coincidir exactamente con la factura física</li>
                <li>Este registro será incluido en los libros fiscales del período {formData.period}</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseForm;