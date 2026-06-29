'use strict';

const { Resend } = require("resend");

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY.");
  }

  return new Resend(process.env.RESEND_API_KEY);
};

const generateVerificationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
  console.log(">>> sendVerificationOTP called");

  const code = otp || generateVerificationOTP();
  
  const resend = getResend();

  const {data, error } = await resend.emails.send({
    from: "Fixdit <onboarding@resend.dev>",
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

  console.log("Resend data:", data);
  console.log("Resend error:", error);

  if (error) {
    throw new Error(error.message);
  }

  return code;
};

module.exports = {
  sendVerificationOTP,
  generateVerificationOTP,
};
