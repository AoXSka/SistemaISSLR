const log = require('electron-log');

class SecurityManager {
  static validateWebPreferences(webPreferences) {
    const required = {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    };

    const violations = [];
    
    Object.entries(required).forEach(([key, expectedValue]) => {
      if (webPreferences[key] !== expectedValue) {
        violations.push(`${key} should be ${expectedValue}, got ${webPreferences[key]}`);
      }
    });

    if (violations.length > 0) {
      log.error('Security violations detected:', violations);
      throw new Error(`Security policy violations: ${violations.join(', ')}`);
    }

    log.info('Security validation passed');
    return true;
  }

  static validatePreloadPath(preloadPath) {
    const fs = require('fs');
    
    if (!preloadPath) {
      throw new Error('Preload script path is required');
    }

    if (!fs.existsSync(preloadPath)) {
      throw new Error(`Preload script not found: ${preloadPath}`);
    }

    log.info('Preload script validated:', preloadPath);
    return true;
  }

  static logSecurityConfig(webPreferences) {
    log.info('Security configuration:', {
      nodeIntegration: webPreferences.nodeIntegration,
      contextIsolation: webPreferences.contextIsolation,
      sandbox: webPreferences.sandbox,
      webSecurity: webPreferences.webSecurity,
      preload: !!webPreferences.preload
    });
  }
}

module.exports = SecurityManager;