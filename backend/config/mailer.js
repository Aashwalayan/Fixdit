import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const generateVerificationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

const sendVerificationOTP = async (email, otp = generateVerificationOTP()) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { otp, delivered: false };
  }

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

    return { otp, delivered: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { otp, delivered: false };
  }
};


const mailer = {
  sendVerificationOTP
};

export default mailer;
