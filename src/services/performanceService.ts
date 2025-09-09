export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  databaseSize: number;
  transactionCount: number;
  errorRate: number;
  uptime: number;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private startTime: number;
  private metrics: PerformanceMetrics;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      responseTime: 0,
      memoryUsage: 0,
      databaseSize: 0,
      transactionCount: 0,
      errorRate: 0,
      uptime: 0
    };
    
    this.startMonitoring();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private startMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Initial update
    this.updateMetrics();
  }

  private updateMetrics(): void {
    this.metrics = {
      responseTime: this.calculateAverageResponseTime(),
      memoryUsage: this.getMemoryUsage(),
      databaseSize: this.getDatabaseSize(),
      transactionCount: this.getTransactionCount(),
      errorRate: this.getErrorRate(),
      uptime: Date.now() - this.startTime
    };
  }

  getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  private calculateAverageResponseTime(): number {
    // Simulate response time calculation
    const recentTimes = this.getRecentResponseTimes();
    if (recentTimes.length === 0) return 0;
    
    return recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
  }

  private getRecentResponseTimes(): number[] {
    // Get from localStorage or return mock data
    const times = localStorage.getItem('contave-response-times');
    return times ? JSON.parse(times) : [120, 150, 98, 200, 175];
  }

  recordResponseTime(duration: number): void {
    const times = this.getRecentResponseTimes();
    times.push(duration);
    
    // Keep only last 50 measurements
    if (times.length > 50) {
      times.splice(0, times.length - 50);
    }
    
    localStorage.setItem('contave-response-times', JSON.stringify(times));
  }

  private getMemoryUsage(): number {
    // Estimate memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    
    // Fallback estimation based on DOM complexity
    const elements = document.querySelectorAll('*').length;
    return Math.min((elements / 1000) * 20, 80); // Rough estimation
  }

  private getDatabaseSize(): number {
    // Simulate database size calculation
    const transactions = localStorage.getItem('contave-transactions');
    const providers = localStorage.getItem('contave-providers');
    const vouchers = localStorage.getItem('contave-vouchers');
    
    const totalSize = (transactions?.length || 0) + (providers?.length || 0) + (vouchers?.length || 0);
    return totalSize / 1024; // Convert to KB
  }

  private getTransactionCount(): number {
    try {
      const transactions = localStorage.getItem('contave-transactions');
      return transactions ? JSON.parse(transactions).length : 0;
    } catch {
      return 0;
    }
  }

  private getErrorRate(): number {
    const errors = localStorage.getItem('contave-error-count');
    const requests = localStorage.getItem('contave-request-count');
    
    const errorCount = errors ? parseInt(errors, 10) : 0;
    const requestCount = requests ? parseInt(requests, 10) : 1;
    
    return (errorCount / requestCount) * 100;
  }

  recordError(): void {
    const currentErrors = parseInt(localStorage.getItem('contave-error-count') || '0', 10);
    localStorage.setItem('contave-error-count', (currentErrors + 1).toString());
  }

  recordRequest(): void {
    const currentRequests = parseInt(localStorage.getItem('contave-request-count') || '0', 10);
    localStorage.setItem('contave-request-count', (currentRequests + 1).toString());
  }

  getSystemHealth(): number {
    const metrics = this.getMetrics();
    
    // Calculate health score based on multiple factors
    let healthScore = 100;
    
    // Memory usage impact
    if (metrics.memoryUsage > 80) healthScore -= 20;
    else if (metrics.memoryUsage > 60) healthScore -= 10;
    
    // Response time impact
    if (metrics.responseTime > 1000) healthScore -= 15;
    else if (metrics.responseTime > 500) healthScore -= 7;
    
    // Error rate impact
    if (metrics.errorRate > 5) healthScore -= 25;
    else if (metrics.errorRate > 2) healthScore -= 10;
    
    return Math.max(healthScore, 0);
  }

  optimizePerformance(): void {
    // Clear old data
    this.clearOldPerformanceData();
    
    // Optimize localStorage
    this.compactLocalStorage();
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  private clearOldPerformanceData(): void {
    const keysToClean = [
      'contave-response-times',
      'contave-audit-logs',
      'contave-temp-data'
    ];
    
    keysToClean.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 100) {
            // Keep only recent items
            const recent = parsed.slice(-50);
            localStorage.setItem(key, JSON.stringify(recent));
          }
        } catch (error) {
          console.error(`Error cleaning ${key}:`, error);
        }
      }
    });
  }

  private compactLocalStorage(): void {
    const totalUsed = Object.keys(localStorage)
      .map(key => localStorage.getItem(key)?.length || 0)
      .reduce((sum, length) => sum + length, 0);
    
    // If using more than 4MB, clear non-essential data
    if (totalUsed > 4 * 1024 * 1024) {
      const nonEssentialKeys = [
        'contave-cache',
        'contave-temp',
        'contave-logs'
      ];
      
      nonEssentialKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }
}

export const performanceService = PerformanceService.getInstance();