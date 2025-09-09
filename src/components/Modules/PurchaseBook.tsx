import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Download, Upload, Filter, Search, Edit, Trash2, 
  FileText, DollarSign, Calendar, TrendingUp, AlertCircle,
  Check, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { Purchase, PurchaseStatistics, Transaction } from '../../types/index';
import PurchaseForm from '../../components/Forms/PurchaseForm';
import PurchaseStatisticsComponent from '../../components/Modules/PurchaseStatistics';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from '../../utils/toast';

interface PurchaseBookProps {
  currentPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

const PurchaseBook: React.FC<PurchaseBookProps> = ({ 
  currentPeriod = new Date().toISOString().substring(0, 7),
  onPeriodChange 
}) => {
  // State Management
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    status: '',
    paymentMethod: '',
    providerRif: '',
    startDate: '',
    endDate: '',
    period: currentPeriod
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data on mount and when period changes
  useEffect(() => {
    loadPurchases();
    loadStatistics();
  }, [currentPeriod]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, purchases]);

  // ========== Data Loading ==========
  
  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getPurchases({ period: currentPeriod });
      setPurchases(data);
      toast.success(`${data.length} compras cargadas`);
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      toast.error('Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await purchaseService.getPurchaseStatistics(currentPeriod);
      setStatistics(stats);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
      toast.error('Error al cargar estadísticas');
    }
  };

  // ========== Filtering Logic ==========
  
  const applyFilters = () => {
    let filtered = [...purchases];

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.invoiceNumber.toLowerCase().includes(searchLower) ||
        p.providerName.toLowerCase().includes(searchLower) ||
        p.concept.toLowerCase().includes(searchLower) ||
        p.providerRif.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(p => p.paymentMethod === filters.paymentMethod);
    }

    // Provider RIF filter
    if (filters.providerRif) {
      filtered = filtered.filter(p => p.providerRif === filters.providerRif);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(p => p.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(p => p.date <= filters.endDate);
    }

    setFilteredPurchases(filtered);
    setCurrentPage(1);
  };

  // ========== CRUD Operations - UPDATED ==========

  const handlePurchaseSuccess = async (transaction: Transaction) => {
    // Refresh data after successful save
    await loadPurchases();
    await loadStatistics();
    setShowForm(false);
    setSelectedPurchase(null);
  };

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta compra?')) return;

    try {
      await purchaseService.deletePurchase(id);
      toast.success('Compra eliminada exitosamente');
      await loadPurchases();
      await loadStatistics();
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      toast.error(error.message || 'Error al eliminar la compra');
    }
  };

  // Convert Purchase to Transaction format for the form
  const convertPurchaseToTransaction = (purchase: Purchase): Transaction => {
    return {
      id: purchase.id.toString(),
      type: 'EXPENSE',
      date: purchase.date,
      documentNumber: purchase.invoiceNumber,
      controlNumber: purchase.controlNumber,
      providerRif: purchase.providerRif,
      providerName: purchase.providerName,
      concept: purchase.concept,
      totalAmount: purchase.totalAmount,
      taxableBase: purchase.netAmount,
      retentionPercentage: 0,
      retentionAmount: 0,
      status: purchase.status as 'PENDING' | 'PAID' | 'DECLARED',
      period: purchase.period,
      createdAt: purchase.createdAt || new Date().toISOString(),
      // Additional fields for purchase
      category: purchase.category,
      paymentMethod: purchase.paymentMethod,
      currency: purchase.currency,
      exchangeRate: purchase.exchangeRate,
      ivaRate: purchase.ivaRate,
      ivaAmount: purchase.ivaAmount,
      exemptAmount: purchase.exemptAmount,
      observations: purchase.observations
    } as Transaction;
  };

  // ========== Import/Export ==========

  const handleExportCSV = async () => {
    try {
      const csv = await purchaseService.exportToCSV(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `libro-compras-${currentPeriod}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Datos exportados exitosamente');
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      toast.error('Error al exportar los datos');
    }
  };

  const handleExportJSON = async () => {
    try {
      const json = await purchaseService.exportToJSON(filters);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `libro-compras-${currentPeriod}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Datos exportados exitosamente');
    } catch (error: any) {
      console.error('Error exporting JSON:', error);
      toast.error('Error al exportar los datos');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const isCSV = file.name.endsWith('.csv');
      
      const result = isCSV 
        ? await purchaseService.importFromCSV(content)
        : await purchaseService.importFromJSON(content);

      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
        toast.warning(`Importados: ${result.success} registros. Errores: ${result.errors.length}`);
      } else {
        toast.success(`${result.success} registros importados exitosamente`);
      }

      await loadPurchases();
      await loadStatistics();
      setShowImportDialog(false);
    } catch (error: any) {
      console.error('Error importing file:', error);
      toast.error('Error al importar el archivo');
    }
  };

  // ========== Pagination ==========

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPurchases, currentPage]);

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  // ========== Render Methods ==========

  const renderFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
          />
        </div>

        {/* Category */}
        <select
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Todas las categorías</option>
          <option value="INV">Inventario</option>
          <option value="SER">Servicios</option>
          <option value="ALQ">Alquileres</option>
          <option value="PUB">Publicidad y Mercadeo</option>
          <option value="MAN">Mantenimiento</option>
          <option value="SUP">Suministros de Oficina</option>
          <option value="TEC">Tecnología</option>
          <option value="OTR">Otros</option>
        </select>

        {/* Status */}
        <select
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="cancelled">Anulado</option>
        </select>

        {/* Payment Method */}
        <select
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.paymentMethod}
          onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
        >
          <option value="">Todos los métodos</option>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="check">Cheque</option>
          <option value="card">Tarjeta</option>
          <option value="other">Otro</option>
        </select>

        {/* Date Range */}
        <input
          type="date"
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.startDate}
          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          placeholder="Desde"
        />
        
        <input
          type="date"
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.endDate}
          onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          placeholder="Hasta"
        />

        {/* Clear Filters */}
        <button
          onClick={() => setFilters({
            searchTerm: '',
            category: '',
            status: '',
            paymentMethod: '',
            providerRif: '',
            startDate: '',
            endDate: '',
            period: currentPeriod
          })}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factura
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Control
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Concepto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Neto
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                IVA
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedPurchases.map(purchase => (
              <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(purchase.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {purchase.invoiceNumber}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {purchase.controlNumber}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{purchase.providerName}</div>
                    <div className="text-gray-500">{purchase.providerRif}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {purchase.concept}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800`}>
                    {purchase.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(purchase.netAmount, purchase.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(purchase.ivaAmount, purchase.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(purchase.totalAmount, purchase.currency)}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderStatusBadge(purchase.status)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(purchase.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={6} className="px-4 py-3 text-sm font-medium text-gray-900">
                Totales del período
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {formatCurrency(
                  filteredPurchases.reduce((sum, p) => sum + p.netAmount, 0),
                  'VES'
                )}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {formatCurrency(
                  filteredPurchases.reduce((sum, p) => sum + p.ivaAmount, 0),
                  'VES'
                )}
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                {formatCurrency(
                  filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
                  'VES'
                )}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} de{' '}
              {filteredPurchases.length} resultados
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-md transition-colors ${
                      page === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              }).filter(Boolean)}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'yellow', label: 'Pendiente', icon: AlertCircle },
      paid: { color: 'green', label: 'Pagado', icon: Check },
      cancelled: { color: 'red', label: 'Anulado', icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        ${config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${config.color === 'green' ? 'bg-green-100 text-green-800' : ''}
        ${config.color === 'red' ? 'bg-red-100 text-red-800' : ''}
      `}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Libro de Compras</h1>
            <p className="text-gray-500 mt-1">
              Período: {currentPeriod} | Total de registros: {filteredPurchases.length}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Estadísticas
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Importar
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar JSON
            </button>
            <button
              onClick={() => {
                setSelectedPurchase(null);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Compra
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {showStatistics && statistics && (
        <PurchaseStatisticsComponent statistics={statistics} period={currentPeriod} />
      )}

      {/* Filters */}
      {renderFilters()}

      {/* Table */}
      {renderTable()}

      {/* Form Modal - UPDATED TO USE NEW PURCHASEFORM */}
      {showForm && (
        <PurchaseForm
          isOpen={showForm}
          onClose={() => {
            console.log('🚪 PurchaseForm closing via onClose');
            setShowForm(false);
            setSelectedPurchase(null);
          }}
          onSuccess={(transaction) => {
            console.log('🎉 PurchaseForm success callback');
            handlePurchaseSuccess(transaction);
          }}
          transaction={selectedPurchase ? convertPurchaseToTransaction(selectedPurchase) : undefined}
        />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Importar Compras</h2>
            <p className="text-gray-600 mb-4">
              Seleccione un archivo CSV o JSON con las compras a importar
            </p>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleImportFile}
              className="w-full p-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseBook;