const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
import { sendVerificationOTP } from '../config/mailer.js';

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'supersecretfixditjwtkey123!',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields: username, email, and password.' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Ensure username is unique
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Ensure email is unique
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = await sendVerificationOTP(email.trim().toLowerCase());

    // Create and store user
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      emailVerified: false,
      role: 'user',
      profilePicture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      verificationOTP: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });


    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',  
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        profilePicture: user.profilePicture,
      }
    });

  } catch (error) {
    console.error(`Register user error: ${error.message}`);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

// @desc    Login user (using username or email)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your username or email, and password.' });
    }

    const searchInput = email.trim();

    // Find user by either username or email
    const user = await User.findOne({
      $or: [
        { email: searchInput.toLowerCase() },
        { username: searchInput }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Reject unverified accounts
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Your email address is not verified. Please verify your email before logging in.',
        unverified: true,
      });
    }

    // Generate JWT Access Token
    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      }
    });

  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: 'Email and OTP are required.',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found.',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email is already verified.',
      });
    }

    if (user.verificationOTP !== otp) {
      return res.status(400).json({
        error: 'Invalid verification code.',
      });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        error: 'Verification code has expired.',
      });
    }

    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      verificationOTP: '',
      otpExpires: null,
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });

  } catch (error) {
    console.error(`Verify OTP error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error during verification.',
    });
  }
};

// @desc    Resend Email Verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: "This email has already been verified.",
      });
    }

    const otp = await sendVerificationOTP(user.email);

    await User.findByIdAndUpdate(user._id, {
      verificationOTP: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });

  } catch (error) {
    console.error(`Resend OTP error: ${error.message}`);

    return res.status(500).json({
      error: "Server error while resending OTP.",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error(`Logout error: ${error.message}`);
    return res.status(500).json({ error: 'Server error during logout.' });
  }
};

// @desc    Get currently authenticated user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized, profile retrieval failed.' });
    }

    return res.status(200).json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        emailVerified: req.user.emailVerified,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      }
    });

  } catch (error) {
    console.error(`GetMe profile error: ${error.message}`);
    return res.status(500).json({ error: 'Server error during profile retrieval.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  logoutUser,
  getMe,
};
