import React, { useState, useMemo, useEffect } from 'react';
import IVAForm from '../Forms/IVAForm';
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
  Receipt,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate, generateVoucherNumber } from '../../utils/formatters';
import { Transaction, Provider } from '../../types';
import { companyService } from '../../services/companyService';
import { useCompany } from '../../hooks/useCompany';

export default function IVARetentions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const { addToast } = useToast();
  const { fiscalYear } = useFiscalConfig();
  const { canAccess: canAccessIVA, blockedMessage } = useLicenseProtection('iva_retentions');
  const { isConfigured } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState(`${fiscalYear || new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
  const [showIVAForm, setShowIVAForm] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [retentionType, setRetentionType] = useState<'75' | '100'>('75');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const itemsPerPage = 10;
  
  const loadCompanyData = async () => {
    try {
      const data = await companyService.getCompany();
      setCompanyData(data);
    } catch (error) {
      console.error('Error loading company data:', error);
      setCompanyData(null);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('✏️ IVARetentions - Opening edit form for transaction:', transaction.id);
    setEditingTransaction(transaction);
    setShowIVAForm(true);
  };

  const handleTransactionSuccess = (transaction: Transaction) => {
    console.log('🔄 IVARetentions - Handling transaction success:', {
      transaction,
      isEditing: !!editingTransaction,
      currentTransactionsCount: transactions.length
    });

    if (editingTransaction) {
      console.log('📝 IVARetentions - Updating existing transaction:', editingTransaction.id);

      setTransactions(prev => {
        const updated = prev.map(t => 
          t.id === editingTransaction.id ? { ...transaction, id: editingTransaction.id } : t
        );
        console.log('✅ IVARetentions - Updated transactions array:', {
          before: prev.length,
          after: updated.length,
          updatedId: editingTransaction.id
        });
        return updated;
      });

      addToast({
        type: 'success',
        title: 'Retención IVA actualizada',
        message: `Retención de ${transaction.providerName} actualizada exitosamente`
      });
    } else {
      console.log('➕ IVARetentions - Adding new transaction to list');

      setTransactions(prev => {
        const newList = [transaction, ...prev];
        console.log('✅ IVARetentions - Added transaction to state:', {
          before: prev.length,
          after: newList.length,
          newTransactionId: transaction.id,
          newTransactionProvider: transaction.providerName
        });
        return newList;
      });

      addToast({
        type: 'success',
        title: 'Retención IVA creada',
        message: `Retención de ${transaction.providerName} creada exitosamente`
      });
    }

    setEditingTransaction(null);
    setShowIVAForm(false);

    // OPCIONAL: Recargar después de 1 segundo para asegurar consistencia
    setTimeout(() => {
      console.log('🔄 IVARetentions - Force reloading transactions...');
      loadTransactions();
    }, 1000);
  };

  const loadTransactions = async () => {
    try {
      const allTransactions = await transactionService.getTransactions({
        type: 'IVA',
        period: selectedPeriod
      });
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading IVA transactions:', error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedPeriod]);

  // Form states for IVA
  const [formData, setFormData] = useState({
    providerRif: '',
    providerName: '',
    documentNumber: '',
    controlNumber: '',
    date: new Date().toISOString().split('T')[0],
    operationType: 'C', // C = Compra, V = Venta
    documentType: '01', // 01 = Factura, 02 = Nota Débito, 03 = Nota Crédito
    totalAmount: 0,
    exemptAmount: 0,
    taxableBase: 0,
    ivaAmount: 0,
    ivaRate: 16, // 16% tasa general
    retentionPercentage: 75,
    retentionAmount: 0,
    comprobante: '',
    expediente: ''
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Validación defensiva para campos que pueden ser undefined/null
      const providerName = transaction.providerName || '';
      const documentNumber = transaction.documentNumber || '';
      
      const matchesSearch = 
        providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
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
      totalIVA: acc.totalIVA + (transaction.taxableBase * 0.16),
      totalRetained: acc.totalRetained + transaction.retentionAmount,
      totalTransactions: acc.totalTransactions + 1,
      pendingCount: acc.pendingCount + (transaction.status === 'PENDING' ? 1 : 0)
    }), { totalBase: 0, totalIVA: 0, totalRetained: 0, totalTransactions: 0, pendingCount: 0 });
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

  const documentTypes = [
    { code: '01', name: 'Factura' },
    { code: '02', name: 'Nota de Débito' },
    { code: '03', name: 'Nota de Crédito' }
  ];

  const operationTypes = [
    { code: 'C', name: 'Compra' },
    { code: 'V', name: 'Venta' }
  ];

  const handleGenerateVoucher = async (transaction: Transaction) => {
    try {
      // Check if voucher already exists for this transaction
      const existingVoucher = await voucherService.getVoucherByTransaction(transaction.id);
      
      if (existingVoucher) {
        addToast({
          type: 'warning',
          title: 'Comprobante ya existe',
          message: `Ya existe el comprobante IVA N° ${existingVoucher.number} para esta transacción`
        });
        
        // Show existing voucher modal
        setSelectedTransaction(transaction);
        setShowVoucherModal(true);
        return;
      }
      
      console.log('📄 IVARetentions - Generating voucher for transaction:', {
        id: transaction.id,
        providerRif: transaction.providerRif,
        providerName: transaction.providerName,
        documentNumber: transaction.documentNumber
      });
      
      const { voucher, pdfBlob } = await voucherService.generateVoucher(transaction.id, 'IVA');
      
      addToast({
        type: 'success',
        title: 'Comprobante IVA generado',
        message: `Comprobante IVA ${voucher.number} generado exitosamente`
      });
      
      // Show voucher modal
      setSelectedTransaction(transaction);
      setShowVoucherModal(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al generar comprobante',
        message: error instanceof Error ? error.message : 'No se pudo generar el comprobante IVA'
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
        const result = await voucherService.generateVoucher(transaction.id, 'IVA');
        voucher = result.voucher;
      }

      const success = await voucherService.sendVoucherByEmail(voucher.id, provider.email);
      
      if (success) {
        addToast({
          type: 'success',
          title: 'Comprobante IVA enviado',
          message: `Comprobante IVA enviado exitosamente a ${provider.name}`
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

    if (confirm(`¿Está seguro de eliminar la retención IVA de ${transaction.providerName}? Esta acción no se puede deshacer.`)) {
      try {
        await transactionService.deleteTransaction(id);
        await loadTransactions(); // Reload from database
        addToast({
          type: 'success',
          title: 'Retención IVA eliminada',
          message: `Retención IVA de ${transaction.providerName} eliminada exitosamente`
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

  const handleExportIVATXT = async () => {
    try {
      const { seniatExporter } = await import('../../services/seniatExporter');
      const txtContent = await seniatExporter.generateIVATXT(transactions, { period: selectedPeriod });
      
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IVA_${selectedPeriod.replace('-', '')}_SENIAT.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Exportación TXT exitosa',
        message: `Archivo IVA_${selectedPeriod.replace('-', '')}_SENIAT.txt descargado`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error en exportación TXT',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  const handleExportIVAXML = async () => {
    try {
      const { seniatExporter } = await import('../../services/seniatExporter');
      const xmlContent = await seniatExporter.generateIVAXML(transactions, { period: selectedPeriod });
      
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IVA_${selectedPeriod.replace('-', '')}_SENIAT.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'Exportación XML exitosa',
        message: `Archivo IVA_${selectedPeriod.replace('-', '')}_SENIAT.xml descargado`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error en exportación XML',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* License Protection Check */}
      {!canAccessIVA && (
        <div className="mb-6">
          <LicenseProtection 
            feature="iva_retentions"
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
              Gestión de Retenciones IVA
            </h1>
            <p className="text-gray-600">
              Control completo de retenciones del Impuesto al Valor Agregado
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowIVAForm(true)}
              disabled={!canAccessIVA}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Retención IVA
            </button>
            <button 
              onClick={handleExportIVATXT}
              disabled={!canAccessIVA || !isConfigured}
              title={!isConfigured ? "Complete la configuración de empresa en Configuración → Datos de Empresa" : "Exportar archivo TXT para SENIAT"}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar TXT
            </button>
            <button 
              onClick={handleExportIVAXML}
              disabled={!canAccessIVA || !isConfigured}
              title={!isConfigured ? "Complete la configuración de empresa en Configuración → Datos de Empresa" : "Exportar archivo XML para SENIAT"}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar XML
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Base Imponible</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalBase)}</p>
              <p className="text-xs text-purple-200 mt-1">Período {selectedPeriod}</p>
            </div>
            <Calculator className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total IVA Facturado</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalIVA)}</p>
              <p className="text-xs text-indigo-200 mt-1">16% sobre base</p>
            </div>
            <Receipt className="h-8 w-8 text-indigo-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Total Retenido IVA</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.totalRetained)}</p>
              <p className="text-xs text-pink-200 mt-1">{totals.totalTransactions} retenciones</p>
            </div>
            <CreditCard className="h-8 w-8 text-pink-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Operaciones del Período</p>
              <p className="text-2xl font-bold">{totals.totalTransactions}</p>
              <p className="text-xs text-orange-200 mt-1">Registradas</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Por Declarar</p>
              <p className="text-2xl font-bold">{totals.pendingCount}</p>
              <p className="text-xs text-teal-200 mt-1">Pendientes</p>
            </div>
            <Check className="h-8 w-8 text-teal-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

          {/* Retention Type Filter */}
          <select
            value={retentionType}
            onChange={(e) => setRetentionType(e.target.value as '75' | '100')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="75">Retención 75%</option>
            <option value="100">Retención 100%</option>
          </select>

          <button className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* IVA Information Cards */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Retención IVA - Referencia Rápida</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-purple-900">Retención 75%</h4>
              <span className="text-2xl font-bold text-purple-800">75%</span>
            </div>
            <p className="text-sm text-purple-700">Aplicable a contribuyentes ordinarios</p>
            <p className="text-xs text-purple-600 mt-2">Servicios profesionales, comerciales y otros</p>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-indigo-900">Retención 100%</h4>
              <span className="text-2xl font-bold text-indigo-800">100%</span>
            </div>
            <p className="text-sm text-indigo-700">Aplicable a contribuyentes especiales</p>
            <p className="text-xs text-indigo-600 mt-2">Operaciones con contribuyentes especiales designados</p>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-pink-900">Alícuota General</h4>
              <span className="text-2xl font-bold text-pink-800">16%</span>
            </div>
            <p className="text-sm text-pink-700">Tasa general del IVA</p>
            <p className="text-xs text-pink-600 mt-2">Aplicable a la mayoría de bienes y servicios</p>
          </div>
        </div>
      </div>

      {/* IVA Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <h3 className="text-lg font-semibold text-purple-900">Retenciones IVA - {selectedPeriod}</h3>
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
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Factura
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Base Imponible
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  IVA 16%
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  % Retención
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  IVA Retenido
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(transaction.taxableBase)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(transaction.taxableBase * 0.16)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
                      ? 'bg-purple-600 text-white'
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
      
      {/* New IVA Retention Form Modal */}
      <IVAForm
        isOpen={showIVAForm}
        onClose={() => {
          console.log('🚪 IVAForm closing');
          setShowIVAForm(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionSuccess}  // ← CAMBIAR: usar onSuccess directamente
        transaction={editingTransaction}
      />

      {/* IVA Voucher Modal */}
      {showVoucherModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Comprobante de Retención IVA</h2>
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
                <h3 className="text-xl font-bold">COMPROBANTE DE RETENCIÓN I.V.A.</h3>
                <p className="text-sm text-gray-600">N° {generateVoucherNumber('IVA')}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
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
                      <th className="border p-2 text-xs">N° Factura</th>
                      <th className="border p-2 text-xs">N° Control</th>
                      <th className="border p-2 text-xs">Fecha</th>
                      <th className="border p-2 text-xs">Total Factura</th>
                      <th className="border p-2 text-xs">Base Imponible</th>
                      <th className="border p-2 text-xs">IVA 16%</th>
                      <th className="border p-2 text-xs">% Ret.</th>
                      <th className="border p-2 text-xs">IVA Retenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-xs">{selectedTransaction.documentNumber}</td>
                      <td className="border p-2 text-xs">{selectedTransaction.controlNumber}</td>
                      <td className="border p-2 text-xs">{formatDate(selectedTransaction.date)}</td>
                      <td className="border p-2 text-xs text-right">{formatCurrency(selectedTransaction.totalAmount)}</td>
                      <td className="border p-2 text-xs text-right">{formatCurrency(selectedTransaction.taxableBase)}</td>
                      <td className="border p-2 text-xs text-right">{formatCurrency(selectedTransaction.taxableBase * 0.16)}</td>
                      <td className="border p-2 text-xs text-center">{selectedTransaction.retentionPercentage}%</td>
                      <td className="border p-2 text-xs text-right font-bold">{formatCurrency(selectedTransaction.retentionAmount)}</td>
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
                  <p className="text-lg font-bold">Total IVA Retenido: {formatCurrency(selectedTransaction.retentionAmount)}</p>
                </div>
              </div>

              <div className="border-t pt-4 mt-8">
                <p className="text-xs text-gray-600 mb-4">
                  Este comprobante se emite en cumplimiento de las disposiciones contenidas en la Providencia Administrativa
                  SNAT/2015/0049 del SENIAT sobre retenciones del IVA.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-12 mt-8">
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
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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