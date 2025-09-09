const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;
const databaseInit = require('./database-init.cjs');

// Configure logging first
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
log.transports.console.level = isDev ? 'debug' : 'info';
log.transports.file.level = 'info';
log.info('=== ContaVe Pro Starting ===');

// Enable single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info('Another instance is already running, quitting...');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    log.info('Second instance attempted, focusing main window');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

let mainWindow = null;

class ContaVeProApp {
  constructor() {
    this.mainWindow = null;
    this.setupApp();
  }

  async setupApp() {
    // Ensure userData directory exists for database
    this.ensureUserDataDirectory();

    try {
      // Initialize database
      log.info('Initializing database...');
      await databaseInit.initializeDatabase();
      
      // Initialize other services
      log.info('App initialization completed');
    } catch (error) {
      log.error('App initialization failed:', error);
      
      dialog.showErrorBox(
        'Error de Inicialización - ContaVe Pro',
        `No se pudo inicializar la aplicación:\n\n${error.message}\n\nContacte soporte: soporte@contavepro.com`
      );
    }
    
    app.whenReady().then(() => {
      this.createMainWindow();
      log.info('App ready, main window created');
    });

    app.on('window-all-closed', () => {
      log.info('All windows closed');
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', () => {
      log.info('App is quitting...');
    });
  }

  ensureUserDataDirectory() {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'database');
      const logsPath = path.join(userDataPath, 'logs');
      
