'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const mailer = require('../config/mailer.cjs');


// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'supersecretfixditjwtkey123!',
    { expiresIn: '7d' }
  );
};

const generateVerificationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  console.log("REGISTER HIT");
  try {
    const { username, email, password } = req.body;
    const normalizedUsername = username?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    // Validate inputs
    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Please provide all required fields: username, email, and password.' });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Ensure username is unique
    const usernameExists = await User.findOne({ username: normalizedUsername });
    if (usernameExists) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Ensure email is unique
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    

    // Send OTP email — awaited so failures surface as real errors.

    const otp = generateVerificationOTP();

    // We do NOT return verificationToken or the OTP to the client.
    try {
      await mailer.sendVerificationOTP(normalizedEmail, otp);
    } catch (emailError) {
      console.error("===== FULL EMAIL ERROR =====");
      console.error(emailError);
      console.error("============================");

      return res.status(503).json({
        error: `We couldn't send the verification email. Please try again later. (${emailError.message})`,
        emailFailed: true,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    

    // Create and store user first, then attempt email.
    // If email fails we return a 503 so the user knows to retry — the user
    // record is created but unverified, and they can use /resend-otp.
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      displayName: normalizedUsername,
      emailVerified: false,
      role: 'user',
      profilePicture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedUsername)}`,
      verificationOTP: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Success: user created, OTP email sent. Do not include OTP or verificationToken.
    return res.status(201).json({
      message: 'Registration successful! A verification code has been sent to your email.',
      email: normalizedEmail,
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
        error: 'Your email address is not verified. Please check your inbox for the verification code.',
        unverified: true,
        email: user.email,
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
        displayName: user.displayName,
        department: user.department,
        designation: user.designation,
        savedReports: user.savedReports || [],
        anonymousReportingDefault: user.anonymousReportingDefault || false,
        showProfilePublicly: user.showProfilePublicly !== undefined ? user.showProfilePublicly : true,
        showActivity: user.showActivity !== undefined ? user.showActivity : true,
        notificationPreferences: user.notificationPreferences || {},
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
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    if (user.verificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new one.',
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
    return res.status(500).json({ error: 'Server error during verification.' });
  }
};

// @desc    Resend Email Verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'This email has already been verified.' });
    }

    const otp = mailer.generateVerificationOTP();

    await User.findByIdAndUpdate(user._id, {
      verificationOTP: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    try {
      await mailer.sendVerificationOTP(user.email, otp);
    } catch (emailError) {
      console.error('Resend OTP email delivery failed:', emailError.message);
      return res.status(503).json({
        error: `Could not send verification email: ${emailError.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });

  } catch (error) {
    console.error(`Resend OTP error: ${error.message}`);
    return res.status(500).json({ error: 'Server error while resending OTP.' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
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
        displayName: req.user.displayName,
        department: req.user.department,
        designation: req.user.designation,
        savedReports: req.user.savedReports || [],
        anonymousReportingDefault: req.user.anonymousReportingDefault || false,
        showProfilePublicly: req.user.showProfilePublicly !== undefined ? req.user.showProfilePublicly : true,
        showActivity: req.user.showActivity !== undefined ? req.user.showActivity : true,
        notificationPreferences: req.user.notificationPreferences || {},
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      }
    });

  } catch (error) {
    console.error(`GetMe profile error: ${error.message}`);
    return res.status(500).json({ error: 'Server error during profile retrieval.' });
  }
};

// @desc    Update currently authenticated user profile/settings
// @route   PATCH /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const allowedFields = [
      'username',
      'displayName',
      'profilePicture',
      'anonymousReportingDefault',
      'showProfilePublicly',
      'showActivity',
      'notificationPreferences',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.username) {
      const normalizedUsername = String(updates.username).trim();
      if (normalizedUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      }
      const usernameExists = await User.findOne({ username: normalizedUsername });
      if (usernameExists && String(usernameExists._id) !== String(req.user._id)) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      updates.username = normalizedUsername;
      if (!updates.displayName) {
        updates.displayName = normalizedUsername;
      }
    }

    if (updates.notificationPreferences && typeof updates.notificationPreferences !== 'object') {
      return res.status(400).json({ error: 'Notification preferences must be an object.' });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        displayName: updatedUser.displayName,
        department: updatedUser.department,
        designation: updatedUser.designation,
        savedReports: updatedUser.savedReports || [],
        anonymousReportingDefault: updatedUser.anonymousReportingDefault || false,
        showProfilePublicly: updatedUser.showProfilePublicly !== undefined ? updatedUser.showProfilePublicly : true,
        showActivity: updatedUser.showActivity !== undefined ? updatedUser.showActivity : true,
        notificationPreferences: updatedUser.notificationPreferences || {},
      },
    });
  } catch (error) {
    console.error(`UpdateMe profile error: ${error.message}`);
    return res.status(500).json({ error: 'Server error while updating profile.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  logoutUser,
  getMe,
  updateMe,
};
