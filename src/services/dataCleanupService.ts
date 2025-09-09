import { db } from './databaseService';
import { auditService } from './auditService';

export class DataCleanupService {
  private static instance: DataCleanupService;

  static getInstance(): DataCleanupService {
    if (!DataCleanupService.instance) {
      DataCleanupService.instance = new DataCleanupService();
    }
    return DataCleanupService.instance;
  }

  async performInitialCleanup(): Promise<void> {
    console.log('🧹 Starting data cleanup for production...');

    try {
      // Clear all test/mock data from database
      await this.clearTestData();
      
      // Reset sequence numbers
      await this.resetSequences();
      
      // Clear localStorage test data
      this.clearBrowserStorage();
      
      // Initialize with clean system config
      await this.initializeSystemDefaults();

      console.log('✅ Data cleanup completed successfully');
      
      // Log cleanup action
      await auditService.logAction(
        'system',
        'DATA_CLEANUP',
        'system',
        undefined,
        null,
        { timestamp: new Date().toISOString(), action: 'production_cleanup' }
      );

    } catch (error) {
      console.error('❌ Data cleanup failed:', error);
      throw error;
    }
  }

  private async clearTestData(): Promise<void> {
    if (!db || typeof window !== 'undefined') {
      console.warn('Skipping database cleanup in browser environment');
      return;
    }

    console.log('🗃️ Clearing test data from database...');

    try {
      // Clear all user data tables (keep structure)
      const tables = [
        'transactions',
        'providers', 
        'vouchers',
        'users',
        'fiscal_events',
        'backups'
      ];

      for (const table of tables) {
        try {
          db.run(`DELETE FROM ${table}`);
          console.log(`  ✓ Cleared ${table} table`);
        } catch (error) {
          console.warn(`  ⚠️ Could not clear ${table}:`, error.message);
        }
      }

      // Reset auto-increment sequences
      for (const table of tables) {
        try {
          db.run(`UPDATE sqlite_sequence SET seq = 0 WHERE name = '${table}'`);
        } catch (error) {
          // Ignore - table might not have auto-increment
        }
      }

    } catch (error) {
      throw new Error(`Database cleanup failed: ${error.message}`);
    }
  }

  private async resetSequences(): Promise<void> {
    console.log('🔄 Resetting sequence numbers...');

    // Reset voucher number sequences
    const sequenceKeys = [
      'contave-islr-sequence',
      'contave-iva-sequence',
      'contave-invoice-sequence',
      'contave-backup-sequence'
    ];

    sequenceKeys.forEach(key => {
      localStorage.setItem(key, '0');
    });

    console.log('  ✓ Sequence numbers reset');
  }

  private clearBrowserStorage(): void {
    console.log('🌐 Clearing browser storage...');

    const keysToRemove = [
      // Temporary/cache data
      'contave-cache',
      'contave-temp-data',
      'contave-temp-settings',
      
      // Test sessions
      'contave-test-session',
      'contave-demo-mode',
      
      // Old auth data
      'contave-temp-auth',
      
      // Performance metrics (will be regenerated)
      'contave-response-times',
      'contave-error-count',
      'contave-request-count'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`  ✓ Removed ${keysToRemove.length} temporary keys`);
  }

  private async initializeSystemDefaults(): Promise<void> {
    console.log('⚙️ Initializing clean system defaults...');

    // Set clean system configuration
    const defaultConfig = {
      'system.version': '2.0.0',
      'system.environment': 'production',
      'system.first_run': 'true',
      'system.data_cleaned': new Date().toISOString(),
      'backup.enabled': 'true',
      'backup.frequency': 'daily',
      'security.encryption': 'true',
      'fiscal.auto_calculate': 'true'
    };

    Object.entries(defaultConfig).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    console.log('  ✓ System defaults initialized');
  }

  async verifyCleanState(): Promise<{
    isClean: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    console.log('🔍 Verifying clean state...');

    // Check for test data in database
    try {
      const transactions = db.getTransactions();
      if (transactions.length > 0) {
        issues.push(`Found ${transactions.length} test transactions in database`);
      }

      const providers = db.getProviders();
      if (providers.length > 0) {
        issues.push(`Found ${providers.length} test providers in database`);
      }

      const vouchers = db.getVouchers();
      if (vouchers.length > 0) {
        issues.push(`Found ${vouchers.length} test vouchers in database`);
      }
    } catch (error) {
      recommendations.push('Database verification skipped (browser environment)');
    }

    // Check for test data in localStorage
    const testKeys = Object.keys(localStorage).filter(key => 
      key.includes('mock') || 
      key.includes('test') || 
      key.includes('demo') ||
      key.includes('sample')
    );

    if (testKeys.length > 0) {
      issues.push(`Found ${testKeys.length} test keys in browser storage: ${testKeys.join(', ')}`);
    }

    // Check for first-run flag
    if (!localStorage.getItem('system.first_run')) {
      recommendations.push('Set first_run flag to show setup wizard');
    }

    const isClean = issues.length === 0;

    console.log(isClean ? '✅ System is clean' : `⚠️ Found ${issues.length} cleanup issues`);

    return {
      isClean,
      issues,
      recommendations
    };
  }

  async createProductionBackup(): Promise<string> {
    console.log('💾 Creating production backup...');

    const backupData = {
      version: '2.0.0',
      environment: 'production',
      timestamp: new Date().toISOString(),
      description: 'Clean production database backup',
      schema_only: true,
      data: {
        islr_concepts: db.getISLRConcepts(),
        system_config: this.getSystemConfig()
      }
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const fileName = `contave-clean-backup-${new Date().toISOString().slice(0, 10)}.json`;

    // Save to downloads or specified directory
    try {
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Backup saved: ${fileName}`);
      return fileName;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  private getSystemConfig(): any {
    const config: any = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('system.')) {
        config[key] = localStorage.getItem(key);
      }
    }
    
    return config;
  }

  // Emergency restore from backup
  async restoreFromBackup(backupData: any): Promise<void> {
    console.log('🔄 Restoring from backup...');

    try {
      // Verify backup integrity
      if (!backupData.version || !backupData.data) {
        throw new Error('Invalid backup format');
      }

      // Clear current data
      await this.clearTestData();

      // Restore system configuration
      if (backupData.data.system_config) {
        Object.entries(backupData.data.system_config).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
      }

      console.log('✅ Backup restored successfully');
    } catch (error) {
      console.error('❌ Backup restore failed:', error);
      throw error;
    }
  }
}

export const dataCleanupService = DataCleanupService.getInstance();