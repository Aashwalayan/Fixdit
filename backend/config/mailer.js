'use strict';

const nodemailer = require('nodemailer');

const generateVerificationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Build the SMTP transporter.
 *
 * On Render (and many cloud providers) outbound port 587 (STARTTLS) is often
 * blocked or unreachable via IPv6, which causes ENETUNREACH. Using port 465
 * with secure:true (implicit TLS) over an explicit IPv4 socket is the most
 * reliable option for Gmail on Render.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,          // implicit TLS — no STARTTLS negotiation needed
    family: 4,             // force IPv4, avoids ENETUNREACH on Render's dual-stack
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // must be a Gmail App Password, not account password
    },
  });
};

/**
 * Send a verification OTP email.
 *
 * Returns a promise that resolves to the OTP string on success.
 * Rejects with a descriptive Error on failure so the caller can surface
 * a real error to the user instead of silently continuing.
 *
 * @param {string} email  - recipient address
 * @param {string} [otp]  - optional pre-generated OTP (generated internally if omitted)
 * @returns {Promise<string>} the OTP that was sent
 */
const sendVerificationOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email service is not configured. Set EMAIL_USER and EMAIL_PASS environment variables on Render.'
    );
  }

  const code = otp || generateVerificationOTP();
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Fixdit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your Fixdit Account',
    text: `Your Fixdit verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#ea580c;margin-bottom:8px;">Fixdit Email Verification</h2>
        <p style="color:#475569;">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0f172a;">${code}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;">If you did not create a Fixdit account, you can safely ignore this email.</p>
      </div>
    `,
  });

  return code;
};

module.exports = {
  sendVerificationOTP,
  generateVerificationOTP,
};
