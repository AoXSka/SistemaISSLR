import React from 'react';
import { formatCurrency, formatDate, formatRIF } from '../utils/formatters';
import { Voucher, Provider, CompanyInfo, Transaction } from '../types';

interface VoucherEmailTemplateProps {
  voucher: Voucher;
  provider: Provider;
  company: CompanyInfo;
  transaction: Transaction;
}

export const VoucherEmailTemplate: React.FC<VoucherEmailTemplateProps> = ({
  voucher,
  provider,
  company,
  transaction
}) => (
  <div style={{ 
    fontFamily: 'Arial, sans-serif', 
    lineHeight: 1.6, 
    color: '#333',
    margin: 0,
    padding: 0,
    backgroundColor: '#f4f4f4'
  }}>
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      backgroundColor: 'white',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '30px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '10px',
          margin: '0 auto 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          CV
        </div>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
          Comprobante de Retención {voucher.type}
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>N° {voucher.number}</p>
      </div>
      
      {/* Content */}
      <div style={{ padding: '30px' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '20px' }}>
          Estimado/a {provider.contactPerson || provider.name}
        </h2>
        
        <p>
          Por medio de la presente, le hacemos entrega del comprobante de retención 
          correspondiente a la operación fiscal del período <strong>{voucher.period}</strong>.
        </p>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          borderLeft: '4px solid #1e40af',
          padding: '20px',
          margin: '25px 0',
          borderRadius: '0 8px 8px 0'
        }}>
          <h3 style={{ color: '#1e40af', marginTop: 0 }}>Detalles del Comprobante:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Tipo:</td>
              <td style={{ padding: '5px 0' }}>Retención {voucher.type}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Número:</td>
              <td style={{ padding: '5px 0' }}>{voucher.number}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Fecha de Emisión:</td>
              <td style={{ padding: '5px 0' }}>{formatDate(voucher.issueDate)}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Período Fiscal:</td>
              <td style={{ padding: '5px 0' }}>{voucher.period}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Factura:</td>
              <td style={{ padding: '5px 0' }}>{transaction.documentNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Monto Total Retenido:</td>
              <td style={{ padding: '5px 0', color: '#dc2626', fontWeight: 'bold' }}>
                {formatCurrency(voucher.totalRetained)}
              </td>
            </tr>
          </table>
        </div>

        <p>
          Este comprobante se genera en cumplimiento con las normativas fiscales vigentes del 
          <strong> SENIAT</strong> y debe conservarse para sus registros contables.
        </p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <div style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#1e40af',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>
            📎 Ver Comprobante Adjunto
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          borderLeft: '4px solid #10b981',
          padding: '15px',
          margin: '25px 0'
        }}>
          <h4 style={{ color: '#047857', marginTop: 0 }}>Datos del Agente de Retención:</h4>
          <p style={{ margin: '5px 0' }}><strong>{company.name}</strong></p>
          <p style={{ margin: '5px 0' }}>RIF: {formatRIF(company.rif)}</p>
          <p style={{ margin: '5px 0' }}>{company.address}</p>
          <p style={{ margin: '5px 0' }}>Teléfono: {company.phone}</p>
          <p style={{ margin: '5px 0' }}>Email: {company.email}</p>
        </div>

        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '15px',
          margin: '20px 0'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            <strong>Importante:</strong> Este comprobante es un documento oficial requerido 
            para el cumplimiento de sus obligaciones tributarias. Consérvelo en sus archivos.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid #e9ecef',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          Este es un mensaje automático del sistema <strong>ContaVe Pro</strong>.
        </p>
        <p style={{ margin: 0 }}>
          Para consultas: soporte@contavepro.com • WhatsApp: +58-212-555-0199
        </p>
      </div>
    </div>
  </div>
);

interface FiscalReminderTemplateProps {
  eventTitle: string;
  eventDate: string;
  eventDescription: string;
  company: CompanyInfo;
  daysUntilDue: number;
}