      // Create directories if they don't exist
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
        log.info('Created database directory:', dbPath);
      }
      
      if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath, { recursive: true });
        log.info('Created logs directory:', logsPath);
      }
      
      log.info('User data directories ensured:', userDataPath);
    } catch (error) {
      log.error('Failed to create user data directories:', error);
    }
  }

  createMainWindow() {
    log.info('Creating main window...');

    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      show: false,
      title: 'ContaVe Pro - Sistema de Gestión Contable Enterprise',
      icon: this.getAppIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false, // CRITICAL: Keep false for localStorage access
        webSecurity: true,
        preload: path.join(__dirname, 'preload.cjs'),
        additionalArguments: [`--user-data-dir=${app.getPath('userData')}`]
      }
    });

    // Store global reference
    mainWindow = this.mainWindow;

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      log.info('Loading dev server: http://localhost:5173');
    } else {
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(indexPath)) {
        this.mainWindow.loadFile(indexPath);  // <- Usa loadFile, no loadURL
        log.info('Loading file:', indexPath);
      } else {
        log.error('index.html not found at:', indexPath);
        // Mostrar error...
      }
    }
    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      log.info('Main window ready to show');
      this.mainWindow.show();
      this.mainWindow.center();
      
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Error handlers
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log.error('Failed to load page:', { errorCode, errorDescription, validatedURL });
      
      dialog.showErrorBox(
        'Error de Carga - ContaVe Pro',
        `No se pudo cargar la aplicación:\n\nCódigo: ${errorCode}\nDescripción: ${errorDescription}\n\nContacte soporte: soporte@contavepro.com`
      );
    });

    this.mainWindow.webContents.on('crashed', (event) => {
      log.error('Renderer process crashed');
      
      dialog.showErrorBox(
        'Error Crítico - ContaVe Pro',
        'El proceso de renderizado se ha cerrado inesperadamente.\n\nReinicie la aplicación o contacte soporte técnico.'
      );
    });

    // Setup menu and IPC
    this.createMenu();
    this.setupIPCHandlers();

    // Handle window events
    this.mainWindow.on('closed', () => {
      log.info('Main window closed');
      this.mainWindow = null;
      mainWindow = null;
    });
  }

  getStartUrl() {
    if (isDev) {
      return 'http://localhost:5173';
    }
    
    // Production: load from multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, '../renderer/index.html'),
      path.join(process.resourcesPath, 'app/renderer/index.html'),
      path.join(__dirname, '../../app.asar.unpacked/dist/index.html')
    ];
    
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        log.info('✅ Found index.html at:', indexPath);
        return `file://${indexPath}`;
      }
    }
    
    log.error('❌ Could not find index.html in any expected location');
    log.info('Available paths in __dirname:', fs.readdirSync(__dirname));
    log.info('Available paths in parent:', fs.readdirSync(path.join(__dirname, '..')));
    
    // Return a minimal HTML as last resort
    return `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ContaVe Pro - Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #1e40af, #3b82f6);
              color: white;
              margin: 0;
            }
            .error { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="error">
          <h1>ContaVe Pro</h1>
          <p>Error: No se pudo cargar la aplicación</p>
          <p>Contacte soporte: soporte@contavepro.com</p>
            <small>Paths checked: ${possiblePaths.join(', ')}</small>
          </div>
        </body>
      </html>
    `)}`;
  }

  getAppIcon() {
    // Try multiple icon locations
    const iconPaths = [
      path.join(__dirname, '..', 'public', 'vite.svg'), // Development
      path.join(__dirname, 'assets', 'icon.png'), // Packaged
      path.join(process.resourcesPath, 'assets', 'icon.png') // Alternative packaged path
    ];

    for (const iconPath of iconPaths) {
      try {
        if (fs.existsSync(iconPath)) {
          log.info('Using icon:', iconPath);
          return iconPath;
        }
      } catch (error) {
        log.warn('Icon not accessible:', iconPath);
      }
    }
    
    log.warn('No icon found, using default');
    return undefined;
  }

  createMenu() {
    const template = [
      {
        label: 'ContaVe Pro',
        submenu: [
          { role: 'about', label: 'Acerca de ContaVe Pro' },
          { type: 'separator' },
          { role: 'quit', label: 'Salir' }
        ]
      },
      {
        label: 'Archivo',
        submenu: [
          { 
            label: 'Nueva Transacción',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.sendToRenderer('new-transaction')
          },
          { type: 'separator' },
          {
            label: 'Backup Base de Datos',
            click: () => this.handleBackupDatabase()
          }
        ]
      },
      {
        label: 'Ver',
        submenu: [
          { role: 'reload', label: 'Recargar' },
          { role: 'toggleDevTools', label: 'Herramientas de Desarrollo' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Zoom Normal' },
          { role: 'zoomIn', label: 'Acercar' },
          { role: 'zoomOut', label: 'Alejar' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Pantalla Completa' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPCHandlers() {
    // File operations
    ipcMain.handle('show-save-dialog', async (event, options) => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow, options);
        log.info('Save dialog result:', result);
        return result;
      } catch (error) {
        log.error('Save dialog error:', error);
        throw error;
      }
    });

    ipcMain.handle('show-open-dialog', async (event, options) => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, options);
        log.info('Open dialog result:', result);
        return result;
      } catch (error) {
        log.error('Open dialog error:', error);
        throw error;
      }
    });

    // Database operations
    ipcMain.handle('backup-database', async () => {
      return await this.handleBackupDatabase();
    });

    // PDF operations
    ipcMain.handle('save-pdf', async (event, pdfBuffer, fileName) => {
      try {
        const { filePath } = await dialog.showSaveDialog(this.mainWindow, {
          title: 'Guardar PDF - ContaVe Pro',
          defaultPath: fileName,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        });

        if (filePath) {
          fs.writeFileSync(filePath, pdfBuffer);
          log.info('PDF saved successfully:', filePath);
          return { success: true, filePath };
        }

        return { success: false };
      } catch (error) {
        log.error('PDF save error:', error);
        return { success: false, error: error.message };
      }
    });

    // System info
    ipcMain.handle('get-system-info', () => {
      const info = {
        platform: process.platform,
        version: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        userDataPath: app.getPath('userData')
      };
      log.info('System info requested:', info);
      return info;
    });

    // App lifecycle
    ipcMain.handle('get-version', () => app.getVersion());
    ipcMain.handle('quit-app', () => app.quit());
  }

  sendToRenderer(channel, data = null) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
      log.info('Sent to renderer:', channel);
    }
  }

  async handleBackupDatabase() {
    try {
      const userDataPath = app.getPath('userData');
      const sourceDb = path.join(userDataPath, 'database', 'contave.db');
      
      if (!fs.existsSync(sourceDb)) {
        log.warn('Source database not found:', sourceDb);
        dialog.showMessageBox(this.mainWindow, {
          type: 'warning',
          title: 'Base de Datos No Encontrada',
          message: 'No se encontró la base de datos para respaldar.',
          detail: 'La base de datos se creará automáticamente cuando registre la primera transacción.'
        });
        return { success: false, message: 'Database not found' };
      }

      const { filePath } = await dialog.showSaveDialog(this.mainWindow, {
        title: 'Crear Backup de Base de Datos - ContaVe Pro',
        defaultPath: `contave-backup-${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'Database Files', extensions: ['db'] }]
      });

      if (filePath) {
        fs.copyFileSync(sourceDb, filePath);
        
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Backup Exitoso - ContaVe Pro',
          message: 'La base de datos ha sido respaldada exitosamente.',
          detail: `Ubicación: ${filePath}`
        });

        log.info('Backup created successfully:', filePath);
        return { success: true, filePath };
      }

      return { success: false };
    } catch (error) {
      log.error('Backup failed:', error);
      dialog.showErrorBox('Error de Backup - ContaVe Pro', 'No se pudo crear el backup de la base de datos.');
      return { success: false, error: error.message };
    }
  }
}

// Initialize the app
const app_instance = new ContaVeProApp();

// Global error handlers
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

log.info('ContaVe Pro main process initialized successfully');