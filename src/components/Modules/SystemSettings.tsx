import React, { useState } from 'react';
import { 
  Settings,
  Database,
  Shield,
  Bell,
  Globe,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Key,
  Lock,
  Unlock,
  HardDrive,
  Cloud,
  Mail,
  Smartphone,
  Monitor,
  Palette,
  Save,
  X,
  Eye,
  EyeOff,
  Copy,
  Zap,
  Clock,
  Users,
  FileText,
  BarChart3,
  Calendar,
  Building2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { LicenseInfo, BackupInfo } from '../../types';

const mockLicenseInfo: LicenseInfo = {
  type: 'enterprise',
  status: 'active',
  expiryDate: '2025-12-31',
  features: ['all', 'api', 'multiuser', 'support'],
  maxRecords: -1,
  currentRecords: 1247
};

const mockBackups: BackupInfo[] = [
  {
    id: 1,
    date: '2024-12-13T10:30:00',
    size: 25.7,
    status: 'completed',
    path: '/backups/backup-2024-12-13.db'
  },
  {
    id: 2,
    date: '2024-12-12T10:30:00',
    size: 24.3,
    status: 'completed',
    path: '/backups/backup-2024-12-12.db'
  },
  {
    id: 3,
    date: '2024-12-11T10:30:00',
    size: 23.8,
    status: 'completed',
    path: '/backups/backup-2024-12-11.db'
  }
];

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'security' | 'integrations' | 'license'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [showLicenseKey, setShowLicenseKey] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    // General
    language: 'es-VE',
    timezone: 'America/Caracas',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'es-VE',
    theme: 'light',
    autoSave: true,
    sessionTimeout: 30,
    
    // Database
    dbLocation: 'C:\\ContaVe\\Data\\contave.db',
    dbSize: '45.2 MB',
    autoBackup: true,
    backupRetention: 30,
    compression: true,
    
    // Security
    passwordPolicy: 'strong',
    loginAttempts: 3,
    sessionSecurity: true,
    auditLog: true,
    encryption: true,
    
    // Notifications
    emailNotifications: true,
    systemAlerts: true,
    fiscalReminders: true,
    backupAlerts: true,
    
    // Performance
    cacheEnabled: true,
    lazyLoading: true,
    compressionLevel: 'medium',
    indexOptimization: true,

    // Integrations
    seniatAPI: false,
    bankingAPI: false,
    whatsappAPI: false,
    googleDriveSync: false
  });

  const [performanceMetrics] = useState({
    averageResponseTime: 145,
    databaseQueries: 1247,
    memoryUsage: 67.3,
    diskUsage: 234.7,
    uptime: '15 días, 8 horas',
    totalTransactions: 1247,
    systemHealth: 98.7
  });

  const handleSaveSettings = () => {
    setIsEditing(false);
    alert('✅ Configuración del sistema guardada exitosamente');
  };

  const handleDatabaseOptimization = () => {
    alert('🔧 Iniciando optimización de la base de datos...');
  };

  const handleClearCache = () => {
    alert('🧹 Cache del sistema limpiado exitosamente');
  };

  const handleActivateLicense = () => {
    if (!licenseKey) {
      alert('❌ Ingrese una clave de licencia válida');
      return;
    }
    
    alert('✅ Licencia activada exitosamente');
    setShowLicenseModal(false);
    setLicenseKey('');
  };

  const handleCreateBackup = () => {
    alert('💾 Creando backup manual de la base de datos...');
  };

  const handleRestoreBackup = (backup: BackupInfo) => {
    if (confirm(`¿Está seguro de restaurar el backup del ${new Date(backup.date).toLocaleDateString('es-VE')}? Esta acción no se puede deshacer.`)) {
      alert('🔄 Restaurando backup...');
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'enterprise': return 'from-purple-500 to-purple-600';
      case 'professional': return 'from-blue-500 to-blue-600';
      case 'basic': return 'from-green-500 to-green-600';
      case 'trial': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configuración del Sistema
            </h1>
            <p className="text-gray-600">
              Configuración avanzada, seguridad y administración del sistema
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Download className="h-4 w-4 mr-2" />
              Exportar Config
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancelar' : 'Configurar'}
            </button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Estado del Sistema</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${performanceMetrics.systemHealth >= 95 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <span className={`font-semibold ${getHealthColor(performanceMetrics.systemHealth)}`}>
              {performanceMetrics.systemHealth}% Saludable
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Tiempo Respuesta</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{performanceMetrics.averageResponseTime}ms</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Database className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Consultas DB</span>
            </div>
            <p className="text-lg font-bold text-green-900">{performanceMetrics.databaseQueries.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Monitor className="h-5 w-5 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Memoria RAM</span>
            </div>
            <p className="text-lg font-bold text-orange-900">{performanceMetrics.memoryUsage}%</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Espacio Disco</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{performanceMetrics.diskUsage}MB</p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-teal-600" />
              <span className="text-xs text-teal-600 font-medium">Tiempo Actividad</span>
            </div>
            <p className="text-sm font-bold text-teal-900">{performanceMetrics.uptime}</p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe className="h-4 w-4 inline mr-2" />
            General
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'database'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Database className="h-4 w-4 inline mr-2" />
            Base de Datos
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Seguridad
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'integrations'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Integraciones
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'license'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Key className="h-4 w-4 inline mr-2" />
            Licencias
          </button>
        </div>

        <div className="p-8">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Idioma del Sistema</label>
                  <select
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    <option value="es-VE">Español (Venezuela)</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                  <select
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    <option value="America/Caracas">Venezuela (UTC-4)</option>
                    <option value="America/Bogota">Colombia (UTC-5)</option>
                    <option value="America/New_York">Nueva York (UTC-5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Fecha</label>
                  <select
                    value={systemSettings.dateFormat}
                    onChange={(e) => setSystemSettings({...systemSettings, dateFormat: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tema de la Aplicación</label>
                  <select
                    value={systemSettings.theme}
                    onChange={(e) => setSystemSettings({...systemSettings, theme: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo de Sesión (minutos)</label>
                  <input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`}
                    min="5"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Configuraciones</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoSave}
                        onChange={(e) => setSystemSettings({...systemSettings, autoSave: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Autoguardado automático</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notifications Settings */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Notificaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={systemSettings.emailNotifications}
                      onChange={(e) => setSystemSettings({...systemSettings, emailNotifications: e.target.checked})}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Notificaciones por Email</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={systemSettings.systemAlerts}
                      onChange={(e) => setSystemSettings({...systemSettings, systemAlerts: e.target.checked})}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Bell className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Alertas del Sistema</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={systemSettings.fiscalReminders}
                      onChange={(e) => setSystemSettings({...systemSettings, fiscalReminders: e.target.checked})}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Recordatorios Fiscales</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={systemSettings.backupAlerts}
                      onChange={(e) => setSystemSettings({...systemSettings, backupAlerts: e.target.checked})}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Alertas de Backup</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Database Tab */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Información de la Base de Datos</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Ubicación:</span>
                      <span className="text-sm font-medium text-blue-900 truncate ml-2" title={systemSettings.dbLocation}>
                        {systemSettings.dbLocation.split('\\').pop()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Tamaño:</span>
                      <span className="text-sm font-medium text-blue-900">{systemSettings.dbSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Transacciones:</span>
                      <span className="text-sm font-medium text-blue-900">{performanceMetrics.totalTransactions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Estado:</span>
                      <span className="text-sm font-medium text-green-600 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Conectado
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Backups Recientes</h3>
                  <div className="space-y-2">
                    {mockBackups.slice(0, 3).map(backup => (
                      <div key={backup.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            {new Date(backup.date).toLocaleDateString('es-VE')}
                          </p>
                          <p className="text-xs text-green-700">{backup.size}MB</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleRestoreBackup(backup)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Restaurar"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Descargar">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCreateBackup}
                    className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    Crear Backup Manual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleDatabaseOptimization}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Optimizar DB
                </button>

                <button
                  onClick={handleClearCache}
                  className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Cache
                </button>

                <button
                  onClick={() => setShowBackupModal(true)}
                  className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Configurar Cloud
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Política de Contraseñas</h3>
                  <div className="space-y-3">
                    <select
                      value={systemSettings.passwordPolicy}
                      onChange={(e) => setSystemSettings({...systemSettings, passwordPolicy: e.target.value})}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 ${!isEditing ? 'bg-red-50' : 'bg-white'}`}
                    >
                      <option value="basic">Básica (6+ caracteres)</option>
                      <option value="medium">Media (8+ caracteres, números)</option>
                      <option value="strong">Fuerte (12+ caracteres, símbolos)</option>
                    </select>
                    
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-1">Intentos de Login</label>
                      <input
                        type="number"
                        value={systemSettings.loginAttempts}
                        onChange={(e) => setSystemSettings({...systemSettings, loginAttempts: parseInt(e.target.value)})}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 ${!isEditing ? 'bg-red-50' : 'bg-white'}`}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Configuraciones de Seguridad</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">Encriptación AES-256</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.encryption}
                        onChange={(e) => setSystemSettings({...systemSettings, encryption: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">Seguridad de Sesión</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.sessionSecurity}
                        onChange={(e) => setSystemSettings({...systemSettings, sessionSecurity: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">Registro de Auditoría</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemSettings.auditLog}
                        onChange={(e) => setSystemSettings({...systemSettings, auditLog: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">Advertencias de Seguridad</h4>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      <li>• Mantenga siempre actualizada la contraseña del administrador</li>
                      <li>• Los backups automáticos son esenciales para la continuidad del negocio</li>
                      <li>• La encriptación protege datos sensibles en caso de acceso no autorizado</li>
                      <li>• El registro de auditoría es requerido para cumplimiento fiscal</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-900">API SENIAT</h4>
                        <p className="text-sm text-red-700">Validación de RIF automática</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={systemSettings.seniatAPI}
                        onChange={(e) => setSystemSettings({...systemSettings, seniatAPI: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className={`text-xs font-medium ${systemSettings.seniatAPI ? 'text-green-600' : 'text-red-600'}`}>
                        {systemSettings.seniatAPI ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                  {systemSettings.seniatAPI && (
                    <div className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-xs text-red-800">
                        Estado: Operativo • Última consulta: {new Date().toLocaleString('es-VE')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">API Bancaria</h4>
                        <p className="text-sm text-blue-700">Descarga automática de estados</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={systemSettings.bankingAPI}
                        onChange={(e) => setSystemSettings({...systemSettings, bankingAPI: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-xs font-medium ${systemSettings.bankingAPI ? 'text-green-600' : 'text-gray-600'}`}>
                        {systemSettings.bankingAPI ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">WhatsApp Business</h4>
                        <p className="text-sm text-green-700">Envío de comprobantes</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={systemSettings.whatsappAPI}
                        onChange={(e) => setSystemSettings({...systemSettings, whatsappAPI: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className={`text-xs font-medium ${systemSettings.whatsappAPI ? 'text-green-600' : 'text-gray-600'}`}>
                        {systemSettings.whatsappAPI ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Cloud className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-900">Google Drive</h4>
                        <p className="text-sm text-purple-700">Backup en la nube</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={systemSettings.googleDriveSync}
                        onChange={(e) => setSystemSettings({...systemSettings, googleDriveSync: e.target.checked})}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className={`text-xs font-medium ${systemSettings.googleDriveSync ? 'text-green-600' : 'text-gray-600'}`}>
                        {systemSettings.googleDriveSync ? 'Sincronizado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* License Tab */}
          {activeTab === 'license' && (
            <div className="space-y-6">
              {/* Current License */}
              <div className={`bg-gradient-to-br ${getLicenseTypeColor(mockLicenseInfo.type)} rounded-xl p-6 text-white shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold capitalize">{mockLicenseInfo.type}</h3>
                    <p className="text-white text-opacity-90">Licencia Actual</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getLicenseStatusColor(mockLicenseInfo.status)}`}>
                      {mockLicenseInfo.status === 'active' ? 'Activa' : mockLicenseInfo.status === 'expired' ? 'Vencida' : 'Suspendida'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-white text-opacity-90 text-sm">Vencimiento</p>
                    <p className="text-xl font-bold">{new Date(mockLicenseInfo.expiryDate).toLocaleDateString('es-VE')}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-white text-opacity-90 text-sm">Registros</p>
                    <p className="text-xl font-bold">
                      {mockLicenseInfo.maxRecords === -1 ? 'Ilimitados' : `${mockLicenseInfo.currentRecords}/${mockLicenseInfo.maxRecords}`}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-white text-opacity-90 text-sm">Usuarios</p>
                    <p className="text-xl font-bold">Ilimitados</p>
                  </div>
                </div>
              </div>

              {/* License Features */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Características Incluidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Todas las funciones</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">API completa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Múltiples usuarios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Soporte prioritario</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Registros ilimitados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Integraciones externas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Actualizaciones gratis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Personalización</span>
                  </div>
                </div>
              </div>

              {/* License Actions */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowLicenseModal(true)}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Key className="h-5 w-5 mr-2" />
                  Activar Nueva Licencia
                </button>
              </div>
            </div>
          )}

          {/* Save Button for editable tabs */}
          {isEditing && activeTab !== 'license' && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </button>
            </div>
          )}
        </div>
      </div>

      {/* License Activation Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Activar Licencia</h2>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clave de Licencia</label>
                <div className="relative">
                  <input
                    type={showLicenseKey ? "text" : "password"}
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                  />
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <button
                      onClick={() => setShowLicenseKey(!showLicenseKey)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showLicenseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.readText().then(text => setLicenseKey(text))}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Pegar desde clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">¿Necesita una licencia?</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Contacte a nuestro equipo de ventas para obtener una licencia Enterprise.
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>Email: ventas@contavepro.com</p>
                  <p>WhatsApp: +58-212-555-0199</p>
                  <p>Web: www.contavepro.com</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleActivateLicense}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Activar Licencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}