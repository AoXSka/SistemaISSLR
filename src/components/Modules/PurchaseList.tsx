import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Download, Upload, Filter, Calendar, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock service (replace with actual import)
const purchaseService = {
  getPurchases: async (filters) => {
    // Simulated data for demo
    return [
      {
        id: 1,
        date: '2025-01-15',
        invoiceNumber: 'FAC-001',
        controlNumber: '000123',
        providerRif: 'J-12345678-9',
        providerName: 'Proveedor Demo S.A.',
        concept: 'Compra de materiales',
        category: 'INV',
        netAmount: 1000,
        exemptAmount: 0,
        taxableBase: 1000,
        ivaRate: 16,
        ivaAmount: 160,
        totalAmount: 1160,
        paymentMethod: 'transfer',
        currency: 'VES',
        exchangeRate: 1,
        status: 'paid',
        period: '2025-01'
      }
    ];
  },
  getPurchaseStatistics: async (period) => ({
    totalPurchases: 1,
    totalAmount: 1160,
    totalIVA: 160,
    totalNet: 1000,
    averageAmount: 1160,
    byCategory: { INV: { count: 1, amount: 1160 } },
    byPaymentMethod: { transfer: { count: 1, amount: 1160 } },
    byStatus: { paid: { count: 1, amount: 1160 } },
    monthlyTrend: [{ month: '2025-01', amount: 1160, count: 1 }]
  }),
  exportToCSV: async () => 'CSV content',
  exportToJSON: async () => 'JSON content',
  getCategories: async () => [
    { id: 1, code: 'INV', name: 'Inventario' },
    { id: 2, code: 'SRV', name: 'Servicios' },
    { id: 3, code: 'ALQ', name: 'Alquileres' }
  ]
};

export default function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    period: new Date().toISOString().substring(0, 7)
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [filters.period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesData, statsData, categoriesData] = await Promise.all([
        purchaseService.getPurchases(filters),
        purchaseService.getPurchaseStatistics(filters.period),
        purchaseService.getCategories()
      ]);
      setPurchases(purchasesData);
      setStatistics(statsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!purchase.providerName.toLowerCase().includes(searchLower) &&
            !purchase.invoiceNumber.toLowerCase().includes(searchLower) &&
            !purchase.concept.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (filters.category && purchase.category !== filters.category) return false;
      if (filters.status && purchase.status !== filters.status) return false;
      if (filters.paymentMethod && purchase.paymentMethod !== filters.paymentMethod) return false;
      if (filters.startDate && purchase.date < filters.startDate) return false;
      if (filters.endDate && purchase.date > filters.endDate) return false;
      return true;
    });
  }, [purchases, filters]);

  const paginatedPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPurchases, currentPage]);

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagada',
      cancelled: 'Anulada'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      check: 'Cheque',
      card: 'Tarjeta',
      other: 'Otro'
    };
    return labels[method] || method;
  };

  const handleExport = async (format) => {
    try {
      const data = format === 'csv' 
        ? await purchaseService.exportToCSV(filters)
        : await purchaseService.exportToJSON(filters);
      
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `libro-compras-${filters.period}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Libro de Compras</h1>
              <p className="text-gray-600 mt-1">Período: {filters.period}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/purchases/new'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Compra
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <p className="text-blue-100 text-sm">Total Compras</p>
                <p className="text-2xl font-bold">{statistics.totalPurchases}</p>
                <p className="text-blue-100 text-xs mt-1">Este período</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <p className="text-green-100 text-sm">Monto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</p>
                <p className="text-green-100 text-xs mt-1">Inc. IVA</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <p className="text-purple-100 text-sm">IVA Total</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.totalIVA)}</p>
                <p className="text-purple-100 text-xs mt-1">Acumulado</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <p className="text-orange-100 text-sm">Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.averageAmount)}</p>
                <p className="text-orange-100 text-xs mt-1">Por factura</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por proveedor, factura o concepto..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.code}>{cat.name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="cancelled">Anulada</option>
            </select>

            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los métodos</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="check">Cheque</option>
              <option value="card">Tarjeta</option>
              <option value="other">Otro</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Más filtros
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período fiscal
                  </label>
                  <input
                    type="month"
                    value={filters.period}
                    onChange={(e) => setFilters({...filters, period: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Neto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IVA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : paginatedPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      No se encontraron compras
                    </td>
                  </tr>
                ) : (
                  paginatedPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(purchase.date).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{purchase.invoiceNumber}</p>
                          <p className="text-gray-500 text-xs">Control: {purchase.controlNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{purchase.providerName}</p>
                          <p className="text-gray-500 text-xs">{purchase.providerRif}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {purchase.concept}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categories.find(c => c.code === purchase.category)?.name || purchase.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(purchase.netAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <div>
                          <p>{formatCurrency(purchase.ivaAmount)}</p>
                          <p className="text-gray-500 text-xs">{purchase.ivaRate}%</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {getStatusBadge(purchase.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => window.location.href = `/purchases/${purchase.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/purchases/${purchase.id}/edit`}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => console.log('Delete:', purchase.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {paginatedPurchases.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan="5" className="px-6 py-3 text-sm font-medium text-gray-900">
                      Totales de la página
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(paginatedPurchases.reduce((sum, p) => sum + p.netAmount, 0))}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(paginatedPurchases.reduce((sum, p) => sum + p.ivaAmount, 0))}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(paginatedPurchases.reduce((sum, p) => sum + p.totalAmount, 0))}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} de {filteredPurchases.length} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}