// src/utils/toast.ts

/**
 * Simple toast notification system
 * You can replace this with a library like react-toastify for better functionality
 */

class Toast {
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    // For now, using console and alert as fallback
    // You should integrate with a proper toast library
    
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const consoleMethod = {
      success: console.log,
      error: console.error,
      warning: console.warn,
      info: console.info
    };

    // Log to console with styled output
    consoleMethod[type](`${prefix[type]} ${message}`);

    // If you want to show a temporary notification in the DOM
    if (typeof document !== 'undefined') {
      this.showDOMNotification(message, type);
    }
  }

  private showDOMNotification(message: string, type: string) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${this.getBackgroundColor(type)};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 350px;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    
    if (!document.querySelector('style[data-toast-styles]')) {
      style.setAttribute('data-toast-styles', 'true');
      document.head.appendChild(style);
    }

    // Add to DOM
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  private getBackgroundColor(type: string): string {
    switch (type) {
      case 'success':
        return '#10B981'; // green
      case 'error':
        return '#EF4444'; // red
      case 'warning':
        return '#F59E0B'; // yellow
      case 'info':
        return '#3B82F6'; // blue
      default:
        return '#6B7280'; // gray
    }
  }

  success(message: string) {
    this.showNotification(message, 'success');
  }

  error(message: string) {
    this.showNotification(message, 'error');
  }

  warning(message: string) {
    this.showNotification(message, 'warning');
  }

  info(message: string) {
    this.showNotification(message, 'info');
  }
}

// Export singleton instance
export const toast = new Toast();

// Also export the class if needed
export default Toast;