'use strict';

const nodemailer = require('nodemailer');

const generateVerificationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Build the SMTP transporter on each call so env vars are read at
 * runtime (not at module load time), which avoids issues on Render
 * where env vars may not be set during the build phase.
 *
 * Port 465 + secure:true (implicit TLS) is the most reliable Gmail
 * path from cloud providers like Render. Port 587 STARTTLS is often
 * blocked or causes ENETUNREACH on IPv6 paths.
 * family:4 forces IPv4 and prevents ENETUNREACH on dual-stack hosts.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a verification OTP email.
 * Throws a descriptive Error on failure — callers must handle it and
 * surface a real error to the user rather than silently continuing.
 *
 * @param {string} email - recipient address
 * @param {string} [otp] - pre-generated OTP (generated internally if omitted)
 * @returns {Promise<string>} the OTP that was sent
 */
const sendVerificationOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email service is not configured. ' +
      'Set EMAIL_USER and EMAIL_PASS environment variables on Render.'
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
