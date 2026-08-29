const nodemailer = require('nodemailer');
const dns = require('dns');
const config = require('../config/env');
const logger = require('../logs/logger');

// Force Node.js to resolve IPv4 addresses first (prevents ENETUNREACH on Cloud Hosts)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment
   * Supports: SMTP, SendGrid, Gmail, development test
   */
  initializeTransporter() {
    const { email } = config;

    const gmailUser = email.gmailUser || process.env.GMAIL_USER;
    const gmailPass = (email.gmailPassword || process.env.GMAIL_PASSWORD || '').replace(/\s+/g, '');
    const provider = (gmailUser && gmailPass) ? 'gmail' : email.provider;

    try {
      if (provider === 'gmail' && gmailUser && gmailPass) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          family: 4,
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
        });
        logger.info(`Email transporter initialized with Gmail IPv4 service: ${gmailUser}`);
        return;
      }

      if (email.provider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: email.smtpHost,
          port: email.smtpPort,
          secure: email.smtpSecure,
          auth: {
            user: email.smtpUser,
            pass: email.smtpPassword,
          },
        });
      } else if (email.provider === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: email.sendgridApiKey,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: email.testUser,
            pass: email.testPassword,
          },
        });
      }

      logger.info(`Email transporter initialized with provider: ${email.provider}`);
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send email with error handling and logging
   */
  async sendEmail(to, subject, htmlContent, textContent = null, attachments = []) {
    if (!this.transporter) {
      logger.warn(`Email not sent (service disabled): ${subject} to ${to}`);
      return { success: false, reason: 'Email service disabled' };
    }

    try {
      const mailOptions = {
        from: config.email.fromEmail,
        to,
        subject,
        html: htmlContent,
        ...(textContent && { text: textContent }),
        ...(attachments.length > 0 && { attachments }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${subject} to ${to}`, { messageId: info.messageId });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email: ${subject} to ${to}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email for new affiliates
   */
  async sendWelcomeEmail(affiliate) {
    const targetEmail = affiliate.official_email || affiliate.officialEmail || affiliate.email;
    const { firstName } = affiliate;
    const subject = 'Welcome to Our Affiliate Program!';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${firstName || 'Partner'}!</h2>
        <p>Thank you for joining our affiliate program. We're excited to have you on board!</p>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Complete your profile with your official payout details</li>
          <li>Generate your unique referral links</li>
          <li>Start promoting and earning commissions!</li>
        </ol>
        
        <p>
          <a href="${config.frontendUrl}/dashboard" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Go to Dashboard
          </a>
        </p>
        
        <p>If you have any questions, contact our support team.</p>
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send commission earned notification
   */
  async sendCommissionEmail(affiliate, commission) {
    const targetEmail = affiliate.official_email || affiliate.officialEmail || affiliate.email;
    const { firstName } = affiliate;
    const { amount, referral_code, created_at } = commission;

    const subject = `Commission Earned: ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Commission Earned! 🎉</h2>
        <p>Hi ${firstName || 'Partner'},</p>
        
        <p>Great news! You've earned a commission:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Commission Amount:</strong> ₹${Number(amount || 0).toFixed(2)}</p>
          <p><strong>Referral Code:</strong> ${referral_code}</p>
          <p><strong>Date:</strong> ${new Date(created_at).toLocaleDateString()}</p>
        </div>
        
        <p>This amount will be added to your wallet and available for withdrawal.</p>
        
        <p>
          <a href="${config.frontendUrl}/earnings" 
             style="background-color: #28a745; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            View Earnings
          </a>
        </p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send withdrawal request confirmation
   */
  async sendWithdrawalRequestEmail(user, withdrawal) {
    const targetEmail = user.official_email || user.officialEmail || user.email;
    const { firstName } = user;
    const { amount, status, requested_at, bank_account_number } = withdrawal;

    const subject = `Withdrawal Request Confirmation - ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Withdrawal Request Received</h2>
        <p>Hi ${firstName || 'Partner'},</p>
        
        <p>Your withdrawal request has been received and is being processed:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${Number(amount || 0).toFixed(2)}</p>
          <p><strong>Status:</strong> <span style="color: #ffc107;">${(status || 'PENDING').toUpperCase()}</span></p>
          <p><strong>Requested on:</strong> ${new Date(requested_at || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <p>You'll receive an email once your withdrawal is processed and transferred to your account.</p>
        
        <p>
          <a href="${config.frontendUrl}/withdrawals" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Track Withdrawal
          </a>
        </p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send withdrawal approval notification
   */
  async sendWithdrawalApprovedEmail(user, withdrawal) {
    const targetEmail = user.official_email || user.officialEmail || user.email;
    const { firstName } = user;
    const { amount, approved_at, transactionReference, notes } = withdrawal;
    const utrNo = transactionReference || notes || '';

    const subject = `Withdrawal Confirmed & Paid - ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin-bottom: 5px;">Alora Radiance Payout</h2>
          <p style="color: #64748b; font-size: 14px;">Confirmed Payment Receipt</p>
        </div>

        <p style="color: #334155; font-size: 16px;">Hi ${firstName || 'Partner'},</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Great news! Your withdrawal request of <strong>₹${Number(amount || 0).toFixed(2)}</strong> has been processed and successfully paid out.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 10px; border: 1px solid #86efac; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #166534; font-size: 15px;"><strong>Amount Paid:</strong> ₹${Number(amount || 0).toFixed(2)}</p>
          ${utrNo ? `<p style="margin: 0 0 10px 0; color: #166534; font-size: 15px;"><strong>Transaction / UTR ID:</strong> <span style="font-family: monospace; font-size: 16px; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${utrNo}</span></p>` : ''}
          <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Date:</strong> ${new Date(approved_at || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">You can view your updated wallet balance and transaction receipts directly in your partner dashboard.</p>
        
        <p style="margin-top: 25px;">
          <a href="${config.frontendUrl}/withdrawals" 
             style="background-color: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Withdrawal Receipts
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Thank you for being a valued Alora Radiance partner!</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send withdrawal rejection notification
   */
  async sendWithdrawalRejectedEmail(user, withdrawal, reason) {
    const targetEmail = user.official_email || user.officialEmail || user.email;
    const { firstName } = user;
    const { amount } = withdrawal;

    const subject = `Withdrawal Request Declined - ₹${Number(amount || 0).toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Withdrawal Request Declined</h2>
        <p>Hi ${firstName || 'Partner'},</p>
        
        <p>Unfortunately, your withdrawal request for <strong>₹${Number(amount || 0).toFixed(2)}</strong> has been declined.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p><strong>Reason:</strong> ${reason || 'Please contact support for details.'}</p>
        </div>
        
        <p>If you believe this is an error or have questions, please contact our support team.</p>
        
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const targetEmail = user.official_email || user.officialEmail || user.email;
    const { firstName } = user;
    const resetLink = `${config.frontendUrl}/reset-password/${resetToken}`;
    const subject = 'Reset Your Password';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        
        <p style="margin: 25px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        
        <p>This link is valid for 1 hour. If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br/>The Affiliate Team</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send 6-Digit Registration Verification OTP
   */
  async sendRegistrationOtp(email, otp) {
    const subject = `Your Alora Verification Code: ${otp}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin-bottom: 5px;">Alora Radiance Partner</h2>
          <p style="color: #64748b; font-size: 14px;">Email Address Verification</p>
        </div>
        
        <p style="color: #334155; font-size: 16px;">Hello,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Thank you for registering with Alora Radiance! Please use the following 6-digit OTP code to verify your email address and complete your account creation:</p>
        
        <div style="background-color: #f8fafc; border: 2px dashed #6366f1; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338ca; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center;">⏱️ This verification code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(user, verificationToken) {
    const targetEmail = user.official_email || user.officialEmail || user.email;
    const verifyLink = `${config.frontendUrl}/verify-email/${verificationToken}`;
    const subject = 'Verify Your Email Address';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #6366f1;">Verify Your Email Address</h2>
        <p style="color: #334155; font-size: 15px;">Hi ${user.first_name || 'Partner'},</p>
        <p style="color: #334155; font-size: 15px;">Please click the button below to verify your email address for your Alora Radiance partner account:</p>
        <p style="margin: 25px 0;">
          <a href="${verifyLink}" style="background:#4f46e5;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
            Verify Email Address
          </a>
        </p>
        <p style="color: #64748b; font-size: 13px;">This verification link will expire in 24 hours.</p>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, htmlContent);
  }

  /**
   * Send admin alert on new affiliate registration
   */
  async sendAdminNewAffiliateAlert(adminEmail, affiliate) {
    const { firstName, lastName, email: affiliateEmail, company } = affiliate;
    const subject = `New Affiliate Registration: ${firstName} ${lastName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Affiliate Registration</h2>
        <p>A new affiliate has registered and requires your attention:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${affiliateEmail}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
        </div>
        
        <p>
          <a href="${config.frontendUrl}/admin/affiliates" 
             style="background-color: #007bff; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Review Affiliate
          </a>
        </p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, htmlContent);
  }
}

module.exports = new EmailService();
