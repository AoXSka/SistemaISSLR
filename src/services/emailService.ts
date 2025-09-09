import { createTransport, Transporter } from 'nodemailer';
import { Provider, Voucher, CompanyInfo } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  configure(config: EmailConfig): void {
    this.config = config;
    this.transporter = createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword
      }
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  async sendVoucherEmail(
    voucher: Voucher,
    provider: Provider,
    company: CompanyInfo,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not configured');
    }

    const subject = `Comprobante de Retención ${voucher.type} N° ${voucher.number}`;
    
    const htmlContent = this.generateVoucherEmailHTML(voucher, provider, company);

    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: provider.email,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `${voucher.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private generateVoucherEmailHTML(
    voucher: Voucher,
    provider: Provider,
    company: CompanyInfo
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprobante de Retención</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white; 
            padding: 30px; 
            text-align: center;
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #1e40af;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #1e40af;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Comprobante de Retención ${voucher.type}</h1>
            <p>N° ${voucher.number}</p>
          </div>
          
          <div class="content">
            <h2>Estimado/a ${provider.contactPerson || provider.name}</h2>
            
            <p>Por medio de la presente, le hacemos entrega del comprobante de retención correspondiente a:</p>
            
            <div class="info-box">
              <strong>Detalles del Comprobante:</strong><br>
              <strong>Tipo:</strong> Retención ${voucher.type}<br>
              <strong>Número:</strong> ${voucher.number}<br>
              <strong>Fecha de Emisión:</strong> ${formatDate(voucher.issueDate)}<br>
              <strong>Período Fiscal:</strong> ${voucher.period}<br>
              <strong>Monto Total Retenido:</strong> ${formatCurrency(voucher.totalRetained)}
            </div>

            <p>Este comprobante se genera en cumplimiento con las normativas fiscales vigentes del SENIAT.</p>

            <p>El archivo PDF adjunto contiene el comprobante oficial que debe conservar para sus registros contables.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="btn">Ver Comprobante</a>
              <a href="#" class="btn">Descargar PDF</a>
            </div>

            <p><strong>Datos del Agente de Retención:</strong></p>
            <div class="info-box">
              <strong>${company.name}</strong><br>
              RIF: ${company.rif}<br>
              ${company.address}<br>
              Teléfono: ${company.phone}<br>
              Email: ${company.email}
            </div>
          </div>
          
          <div class="footer">
            <p><small>
              Este es un mensaje automático del sistema ContaVe Pro.<br>
              Para cualquier consulta, responda a este email o contacte a nuestro soporte.
            </small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendReportEmail(
    recipientEmail: string,
    reportName: string,
    reportPDF: Buffer,
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not configured');
    }

    // Get real company data for email
    let company: CompanyInfo;
    try {
      const companyData = await companyDataProvider.getCompanyData();
      if (!companyData?.rif || !companyData?.name) {
        throw new Error('Complete la configuración de empresa antes de enviar reportes');
      }
      
      company = {
        rif: companyData.rif,
        name: companyData.name,
        address: companyData.address || '',
        phone: companyData.phone || '',
        email: companyData.email || ''
      };
    } catch (error) {
      console.error('❌ Error loading company data for report email:', error);
      throw error;
    }
    const subject = `Reporte Contable: ${reportName}`;
    
    const htmlContent = `
      <h2>Reporte Contable Generado</h2>
      <p>Adjunto encontrará el reporte <strong>${reportName}</strong> generado automáticamente por ContaVe Pro.</p>
      <p><strong>Empresa:</strong> ${company.name}</p>
      <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString('es-VE')}</p>
      <hr>
      <p><small>Sistema ContaVe Pro - Gestión Contable Enterprise</small></p>
    `;

    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `${reportName.replace(/\s+/g, '_')}.pdf`,
          content: reportPDF,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send report email:', error);
      return false;
    }
  }

  async sendFiscalReminder(
    recipientEmail: string,
    eventTitle: string,
    eventDate: string,
    eventDescription: string,
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not configured');
    }

    // Load company data for reminder headers
    let company: CompanyInfo;
    try {
      const companyData = await companyDataProvider.getCompanyData();
      if (!companyData?.name) {
        throw new Error('Configure el nombre de empresa antes de enviar recordatorios');
      }
      
      company = {
        rif: companyData.rif || '',
        name: companyData.name,
        address: companyData.address || '',
        phone: companyData.phone || '',
        email: companyData.email || ''
      };
    } catch (error) {
      console.error('❌ Error loading company data for fiscal reminder:', error);
      throw error;
    }
    const subject = `Recordatorio Fiscal: ${eventTitle}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; text-align: center;">
          <h1>⚠️ Recordatorio Fiscal</h1>
        </div>
        
        <div style="padding: 20px; background: white;">
          <h2>${eventTitle}</h2>
          <p><strong>Fecha:</strong> ${formatDate(eventDate)}</p>
          <p><strong>Descripción:</strong> ${eventDescription}</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p><strong>Acción Requerida:</strong> Asegúrese de cumplir con esta obligación fiscal antes de la fecha límite para evitar sanciones.</p>
          </div>

          <p>Para más información, acceda al sistema ContaVe Pro en el módulo de Calendario Fiscal.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666;">
          <small>${company.name} - Sistema ContaVe Pro</small>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send fiscal reminder:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();