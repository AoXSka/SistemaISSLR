import { db } from './databaseService';
import { auditService } from './auditService';


export interface SyncConfig {
  cloudEndpoint: string;
  syncInterval: number; // minutes
  maxRetries: number;
  timeout: number; // milliseconds
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  lastError: string | null;
}

export class SyncService {
  private static instance: SyncService;
  private config: SyncConfig;
  private status: SyncStatus;
  private syncInterval: NodeJS.Timeout | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    
    this.config = {
      cloudEndpoint: 'https://api.contavepro.com/sync',
      syncInterval: 5, // 5 minutes
      maxRetries: 3,
      timeout: 30000 // 30 seconds
    };

    this.status = {
      isOnline: navigator.onLine,
      lastSync: localStorage.getItem('contave-last-sync'),
      pendingChanges: 0,
      syncInProgress: false,
      lastError: null
    };

    this.setupConnectionListeners();
    
    // Only start sync scheduler in production
    if (!this.isDevelopment) {
      this.startSyncScheduler();
    } else {
      console.log('🚧 Development mode - cloud sync disabled');
    }
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private setupConnectionListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      console.log('🌐 Connection restored - initiating sync');
      if (!this.isDevelopment) {
        this.performSync();
      }
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      console.log('📴 Connection lost - switching to offline mode');
    });
  }

  private startSyncScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.status.isOnline && !this.status.syncInProgress) {
        this.performSync();
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  async performSync(): Promise<boolean> {
    // Skip sync entirely in development mode
    if (this.isDevelopment) {
      console.log('🚧 Development mode - cloud sync disabled, using localStorage only');
      
      // Simulate successful sync for development
      this.status.lastSync = new Date().toISOString();
      this.status.pendingChanges = 0;
      localStorage.setItem('contave-last-sync', this.status.lastSync);
      
      return true;
    }
    
    if (!this.status.isOnline || this.status.syncInProgress) {
      return false;
    }

    this.status.syncInProgress = true;
    this.status.lastError = null;

    try {
      console.log('🔄 Starting synchronization with cloud...');

      // Get pending changes from local database
      const pendingChanges = await this.getPendingChanges();
      console.log(`📊 Sync: ${pendingChanges.length} changes pending for cloud upload`);

      // Upload local changes to cloud
      if (pendingChanges.length > 0) {
        await this.uploadLocalChanges(pendingChanges);
      }

      // Download updates from cloud
      await this.downloadCloudUpdates();

      // Mark sync as complete
      this.status.lastSync = new Date().toISOString();
      this.status.pendingChanges = 0;
      localStorage.setItem('contave-last-sync', this.status.lastSync);

      console.log('✅ Hybrid sync completed: localStorage primary + cloud backup updated');
      
      // Log successful sync
      await auditService.logAction(
        'system',
        'SYNC_SUCCESS',
        'sync',
        undefined,
        null,
        { timestamp: this.status.lastSync, changes: pendingChanges.length }
      );

      return true;
    } catch (error) {
      this.status.lastError = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('❌ Sync failed:', this.status.lastError);
      
      // Log sync failure
      await auditService.logAction(
        'system',
        'SYNC_ERROR',
        'sync',
        undefined,
        null,
        { error: this.status.lastError }
      );

      return false;
    } finally {
      this.status.syncInProgress = false;
    }
  }

  private async getPendingChanges(): Promise<any[]> {
    const lastSyncTime = this.status.lastSync || '1970-01-01T00:00:00.000Z';
    
    // Get changes since last sync from audit log
    const auditLogs = auditService.getAuditLogs({
      startDate: lastSyncTime,
      limit: 1000
    });

    return auditLogs.filter(log => 
      ['CREATE', 'UPDATE', 'DELETE'].includes(log.action) &&
      ['transaction', 'provider', 'voucher'].includes(log.entityType)
    );
  }

  private async uploadLocalChanges(changes: any[]): Promise<void> {
    const uploadData = {
      deviceId: this.getDeviceId(),
      timestamp: new Date().toISOString(),
      changes: changes
    };

    const response = await fetch(`${this.config.cloudEndpoint}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(uploadData),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📤 Uploaded ${changes.length} changes to cloud`);
    
    return result;
  }

  private async downloadCloudUpdates(): Promise<void> {
    const lastSync = this.status.lastSync || '1970-01-01T00:00:00.000Z';
    
    const response = await fetch(
      `${this.config.cloudEndpoint}/download?since=${lastSync}&device=${this.getDeviceId()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        signal: AbortSignal.timeout(this.config.timeout)
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const cloudUpdates = await response.json();
    
    if (cloudUpdates.changes && cloudUpdates.changes.length > 0) {
      console.log(`📥 Downloading ${cloudUpdates.changes.length} updates from cloud`);
      await this.applyCloudUpdates(cloudUpdates.changes);
    }
  }

  private async applyCloudUpdates(updates: any[]): Promise<void> {
    for (const update of updates) {
      try {
        await this.applyUpdate(update);
      } catch (error) {
        console.error(`Failed to apply update ${update.id}:`, error);
        // Continue with other updates
      }
    }
  }

  private async applyUpdate(update: any): Promise<void> {
    const { entityType, action, entityId, newValues } = update;
    
    switch (action) {
      case 'CREATE':
        if (entityType === 'transaction') {
          db.createTransaction(newValues);
        } else if (entityType === 'provider') {
          db.createProvider(newValues);
        }
        break;
        
      case 'UPDATE':
        if (entityType === 'transaction') {
          db.updateTransaction(entityId, newValues);
        } else if (entityType === 'provider') {
          db.updateProvider(entityId, newValues);
        }
        break;
        
      case 'DELETE':
        if (entityType === 'transaction') {
          db.deleteTransaction(entityId);
        } else if (entityType === 'provider') {
          db.deleteProvider(entityId);
        }
        break;
    }
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('contave-device-id');
    
    if (!deviceId) {
      deviceId = 'cv-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('contave-device-id', deviceId);
    }
    
    return deviceId;
  }

  private getAuthToken(): string {
    return localStorage.getItem('contave-auth-token') || '';
  }

  // Public methods for UI
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async forcSync(): Promise<boolean> {
    if (this.status.isOnline) {
      return await this.performSync();
    }
    return false;
  }

  isOfflineMode(): boolean {
    return !this.status.isOnline;
  }

  getPendingChangesCount(): number {
    const auditLogs = auditService.getAuditLogs({
      startDate: this.status.lastSync || '1970-01-01T00:00:00.000Z'
    });
    
    return auditLogs.filter(log => 
      ['CREATE', 'UPDATE', 'DELETE'].includes(log.action)
    ).length;
  }

  // Conflict resolution
  private async resolveConflict(localData: any, cloudData: any): Promise<any> {
    // Simple timestamp-based resolution (last write wins)
    const localTimestamp = new Date(localData.updated_at || localData.created_at).getTime();
    const cloudTimestamp = new Date(cloudData.updated_at || cloudData.created_at).getTime();
    
    if (cloudTimestamp > localTimestamp) {
      console.log('🔄 Using cloud data (newer timestamp)');
      return cloudData;
    } else {
      console.log('📱 Using local data (newer timestamp)');
      return localData;
    }
  }

  // Setup offline-first database structure
  async initializeOfflineMode(): Promise<void> {
    try {
      console.log('📴 SyncService - Initializing offline-first mode...');
      
      // Ensure local database is initialized
      await db.connect();
      
      // Configure offline-first indicators
      localStorage.setItem('contave-offline-mode', 'true');
      localStorage.setItem('contave-sync-mode', 'offline-first');
      
      // Test localStorage functionality
      const testKey = 'contave-offline-test';
      localStorage.setItem(testKey, 'test');
      const testValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (testValue !== 'test') {
        throw new Error('localStorage not available');
      }
      
      console.log('✅ SyncService - Offline-first mode initialized successfully');
    } catch (error) {
      console.error('❌ SyncService - Failed to initialize offline mode:', error);
      throw error;
    }
  }

  // Cleanup and optimization
  async cleanupOldSyncData(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    auditService.clearOldLogs(30);
    
    console.log('🧹 Old sync data cleaned up');
  }
}

export const syncService = SyncService.getInstance();