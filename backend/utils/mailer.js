const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

let transporter = null;

async function initMailer() {
  if (transporter) return transporter;

  // Option 1: Use Custom SMTP Server configured in backend/.env or Vercel Env Vars
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      return transporter;
    } catch (err) {
      console.warn('Custom SMTP Connection Warning:', err.message);
    }
  }

  // Option 2: Fallback to JsonTransport for Serverless safety (Zero top-level network requests)
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
  return transporter;
}

/**
 * Send Account Activation Email
 */
exports.sendActivationEmail = async (toEmail, name, token, req = null) => {
  let baseUrl = process.env.FRONTEND_URL;

  if (!baseUrl && req) {
    try {
      const headers = req.headers || {};
      const protocol = headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = headers['x-forwarded-host'] || (typeof req.get === 'function' ? req.get('host') : null);
      if (host) {
        baseUrl = `${protocol}://${host}`;
      }
    } catch (e) {
      console.warn("Base URL resolution warning:", e.message);
    }
  }

  if (!baseUrl) {
    baseUrl = 'http://localhost:5173';
  }

  // Strip trailing slash
  baseUrl = String(baseUrl).replace(/\/+$/, '');

  const activationLink = `${baseUrl}/?verify_token=${token}`;
  const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"Dinas Bina Marga LaporJalan" <robbihably10@gmail.com>';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #38bdf8; margin: 0;">LaporJalan</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Sistem Informasi Pelaporan Jalan Rusak Masyarakat</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
      <h2 style="color: #ffffff;">Halo ${name || 'Warga'},</h2>
      <p style="color: #cbd5e1; line-height: 1.6;">
        Terima kasih telah mendaftar di portal LaporJalan. Akun Anda saat ini berstatus <strong>Nonaktif</strong>. Silakan klik tombol di bawah ini untuk memverifikasi email Anda dan mengaktifkan akun:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${activationLink}" style="background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
          Aktivasi Akun Saya Sekarang
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
        Atau salin dan tempel link berikut pada browser Anda:<br />
        <a href="${activationLink}" style="color: #38bdf8; word-break: break-all;">${activationLink}</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 11px; text-align: center;">
        Jika Anda tidak merasa mendaftar di LaporJalan, silakan abaikan pesan email ini.
      </p>
    </div>
  `;

  try {
    if (!transporter) await initMailer();

    const info = await transporter.sendMail({
      from: senderEmail,
      to: toEmail,
      subject: 'Aktivasi Akun LaporJalan Anda',
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`===================================================`);
    console.log(` Activation Email sent to: ${toEmail}`);
    if (previewUrl) {
      console.log(` LIVE INBOX PREVIEW LINK: ${previewUrl}`);
    }
    console.log(` Direct Activation Link : ${activationLink}`);
    console.log(`===================================================`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || activationLink,
      activationLink
    };
  } catch (err) {
    console.error(' Error sending activation email:', err.message);
    return {
      success: false,
      activationLink,
      error: err.message
    };
  }
};
