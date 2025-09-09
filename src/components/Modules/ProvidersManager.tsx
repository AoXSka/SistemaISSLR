import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  History,
  DollarSign,
  X,
  FileText,
  TrendingUp,
  Calendar,
  CreditCard,
  Percent,
  Globe,
  ClipboardCheck
} from 'lucide-react';
import { providerService } from '../../services/providerService';
import { transactionService } from '../../services/transactionService';
import { useToast } from '../UI/Toast';
import { formatCurrency, formatDate, formatRIF, validateRIF } from '../../utils/formatters';
import { Provider, Transaction } from '../../types';
import ProviderForm from '../Forms/ProviderForm';

interface ProviderStats {
  totalTransactions: number;
  totalAmount: number;
  totalRetained: number;
  lastTransaction?: Transaction;
  yearlyAmount: number;
  monthlyAmount: number;
  averageRetention: number;
}

export default function ProvidersManager() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerStats, setProviderStats] = useState<Record<string, ProviderStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'transactions' | 'stats'>('info');
  const [selectedProviderTransactions, setSelectedProviderTransactions] = useState<Transaction[]>([]);

  const [formData, setFormData] = useState({
    rif: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    retentionISLRPercentage: 6,
    retentionIVAPercentage: 75,
    website: '',
    taxType: 'ordinary',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { addToast } = useToast();

  // Load providers from real service
  const loadProviders = async () => {
    try {
      const allProviders = await providerService.getProviders();
      setProviders(allProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
      setProviders([]);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  // Load stats for all providers
  useEffect(() => {
    const loadAllStats = async () => {
      if (providers.length === 0) return;
      
      setLoadingStats(true);
      const stats: Record<string, ProviderStats> = {};
      
      for (const provider of providers) {
        stats[provider.rif] = await getProviderStats(provider.rif);
      }
      
      setProviderStats(stats);
      setLoadingStats(false);
    };
    
    loadAllStats();
  }, [providers]);

  const getProviderTransactions = async (providerRif: string): Promise<Transaction[]> => {
    try {
      return await transactionService.getTransactions({ providerRif });
    } catch (error) {
      console.error('Error loading provider transactions:', error);
      return [];
    }
  };

  const getProviderStats = async (providerRif: string): Promise<ProviderStats> => {
    const transactions = await getProviderTransactions(providerRif);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const currentYearTransactions = transactions.filter(t => 
      new Date(t.date).getFullYear() === currentYear
    );
    
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    return {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
      totalRetained: transactions.reduce((sum, t) => sum + t.retentionAmount, 0),
      lastTransaction: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
      yearlyAmount: currentYearTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      monthlyAmount: currentMonthTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
      averageRetention: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.retentionPercentage, 0) / transactions.length 
        : 0
    };
  };

  const filteredProviders = useMemo(() => {
    // Filtrar proveedores null o undefined primero
    const validProviders = providers.filter(provider => 
      provider && 
      provider.name && 
      provider.rif && 
      provider.email !== undefined
    );
    
    // Luego aplicar el filtro de búsqueda
    return validProviders.filter(provider =>
      (provider.name && provider.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.rif && provider.rif.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.email && provider.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [providers, searchTerm]);

  // Load transactions for selected provider
  useEffect(() => {
    if (selectedProvider && showProviderDetails) {
      const loadSelectedProviderTransactions = async () => {
        const transactions = await getProviderTransactions(selectedProvider.rif);
        setSelectedProviderTransactions(transactions);
      };
      loadSelectedProviderTransactions();
    }
  }, [selectedProvider, showProviderDetails]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.rif) {
      errors.rif = 'El RIF es obligatorio';
    } else if (!validateRIF(formData.rif)) {
      errors.rif = 'El formato del RIF es inválido';
    }
    
    if (!formData.name) {
      errors.name = 'El nombre es obligatorio';
    }
    
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'El formato del email es inválido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const newProvider: Provider = {
      id: editingProvider ? editingProvider.id : providers.length + 1,
      ...formData,
      createdAt: editingProvider ? editingProvider.createdAt : new Date().toISOString().split('T')[0]
    };

    if (editingProvider) {
      setProviders(providers.map(p => p.id === editingProvider.id ? newProvider : p));
      setEditingProvider(null);
    } else {
      setProviders([...providers, newProvider]);
    }

    setShowNewProviderForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      rif: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      contactPerson: '',
      retentionISLRPercentage: 6,
      retentionIVAPercentage: 75,
      website: '',
      taxType: 'ordinary',
      notes: ''
    });
    setFormErrors({});
  };

  const handleEdit = (provider: Provider) => {
    console.log('✏️ ProvidersManager - Editing provider:', provider);
    setEditingProvider(provider);
    setShowNewProviderForm(true);
  };

  const handleDelete = async (id: number) => {
    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    if (confirm(`¿Está seguro de eliminar el proveedor "${provider.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await providerService.deleteProvider(id);
        await loadProviders(); // Reload from database
        addToast({
          type: 'success',
          title: 'Proveedor eliminado',
          message: `${provider.name} ha sido eliminado exitosamente`
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error al eliminar',
          message: error instanceof Error ? error.message : 'No se pudo eliminar el proveedor'
        });
      }
    }
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProviderDetails(true);
    setActiveTab('info');
  };

  const exportToCSV = () => {
    const headers = ['RIF', 'Nombre', 'Dirección', 'Teléfono', 'Email', 'Contacto', '% ISLR', '% IVA'];
    const rows = filteredProviders.map(p => [
      p.rif, p.name, p.address, p.phone, p.email, p.contactPerson,
      p.retentionISLRPercentage, p.retentionIVAPercentage
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Proveedores
            </h1>
            <p className="text-gray-600">
              Base de datos completa con historial de transacciones
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            <button 
              onClick={() => setShowNewProviderForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Proveedores</p>
              <p className="text-2xl font-bold">{providers.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Proveedores Activos</p>
              <p className="text-2xl font-bold">{providers.filter(p => validateRIF(p.rif)).length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Transacciones Totales</p>
              <p className="text-2xl font-bold">
                {Object.values(providerStats).reduce((sum, stats) => sum + stats.totalTransactions, 0)}
              </p>
            </div>
            <History className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Facturado</p>
              <p className="text-xl font-bold">
                {formatCurrency(Object.values(providerStats).reduce((sum, stats) => sum + stats.totalAmount, 0))}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RIF o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => {
          const stats = providerStats[provider.rif] || {
            totalTransactions: 0,
            totalAmount: 0,
            totalRetained: 0,
            yearlyAmount: 0,
            monthlyAmount: 0,
            averageRetention: 0
          };
          
          return (
            <div key={provider.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{formatRIF(provider.rif)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {validateRIF(provider.rif) ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" title="RIF Válido" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" title="RIF Inválido" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{provider.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{provider.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{provider.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{provider.contactPerson}</span>
                </div>
              </div>

              {/* Retention Rates */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">ISLR</p>
                  <p className="text-lg font-bold text-blue-900">{provider.retentionISLRPercentage}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium">IVA</p>
                  <p className="text-lg font-bold text-purple-900">{provider.retentionIVAPercentage}%</p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transacciones:</span>
                  <span className="font-semibold">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Facturado:</span>
                  <span className="font-semibold">{formatCurrency(stats.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Retenido:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(stats.totalRetained)}</span>
                </div>
                {stats.lastTransaction && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Última transacción:</span>
                    <span className="font-medium">{formatDate(stats.lastTransaction.date)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(provider)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </button>
                <button
                  onClick={() => handleEdit(provider)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(provider.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New/Edit Provider Form Modal */}
      <ProviderForm
        isOpen={showNewProviderForm}
        onClose={() => {
          setShowNewProviderForm(false);
          setEditingProvider(null);
          setFormErrors({});
        }}
        onSuccess={async (savedProvider: Provider) => {
          console.log('✅ ProvidersManager - Provider form success:', { 
            savedProvider,
            isEditing: !!editingProvider,
            hasValidData: !!(savedProvider?.name && savedProvider?.rif)
          });
          
          // Validar que el proveedor tenga datos válidos
          if (!savedProvider || !savedProvider.name || !savedProvider.rif) {
            console.error('❌ Invalid provider data received');
            addToast({
              type: 'warning',
              title: 'Advertencia',
              message: 'El proveedor se guardó pero hubo un problema al actualizar la lista'
            });
            // Recargar la lista completa desde la base de datos
            await loadProviders();
            return;
          }
          
          if (editingProvider) {
            setProviders(prev => {
              const updated = prev.map(p => 
                p.id === savedProvider.id ? savedProvider : p
              );
              console.log('✅ ProvidersManager - Provider list updated after edit');
              return updated;
            });
          } else {
            // Agregar el nuevo proveedor a la lista
            setProviders(prev => [savedProvider, ...prev]);
          }
          
          setShowNewProviderForm(false);
          setEditingProvider(null);
          setFormErrors({});
        }}
        provider={editingProvider}
      />

      {/* Provider Details Modal */}
      {showProviderDetails && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles del Proveedor
              </h2>
              <button
                onClick={() => setShowProviderDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'info' 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'transactions' 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Historial de Transacciones
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'stats' 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Estadísticas
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Datos Principales</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">RIF:</span>
                          <span className="font-medium">{formatRIF(selectedProvider.rif)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nombre:</span>
                          <span className="font-medium">{selectedProvider.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">{selectedProvider.taxType || 'Ordinario'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Contacto</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedProvider.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedProvider.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{selectedProvider.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{selectedProvider.contactPerson}</span>
                        </div>
                        {selectedProvider.website && (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span>{selectedProvider.website}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Retenciones Configuradas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-100 rounded-lg p-3 text-center">
                          <p className="text-xs text-blue-600 font-medium">ISLR</p>
                          <p className="text-2xl font-bold text-blue-900">{selectedProvider.retentionISLRPercentage}%</p>
                        </div>
                        <div className="bg-purple-100 rounded-lg p-3 text-center">
                          <p className="text-xs text-purple-600 font-medium">IVA</p>
                          <p className="text-2xl font-bold text-purple-900">{selectedProvider.retentionIVAPercentage}%</p>
                        </div>
                      </div>
                    </div>

                    {selectedProvider.notes && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Notas</h3>
                        <p className="text-gray-600">{selectedProvider.notes}</p>
                      </div>
                    )}

                    {(() => {
                      const stats = providerStats[selectedProvider.rif] || {
                        totalTransactions: 0,
                        totalAmount: 0,
                        totalRetained: 0
                      };
                      return (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Resumen Rápido</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Transacciones:</span>
                              <span className="font-medium">{stats.totalTransactions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Facturado:</span>
                              <span className="font-medium">{formatCurrency(stats.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Retenido:</span>
                              <span className="font-medium text-red-600">{formatCurrency(stats.totalRetained)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Monto Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Base Imponible
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          % Retención
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Monto Retenido
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedProviderTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'ISLR' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.documentNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(transaction.taxableBase)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {transaction.retentionPercentage}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-bold">
                            {formatCurrency(transaction.retentionAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : transaction.status === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.status === 'PENDING' ? 'Pendiente' : 
                               transaction.status === 'PAID' ? 'Pagado' : 'Declarado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-blue-900">Transacciones Totales</h4>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {providerStats[selectedProvider.rif]?.totalTransactions || 0}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">Operaciones registradas</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-green-900">Total Facturado</h4>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(providerStats[selectedProvider.rif]?.totalAmount || 0)}
                  </p>
                  <p className="text-sm text-green-600 mt-2">Monto acumulado</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-red-900">Total Retenido</h4>
                    <CreditCard className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(providerStats[selectedProvider.rif]?.totalRetained || 0)}
                  </p>
                  <p className="text-sm text-red-600 mt-2">ISLR + IVA</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-purple-900">Este Año</h4>
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(providerStats[selectedProvider.rif]?.yearlyAmount || 0)}
                  </p>
                  <p className="text-sm text-purple-600 mt-2">{new Date().getFullYear()}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-orange-900">Este Mes</h4>
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(providerStats[selectedProvider.rif]?.monthlyAmount || 0)}
                  </p>
                  <p className="text-sm text-orange-600 mt-2">
                    {new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-teal-900">Promedio Retención</h4>
                    <Percent className="h-5 w-5 text-teal-600" />
                  </div>
                  <p className="text-3xl font-bold text-teal-900">
                    {(providerStats[selectedProvider.rif]?.averageRetention || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-teal-600 mt-2">Porcentaje promedio</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleEdit(selectedProvider)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Edit3 className="h-4 w-4 inline mr-2" />
                Editar Proveedor
              </button>
              <button
                onClick={() => setShowProviderDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}