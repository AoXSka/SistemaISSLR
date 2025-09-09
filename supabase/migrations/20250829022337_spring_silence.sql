-- ContaVe Pro Database Schema
-- Venezuelan Accounting System with Tax Compliance

-- Company Information
CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY,
  rif VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(100),
  logo_path TEXT,
  fiscal_year INTEGER DEFAULT 2024,
  currency VARCHAR(3) DEFAULT 'VES',
  tax_regime VARCHAR(20) DEFAULT 'ordinary',
  accounting_method VARCHAR(20) DEFAULT 'accrual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Providers/Suppliers
CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY,
  rif VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  contact_person VARCHAR(100),
  website VARCHAR(100),
  tax_type VARCHAR(20) DEFAULT 'ordinary',
  retention_islr_percentage DECIMAL(5,2) DEFAULT 6.00,
  retention_iva_percentage DECIMAL(5,2) DEFAULT 75.00,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id INTEGER PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'
  parent_id INTEGER,
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id)
);

-- Transactions (Main ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'ISLR', 'IVA', 'INCOME', 'EXPENSE'
  document_number VARCHAR(50),
  control_number VARCHAR(50),
  provider_id INTEGER,
  provider_rif VARCHAR(20),
  provider_name VARCHAR(200),
  concept VARCHAR(500),
  concept_code VARCHAR(10), -- For ISLR concepts
  operation_type VARCHAR(5), -- 'C' = Compra, 'V' = Venta (for IVA)
  document_type VARCHAR(5), -- '01' = Factura, '02' = Nota Débito, etc.
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  exempt_amount DECIMAL(15,2) DEFAULT 0,
  taxable_base DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 16.00, -- IVA rate
  tax_amount DECIMAL(15,2) DEFAULT 0,
  retention_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  retention_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'DECLARED'
  period VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  notes TEXT,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Vouchers (Comprobantes)
CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- 'ISLR', 'IVA'
  number VARCHAR(50) UNIQUE NOT NULL,
  transaction_id INTEGER NOT NULL,
  provider_id INTEGER,
  provider_rif VARCHAR(20) NOT NULL,
  issue_date DATE NOT NULL,
  period VARCHAR(7) NOT NULL,
  total_retained DECIMAL(15,2) NOT NULL,
  pdf_path TEXT,
  email_sent BOOLEAN DEFAULT 0,
  email_sent_at TIMESTAMP,
  print_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'GENERATED', -- 'GENERATED', 'SENT', 'RECEIVED'
  notes TEXT,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- ISLR Concepts (Official SENIAT codes)
CREATE TABLE IF NOT EXISTS islr_concepts (
  id INTEGER PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  retention_rate DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fiscal Events (Calendar)
CREATE TABLE IF NOT EXISTS fiscal_events (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'declaration', 'payment', 'deadline', 'holiday'
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
  is_completed BOOLEAN DEFAULT 0,
  completed_at TIMESTAMP,
  reminder_days INTEGER DEFAULT 7,
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_pattern VARCHAR(20), -- 'monthly', 'quarterly', 'yearly'
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user', 'readonly'
  permissions TEXT, -- JSON string with permissions
  is_active BOOLEAN DEFAULT 1,
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  username VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- 'transaction', 'provider', 'voucher', etc.
  entity_id INTEGER,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System Backups
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY,
  file_name VARCHAR(200) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER, -- Size in bytes
  backup_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'auto'
  status VARCHAR(20) DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
  compression_used BOOLEAN DEFAULT 0,
  checksum VARCHAR(64),
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  category VARCHAR(50), -- 'general', 'security', 'email', 'backup', etc.
  is_sensitive BOOLEAN DEFAULT 0, -- For passwords, API keys, etc.
  updated_by VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License Information
CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY,
  license_key VARCHAR(200) UNIQUE NOT NULL,
  license_type VARCHAR(20) NOT NULL, -- 'trial', 'basic', 'professional', 'enterprise'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'suspended'
  issued_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  max_records INTEGER DEFAULT 1000,
  features TEXT, -- JSON array of features
  company_rif VARCHAR(20),
  activated_at TIMESTAMP,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'voucher_islr', 'voucher_iva', 'reminder', 'notification'
  subject VARCHAR(200),
  html_content TEXT,
  plain_content TEXT,
  variables TEXT, -- JSON array of available variables
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'balance', 'income_statement', 'retention_summary', etc.
  description TEXT,
  query_sql TEXT, -- SQL query for the report
  parameters TEXT, -- JSON with report parameters
  format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
  is_scheduled BOOLEAN DEFAULT 0,
  schedule_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'quarterly'
  last_generated TIMESTAMP,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'seniat', 'banking', 'whatsapp', 'google_drive'
  status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'inactive', 'error'
  config TEXT, -- JSON configuration
  last_sync TIMESTAMP,
  sync_status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default ISLR concepts
INSERT OR IGNORE INTO islr_concepts (code, name, description, retention_rate) VALUES
('001', 'Honorarios Profesionales', 'Servicios profesionales independientes', 6.00),
('002', 'Servicios Técnicos', 'Servicios técnicos especializados', 3.00),
('003', 'Servicios de Construcción', 'Servicios relacionados con construcción', 2.00),
('004', 'Servicios de Publicidad', 'Servicios de publicidad y marketing', 3.00),
('005', 'Servicios de Limpieza', 'Servicios de aseo y limpieza', 2.00),
('006', 'Servicios de Transporte', 'Servicios de transporte de carga y pasajeros', 2.00),
('007', 'Arrendamientos', 'Alquiler de bienes muebles e inmuebles', 6.00),
('008', 'Servicios de Informática', 'Desarrollo y mantenimiento de software', 3.00);

-- Insert default chart of accounts
INSERT OR IGNORE INTO chart_of_accounts (code, name, type, level) VALUES
('1', 'ACTIVOS', 'ASSET', 1),
('11', 'ACTIVOS CORRIENTES', 'ASSET', 2),
('111', 'Efectivo y Equivalentes', 'ASSET', 3),
('112', 'Cuentas por Cobrar', 'ASSET', 3),
('12', 'ACTIVOS NO CORRIENTES', 'ASSET', 2),
('2', 'PASIVOS', 'LIABILITY', 1),
('21', 'PASIVOS CORRIENTES', 'LIABILITY', 2),
('211', 'Cuentas por Pagar', 'LIABILITY', 3),
('212', 'Retenciones por Pagar', 'LIABILITY', 3),
('3', 'PATRIMONIO', 'EQUITY', 1),
('4', 'INGRESOS', 'INCOME', 1),
('5', 'GASTOS', 'EXPENSE', 1),
('51', 'GASTOS OPERATIVOS', 'EXPENSE', 2),
('52', 'GASTOS ADMINISTRATIVOS', 'EXPENSE', 2);

-- Insert system configuration defaults
INSERT OR IGNORE INTO system_config (config_key, config_value, data_type, description, category) VALUES
('system.language', 'es-VE', 'string', 'System language', 'general'),
('system.timezone', 'America/Caracas', 'string', 'System timezone', 'general'),
('system.theme', 'light', 'string', 'UI theme', 'general'),
('backup.enabled', 'true', 'boolean', 'Enable automatic backups', 'backup'),
('backup.frequency', 'daily', 'string', 'Backup frequency', 'backup'),
('backup.retention_days', '30', 'number', 'Days to keep backups', 'backup'),
('security.encryption', 'true', 'boolean', 'Enable AES-256 encryption', 'security'),
('security.audit_trail', 'true', 'boolean', 'Enable audit logging', 'security'),
('security.session_timeout', '30', 'number', 'Session timeout in minutes', 'security'),
('email.notifications', 'true', 'boolean', 'Enable email notifications', 'email'),
('fiscal.auto_calculate', 'true', 'boolean', 'Auto calculate retentions', 'fiscal');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(period);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_rif ON transactions(provider_rif);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_period ON vouchers(period);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
CREATE INDEX IF NOT EXISTS idx_vouchers_provider_rif ON vouchers(provider_rif);
CREATE INDEX IF NOT EXISTS idx_providers_rif ON providers(rif);
CREATE INDEX IF NOT EXISTS idx_fiscal_events_date ON fiscal_events(event_date);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);