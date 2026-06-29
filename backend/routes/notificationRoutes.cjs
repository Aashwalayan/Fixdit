const express = require('express');
const router = express.Router();

const {
  listMyNotifications,
  markNotificationRead,
  markAllRead,
} = require('../controllers/notificationController.cjs');

const { protect } = require('../middleware/authMiddleware.cjs');

router.get('/', protect, listMyNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markNotificationRead);

module.exports = router;
