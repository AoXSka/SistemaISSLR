import { db } from './databaseService';

export interface AuditLogEntry {
  id?: number;
  userId?: number;
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

export class AuditService {
  private static instance: AuditService;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async logAction(
    username: string,
    action: string,
    entityType: string,
    entityId?: number,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      username,
      action,
      entityType,
      entityId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      // In a real implementation, this would insert into audit_log table
      console.log('Audit Log:', auditEntry);
      
      // Store in local storage for demo purposes
      const existingLogs = JSON.parse(localStorage.getItem('contave-audit-logs') || '[]');
      existingLogs.push(auditEntry);
      
      // Keep only last 1000 entries
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('contave-audit-logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }

  getAuditLogs(filters?: {
    username?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditLogEntry[] {
    try {
      const logs = JSON.parse(localStorage.getItem('contave-audit-logs') || '[]');
      
      let filteredLogs = logs;

      if (filters?.username) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.username.toLowerCase().includes(filters.username!.toLowerCase())
        );
      }

      if (filters?.action) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.action === filters.action
        );
      }

      if (filters?.entityType) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.entityType === filters.entityType
        );
      }

      if (filters?.startDate) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.timestamp >= filters.startDate!
        );
      }

      if (filters?.endDate) {
        filteredLogs = filteredLogs.filter((log: AuditLogEntry) => 
          log.timestamp <= filters.endDate!
        );
      }

      // Sort by timestamp descending
      filteredLogs.sort((a: AuditLogEntry, b: AuditLogEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply limit
      if (filters?.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }

      return filteredLogs;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  getAuditSummary(): {
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActivity: AuditLogEntry[];
    topUsers: Array<{ username: string; actionCount: number }>;
  } {
    const logs = this.getAuditLogs();
    
    const actionsByType: Record<string, number> = {};
    const userActions: Record<string, number> = {};

    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      userActions[log.username] = (userActions[log.username] || 0) + 1;
    });

    const topUsers = Object.entries(userActions)
      .map(([username, actionCount]) => ({ username, actionCount }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10);

    return {
      totalActions: logs.length,
      actionsByType,
      recentActivity: logs.slice(0, 20),
      topUsers
    };
  }

  private getClientIP(): string {
    // In Electron, this might get local IP
    // For web, this would typically be handled server-side
    return '127.0.0.1';
  }

  exportAuditLog(format: 'csv' | 'json' = 'csv'): string {
    const logs = this.getAuditLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV format
    const headers = [
      'Timestamp', 'Username', 'Action', 'Entity Type', 'Entity ID',
      'Old Values', 'New Values', 'IP Address', 'User Agent'
    ];
    
    const rows = logs.map(log => [
      log.timestamp,
      log.username,
      log.action,
      log.entityType,
      log.entityId?.toString() || '',
      log.oldValues || '',
      log.newValues || '',
      log.ipAddress || '',
      log.userAgent || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  clearOldLogs(daysToKeep: number = 365): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const logs = this.getAuditLogs();
    const recentLogs = logs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );
    
    localStorage.setItem('contave-audit-logs', JSON.stringify(recentLogs));
  }

  async log(data: {
    action: string;
    entityType: string;
    entityId: number | string;
    oldValues?: any;
    newValues?: any;
    userId?: number | string;
  }): Promise<void> {
    // Obtener el username del usuario actual o usar 'system'
    let username = 'system';
    
    try {
      // Intentar obtener el usuario actual del authService si existe
      const authService = (await import('./authService')).authService;
      const currentUser = authService.getCurrentUser();
      if (currentUser?.username) {
        username = currentUser.username;
      }
    } catch (error) {
      // Si authService no existe, usar 'system'
      console.log('Using system user for audit log');
    }

    // Llamar al método logAction existente
    await this.logAction(
      username,
      data.action,
      data.entityType,
      typeof data.entityId === 'number' ? data.entityId : parseInt(data.entityId as string),
      data.oldValues,
      data.newValues
    );
  }
}

export const auditService = AuditService.getInstance();