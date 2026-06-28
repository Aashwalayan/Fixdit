const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  logoutUser,
  getMe,
} = require('../controllers/authController.cjs');

const { protect } = require('../middleware/authMiddleware.cjs');

// Public endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/logout', logoutUser);

// Protected endpoints
router.get('/me', protect, getMe);

module.exports = router;