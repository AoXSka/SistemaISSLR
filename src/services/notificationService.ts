import { auditService } from './auditService';

export interface SystemNotification {
  id: string;
  type: 'fiscal' | 'system' | 'backup' | 'license' | 'update';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: SystemNotification[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.loadNotifications();
    this.scheduleAutomaticChecks();
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('contave-notifications');
      this.notifications = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('contave-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  addNotification(notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: SystemNotification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    this.saveNotifications();
    
    // Log audit trail
    auditService.logAction(
      'system',
      'CREATE_NOTIFICATION',
      'notification',
      undefined,
      null,
      newNotification
    );

    return id;
  }

  getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveNotifications();
    }
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Automatic system checks
  private scheduleAutomaticChecks(): void {
    // Check every 5 minutes
    setInterval(() => {
      this.checkFiscalDeadlines();
      this.checkBackupStatus();
      this.checkSystemHealth();
    }, 5 * 60 * 1000);

    // Initial check after 10 seconds
    setTimeout(() => {
      this.checkFiscalDeadlines();
    }, 10000);
  }

  private checkFiscalDeadlines(): void {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Check for upcoming IVA declaration (15th of month)
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const ivaDeadline = new Date(currentYear, currentMonth - 1, 15);

    const daysUntilIVA = Math.ceil((ivaDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilIVA <= 3 && daysUntilIVA > 0) {
      this.addNotification({
        type: 'fiscal',
        priority: 'high',
        title: 'Declaración IVA Próxima a Vencer',
        message: `La declaración de IVA vence en ${daysUntilIVA} días (${ivaDeadline.toLocaleDateString('es-VE')})`,
        actionLabel: 'Ver Calendario Fiscal',
        actionUrl: '/calendar'
      });
    }

    // Check for ISLR deadlines (15th and end of month)
    const islrDeadline1 = new Date(currentYear, currentMonth - 1, 15);
    const islrDeadline2 = new Date(currentYear, currentMonth, 0); // Last day of current month

    [islrDeadline1, islrDeadline2].forEach((deadline, index) => {
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 2 && daysUntil > 0) {
        this.addNotification({
          type: 'fiscal',
          priority: 'high',
          title: `Pago ISLR ${index === 0 ? '1ra' : '2da'} Quincena`,
          message: `Vence en ${daysUntil} días (${deadline.toLocaleDateString('es-VE')})`,
          actionLabel: 'Ver Retenciones ISLR',
          actionUrl: '/islr'
        });
      }
    });
  }


  private checkBackupStatus(): void {
    const lastBackup = localStorage.getItem('contave-last-backup');
    if (!lastBackup) {
      this.addNotification({
        type: 'backup',
        priority: 'medium',
        title: 'Backup Recomendado',
        message: 'No se ha realizado backup reciente de la base de datos',
        actionLabel: 'Crear Backup',
        actionUrl: '/settings'
      });
      return;
    }

    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = Math.ceil((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceBackup > 7) {
      this.addNotification({
        type: 'backup',
        priority: 'medium',
        title: 'Backup Pendiente',
        message: `Último backup hace ${daysSinceBackup} días`,
        actionLabel: 'Crear Backup',
        actionUrl: '/settings'
      });
    }
  }

  private checkSystemHealth(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > 85) {
      this.addNotification({
        type: 'system',
        priority: 'high',
        title: 'Uso de Memoria Alto',
        message: `Uso de memoria: ${memoryUsage.toFixed(1)}% - Se recomienda reiniciar`,
        actionLabel: 'Optimizar Sistema'
      });
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }
}

export const notificationService = NotificationService.getInstance();