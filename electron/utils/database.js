const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

class DatabaseManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.dbPath = path.join(this.userDataPath, 'contave.db');
    this.backupPath = path.join(this.userDataPath, 'backups');
  }

  getDatabasePath() {
    return this.dbPath;
  }

  ensureDirectories() {
    try {
      // Create database directory
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        log.info('Created database directory:', dbDir);
      }

      // Create backup directory
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
        log.info('Created backup directory:', this.backupPath);
      }

      return true;
    } catch (error) {
      log.error('Failed to create directories:', error);
      return false;
    }
  }

  initializeEmptyDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        log.info('Database already exists:', this.dbPath);
        return true;
      }

      // Create empty database file
      fs.writeFileSync(this.dbPath, '');
      log.info('Created empty database file:', this.dbPath);
      return true;
    } catch (error) {
      log.error('Failed to create empty database:', error);
      return false;
    }
  }

  getDatabaseInfo() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        return {
          exists: false,
          path: this.dbPath,
          size: 0
        };
      }

      const stats = fs.statSync(this.dbPath);
      return {
        exists: true,
        path: this.dbPath,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    } catch (error) {
      log.error('Failed to get database info:', error);
      return {
        exists: false,
        path: this.dbPath,
        size: 0,
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseManager();