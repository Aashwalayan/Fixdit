const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.cjs');

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

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create and store user
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      emailVerified: false,
      role: 'user',
      profilePicture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      verificationToken,
    });

    // Send Simulated Email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    console.log('\n========================================================================');
    console.log('📧 SIMULATED FIXDIT EMAIL VERIFICATION');
    console.log(`To: ${user.email}`);
    console.log(`Subject: Verify Your Fixdit Civic Account`);
    console.log(`Welcome, ${user.username}! Please verify your account by clicking the link below:`);
    console.log(`👉 Verification Link: ${verificationUrl}`);
    console.log('========================================================================\n');

    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      verificationToken, 
      verificationUrl,   
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
        error: 'Your email address is not verified. Please check your inbox or use the sandbox simulator to verify your account.',
        unverified: true,
        verificationToken: user.verificationToken,
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

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Verification token is invalid or has expired.' });
    }

    // Update user to verified
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      verificationToken: '', 
    });

    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
    if (acceptsHtml) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Account Verified - Fixdit</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; width: 90%; border: 1px solid #e2e8f0; }
            .icon { background: #dcfce7; color: #15803d; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 28px; font-weight: bold; }
            h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem; color: #0f172a; }
            p { font-size: 0.95rem; color: #64748b; line-height: 1.5; margin: 0 0 1.5rem; }
            .btn { display: inline-block; background: #ea580c; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: background 0.15s; }
            .btn:hover { background: #c2410c; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Email Verified!</h1>
            <p>Your Fixdit account has been successfully verified. You can now close this tab and log in to the application.</p>
            <a href="/" class="btn">Go to Fixdit Portal</a>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(200).json({
      success: true,
      message: 'Your email address has been verified successfully. You can now log in.'
    });

  } catch (error) {
    console.error(`Verify email error: ${error.message}`);
    return res.status(500).json({ error: 'Server error during email verification.' });
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
  verifyEmail,
  logoutUser,
  getMe,
};
