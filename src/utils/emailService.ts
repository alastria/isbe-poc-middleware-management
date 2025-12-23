import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EMAIL_CONFIG, DEPLOYMENT } from '../settings.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type NewManagementEmailData = {
  organizationId: string;
  contractFilename: string;
  contractUrl: string;
  contractPath?: string; // Ruta física del archivo para adjuntar
};

let transporter: Transporter | null = null;

/**
 * Inicializa el transportador de correo con la configuración SMTP
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.SMTP_HOST,
      port: EMAIL_CONFIG.SMTP_PORT,
      secure: EMAIL_CONFIG.SMTP_SECURE, // true para 465, false para otros puertos
      auth: {
        user: EMAIL_CONFIG.SMTP_USER,
        pass: EMAIL_CONFIG.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Genera el HTML del correo para nueva incorporación
 */
function generateNewManagementEmailHTML(data: NewManagementEmailData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva incorporación a ISBE</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #0066cc;
      font-size: 24px;
      margin: 0;
    }
    .info-section {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .info-label {
      font-weight: bold;
      color: #555;
      margin-bottom: 5px;
    }
    .info-value {
      color: #333;
      margin-bottom: 15px;
      word-break: break-word;
    }
    .attachment-note {
      background-color: #e7f3ff;
      border: 1px solid #0066cc;
      border-radius: 4px;
      padding: 10px;
      margin-top: 15px;
      font-size: 14px;
    }
    .attachment-icon {
      color: #0066cc;
      margin-right: 8px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nueva incorporación a ISBE</h1>
    </div>

    <p>Se ha registrado una nueva organización en el sistema ISBE.</p>

    <div class="info-section">
      <div class="info-label">ID de Organización:</div>
      <div class="info-value">${data.organizationId}</div>

      <div class="info-label">Contrato:</div>
      <div class="info-value">${data.contractFilename}</div>

      <div class="attachment-note">
        <span class="attachment-icon">📎</span>
        <strong>El contrato está adjunto a este correo</strong>
      </div>
    </div>

    <p>Por favor, revisa la información y procede con las acciones necesarias.</p>

    <div class="footer">
      <p>Este es un correo automático generado por el sistema ISBE.</p>
      <p>Por favor, no responda a este correo.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envía un correo electrónico notificando una nueva incorporación a ISBE
 */
export async function sendNewManagementEmail(data: NewManagementEmailData): Promise<void> {
  console.log('[EMAIL] Starting email sending process...');
  console.log('[EMAIL] Configuration:', {
    host: EMAIL_CONFIG.SMTP_HOST,
    port: EMAIL_CONFIG.SMTP_PORT,
    secure: EMAIL_CONFIG.SMTP_SECURE,
    user: EMAIL_CONFIG.SMTP_USER,
    hasPassword: !!EMAIL_CONFIG.SMTP_PASS,
    recipients: EMAIL_CONFIG.NOTIFICATION_RECIPIENTS,
  });

  // Si no hay destinatarios configurados, no enviar
  if (!EMAIL_CONFIG.NOTIFICATION_RECIPIENTS || EMAIL_CONFIG.NOTIFICATION_RECIPIENTS.length === 0) {
    console.warn('[EMAIL] No email recipients configured. Skipping email notification.');
    return;
  }

  // Si la configuración SMTP no está completa, no enviar
  if (!EMAIL_CONFIG.SMTP_HOST || !EMAIL_CONFIG.SMTP_USER || !EMAIL_CONFIG.SMTP_PASS) {
    console.warn('[EMAIL] SMTP configuration incomplete. Skipping email notification.');
    return;
  }

  try {
    const transporter = getTransporter();

    // Verificar la conexión antes de enviar
    console.log('[EMAIL] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified successfully!');

    const htmlContent = generateNewManagementEmailHTML(data);

    const mailOptions: any = {
      from: `"Sistema ISBE" <${EMAIL_CONFIG.SMTP_USER}>`,
      to: EMAIL_CONFIG.NOTIFICATION_RECIPIENTS.join(', '),
      subject: 'Nueva incorporación a ISBE',
      html: htmlContent,
      text: `Nueva incorporación a ISBE\n\nID de Organización: ${data.organizationId}\nContrato adjunto: ${data.contractFilename}\n\nVer contrato: ${data.contractUrl}`,
    };

    // Adjuntar el archivo si existe la ruta física
    if (data.contractPath && fs.existsSync(data.contractPath)) {
      console.log('[EMAIL] ✅ Attaching contract file:', data.contractPath);
      mailOptions.attachments = [
        {
          filename: data.contractFilename,
          path: data.contractPath,
        },
      ];
    } else {
      console.warn('[EMAIL] ⚠️  Contract file not found for attachment. Path:', data.contractPath);
    }

    console.log('[EMAIL] Sending email to:', mailOptions.to);
    console.log('[EMAIL] Has attachments:', !!mailOptions.attachments);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Email sent successfully! Message ID: ${info.messageId}`);
    console.log('[EMAIL] Response:', info.response);
  } catch (error) {
    // Log el error pero no lanzar excepción para no interrumpir el flujo principal
    console.error('[EMAIL] ❌ Error sending email notification:', error);
    if (error instanceof Error) {
      console.error('[EMAIL] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    // En producción, podrías querer registrar esto en un sistema de logging más robusto
  }
}
