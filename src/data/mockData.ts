// ContaVe Pro - Clean Data Structure (No Mock Data)
// All mock data removed for production build

import { Transaction, Provider, Voucher, CompanyInfo, DashboardMetrics } from '../types';

// Empty company info - will be filled by user setup
export const emptyCompanyInfo: CompanyInfo = {
  rif: '',
  name: '',
  address: '',
  phone: '',
  email: '',
};

// Empty dashboard metrics - will be calculated from real data
export const emptyDashboardMetrics: DashboardMetrics = {
  totalIncome: 0,
  totalExpenses: 0,
  totalISLRRetained: 0,
  totalIVARetained: 0,
  pendingDeclarations: 0,
  monthlyGrowth: 0
};

// Clean chart data structure for initialization
export const emptyChartData = {
  monthlyIncome: [
    { month: 'Ene', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Abr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 }
  ],
  retentionsByType: [
    { name: 'ISLR', value: 0, color: '#2563eb' },
    { name: 'IVA', value: 0, color: '#7c3aed' }
  ]
};

// Default ISLR concepts (system configuration, not user data)
export const defaultISLRConcepts = [
  { code: '001', name: 'Honorarios Profesionales', rate: 6.00 },
  { code: '002', name: 'Servicios Técnicos', rate: 3.00 },
  { code: '003', name: 'Servicios de Construcción', rate: 2.00 },
  { code: '004', name: 'Servicios de Publicidad', rate: 3.00 },
  { code: '005', name: 'Servicios de Limpieza', rate: 2.00 },
  { code: '006', name: 'Servicios de Transporte', rate: 2.00 },
  { code: '007', name: 'Arrendamientos', rate: 6.00 },
  { code: '008', name: 'Servicios de Informática', rate: 3.00 }
];

// Default fiscal deadlines (system configuration)
export const fiscalDeadlines = [
  { type: 'IVA', description: 'Declaración IVA Mensual', day: 15 },
  { type: 'ISLR', description: 'Retención ISLR 1ra Quincena', day: 15 },
  { type: 'ISLR', description: 'Retención ISLR 2da Quincena', day: -1 }, // Last day of month
];

// Get dynamic fiscal year from configuration or current year
const getDynamicFiscalYear = (): number => {
  try {
    const company = JSON.parse(localStorage.getItem('contave-company-v2') || '{}');
    return company.fiscalYear || new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
};

// Helper functions to generate empty data structures
export const generateEmptyTransaction = (): Omit<Transaction, 'id' | 'createdAt'> => ({
  date: new Date().toISOString().split('T')[0],
  type: 'ISLR',
  documentNumber: '',
  controlNumber: '',
  providerRif: '',
  providerName: '',
  concept: '',
  totalAmount: 0,
  taxableBase: 0,
  retentionPercentage: 0,
  retentionAmount: 0,
  status: 'PENDING',
  period: `${getDynamicFiscalYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
});

export const generateEmptyProvider = (): Omit<Provider, 'id' | 'createdAt'> => ({
  rif: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
  retentionISLRPercentage: 6,
  retentionIVAPercentage: 75
});

export const generateEmptyVoucher = (): Omit<Voucher, 'id' | 'createdAt'> => ({
  type: 'ISLR',
  number: '',
  transactionId: 0,
  providerRif: '',
  issueDate: new Date().toISOString().split('T')[0],
  period: new Date().toISOString().slice(0, 7),
  totalRetained: 0,
  emailSent: false
});