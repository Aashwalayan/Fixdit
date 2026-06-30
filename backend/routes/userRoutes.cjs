const express = require('express');
const router = express.Router();

const {
  getSavedReports,
  getSavedPosts,
  getMyReports,
  getUpvotedPosts,
  getCommentedPosts,
  getOfficialApplicationStatus,
  toggleSavedReport,
} = require('../controllers/userController.cjs');
const { protect } = require('../middleware/authMiddleware.cjs');

router.get('/me/saved-reports', protect, getSavedReports);
router.get('/me/saved-posts', protect, getSavedPosts);
router.get('/me/reports', protect, getMyReports);
router.get('/me/upvoted-posts', protect, getUpvotedPosts);
router.get('/me/commented-posts', protect, getCommentedPosts);
router.get('/me/official-application', protect, getOfficialApplicationStatus);
router.patch('/me/saved-reports/:id', protect, toggleSavedReport);

module.exports = router;
