-- ContaVe Pro - Database Schema for Distribution
-- This file is copied to the application bundle and used to initialize the database

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

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

-- Version tracking
CREATE TABLE IF NOT EXISTS app_version (
  id INTEGER PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO app_version (id, version) VALUES (1, '2.0.0');