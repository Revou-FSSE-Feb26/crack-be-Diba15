import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY belum dikonfigurasi di file .env');
    }
  }

  async sendPasswordResetEmail(email: string, name: string, resetLink: string) {
    if (!this.resend) {
      this.logger.error('Resend client belum diinisialisasi. Gagal mengirim email reset password.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
            .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
            .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 9999px; margin: 20px 0; text-align: center; }
            .footer { margin-top: 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }
            .link-text { font-size: 12px; color: #64748b; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">TruBrush</div>
            </div>
            <p>Halo <strong>${name}</strong>,</p>
            <p>Kami menerima permintaan untuk mereset password akun TruBrush Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="btn" target="_blank">Reset Password Saya</a>
            </div>
            <p>Link ini berlaku selama <strong>15 menit</strong>. Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>
            <div class="footer">
              <p>Atau salin link berikut ke browser Anda:</p>
              <p class="link-text">${resetLink}</p>
              <p style="margin-top: 16px;">© ${new Date().getFullYear()} TruBrush. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'TruBrush <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset Password Akun TruBrush Anda',
        html: htmlContent,
      });

      if (error) {
        this.logger.error(`Gagal mengirim email reset password via Resend: ${error.message}`);
        return;
      }

      this.logger.log(`Email reset password berhasil dikirim ke ${email} (ID: ${data?.id})`);
    } catch (err) {
      this.logger.error('Error saat mengirim email reset password:', err);
    }
  }
}
