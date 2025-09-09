// ContaVe Pro - External License Generator Module
// Separate application to generate licenses with private key signing

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface LicenseRequest {
  clientName: string;
  companyName: string;
  companyRif: string;
  email: string;
  phone?: string;
  licenseType: 'trial' | 'basic' | 'professional' | 'enterprise';
  duration: number; // months
  maxRecords: number;
  maxUsers: number;
  features: string[];
  issuedBy: string;
  notes?: string;
}

export interface GeneratedLicense {
  id: string;
  client: {
    name: string;
    company: string;
    rif: string;
    email: string;
    phone?: string;
  };
  license: {
    type: 'trial' | 'basic' | 'professional' | 'enterprise';
    status: 'active';
    issuedDate: string;
    expiryDate: string;
    duration: number;
  };
  limits: {
    maxRecords: number;
    maxUsers: number;
    maxCompanies: number;
  };
  features: string[];
  security: {
    signature: string;
    checksum: string;
    version: string;
  };
  metadata: {
    issuedBy: string;
    generatedAt: string;
    licenseKey: string;
    activationCode: string;
  };
}

export class LicenseGenerator {
  private readonly PRIVATE_KEY_PATH = './keys/contave-private.pem';
  private readonly LICENSE_VERSION = '2.0.0';
  private readonly SALT = 'ContaVe-Pro-Enterprise-2024-Venezuelan-Fiscal-System';

  constructor() {
    this.ensureKeyPairExists();
  }

  private ensureKeyPairExists(): void {
    const keyDir = path.dirname(this.PRIVATE_KEY_PATH);
    
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }

