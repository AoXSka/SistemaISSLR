import { db } from './databaseService';
import { pdfGenerator } from './pdfGenerator';
import { emailService } from './emailService';
import { Transaction, CompanyInfo } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface ReportData {
  id: string;
  name: string;
  type: 'balance' | 'income-statement' | 'retention-summary' | 'provider-analysis' | 'fiscal-projection';
  period: string;
  data: any;
  generatedAt: string;
}

export class ReportService {
  private static instance: ReportService;

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  async generateBalanceSheet(
    period: string,
    company: CompanyInfo
  ): Promise<{ data: any; pdf: Blob }> {
    const transactions = db.getTransactions({
      startDate: `${period}-01`,
      endDate: `${period}-31`
    });

    // Calculate balance sheet data
    const assets = this.calculateAssets(transactions);
    const liabilities = this.calculateLiabilities(transactions);
    const equity = assets.total - liabilities.total;

    const balanceData = {
      period,
      assets: {
        current: {
          cash: assets.cash,
          accountsReceivable: assets.receivables,
          total: assets.current
        },
        nonCurrent: {
          fixedAssets: assets.fixed,
          total: assets.nonCurrent
        },
        total: assets.total
      },
      liabilities: {
        current: {
          accountsPayable: liabilities.payable,
          retentionsPayable: liabilities.retentions,
          total: liabilities.current
        },
        nonCurrent: {
          longTermDebt: liabilities.longTerm,
          total: liabilities.nonCurrent
        },
        total: liabilities.total
      },
      equity: {
        capital: equity * 0.8, // Simplified calculation
        retainedEarnings: equity * 0.2,
        total: equity
      }
    };

    // Generate PDF
    const pdf = await this.generateBalanceSheetPDF(balanceData, company);

    return { data: balanceData, pdf };
  }

  async generateIncomeStatement(
    period: string,
    company: CompanyInfo
  ): Promise<{ data: any; pdf: Blob }> {
    const transactions = db.getTransactions({
      startDate: `${period}-01`,
      endDate: `${period}-31`
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const retentions = transactions
      .reduce((sum, t) => sum + t.retentionAmount, 0);

    const incomeData = {
      period,
      revenue: {
        sales: income * 0.8,
        services: income * 0.2,
        total: income
      },
      expenses: {
        operational: expenses * 0.6,
        administrative: expenses * 0.3,
        financial: expenses * 0.1,
        total: expenses
      },
      grossProfit: income - (expenses * 0.7),
      operatingProfit: income - expenses,
      taxes: retentions,
      netProfit: income - expenses - retentions
    };

    const pdf = await this.generateIncomeStatementPDF(incomeData, company);

    return { data: incomeData, pdf };
  }

  async generateRetentionSummary(
    period: string,
    company: CompanyInfo
  ): Promise<{ data: any; pdf: Blob }> {
    const transactions = db.getTransactions({
      startDate: `${period}-01`,
      endDate: `${period}-31`
    });

    const islrTransactions = transactions.filter(t => t.type === 'ISLR');
    const ivaTransactions = transactions.filter(t => t.type === 'IVA');

    const summaryData = {
      period,
      islr: {
        transactions: islrTransactions.length,
        totalBase: islrTransactions.reduce((sum, t) => sum + t.taxableBase, 0),
        totalRetained: islrTransactions.reduce((sum, t) => sum + t.retentionAmount, 0),
        byProvider: this.groupRetentionsByProvider(islrTransactions)
      },
      iva: {
        transactions: ivaTransactions.length,
        totalBase: ivaTransactions.reduce((sum, t) => sum + t.taxableBase, 0),
        totalRetained: ivaTransactions.reduce((sum, t) => sum + t.retentionAmount, 0),
        byProvider: this.groupRetentionsByProvider(ivaTransactions)
      },
      combined: {
        totalTransactions: transactions.length,
        totalRetained: transactions.reduce((sum, t) => sum + t.retentionAmount, 0)
      }
    };

    const pdf = await this.generateRetentionSummaryPDF(summaryData, company);

    return { data: summaryData, pdf };
  }

  private calculateAssets(transactions: Transaction[]): any {
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    return {
      cash: totalIncome * 0.3,
      receivables: totalIncome * 0.4,
      current: totalIncome * 0.7,
      fixed: totalIncome * 0.5,
      nonCurrent: totalIncome * 0.5,
      total: totalIncome * 1.2
    };
  }

  private calculateLiabilities(transactions: Transaction[]): any {
    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalRetentions = transactions
      .reduce((sum, t) => sum + t.retentionAmount, 0);

    return {
      payable: totalExpenses * 0.6,
      retentions: totalRetentions,
      current: totalExpenses * 0.6 + totalRetentions,
      longTerm: totalExpenses * 0.2,
      nonCurrent: totalExpenses * 0.2,
      total: totalExpenses * 0.8 + totalRetentions
    };
  }

  private groupRetentionsByProvider(transactions: Transaction[]): any[] {
    const grouped = transactions.reduce((acc, t) => {
      const key = t.providerRif;
      if (!acc[key]) {
        acc[key] = {
          rif: t.providerRif,
          name: t.providerName,
          transactions: 0,
          totalBase: 0,
          totalRetained: 0
        };
      }
      
      acc[key].transactions++;
      acc[key].totalBase += t.taxableBase;
      acc[key].totalRetained += t.retentionAmount;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .sort((a: any, b: any) => b.totalRetained - a.totalRetained);
  }

  private async generateBalanceSheetPDF(data: any, company: CompanyInfo): Promise<Blob> {
    // This would use the PDF generator to create a formatted balance sheet
    return new Blob(['Mock Balance Sheet PDF'], { type: 'application/pdf' });
  }

  private async generateIncomeStatementPDF(data: any, company: CompanyInfo): Promise<Blob> {
    // This would use the PDF generator to create a formatted income statement
    return new Blob(['Mock Income Statement PDF'], { type: 'application/pdf' });
  }

  private async generateRetentionSummaryPDF(data: any, company: CompanyInfo): Promise<Blob> {
    // This would use the PDF generator to create a formatted retention summary
    return new Blob(['Mock Retention Summary PDF'], { type: 'application/pdf' });
  }

  async scheduleReport(
    reportType: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: string[]
  ): Promise<void> {
    // In a real implementation, this would set up a scheduled task
    console.log(`Scheduled ${reportType} report ${frequency} for ${recipients.join(', ')}`);
    
    // Store schedule in localStorage for demo
    const schedules = JSON.parse(localStorage.getItem('contave-report-schedules') || '[]');
    schedules.push({
      id: Math.random().toString(36),
      reportType,
      frequency,
      recipients,
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('contave-report-schedules', JSON.stringify(schedules));
  }

  getScheduledReports(): any[] {
    return JSON.parse(localStorage.getItem('contave-report-schedules') || '[]');
  }
}

export const reportService = ReportService.getInstance();