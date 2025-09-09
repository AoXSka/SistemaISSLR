export interface Transaction {
  id: number;
  date: string;
  type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE';
  documentNumber: string;
  controlNumber?: string;
  providerRif: string;
  providerName: string;
  concept: string;
  totalAmount: number;
  taxableBase: number;
  retentionPercentage: number;
  retentionAmount: number;
  status: 'PENDING' | 'PAID' | 'DECLARED';
  period: string;
  createdAt: string;
}

export interface Provider {
  id: number;
  rif: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  retentionISLRPercentage: number;
  retentionIVAPercentage: number;
  website?: string;
  taxType?: string;
  notes?: string;
  createdAt: string;
}

export interface Voucher {
  id: number;
  type: 'ISLR' | 'IVA';
  number: string;
  transactionId: number;
  providerRif: string;
  issueDate: string;
  period: string;
  totalRetained: number;
  pdfPath?: string;
  emailSent: boolean;
  createdAt: string;
}

export interface CompanyInfo {
  rif: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
}

export interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalISLRRetained: number;
  totalIVARetained: number;
  pendingDeclarations: number;
  monthlyGrowth: number;
}

export interface LicenseInfo {
  type: 'trial' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'suspended';
  expiryDate: string;
  features: string[];
  maxRecords: number;
  currentRecords: number;
}

export interface BackupInfo {
  id: number;
  date: string;
  size: number;
  status: 'completed' | 'failed' | 'in-progress';
  path: string;
}

export interface FiscalEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'declaration' | 'payment' | 'deadline' | 'holiday';
  priority: 'low' | 'medium' | 'high';
  completed?: boolean;
}

export interface Report {
  id: number;
  name: string;
  type: 'balance' | 'income-statement' | 'retention-summary' | 'provider-analysis';
  description: string;
  period: string;
  createdAt: string;
  data: any;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user' | 'readonly';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface Purchase {
  id: number;
  date: string;
  invoiceNumber: string;
  controlNumber: string;
  providerRif: string;
  providerName: string;
  concept: string;
  category: string;
  netAmount: number;
  exemptAmount: number;
  taxableBase: number;
  ivaRate: number;
  ivaAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'check' | 'card' | 'other';
  currency: string;
  exchangeRate: number;
  status: 'pending' | 'paid' | 'cancelled';
  observations?: string;
  period: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  accountCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseStatistics {
  totalPurchases: number;
  totalAmount: number;
  totalIVA: number;
  totalNet: number;
  averageAmount: number;
  byCategory: Record<string, { count: number; amount: number }>;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
}

export interface SystemConfig {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  sessionTimeout: number;
  currency: string;
  fiscalYear: number;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  enableNotifications: boolean;
  enableReminders: boolean;
}

export interface Integration {
  id: number;
  name: string;
  type: 'seniat' | 'banking' | 'whatsapp' | 'google_drive';
  status: 'active' | 'inactive' | 'error';
  config: any;
  lastSync?: string;
  syncStatus?: string;
  errorMessage?: string;
}

export interface ISLRConcept {
  id: number;
  code: string;
  name: string;
  description: string;
  retentionRate: number;
  isActive: boolean;
}