const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  logoutUser,
  getMe
} = require('../controllers/authController.cjs');
const { protect } = require('../middleware/authMiddleware.cjs');

// Public endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/logout', logoutUser);

// Private/Protected endpoints
router.get('/me', protect, getMe);

module.exports = router;
