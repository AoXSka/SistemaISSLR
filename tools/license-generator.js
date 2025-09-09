#!/usr/bin/env node

// ContaVe Pro - External License Generator Tool
// Standalone CLI application for generating signed licenses

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const LICENSE_VERSION = '2.0.0';
const SALT = 'ContaVe-Pro-Enterprise-2024-Venezuelan-Fiscal-System';
const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'contave-private.pem');
const PUBLIC_KEY_PATH = path.join(__dirname, 'keys', 'contave-public.pem');

class LicenseGenerator {
  constructor() {
    this.ensureKeyPairExists();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  ensureKeyPairExists() {
    const keyDir = path.dirname(PRIVATE_KEY_PATH);
    
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }

    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
      this.generateKeyPair();
    }
  }

  generateKeyPair() {
    console.log('🔐 Generating RSA key pair for license signing...');
    
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);

    console.log('✅ Key pair generated successfully');
    console.log(`🔑 Private key: ${PRIVATE_KEY_PATH}`);
    console.log(`🔓 Public key: ${PUBLIC_KEY_PATH}`);
  }

  async generateLicense(request) {
    // Calculate dates
    const issuedDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + request.duration);

    // Generate unique identifiers
    const licenseId = this.generateLicenseId();
    const activationCode = this.generateActivationCode(request.licenseType);
    const licenseKey = this.generateLicenseKey(request.licenseType, request.companyRif, licenseId);

    // Create license object with EXACT structure expected by ContaVe Pro
    const license = {
      id: licenseId,
      client: {
        name: request.clientName,
        company: request.companyName,
        rif: request.companyRif,
        email: request.email,
        phone: request.phone
      },
      company: {
        name: request.companyName,
        email: request.email,
        rif: request.companyRif
      },
      license: {
        id: licenseId,
        type: request.licenseType,
        status: 'active',
        issuedDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        duration: request.duration,
        activationKey: activationCode  // CRITICAL: This field MUST be present
      },
      limits: {
        maxRecords: request.maxRecords,
        maxUsers: request.maxUsers,
        maxCompanies: this.getMaxCompaniesByType(request.licenseType)
      },
      features: this.getFeaturesByType(request.licenseType),
      usage: {
        users: 0,
        records: 0,
        companies: 0
      },
      security: {
        version: LICENSE_VERSION
      },
      metadata: {
        issuedBy: request.issuedBy || 'ContaVe Solutions',
        generatedAt: new Date().toISOString(),
        activationCode: activationCode,
        licenseKey: licenseKey
      }
    };

    // Generate signature and checksum AFTER creating the complete structure
    license.security.signature = this.signLicense(license);
    license.security.checksum = this.generateChecksum(license);

    // Verify the structure before returning
    if (!license.license.activationKey) {
      throw new Error('Critical error: activationKey not set in license');
    }

    return license;
  }

  signLicense(license) {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    
    const payload = JSON.stringify({
      id: license.id,
      rif: license.client.rif,
      type: license.license.type,
      issued: license.license.issuedDate,
      expiry: license.license.expiryDate,
      activationKey: license.license.activationKey,
      limits: license.limits,
      features: license.features.sort()
    });

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(payload + SALT);
    return signer.sign(privateKey, 'base64');
  }

  generateChecksum(license) {
    const data = JSON.stringify(license);
    return crypto.createHash('sha256').update(data + SALT).digest('hex');
  }

  generateLicenseKey(licenseType, rif, licenseId) {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const typeCode = {
      trial: 'TRI',
      basic: 'BAS',
      professional: 'PRO', 
      enterprise: 'ENT'
    }[licenseType];

    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const checksum = this.calculateLicenseChecksum(rif, licenseId);

    return `${typeCode}${year}${month}${sequence}${checksum}`;
  }

  generateLicenseId() {
    return 'CV-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  }

  generateActivationCode(licenseType) {
    const prefix = {
      trial: 'TRIAL',
      basic: 'BASIC',
      professional: 'PRO',
      enterprise: 'ENT'
    }[licenseType] || 'BASIC';

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${prefix}-${suffix}`;
  }

  calculateLicenseChecksum(rif, licenseId) {
    const hash = crypto.createHash('md5').update(rif + licenseId + SALT).digest('hex');
    return hash.substr(0, 4).toUpperCase();
  }

  getMaxCompaniesByType(type) {
    const limits = { trial: 1, basic: 1, professional: 3, enterprise: -1 };
    return limits[type] || 1;
  }

  getFeaturesByType(type) {
    const featureMap = {
      trial: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers',
        'basic_reports'
      ],
      basic: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers',
        'basic_reports',
        'email_vouchers'
      ],
      professional: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers',
        'basic_reports',
        'email_vouchers',
        'advanced_reports',
        'seniat_exports',
        'manage_providers',
        'backup_restore'
      ],
      enterprise: [
        'basic_accounting',
        'islr_retentions',
        'iva_retentions',
        'generate_vouchers',
        'basic_reports',
        'email_vouchers',
        'advanced_reports',
        'seniat_exports',
        'manage_providers',
        'backup_restore',
        'multi_company',
        'api_access',
        'priority_support'
      ]
    };
    return featureMap[type] || [];
  }

  async saveLicenseToFile(license, outputDir = './licenses') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${license.metadata.licenseKey}.json`;
    const filePath = path.join(outputDir, fileName);

    // IMPORTANT: Ensure the license structure is exactly what ContaVe Pro expects
    const licenseData = {
      ...license,
      _warning: 'This file contains a digitally signed license. Do not modify.',
      _instructions: 'Import this file into ContaVe Pro via License Management.',
      _support: 'For assistance, contact soporte@contavepro.com'
    };

    // Final verification before saving
    console.log('\n📋 License structure verification:');
    console.log(`  - license.activationKey: ${licenseData.license.activationKey ? '✅' : '❌'}`);
    console.log(`  - license.type: ${licenseData.license.type ? '✅' : '❌'}`);
    console.log(`  - license.status: ${licenseData.license.status ? '✅' : '❌'}`);
    console.log(`  - license.expiryDate: ${licenseData.license.expiryDate ? '✅' : '❌'}`);

    if (!licenseData.license || !licenseData.license.activationKey) {
      throw new Error('License structure is invalid: missing activationKey');
    }

    fs.writeFileSync(filePath, JSON.stringify(licenseData, null, 2));
    return filePath;
  }

  validateRIF(rif) {
    const rifPattern = /^[VEJGPRC]-\d{8}-\d$/;
    return rifPattern.test(rif);
  }

  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  async generateInteractive() {
    console.log('🔑 ContaVe Pro License Generator v2.0.0');
    console.log('=====================================\n');

    try {
      const clientName = await this.question('👤 Nombre del cliente: ');
      const companyName = await this.question('🏢 Nombre de la empresa: ');
      const companyRif = await this.question('📋 RIF de la empresa (J-12345678-9): ');
      const email = await this.question('📧 Email del cliente: ');
      const phone = await this.question('📱 Teléfono (opcional): ');

      console.log('\n📋 Tipos de licencia disponibles:');
      console.log('1. Trial (7 días, funciones limitadas)');
      console.log('2. Basic ($99/año, 1,000 registros)');
      console.log('3. Professional ($299/año, 10,000 registros, API)');
      console.log('4. Enterprise ($599/año, ilimitado, soporte 24/7)');
      
      const licenseChoice = await this.question('\n🎯 Seleccione tipo (1-4): ');
      const licenseTypes = ['trial', 'basic', 'professional', 'enterprise'];
      const licenseType = licenseTypes[parseInt(licenseChoice) - 1] || 'trial';

      const duration = await this.question('📅 Duración en meses (1-120): ');

      // Validation
      if (!this.validateRIF(companyRif)) {
        throw new Error('❌ RIF inválido. Use formato J-12345678-9');
      }

      if (!this.validateEmail(email)) {
        throw new Error('❌ Email inválido');
      }

      // License limits by type (matching ContaVe Pro service)
      const limits = {
        trial: { maxRecords: 100, maxUsers: 2 },
        basic: { maxRecords: 1000, maxUsers: 3 },
        professional: { maxRecords: 10000, maxUsers: 10 },
        enterprise: { maxRecords: -1, maxUsers: -1 }
      };

      const request = {
        clientName,
        companyName,
        companyRif,
        email,
        phone: phone || undefined,
        licenseType,
        duration: parseInt(duration) || 12,
        maxRecords: limits[licenseType].maxRecords,
        maxUsers: limits[licenseType].maxUsers,
        issuedBy: 'ContaVe Solutions'
      };

      console.log('\n🔄 Generating license...');
      const license = await this.generateLicense(request);
      
      console.log('\n💾 Saving license file...');
      const filePath = await this.saveLicenseToFile(license);

      console.log('\n✅ License generated successfully!');
      console.log('=====================================');
      console.log(`📄 File: ${filePath}`);
      console.log(`🔑 License Key: ${license.metadata.licenseKey}`);
      console.log(`🎫 Activation Key: ${license.license.activationKey}`);
      console.log(`👤 Client: ${clientName} (${companyName})`);
      console.log(`📅 Valid until: ${new Date(license.license.expiryDate).toLocaleDateString('es-VE')}`);
      console.log(`💼 Type: ${licenseType.toUpperCase()}`);
      console.log(`📊 Limits: ${license.limits.maxRecords === -1 ? 'Unlimited' : license.limits.maxRecords} records, ${license.limits.maxUsers === -1 ? 'Unlimited' : license.limits.maxUsers} users`);
      
      console.log('\n📝 License file structure:');
      console.log(`  - Contains license.activationKey: ${license.license.activationKey ? 'YES ✅' : 'NO ❌'}`);
      
    } catch (error) {
      console.error('\n❌ License generation failed:', error.message);
    } finally {
      this.rl.close();
    }
  }
}

// CLI execution
if (require.main === module) {
  const generator = new LicenseGenerator();
  generator.generateInteractive().then(() => {
    console.log('\n👋 License generation completed. Thank you for using ContaVe Pro!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = LicenseGenerator;