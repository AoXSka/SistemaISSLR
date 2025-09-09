import React, { useState, useMemo, useEffect } from 'react';
import ISLRForm from '../Forms/ISLRForm';
import { useLicenseProtection } from '../../hooks/useLicense';
import LicenseProtection from '../UI/LicenseProtection';
import { transactionService } from '../../services/transactionService';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { useToast } from '../UI/Toast';
import { voucherService } from '../../services/voucherService';
import { providerService } from '../../services/providerService';
import { 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  FileText, 
  Calculator,
  Filter,
  Mail,
  X,
  Printer,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Building2,
  User,
  CheckCircle2,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate, generateVoucherNumber } from '../../utils/formatters';
import { Transaction, Provider } from '../../types';
import { useCompany } from '../../hooks/useCompany';

export default function ISLRRetentions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { addToast } = useToast();
  const { fiscalYear } = useFiscalConfig();
  const { canAccess: canAccessISLR, blockedMessage } = useLicenseProtection('islr_retentions');
  const { company } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState(`${fiscalYear || new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
  const [showISLRForm, setShowISLRForm] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const itemsPerPage = 10;

  // Company data with fallback
  const companyData = company || {
    rif: 'J-00000000-0',
    name: 'EMPRESA NO CONFIGURADA',
    address: 'Configure dirección en Configuración',
    phone: '0000-0000000',
    email: 'configurar@empresa.com'
  };

  // Load transactions on component mount and period change
  useEffect(() => {
    loadTransactions();
  }, [selectedPeriod]);

  const loadTransactions = async () => {
    try {
      const allTransactions = await transactionService.getTransactions({
        type: 'ISLR',
        period: selectedPeriod
      });
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading ISLR transactions:', error);
      setTransactions([]);
    }
  };

  const handleTransactionSuccess = (transaction: Transaction) => {
  console.log('🔄 ISLRRetentions - Handling transaction success:', {
    transaction,
    isEditing: !!editingTransaction,
    currentTransactionsCount: transactions.length
  });

  if (editingTransaction) {
    console.log('📝 ISLRRetentions - Updating existing transaction:', editingTransaction.id);
    
    setTransactions(prev => {
      const updated = prev.map(t => 
        t.id === editingTransaction.id ? { ...transaction, id: editingTransaction.id } : t
      );
      console.log('✅ ISLRRetentions - State updated with edited transaction');
      return updated;
    });
    
    addToast({
      type: 'success',
      title: 'Retención ISLR actualizada',
      message: `Retención de ${transaction.providerName} actualizada exitosamente`
    });
  } else {
    console.log('➕ ISLRRetentions - Adding new transaction to list');
    
    setTransactions(prev => {
      const newList = [transaction, ...prev];
      console.log('✅ ISLRRetentions - Added transaction to state:', {
        before: prev.length,
        after: newList.length,
        newTransactionId: transaction.id
      });
      return newList;
    });
    
    addToast({
      type: 'success',
      title: 'Retención ISLR creada',
      message: `Retención de ${transaction.providerName} creada exitosamente`
    });
  }
  
  setEditingTransaction(null);
  setShowISLRForm(false);
  
  // Reload transactions to ensure fresh data
  setTimeout(() => {
    loadTransactions();
  }, 1000);
};
  // Form states

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || transaction.status === statusFilter;
      const matchesPeriod = transaction.period === selectedPeriod;
      
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [transactions, searchTerm, statusFilter, selectedPeriod]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => ({
      totalBase: acc.totalBase + transaction.taxableBase,
      totalRetained: acc.totalRetained + transaction.retentionAmount,
      totalTransactions: acc.totalTransactions + 1,
      pendingCount: acc.pendingCount + (transaction.status === 'PENDING' ? 1 : 0)
    }), { totalBase: 0, totalRetained: 0, totalTransactions: 0, pendingCount: 0 });
  }, [filteredTransactions]);

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

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('✏️ ISLRRetentions - Opening edit form for transaction:', transaction.id);
    setEditingTransaction(transaction);
    setShowISLRForm(true);
  };

  const islrConcepts = [
    { code: '001', name: 'Honorarios Profesionales', rate: 6 },
    { code: '002', name: 'Servicios Técnicos', rate: 3 },
    { code: '003', name: 'Servicios de Construcción', rate: 2 },
    { code: '004', name: 'Servicios de Publicidad', rate: 3 },
    { code: '005', name: 'Servicios de Limpieza', rate: 2 },
    { code: '006', name: 'Servicios de Transporte', rate: 2 },
    { code: '007', name: 'Arrendamientos', rate: 6 },
    { code: '008', name: 'Servicios de Informática', rate: 3 }
  ];

  const handleGenerateVoucher = async (transaction: Transaction) => {
    try {
      // Check if voucher already exists for this transaction
      const existingVoucher = await voucherService.getVoucherByTransaction(transaction.id);
      
      if (existingVoucher) {
        addToast({
          type: 'warning',
          title: 'Comprobante ya existe',
          message: `Ya existe un comprobante ISLR N° ${existingVoucher.number} para esta transacción`
        });
        
        // Show existing voucher in modal
        setSelectedTransaction(transaction);
        setShowVoucherModal(true);
        return;
      }
      
      console.log('🧾 ISLRRetentions - Generating voucher for transaction:', {
        id: transaction.id,
        providerRif: transaction.providerRif,
        providerName: transaction.providerName,
        documentNumber: transaction.documentNumber
      });
      
      const { voucher, pdfBlob } = await voucherService.generateVoucher(transaction.id, 'ISLR');
      
      addToast({
        type: 'success',
        title: 'Comprobante generado',
        message: `Comprobante ISLR ${voucher.number} generado exitosamente`
      });
      
      // Show voucher modal
      setSelectedTransaction(transaction);
      setShowVoucherModal(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al generar comprobante',
        message: error instanceof Error ? error.message : 'No se pudo generar el comprobante'
      });
    }
  };

  const handleGenerateVoucherOld = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowVoucherModal(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleSendEmail = async (transaction: Transaction) => {
    const provider = providers.find(p => p.rif === transaction.providerRif);
    
    if (!provider?.email) {
      addToast({
        type: 'warning',
        title: 'Email no configurado',
        message: `El proveedor ${transaction.providerName} no tiene email configurado`
      });
      return;
    }

    try {
      // Generate voucher if it doesn't exist
      let voucher = voucherService.getVouchersByTransaction(transaction.id)[0];
      
      if (!voucher) {
        const result = await voucherService.generateVoucher(transaction.id, 'ISLR');
        voucher = result.voucher;
      }

      const success = await voucherService.sendVoucherByEmail(voucher.id, provider.email);
      
      if (success) {
        addToast({
          type: 'success',
          title: 'Comprobante enviado',
          message: `Comprobante ISLR enviado exitosamente a ${provider.name}`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error al enviar',
          message: 'No se pudo enviar el comprobante por email'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error de envío',
        message: error instanceof Error ? error.message : 'Error al procesar envío de email'
      });
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    if (confirm(`¿Está seguro de eliminar la retención ISLR de ${transaction.providerName}? Esta acción no se puede deshacer.`)) {
      try {
        await transactionService.deleteTransaction(id);
        await loadTransactions(); // Reload from database
        addToast({
          type: 'success',
          title: 'Retención eliminada',
          message: `Retención ISLR de ${transaction.providerName} eliminada exitosamente`
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error al eliminar',
          message: error instanceof Error ? error.message : 'No se pudo eliminar la retención'
        });
      }
    }
  };

  const handleExportISLRTXT = async () => {
    try {
      const { seniatExporter } = await import('../../services/seniatExporter');
      const txtContent = await seniatExporter.generateISLRTXT(transactions, { period: selectedPeriod });
      
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ISLR_${selectedPeriod.replace('-', '')}_SENIAT.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Exportación ISLR TXT exitosa',
        message: `Archivo ISLR_${selectedPeriod.replace('-', '')}_SENIAT.txt descargado`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error en exportación ISLR TXT',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  const handleExportISLRXML = async () => {
    try {
      const { seniatExporter } = await import('../../services/seniatExporter');
      const xmlContent = await seniatExporter.generateISLRXML(transactions, { period: selectedPeriod });
      
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ISLR_${selectedPeriod.replace('-', '')}_SENIAT.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Exportación ISLR XML exitosa',
        message: `Archivo ISLR_${selectedPeriod.replace('-', '')}_SENIAT.xml descargado`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error en exportación ISLR XML',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* License Protection Check */}
      {!canAccessISLR && (
        <div className="mb-6">
          <LicenseProtection 
            feature="islr_retentions"
            fallback={
              <div className="bg-warning-50 dark:bg-warning-900/20 p-6 rounded-xl border border-warning-200 dark:border-warning-700 text-center">
                <p className="text-warning-800 dark:text-warning-200">{blockedMessage}</p>
              </div>
            }
          />
        </div>
      )}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Retenciones ISLR
            </h1>
            <p className="text-gray-600">
              Control completo de retenciones del Impuesto Sobre La Renta
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowISLRForm(true)}
              disabled={!canAccessISLR}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Retención
            </button>
            <button 
              onClick={handleExportISLRTXT}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar TXT
            </button>
            <button 
              onClick={handleExportISLRXML}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar XML
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Base Imponible</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalBase)}</p>
              <p className="text-xs text-blue-200 mt-1">Período {selectedPeriod}</p>
            </div>
            <Calculator className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Retenido ISLR</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalRetained)}</p>
              <p className="text-xs text-red-200 mt-1">{totals.totalTransactions} operaciones</p>
            </div>
            <FileText className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Retenciones del Período</p>
              <p className="text-2xl font-bold">{totals.totalTransactions}</p>
              <p className="text-xs text-yellow-200 mt-1">Registradas</p>
            </div>
            <Eye className="h-8 w-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Por Declarar</p>
              <p className="text-2xl font-bold">{totals.pendingCount}</p>
              <p className="text-xs text-purple-200 mt-1">Pendientes</p>
            </div>
            <Check className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
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

          {/* Period Filter */}
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

      {/* ISLR Concepts Reference */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conceptos ISLR - Referencia Rápida</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {islrConcepts.map((concept) => (
            <div key={concept.code} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-semibold text-blue-900">Código {concept.code}</div>
              <div className="text-sm text-blue-800">{concept.name}</div>
              <div className="text-lg font-bold text-blue-900">{concept.rate}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ISLR Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-semibold text-blue-900">Retenciones ISLR - {selectedPeriod}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fecha
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
                  % ISLR
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
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatDate(transaction.date)}
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
                      <p className="text-xs text-gray-500">{transaction.providerRif}</p>
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
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {transaction.retentionPercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                    {formatCurrency(transaction.retentionAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                      {transaction.status === 'PENDING' ? 'Pendiente' : transaction.status === 'PAID' ? 'Pagado' : 'Declarado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleGenerateVoucher(transaction)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Generar comprobante"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleSendEmail(transaction)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Enviar por email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar retención"
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length} retenciones
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
      </div>

      {/* New Retention Form Modal */}
      <ISLRForm
        isOpen={showISLRForm}
        onClose={() => {
          console.log('🚪 ISLRForm closing');
          setShowISLRForm(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionSuccess}  // ← CAMBIAR: usar onSuccess directamente
        transaction={editingTransaction}
      />
      

      {/* Voucher Modal */}
      {showVoucherModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Comprobante de Retención ISLR</h2>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Voucher Content */}
            <div className="border-2 border-gray-300 rounded-lg p-6" id="voucher-content">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold">COMPROBANTE DE RETENCIÓN I.S.L.R.</h3>
                <p className="text-sm text-gray-600">N° {generateVoucherNumber('ISLR')}</p>
              </div>

              {/* Company and Provider Data */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {!company || !company.rif ? (
                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <h4 className="font-semibold text-sm mb-3 text-red-700 uppercase">⚠️ Agente de Retención</h4>
                    <p className="text-sm text-red-600 mb-2">Configure la información de empresa antes de generar comprobantes oficiales.</p>
                    <button className="text-xs text-red-700 underline hover:text-red-800">
                      Ir a Configuración → Empresa
                    </button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-sm mb-2">AGENTE DE RETENCIÓN</h4>
                    <p className="text-sm">RIF: {company.rif}</p>
                    <p className="text-sm">Razón Social: {company.name}</p>
                    <p className="text-sm">Dirección: {company.address || 'Dirección no configurada'}</p>
                    <p className="text-sm">Teléfono: {company.phone || 'Teléfono no configurado'}</p>
                  </div>
                )}
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-sm mb-2">SUJETO RETENIDO</h4>
                  <p className="text-sm">RIF: {selectedTransaction.providerRif}</p>
                  <p className="text-sm">Nombre: {selectedTransaction.providerName}</p>
                  <p className="text-sm">Dirección: Dirección del proveedor</p>
                </div>
              </div>

              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-sm">Concepto</th>
                      <th className="border p-2 text-sm">Documento</th>
                      <th className="border p-2 text-sm">Fecha</th>
                      <th className="border p-2 text-sm">Base Imponible</th>
                      <th className="border p-2 text-sm">%</th>
                      <th className="border p-2 text-sm">Monto Retenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-sm">{selectedTransaction.concept}</td>
                      <td className="border p-2 text-sm">{selectedTransaction.documentNumber}</td>
                      <td className="border p-2 text-sm">{formatDate(selectedTransaction.date)}</td>
                      <td className="border p-2 text-sm text-right">{formatCurrency(selectedTransaction.taxableBase)}</td>
                      <td className="border p-2 text-sm text-center">{selectedTransaction.retentionPercentage}%</td>
                      <td className="border p-2 text-sm text-right font-bold">{formatCurrency(selectedTransaction.retentionAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between mb-6">
                <div className="text-sm">
                  <p><strong>Período Fiscal:</strong> {selectedTransaction.period}</p>
                  <p><strong>Fecha de Emisión:</strong> {formatDate(new Date().toISOString())}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">Total Retenido: {formatCurrency(selectedTransaction.retentionAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mt-12">
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold">Firma del Agente de Retención</p>
                    <p className="text-xs text-gray-600">Sello de la Empresa</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm font-semibold">Firma del Sujeto Retenido</p>
                    <p className="text-xs text-gray-600">C.I./RIF</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handlePrintVoucher}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={() => handleSendEmail(selectedTransaction)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </button>
              <button
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}