export const FiscalReminderTemplate: React.FC<FiscalReminderTemplateProps> = ({
  eventTitle,
  eventDate,
  eventDescription,
  company,
  daysUntilDue
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
      color: 'white',
      padding: '25px',
      textAlign: 'center',
      borderRadius: '10px 10px 0 0'
    }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
      <h1 style={{ margin: 0, fontSize: '24px' }}>Recordatorio Fiscal Urgente</h1>
      <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
        {daysUntilDue <= 1 ? '¡Vence HOY!' : `Faltan ${daysUntilDue} días`}
      </p>
    </div>
    
    <div style={{ padding: '25px', backgroundColor: 'white' }}>
      <div style={{
        backgroundColor: '#fef3c7',
        borderLeft: '4px solid #f59e0b',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '0 8px 8px 0'
      }}>
        <h2 style={{ color: '#92400e', marginTop: 0 }}>{eventTitle}</h2>
        <p style={{ margin: '10px 0', color: '#78350f' }}>
          <strong>Fecha Límite:</strong> {formatDate(eventDate)}
        </p>
        <p style={{ margin: '10px 0 0 0', color: '#78350f' }}>
          <strong>Descripción:</strong> {eventDescription}
        </p>
      </div>

      <div style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#b91c1c', marginTop: 0, fontSize: '16px' }}>
          🚨 Acción Requerida Inmediata
        </h3>
        <p style={{ margin: '10px 0 0 0', color: '#7f1d1d', fontSize: '14px' }}>
          Asegúrese de cumplir con esta obligación fiscal antes de la fecha límite 
          para evitar sanciones y multas del SENIAT.
        </p>
      </div>

      <p>
        Para procesar esta obligación, acceda al sistema ContaVe Pro en el módulo 
        correspondiente o contacte a su contador de confianza.
      </p>

      <div style={{ textAlign: 'center', margin: '25px 0' }}>
        <div style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#1e40af',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold'
        }}>
          🏢 Acceder a ContaVe Pro
        </div>
      </div>
    </div>
    
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '15px',
      textAlign: 'center',
      color: '#666',
      fontSize: '12px',
      borderRadius: '0 0 10px 10px'
    }}>
      <p style={{ margin: '0 0 5px 0' }}>{company.name}</p>
      <p style={{ margin: 0 }}>Sistema ContaVe Pro - Gestión Fiscal Automatizada</p>
    </div>
  </div>
);

interface ReportEmailTemplateProps {
  reportName: string;
  reportPeriod: string;
  company: CompanyInfo;
  summary: {
    transactions: number;
    totalAmount: number;
    retentions: number;
  };
}

export const ReportEmailTemplate: React.FC<ReportEmailTemplateProps> = ({
  reportName,
  reportPeriod,
  company,
  summary
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{
      background: 'linear-gradient(135deg, #059669, #10b981)',
      color: 'white',
      padding: '25px',
      textAlign: 'center'
    }}>
      <h1 style={{ margin: '0 0 10px 0' }}>📊 Reporte Generado</h1>
      <p style={{ margin: 0, opacity: 0.9 }}>{reportName}</p>
    </div>
    
    <div style={{ padding: '25px', backgroundColor: 'white' }}>
      <h2>Reporte Contable Disponible</h2>
      
      <p>Su reporte <strong>{reportName}</strong> del período <strong>{reportPeriod}</strong> ha sido generado exitosamente.</p>
      
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0'
      }}>
        <h3 style={{ color: '#0369a1', marginTop: 0 }}>Resumen del Reporte:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '5px 0', borderBottom: '1px solid #e0f2fe' }}>
            <strong>Transacciones Procesadas:</strong> {summary.transactions}
          </li>
          <li style={{ padding: '5px 0', borderBottom: '1px solid #e0f2fe' }}>
            <strong>Monto Total:</strong> {formatCurrency(summary.totalAmount)}
          </li>
          <li style={{ padding: '5px 0' }}>
            <strong>Total Retenciones:</strong> {formatCurrency(summary.retentions)}
          </li>
        </ul>
      </div>

      <p>El archivo PDF adjunto contiene el reporte detallado con todas las transacciones y análisis correspondientes.</p>
    </div>
    
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '15px',
      textAlign: 'center',
      fontSize: '12px',
      color: '#666'
    }}>
      <p style={{ margin: '0 0 5px 0' }}>{company.name}</p>
      <p style={{ margin: 0 }}>ContaVe Pro - Reportes Automatizados</p>
    </div>
  </div>
);

// Generate HTML string from React component for email sending
export const generateEmailHTML = (component: React.ReactElement): string => {
  // This would typically use ReactDOMServer.renderToStaticMarkup
  // For now, returning the component as is for the email service to handle
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ContaVe Pro Email</title></head><body>${component}</body></html>`;
};