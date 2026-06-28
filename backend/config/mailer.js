import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Email server error:", error);
  } else {
    console.log("SMTP server is ready.");
  }
});

export const sendVerificationOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await transporter.sendMail({
      from: `"Fixdit" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your Fixdit Account",
      text: `Your Fixdit verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <h2>Fixdit Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:6px;">${otp}</h1>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
    });

    return otp;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
};