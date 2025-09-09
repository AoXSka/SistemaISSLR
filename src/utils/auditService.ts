import { db } from './database';
import { authService } from './authService';
import { AuditLogEntry } from '../types';

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  userId?: number;
  metadata?: Record<string, any>;
}

class AuditService {
  private static instance: AuditService;
  private readonly MAX_LOG_ENTRIES = 10000;
  private readonly LOG_RETENTION_DAYS = 90;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      const entry: AuditLogEntry = {
        id: Date.now(),
        userId: data.userId || user?.id || 0,
        username: user?.username || 'system',
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent(),
        timestamp: new Date().toISOString()
      };

      // Add metadata if provided
      if (data.metadata) {
        Object.assign(entry, { metadata: data.metadata });
      }

      await this.saveAuditLog(entry);
      
      // Clean up old logs
      await this.cleanupOldLogs();

      console.log(`📝 Audit log: ${entry.action} on ${entry.entityType}${entry.entityId ? ` #${entry.entityId}` : ''} by ${entry.username}`);
    } catch (error) {
      console.error('❌ Error logging audit event:', error);
      // Don't throw - audit failures shouldn't break operations
    }
  }

  /**
   * Log a purchase-specific event
   */
  async logPurchase(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT',
    purchaseData?: any,
    oldData?: any
  ): Promise<void> {
    const metadata: Record<string, any> = {};

    if (purchaseData) {
      metadata.invoiceNumber = purchaseData.invoiceNumber;
      metadata.providerRif = purchaseData.providerRif;
      metadata.totalAmount = purchaseData.totalAmount;
      metadata.period = purchaseData.period;
    }

    await this.log({
      action: `PURCHASE_${action}`,
      entityType: 'purchase',
      entityId: purchaseData?.id,
      oldValues: oldData,
      newValues: action !== 'DELETE' ? purchaseData : undefined,
      metadata
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters?: {
    userId?: number;
    entityType?: string;
    entityId?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let logs = await this.getAllAuditLogs();

      // Apply filters
      if (filters) {
        if (filters.userId) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.entityType) {
          logs = logs.filter(log => log.entityType === filters.entityType);
        }
        if (filters.entityId) {
          logs = logs.filter(log => log.entityId === filters.entityId);
        }
        if (filters.action) {
          logs = logs.filter(log => log.action.includes(filters.action));
        }
        if (filters.startDate) {
          logs = logs.filter(log => log.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
          logs = logs.filter(log => log.timestamp <= filters.endDate);
        }
      }

      // Sort by timestamp descending
      logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      // Apply limit
      if (filters?.limit) {
        logs = logs.slice(0, filters.limit);
      }

      return logs;
    } catch (error) {
      console.error('❌ Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Get entity history
   */
  async getEntityHistory(entityType: string, entityId: number): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({
      entityType,
      entityId
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: number, days: number = 7): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getAuditLogs({
      userId,
      startDate: startDate.toISOString(),
      limit: 100
    });
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(period: string): Promise<{
    summary: Record<string, any>;
    topUsers: Array<{ userId: number; username: string; actionCount: number }>;
    topEntities: Array<{ entityType: string; actionCount: number }>;
    actionBreakdown: Record<string, number>;
    suspiciousActivity: AuditLogEntry[];
  }> {
    try {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

      const logs = await this.getAuditLogs({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Calculate summary
      const summary = {
        totalActions: logs.length,
        uniqueUsers: new Set(logs.map(l => l.userId)).size,
        creates: logs.filter(l => l.action.includes('CREATE')).length,
        updates: logs.filter(l => l.action.includes('UPDATE')).length,
        deletes: logs.filter(l => l.action.includes('DELETE')).length,
        exports: logs.filter(l => l.action.includes('EXPORT')).length,
        imports: logs.filter(l => l.action.includes('IMPORT')).length
      };

      // Top users by activity
      const userActivity: Record<number, { username: string; count: number }> = {};
      logs.forEach(log => {
        if (!userActivity[log.userId]) {
          userActivity[log.userId] = { username: log.username, count: 0 };
        }
        userActivity[log.userId].count++;
      });
      
      const topUsers = Object.entries(userActivity)
        .map(([userId, data]) => ({
          userId: parseInt(userId),
          username: data.username,
          actionCount: data.count
        }))
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 10);

      // Top entities
      const entityActivity: Record<string, number> = {};
      logs.forEach(log => {
        if (!entityActivity[log.entityType]) {
          entityActivity[log.entityType] = 0;
        }
        entityActivity[log.entityType]++;
      });

      const topEntities = Object.entries(entityActivity)
        .map(([entityType, count]) => ({ entityType, actionCount: count }))
        .sort((a, b) => b.actionCount - a.actionCount);

      // Action breakdown
      const actionBreakdown: Record<string, number> = {};
      logs.forEach(log => {
        if (!actionBreakdown[log.action]) {
          actionBreakdown[log.action] = 0;
        }
        actionBreakdown[log.action]++;
      });

      // Detect suspicious activity
      const suspiciousActivity = this.detectSuspiciousActivity(logs);

      return {
        summary,
        topUsers,
        topEntities,
        actionBreakdown,
        suspiciousActivity
      };
    } catch (error) {
      console.error('❌ Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(logs: AuditLogEntry[]): AuditLogEntry[] {
    const suspicious: AuditLogEntry[] = [];
    
    // Pattern 1: Mass deletions (>10 in 5 minutes)
    const deletions = logs.filter(l => l.action.includes('DELETE'));
    const deletionsByUser: Record<number, AuditLogEntry[]> = {};
    
    deletions.forEach(log => {
      if (!deletionsByUser[log.userId]) {
        deletionsByUser[log.userId] = [];
      }
      deletionsByUser[log.userId].push(log);
    });

    Object.values(deletionsByUser).forEach(userDeletions => {
      if (userDeletions.length > 10) {
        // Check if they happened within 5 minutes
        userDeletions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const firstTime = new Date(userDeletions[0].timestamp);
        const lastTime = new Date(userDeletions[userDeletions.length - 1].timestamp);
        const diffMinutes = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60);
        
        if (diffMinutes <= 5) {
          suspicious.push(...userDeletions);
        }
      }
    });

    // Pattern 2: After-hours activity (between 10 PM and 6 AM)
    const afterHours = logs.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 22 || hour < 6;
    });
    
    // Only flag if there's significant after-hours activity
    if (afterHours.length > 20) {
      suspicious.push(...afterHours);
    }

    // Pattern 3: Rapid exports (>5 exports in 1 minute)
    const exports = logs.filter(l => l.action.includes('EXPORT'));
    const exportsByUser: Record<number, AuditLogEntry[]> = {};
    
    exports.forEach(log => {
      if (!exportsByUser[log.userId]) {
        exportsByUser[log.userId] = [];
      }
      exportsByUser[log.userId].push(log);
    });

    Object.values(exportsByUser).forEach(userExports => {
      if (userExports.length > 5) {
        userExports.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const firstTime = new Date(userExports[0].timestamp);
        const lastTime = new Date(userExports[userExports.length - 1].timestamp);
        const diffMinutes = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60);
        
        if (diffMinutes <= 1) {
          suspicious.push(...userExports);
        }
      }
    });

    // Remove duplicates
    const uniqueSuspicious = Array.from(
      new Map(suspicious.map(item => [item.id, item])).values()
    );

    return uniqueSuspicious;
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(format: 'csv' | 'json', filters?: any): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filters);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      // CSV format
      const headers = [
        'ID',
        'Timestamp',
        'User ID',
        'Username',
        'Action',
        'Entity Type',
        'Entity ID',
        'IP Address',
        'User Agent'
      ];

      const rows = logs.map(log => [
        log.id,
        log.timestamp,
        log.userId,
        log.username,
        log.action,
        log.entityType,
        log.entityId || '',
        log.ipAddress || '',
        log.userAgent || ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csv;
    } catch (error) {
      console.error('❌ Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const logs = await this.getAllAuditLogs();
      
      // Remove logs older than retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);
      
      const filteredLogs = logs.filter(log => 
        new Date(log.timestamp) > cutoffDate
      );

      // Also limit total number of logs
      const limitedLogs = filteredLogs
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, this.MAX_LOG_ENTRIES);

      await this.saveAllAuditLogs(limitedLogs);

      if (logs.length !== limitedLogs.length) {
        console.log(`🧹 Cleaned up ${logs.length - limitedLogs.length} old audit logs`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up audit logs:', error);
    }
  }

  // ========== Storage Methods ==========

  private async getAllAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const data = localStorage.getItem('contave-audit-logs-v2');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error reading audit logs:', error);
      return [];
    }
  }

  private async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const logs = await this.getAllAuditLogs();
      logs.unshift(entry); // Add to beginning
      await this.saveAllAuditLogs(logs);
    } catch (error) {
      console.error('❌ Error saving audit log:', error);
    }
  }

  private async saveAllAuditLogs(logs: AuditLogEntry[]): Promise<void> {
    try {
      localStorage.setItem('contave-audit-logs-v2', JSON.stringify(logs));
    } catch (error) {
      console.error('❌ Error saving all audit logs:', error);
    }
  }

  // ========== Helper Methods ==========

  private getClientIp(): string {
    // In a real environment, this would get the actual client IP
    // For browser environment, we can't get real IP without server
    return '127.0.0.1';
  }

  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'Unknown';
  }

  /**
   * Get audit statistics
   */
  async getStatistics(): Promise<{
    totalLogs: number;
    logsToday: number;
    logsThisWeek: number;
    logsThisMonth: number;
    mostActiveUser: { userId: number; username: string; count: number } | null;
    mostModifiedEntity: { type: string; count: number } | null;
  }> {
    try {
      const logs = await this.getAllAuditLogs();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const statistics = {
        totalLogs: logs.length,
        logsToday: logs.filter(l => new Date(l.timestamp) >= today).length,
        logsThisWeek: logs.filter(l => new Date(l.timestamp) >= weekAgo).length,
        logsThisMonth: logs.filter(l => new Date(l.timestamp) >= monthAgo).length,
        mostActiveUser: null as { userId: number; username: string; count: number } | null,
        mostModifiedEntity: null as { type: string; count: number } | null
      };

      // Calculate most active user
      const userCounts: Record<number, { username: string; count: number }> = {};
      logs.forEach(log => {
        if (!userCounts[log.userId]) {
          userCounts[log.userId] = { username: log.username, count: 0 };
        }
        userCounts[log.userId].count++;
      });

      const topUser = Object.entries(userCounts)
        .map(([userId, data]) => ({
          userId: parseInt(userId),
          username: data.username,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)[0];

      if (topUser) {
        statistics.mostActiveUser = topUser;
      }

      // Calculate most modified entity
      const entityCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (!entityCounts[log.entityType]) {
          entityCounts[log.entityType] = 0;
        }
        entityCounts[log.entityType]++;
      });

      const topEntity = Object.entries(entityCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)[0];

      if (topEntity) {
        statistics.mostModifiedEntity = topEntity;
      }

      return statistics;
    } catch (error) {
      console.error('❌ Error getting audit statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();