    if (!fs.existsSync(this.PRIVATE_KEY_PATH)) {
      this.generateKeyPair();
    }
  }

  private generateKeyPair(): void {
    console.log('🔐 Generating RSA key pair for license signing...');
    
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Save private key (keep secure!)
    fs.writeFileSync(this.PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    
    // Save public key (this goes into the main app)
    const publicKeyPath = './keys/contave-public.pem';
    fs.writeFileSync(publicKeyPath, publicKey);

    console.log('✅ Key pair generated successfully');
    console.log(`🔑 Private key saved to: ${this.PRIVATE_KEY_PATH}`);
    console.log(`🔓 Public key saved to: ${publicKeyPath}`);
  }

  async generateLicense(request: LicenseRequest): Promise<GeneratedLicense> {
    try {
      // Validate request
      this.validateLicenseRequest(request);

      // Calculate dates
      const issuedDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + request.duration);

      // Generate unique identifiers
      const licenseId = this.generateLicenseId();
      const activationCode = this.generateActivationCode();

      // Create license object
      const license: GeneratedLicense = {
        id: licenseId,
        client: {
          name: request.clientName,
          company: request.companyName,
          rif: request.companyRif,
          email: request.email,
          phone: request.phone
        },
        license: {
          type: request.licenseType,
          status: 'active',
          issuedDate: issuedDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          duration: request.duration
        },
        limits: {
          maxRecords: request.maxRecords,
          maxUsers: request.maxUsers,
          maxCompanies: this.getMaxCompaniesByType(request.licenseType)
        },
        features: request.features,
        security: {
          signature: '',
          checksum: '',
          version: this.LICENSE_VERSION
        },
        metadata: {
          issuedBy: request.issuedBy,
          generatedAt: new Date().toISOString(),
          licenseKey: '',
          activationCode
        }
      };

      // Generate signature
      const signature = this.signLicense(license);
      license.security.signature = signature;

      // Generate checksum
      const checksum = this.generateChecksum(license);
      license.security.checksum = checksum;

      // Generate formatted license key
      const licenseKey = this.generateLicenseKey(license);
      license.metadata.licenseKey = licenseKey;

      return license;
    } catch (error) {
      throw new Error(`License generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateLicenseRequest(request: LicenseRequest): void {
    const errors: string[] = [];

    if (!request.clientName || request.clientName.length < 3) {
      errors.push('Client name must be at least 3 characters');
    }

    if (!request.companyName || request.companyName.length < 3) {
      errors.push('Company name must be at least 3 characters');
    }

    if (!request.companyRif || !this.validateRIF(request.companyRif)) {
      errors.push('Valid Venezuelan RIF is required');
    }

    if (!request.email || !this.validateEmail(request.email)) {
      errors.push('Valid email address is required');
    }

    if (!['trial', 'basic', 'professional', 'enterprise'].includes(request.licenseType)) {
      errors.push('Invalid license type');
    }

    if (request.duration < 1 || request.duration > 120) {
      errors.push('License duration must be between 1 and 120 months');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  private signLicense(license: Omit<GeneratedLicense, 'security'>): string {
    const privateKey = fs.readFileSync(this.PRIVATE_KEY_PATH, 'utf8');
    
    // Create payload for signing
    const payload = JSON.stringify({
      id: license.id,
      rif: license.client.rif,
      type: license.license.licenseType,
      issued: license.license.issuedDate,
      expiry: license.license.expiryDate,
      limits: license.limits,
      features: license.features.sort()
    });

    // Sign with private key
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(payload + this.SALT);
    const signature = signer.sign(privateKey, 'base64');

    return signature;
  }

  private generateChecksum(license: Omit<GeneratedLicense, 'security'> & { security: { signature: string } }): string {
    const data = JSON.stringify({
      ...license,
      security: { signature: license.security.signature }
    });
    
    return crypto.createHash('sha256').update(data + this.SALT).digest('hex');
  }

  private generateLicenseKey(license: GeneratedLicense): string {
    // Create a compound key: TYPE-YEAR-MONTH-SEQUENCE-CHECK
    const year = new Date(license.license.issuedDate).getFullYear();
    const month = (new Date(license.license.issuedDate).getMonth() + 1).toString().padStart(2, '0');
    
    const typeCode = {
      'trial': 'TRI',
      'basic': 'BAS', 
      'professional': 'PRO',
      'enterprise': 'ENT'
    }[license.license.type];

    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const checksum = this.calculateLicenseChecksum(license.client.rif, license.id);

    return `${typeCode}${year}${month}${sequence}${checksum}`;
  }

  private generateLicenseId(): string {
    return 'CV-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
  }

  private generateActivationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private calculateLicenseChecksum(rif: string, licenseId: string): string {
    const hash = crypto.createHash('md5').update(rif + licenseId + this.SALT).digest('hex');
    return hash.substr(0, 4).toUpperCase();
  }

  private getMaxCompaniesByType(type: string): number {
    const limits = {
      trial: 1,
      basic: 1,
      professional: 3,
      enterprise: -1 // unlimited
    };
    return limits[type as keyof typeof limits] || 1;
  }

  private validateRIF(rif: string): boolean {
    const rifPattern = /^[VEJGPGRC]-\d{8}-\d$/;
    return rifPattern.test(rif);
  }

  private validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  // Save license to file
  async saveLicenseToFile(license: GeneratedLicense, outputDir: string = './licenses'): Promise<string> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${license.metadata.licenseKey}.json`;
    const filePath = path.join(outputDir, fileName);

    const licenseData = {
      ...license,
      _warning: 'This file contains a digitally signed license. Do not modify.',
      _instructions: 'Import this file into ContaVe Pro via License Management.',
      _support: 'For assistance, contact soporte@contavepro.com'
    };

    fs.writeFileSync(filePath, JSON.stringify(licenseData, null, 2));
    
    console.log(`📄 License saved to: ${filePath}`);
    return filePath;
  }

  // Generate multiple licenses (batch)
  async generateBatchLicenses(requests: LicenseRequest[]): Promise<GeneratedLicense[]> {
    const licenses: GeneratedLicense[] = [];
    
    for (const request of requests) {
      try {
        const license = await this.generateLicense(request);
        licenses.push(license);
        console.log(`✅ Generated license for ${request.companyName}`);
      } catch (error) {
        console.error(`❌ Failed to generate license for ${request.companyName}:`, error);
      }
    }

    return licenses;
  }
}

// CLI Interface for license generation
export class LicenseCLI {
  private generator: LicenseGenerator;

  constructor() {
    this.generator = new LicenseGenerator();
  }

  async generateLicenseInteractive(): Promise<void> {
    console.log('🔑 ContaVe Pro License Generator v2.0.0');
    console.log('=====================================\n');

    // In a real CLI implementation, this would use readline or inquirer
    const sampleRequest: LicenseRequest = {
      clientName: 'Juan Pérez',
      companyName: 'CONSULTORÍA PÉREZ, C.A.',
      companyRif: 'J-12345678-9',
      email: 'juan.perez@consultoria.com',
      phone: '0212-555-0123',
      licenseType: 'professional',
      duration: 12,
      maxRecords: 10000,
      maxUsers: 5,
      features: ['all_basic', 'all_advanced', 'api', 'multiuser', 'advanced_reports'],
      issuedBy: 'ContaVe Solutions',
      notes: 'Professional license for tax consulting firm'
    };

    try {
      const license = await this.generator.generateLicense(sampleRequest);
      const filePath = await this.generator.saveLicenseToFile(license);
      
      console.log('\n✅ License generated successfully!');
      console.log(`📄 File: ${filePath}`);
      console.log(`🔑 License Key: ${license.metadata.licenseKey}`);
      console.log(`🎫 Activation Code: ${license.metadata.activationCode}`);
      console.log(`📅 Expires: ${new Date(license.license.expiryDate).toLocaleDateString('es-VE')}`);
      
    } catch (error) {
      console.error('❌ License generation failed:', error);
    }
  }
}

// Export for use in separate license generator app
export const licenseGenerator = new LicenseGenerator();
export default LicenseGenerator;