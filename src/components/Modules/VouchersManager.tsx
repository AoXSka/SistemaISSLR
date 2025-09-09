import React, { useState, useEffect, useMemo } from 'react';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  FileText, 
  Mail,
  Printer,
  Filter,
  Calendar,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Send,
  Archive,
  Star,
  Copy,
  Share2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  DollarSign,
  FileDown,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { voucherService } from '../../services/voucherService';
import { transactionService } from '../../services/transactionService';
import { providerService } from '../../services/providerService';
import { formatCurrency, formatDate, generateVoucherNumber, formatRIF } from '../../utils/formatters';
import { Voucher, Transaction, Provider } from '../../types';
import { useCompany } from '../../hooks/useCompany';
import { useToast } from '../UI/Toast';

export default function VouchersManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const { fiscalYear } = useFiscalConfig();
  const { company } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState(`${fiscalYear || new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const itemsPerPage = 9;

  const { addToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        // IMPORTANTE: Agregar await a todas las llamadas asíncronas
        const allVouchers = await voucherService.getVouchers(); // ← Faltaba await
        const allTransactions = await transactionService.getTransactions({});
        const allProviders = await providerService.getProviders(); // ← Faltaba await
        
        setVouchers(allVouchers || []); // Asegurar que sea array
        setTransactions(allTransactions || []); // Asegurar que sea array
        setProviders(allProviders || []); // Asegurar que sea array
      } catch (error) {
        console.error('Error loading voucher data:', error);
        setVouchers([]);
        setTransactions([]);
        setProviders([]);
      }
    };
    
    loadData();
  }, []);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(voucher => {
      const transaction = transactions.find(t => t.id === voucher.transactionId);
      const provider = providers.find(p => p.rif === voucher.providerRif);
      
      const matchesSearch = 
        provider?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.providerRif.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || voucher.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'SENT' && voucher.emailSent) ||
        (statusFilter === 'PENDING' && !voucher.emailSent);
      const matchesPeriod = voucher.period === selectedPeriod;
      
      return matchesSearch && matchesType && matchesStatus && matchesPeriod;
    });
  }, [vouchers, searchTerm, typeFilter, statusFilter, selectedPeriod, transactions, providers]);

  const paginatedVouchers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVouchers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVouchers, currentPage]);

  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);

  const totals = useMemo(() => {
    return filteredVouchers.reduce((acc, voucher) => ({
      totalVouchers: acc.totalVouchers + 1,
      totalRetained: acc.totalRetained + voucher.totalRetained,
      emailsSent: acc.emailsSent + (voucher.emailSent ? 1 : 0),
      pendingEmails: acc.pendingEmails + (!voucher.emailSent ? 1 : 0),
      islrCount: acc.islrCount + (voucher.type === 'ISLR' ? 1 : 0),
      ivaCount: acc.ivaCount + (voucher.type === 'IVA' ? 1 : 0)
    }), { 
      totalVouchers: 0, 
      totalRetained: 0, 
      emailsSent: 0, 
      pendingEmails: 0,
      islrCount: 0,
      ivaCount: 0
    });
  }, [filteredVouchers]);

  const handleViewVoucher = (voucher: Voucher) => {
    const transaction = transactions.find(t => t.id === voucher.transactionId);
    setSelectedVoucher(voucher);
    setSelectedTransaction(transaction || null);
    setShowVoucherModal(true);
  };

  const handleSendEmail = async (voucher: Voucher) => {
    const provider = providers.find(p => p.rif === voucher.providerRif);
    
    if (!provider?.email) {
      addToast({
        type: 'warning',
        title: 'Email no configurado',
        message: `El proveedor ${provider?.name || voucher.providerRif} no tiene email configurado`
      });
      return;
    }

    try {
      const success = await voucherService.sendVoucherByEmail(voucher.id, provider.email);
      
      if (success) {
        // Update voucher status in state
        setVouchers(vouchers.map(v => 
          v.id === voucher.id ? { ...v, emailSent: true } : v
        ));
        
        addToast({
          type: 'success',
          title: 'Comprobante enviado',
          message: `Comprobante ${voucher.number} enviado exitosamente a ${provider.name}`
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
        message: error instanceof Error ? error.message : 'Error desconocido al enviar email'
      });
    }
  };

  const handleBatchSendEmails = async () => {
    const selectedVouchersList = vouchers.filter(v => selectedVouchers.includes(v.id));
    
    if (selectedVouchersList.length === 0) {
      addToast({
        type: 'warning',
        title: 'Sin selección',
        message: 'Seleccione al menos un comprobante para enviar'
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const voucher of selectedVouchersList) {
        const provider = providers.find(p => p.rif === voucher.providerRif);
        
        if (provider?.email) {
          try {
            const success = await voucherService.sendVoucherByEmail(voucher.id, provider.email);
            if (success) successCount++;
            else errorCount++;
          } catch {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }

      // Update voucher status for successful sends
      if (successCount > 0) {
        setVouchers(vouchers.map(v => 
          selectedVouchers.includes(v.id) ? { ...v, emailSent: true } : v
        ));
      }
      
      setSelectedVouchers([]);
      setShowBatchActions(false);
      
      addToast({
        type: successCount > 0 ? 'success' : 'error',
        title: 'Envío masivo completado',
        message: `${successCount} comprobantes enviados exitosamente${errorCount > 0 ? `, ${errorCount} fallaron` : ''}`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error en envío masivo',
        message: 'No se pudo completar el envío masivo'
      });
    }
  };

  const handleDownloadPDF = async (voucher: Voucher) => {
    try {
      const transaction = transactions.find(t => t.id === voucher.transactionId);
      const provider = providers.find(p => p.rif === voucher.providerRif);
      
      if (!transaction || !provider) {
        addToast({
          type: 'error',
          title: 'Datos incompletos',
          message: 'No se encontraron los datos necesarios para generar el PDF'
        });
        return;
      }

      // Import PDF generator directly to avoid creating duplicate voucher
      const { pdfGenerator } = await import('../../services/pdfGenerator');
      
      // Generate PDF directly for existing voucher
      const pdfBlob = voucher.type === 'ISLR' 
        ? await pdfGenerator.generateISLRVoucher(transaction, provider, voucher.number)
        : await pdfGenerator.generateIVAVoucher(transaction, provider, voucher.number);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${voucher.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast({
        type: 'success',
        title: 'PDF descargado',
        message: `Comprobante ${voucher.number} descargado exitosamente`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al descargar PDF',
        message: error instanceof Error ? error.message : 'No se pudo generar el PDF'
      });
    }
  };

  const handlePrint = (voucher: Voucher) => {
    window.print();
  };

  const handleSelectAll = () => {
    if (selectedVouchers.length === paginatedVouchers.length) {
      setSelectedVouchers([]);
      setShowBatchActions(false);
    } else {
      setSelectedVouchers(paginatedVouchers.map(v => v.id));
      setShowBatchActions(true);
    }
  };

  const handleSelectVoucher = (id: number) => {
    if (selectedVouchers.includes(id)) {
      const newSelection = selectedVouchers.filter(vid => vid !== id);
      setSelectedVouchers(newSelection);
      if (newSelection.length === 0) setShowBatchActions(false);
    } else {
      setSelectedVouchers([...selectedVouchers, id]);
      setShowBatchActions(true);
    }
  };

  const handleDeleteVoucher = async (id: number) => {
    const voucher = vouchers.find(v => v.id === id);
    if (!voucher) return;

    if (confirm(`¿Está seguro de eliminar el comprobante ${voucher.number}? Esta acción no se puede deshacer.`)) {
      try {
        await voucherService.deleteVoucher(id);
        setVouchers(vouchers.filter(v => v.id !== id));
        addToast({
          type: 'success',
          title: 'Comprobante eliminado',
          message: `Comprobante ${voucher.number} eliminado exitosamente`
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error al eliminar',
          message: error instanceof Error ? error.message : 'No se pudo eliminar el comprobante'
        });
      }
    }
  };

  const handleDuplicateVoucher = async (voucherId: number) => {
    try {
      const newVoucherId = await voucherService.duplicateVoucher(voucherId);
      const newVoucher = voucherService.getVoucher(newVoucherId);
      
      if (newVoucher) {
        setVouchers([newVoucher, ...vouchers]);
        addToast({
          type: 'success',
          title: 'Comprobante duplicado',
          message: `Comprobante duplicado como ${newVoucher.number}`
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al duplicar',
        message: error instanceof Error ? error.message : 'No se pudo duplicar el comprobante'
      });
    }
  };

  const getProvider = (rif: string): Provider | undefined => {
    return providers.find(p => p.rif === rif);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Comprobantes
            </h1>
            <p className="text-gray-600">
              Control completo de comprobantes ISLR e IVA generados
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todo
            </button>
            <button 
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generar Comprobante
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Comprobantes</p>
              <p className="text-2xl font-bold">{totals.totalVouchers}</p>
              <p className="text-xs text-blue-200 mt-1">Período {selectedPeriod}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Retenido</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalRetained)}</p>
              <p className="text-xs text-green-200 mt-1">Monto total</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Enviados</p>
              <p className="text-2xl font-bold">{totals.emailsSent}</p>
              <p className="text-xs text-purple-200 mt-1">Por email</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pendientes</p>
              <p className="text-2xl font-bold">{totals.pendingEmails}</p>
              <p className="text-xs text-orange-200 mt-1">Por enviar</p>
            </div>
            <Clock className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">ISLR</p>
              <p className="text-2xl font-bold">{totals.islrCount}</p>
              <p className="text-xs text-indigo-200 mt-1">Comprobantes</p>
            </div>
            <Receipt className="h-8 w-8 text-indigo-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">IVA</p>
              <p className="text-2xl font-bold">{totals.ivaCount}</p>
              <p className="text-xs text-pink-200 mt-1">Comprobantes</p>
            </div>
            <FileText className="h-8 w-8 text-pink-200" />
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
              placeholder="Buscar comprobante, proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="ISLR">Comprobantes ISLR</option>
            <option value="IVA">Comprobantes IVA</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="SENT">Enviados</option>
            <option value="PENDING">Pendientes</option>
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

        {/* Batch Actions */}
        {showBatchActions && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-blue-900 font-medium">
                {selectedVouchers.length} comprobantes seleccionados
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleBatchSendEmails}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Enviar Todos
              </button>
              <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                Descargar Todos
              </button>
              <button 
                onClick={() => {
                  setSelectedVouchers([]);
                  setShowBatchActions(false);
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {paginatedVouchers.map((voucher) => {
          const transaction = transactions.find(t => t.id === voucher.transactionId);
          const provider = getProvider(voucher.providerRif);
          
          return (
            <div key={voucher.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Checkbox for selection */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedVouchers.includes(voucher.id)}
                    onChange={() => handleSelectVoucher(voucher.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className={`p-3 rounded-lg ${
                    voucher.type === 'ISLR' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {voucher.type === 'ISLR' ? (
                      <Receipt className="h-6 w-6 text-white" />
                    ) : (
                      <FileText className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{voucher.number}</h3>
                    <p className="text-sm text-gray-600">Comprobante {voucher.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {voucher.emailSent ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" title="Email enviado" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-500" title="Email pendiente" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Proveedor</p>
                  <p className="font-semibold text-gray-900">{provider?.name}</p>
                  <p className="text-sm text-gray-600">{formatRIF(voucher.providerRif)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Fecha Emisión</p>
                    <p className="text-sm font-semibold">{formatDate(voucher.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Período</p>
                    <p className="text-sm font-semibold">{voucher.period}</p>
                  </div>
                </div>

                {transaction && (
                  <div className="text-xs text-gray-500">
                    <p>Factura: {transaction.documentNumber}</p>
                    <p>Control: {transaction.controlNumber}</p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 font-medium">Monto Total Retenido</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(voucher.totalRetained)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleViewVoucher(voucher)}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </button>
                <button
                  onClick={() => handleDownloadPDF(voucher)}
                  className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => handleSendEmail(voucher)}
                  disabled={voucher.emailSent}
                  className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-sm ${
                    voucher.emailSent 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {voucher.emailSent ? 'Enviado' : 'Enviar'}
                </button>
                <button 
                  onClick={() => handlePrint(voucher)}
                  className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir
                </button>
              </div>

              {/* Additional Actions */}
              <div className="mt-2 flex justify-between">
                <button
                  onClick={() => handleDuplicateVoucher(voucher.id)}
                  className="text-blue-600 hover:text-blue-700 text-xs flex items-center"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicar
                </button>
                <button
                  onClick={() => handleDeleteVoucher(voucher.id)}
                  className="text-red-600 hover:text-red-700 text-xs flex items-center"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow">
        <div className="text-sm text-gray-700">
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredVouchers.length)} de {filteredVouchers.length} comprobantes
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

      {/* Select All Option */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleSelectAll}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {selectedVouchers.length === paginatedVouchers.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
        </button>
      </div>

      {/* Voucher Detail Modal */}
      {showVoucherModal && selectedVoucher && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Comprobante de Retención {selectedVoucher.type}
              </h2>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Voucher Content */}
            <div className="border-2 border-gray-300 rounded-lg p-6" id="voucher-content">
              <div className="text-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">
                  COMPROBANTE DE RETENCIÓN {selectedVoucher.type === 'ISLR' ? 'I.S.L.R.' : 'I.V.A.'}
                </h3>
                <p className="text-sm text-gray-600 mt-2">N° {selectedVoucher.number}</p>
              </div>

              {/* Company Information */}
              {!company || !company.rif ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <p className="text-red-800 font-medium">
                    ⚠️ Configure la información de empresa en Configuración → Empresa antes de generar comprobantes oficiales.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                  <h4 className="font-semibold text-sm mb-3 text-gray-700 uppercase">Agente de Retención</h4>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">RIF:</span> {company.rif}</p>
                    <p className="text-sm"><span className="font-medium">Razón Social:</span> {company.name}</p>
                    <p className="text-sm"><span className="font-medium">Dirección:</span> {company.address || 'Dirección no configurada'}</p>
                    <p className="text-sm"><span className="font-medium">Teléfono:</span> {company.phone || 'Teléfono no configurado'}</p>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-sm mb-3 text-gray-700 uppercase">Sujeto Retenido</h4>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">RIF:</span> {formatRIF(selectedVoucher.providerRif)}</p>
                  <p className="text-sm"><span className="font-medium">Nombre:</span> {getProvider(selectedVoucher.providerRif)?.name}</p>
                  <p className="text-sm"><span className="font-medium">Dirección:</span> {getProvider(selectedVoucher.providerRif)?.address || 'Dirección no configurada'}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 mt-6">
                <h4 className="font-semibold text-sm mb-3 text-gray-700 uppercase">Detalles de la Retención</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-xs text-left">Documento</th>
                      <th className="border p-2 text-xs text-left">Control</th>
                      <th className="border p-2 text-xs text-left">Fecha</th>
                      <th className="border p-2 text-xs text-right">Total Factura</th>
                      <th className="border p-2 text-xs text-right">Base Imponible</th>
                      {selectedVoucher.type === 'IVA' && (
                        <th className="border p-2 text-xs text-right">IVA</th>
                      )}
                      <th className="border p-2 text-xs text-center">% Ret.</th>
                      <th className="border p-2 text-xs text-right">Monto Retenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-xs">{selectedTransaction.documentNumber}</td>
                      <td className="border p-2 text-xs">{selectedTransaction.controlNumber}</td>
                      <td className="border p-2 text-xs">{formatDate(selectedTransaction.date)}</td>
                      <td className="border p-2 text-xs text-right">{formatCurrency(selectedTransaction.totalAmount)}</td>
                      <td className="border p-2 text-xs text-right">{formatCurrency(selectedTransaction.taxableBase)}</td>
                      {selectedVoucher.type === 'IVA' && (
                        <td className="border p-2 text-xs text-right">{formatCurrency(selectedTransaction.taxableBase * 0.16)}</td>
                      )}
                      <td className="border p-2 text-xs text-center">{selectedTransaction.retentionPercentage}%</td>
                      <td className="border p-2 text-xs text-right font-bold">{formatCurrency(selectedVoucher.totalRetained)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={selectedVoucher.type === 'IVA' ? 7 : 6} className="border p-2 text-sm text-right">
                        TOTAL RETENIDO:
                      </td>
                      <td className="border p-2 text-sm text-right text-blue-600">
                        {formatCurrency(selectedVoucher.totalRetained)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-sm">
                  <p><strong>Período Fiscal:</strong> {selectedVoucher.period}</p>
                  <p><strong>Concepto:</strong> {selectedTransaction.concept}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">Este comprobante se emite en cumplimiento de las</p>
                  <p className="text-gray-600">disposiciones contenidas en la normativa del SENIAT</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t">
                <div className="text-center">
                  <div className="border-b-2 border-gray-400 pb-2 mb-2 mx-auto w-48">
                    <div className="h-16"></div>
                  </div>
                  <p className="text-sm font-semibold">Firma del Agente de Retención</p>
                  <p className="text-xs text-gray-600">Sello de la Empresa</p>
                </div>
                <div className="text-center">
                  <div className="border-b-2 border-gray-400 pb-2 mb-2 mx-auto w-48">
                    <div className="h-16"></div>
                  </div>
                  <p className="text-sm font-semibold">Firma del Sujeto Retenido</p>
                  <p className="text-xs text-gray-600">C.I./RIF</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDuplicateVoucher(selectedVoucher.id)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </button>
                <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePrint(selectedVoucher)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={() => handleSendEmail(selectedVoucher)}
                  disabled={selectedVoucher.emailSent}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    selectedVoucher.emailSent
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {selectedVoucher.emailSent ? 'Email Enviado' : 'Enviar por Email'}
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedVoucher)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Voucher Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Generar Nuevo Comprobante
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Seleccionar Transacción</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Seleccione una transacción sin comprobante generado para crear uno nuevo.
                </p>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transactions.filter(t => !vouchers.some(v => v.transactionId === t.id)).slice(0, 5).map(transaction => (
                    <div key={transaction.id} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{transaction.documentNumber}</p>
                          <p className="text-sm text-gray-600">{transaction.providerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(transaction.retentionAmount)}</p>
                          <p className="text-xs text-gray-500">{transaction.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                O puede generar comprobantes masivos desde el módulo correspondiente
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('✅ Comprobante generado exitosamente');
                  setShowGenerateModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}