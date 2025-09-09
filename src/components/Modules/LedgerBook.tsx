import React, { useState, useEffect } from 'react';
import { useToast } from '../UI/Toast';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2,
  BookOpen,
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Building2,
  Receipt,
  X
} from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { formatCurrency, formatDate, formatRIF } from '../../utils/formatters';
import { Transaction } from '../../types';

interface LedgerBookProps {
  onNavigate?: (module: string) => void;
}

export default function LedgerBook({ onNavigate }: LedgerBookProps) {
  const { fiscalYear } = useFiscalConfig();
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState(`${fiscalYear || new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    loadTransactions();
  }, [selectedPeriod]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      console.log('📖 LedgerBook - Loading transactions for period:', selectedPeriod);
      
      const allTransactions = await transactionService.getTransactions({
        period: selectedPeriod
      });
      
      console.log('📖 LedgerBook - Loaded transactions:', allTransactions.length);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    console.log('👁️ LedgerBook - View transaction details:', transaction.id);
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('✏️ LedgerBook - Edit transaction:', transaction.id);
    setSelectedTransaction(transaction);
    setShowEditForm(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const confirmMessage = `¿Está seguro de eliminar esta transacción?

Proveedor: ${transaction.providerName}
Documento: ${transaction.documentNumber}
Monto: ${formatCurrency(transaction.retentionAmount)}

Esta acción no se puede deshacer.`;

    if (confirm(confirmMessage)) {
      try {
        console.log('🗑️ LedgerBook - Deleting transaction:', { id, provider: transaction.providerName });
        await transactionService.deleteTransaction(id);
        await loadTransactions(); // Reload from database
        
        addToast({
          type: 'success',
          title: 'Transacción eliminada',
          message: `Transacción de ${transaction.providerName} eliminada exitosamente`
        });
      } catch (error) {
        console.error('❌ LedgerBook - Delete failed:', error);
        addToast({
          type: 'error',
          title: 'Error al eliminar',
          message: error instanceof Error ? error.message : 'No se pudo eliminar la transacción'
        });
      }
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.concept.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const totals = filteredTransactions.reduce((acc, transaction) => ({
    totalAmount: acc.totalAmount + transaction.totalAmount,
    totalBase: acc.totalBase + transaction.taxableBase,
    totalRetained: acc.totalRetained + transaction.retentionAmount,
    totalTransactions: acc.totalTransactions + 1
  }), { totalAmount: 0, totalBase: 0, totalRetained: 0, totalTransactions: 0 });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DECLARED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISLR':
        return <Receipt className="h-4 w-4 text-blue-600" />;
      case 'IVA':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'INCOME':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'EXPENSE':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Calculator className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Cargando libro mayor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Libro Mayor Contable
            </h1>
            <p className="text-gray-600">
              Registro cronológico completo de operaciones - Año Fiscal {fiscalYear || 'No configurado'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => loadTransactions()}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Transacciones</p>
              <p className="text-2xl font-bold">{totals.totalTransactions.toLocaleString()}</p>
              <p className="text-xs text-blue-200 mt-1">Período {selectedPeriod}</p>
            </div>
            <Calculator className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Monto Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</p>
              <p className="text-xs text-green-200 mt-1">Operaciones</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Base Imponible</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalBase)}</p>
              <p className="text-xs text-purple-200 mt-1">Total período</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Retenido</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalRetained)}</p>
              <p className="text-xs text-red-200 mt-1">ISLR + IVA</p>
            </div>
            <Receipt className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="ISLR">Retenciones ISLR</option>
            <option value="IVA">Retenciones IVA</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Gastos</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado</option>
            <option value="DECLARED">Declarado</option>
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const month = 12 - i;
              const monthName = new Date(fiscalYear || new Date().getFullYear(), month - 1).toLocaleDateString('es-VE', { month: 'long' });
              return (
                <option key={`${fiscalYear}-${month.toString().padStart(2, '0')}`} value={`${fiscalYear}-${month.toString().padStart(2, '0')}`}>
                  {monthName} {fiscalYear}
                </option>
              );
            })}
          </select>

          <button className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-semibold text-blue-900">
            Libro Mayor - {selectedPeriod} • Año Fiscal {fiscalYear}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Base Imponible
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  % Retención
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Monto Retenido
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-500 mb-2">
                        No hay transacciones registradas
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Comience registrando retenciones ISLR o IVA para ver el libro mayor
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Registrar Primera Transacción
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'ISLR' ? 'bg-blue-100 text-blue-800' :
                          transaction.type === 'IVA' ? 'bg-purple-100 text-purple-800' :
                          transaction.type === 'INCOME' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{transaction.documentNumber}</p>
                        {transaction.controlNumber && (
                          <p className="text-xs text-gray-500">Control: {transaction.controlNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.providerName}</p>
                        <p className="text-xs text-gray-500">{formatRIF(transaction.providerRif)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate" title={transaction.concept}>
                        {transaction.concept}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(transaction.taxableBase)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.retentionPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                      {formatCurrency(transaction.retentionAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                        {transaction.status === 'PENDING' ? 'Pendiente' : 
                         transaction.status === 'PAID' ? 'Pagado' : 'Declarado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleViewTransaction(transaction)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length} transacciones
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen del Período {selectedPeriod}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Transacciones</p>
            <p className="text-2xl font-bold text-blue-900">{totals.totalTransactions}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Monto Total</p>
            <p className="text-xl font-bold text-green-900">{formatCurrency(totals.totalAmount)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Base Imponible</p>
            <p className="text-xl font-bold text-purple-900">{formatCurrency(totals.totalBase)}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Total Retenido</p>
            <p className="text-xl font-bold text-red-900">{formatCurrency(totals.totalRetained)}</p>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de la Transacción
              </h2>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">{selectedTransaction.providerName}</h3>
                    <p className="text-sm text-blue-700">{selectedTransaction.providerRif}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status === 'PENDING' ? 'Pendiente' : 
                       selectedTransaction.status === 'PAID' ? 'Pagado' : 'Declarado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Tipo:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Fecha:</span>
                    <span className="text-sm text-gray-900">{formatDate(selectedTransaction.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Documento:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.documentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Control:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.controlNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Período:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.period}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Base Imponible:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedTransaction.taxableBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">% Retención:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.retentionPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Monto Retenido:</span>
                    <span className="text-sm font-bold text-red-600">{formatCurrency(selectedTransaction.retentionAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Total Factura:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedTransaction.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Concept */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Concepto</h4>
                <p className="text-sm text-gray-700">{selectedTransaction.concept}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleEditTransaction(selectedTransaction)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditForm && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Editar Transacción
              </h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center py-8">
              <Edit3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Edición de Transacción
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Para editar esta transacción {selectedTransaction.type}, será redirigido al módulo correspondiente.
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    
                    // Navigate to appropriate module based on transaction type
                    if (onNavigate && selectedTransaction.type) {
                      if (selectedTransaction.type === 'ISLR') {
                        onNavigate('islr');
                      } else if (selectedTransaction.type === 'IVA') {
                        onNavigate('iva');
                      }
                      
                      addToast({
                        type: 'info',
                        title: 'Redirección',
                        message: `Abriendo módulo de ${selectedTransaction.type} para editar`
                      });
                    } else {
                      addToast({
                        type: 'warning',
                        title: 'Función no disponible',
                        message: 'La edición desde libro mayor requiere navegación específica'
                      });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continuar
                </button>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}