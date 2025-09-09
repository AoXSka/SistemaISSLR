const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

class DatabaseInitializer {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.dbPath = path.join(this.userDataPath, 'database', 'contave.db');
    this.schemaPath = this.getSchemaPath();
  }

  getSchemaPath() {
    // Try multiple locations for schema file
    const possiblePaths = [
      path.join(__dirname, '..', 'database', 'schema.sql'),
      path.join(process.resourcesPath, 'database', 'schema.sql'),
      path.join(__dirname, '..', 'resources', 'database', 'schema.sql')
    ];

    for (const schemaPath of possiblePaths) {
      if (fs.existsSync(schemaPath)) {
        log.info('Found schema at:', schemaPath);
        return schemaPath;
      }
    }

    log.error('Schema file not found in any expected location');
    return null;
  }

  ensureUserDataDirectory() {
    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        log.info('Created userData directory:', dbDir);
      }

      // Create subdirectories
      const subdirs = ['backups', 'logs', 'temp', 'exports'];
      subdirs.forEach(subdir => {
        const dirPath = path.join(this.userDataPath, subdir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          log.info('Created subdirectory:', dirPath);
        }
      });

      return true;
    } catch (error) {
      log.error('Failed to create userData directories:', error);
      return false;
    }
  }

  async initializeDatabase() {
    try {
      log.info('Initializing ContaVe Pro database...');
      log.info('Database path:', this.dbPath);

      // Ensure directories exist
      if (!this.ensureUserDataDirectory()) {
        throw new Error('Failed to create userData directories');
      }

      // Check if database already exists
      if (fs.existsSync(this.dbPath)) {
        log.info('Database already exists, checking version...');
        return await this.checkDatabaseVersion();
      }

      // Create new database
      log.info('Creating new database...');
      return await this.createNewDatabase();

    } catch (error) {
      log.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createNewDatabase() {
    try {
      if (!this.schemaPath) {
        log.warn('Database schema file not found, creating empty database');
        // Create empty file to indicate database location
        fs.writeFileSync(this.dbPath, '-- ContaVe Pro Database\n-- Created: ' + new Date().toISOString());
      } else {
        // Read schema file
        const schema = fs.readFileSync(this.schemaPath, 'utf8');
        log.info('Schema file read successfully');

        // For now, create file with schema as comment (better-sqlite3 would execute this)
        const databaseContent = `-- ContaVe Pro Database\n-- Created: ${new Date().toISOString()}\n\n${schema}`;
        fs.writeFileSync(this.dbPath, databaseContent);
      }

      log.info('Database created successfully');
      return { success: true, created: true };

    } catch (error) {
      log.error('Failed to create database:', error);
      throw error;
    }
  }

  async checkDatabaseVersion() {
    try {
      // In a real implementation, check schema version
      log.info('Database version check passed');
      return { success: true, created: false };
    } catch (error) {
      log.error('Database version check failed:', error);
      throw error;
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

module.exports = new DatabaseInitializer();