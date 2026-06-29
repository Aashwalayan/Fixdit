const express = require('express');
const router = express.Router();

const {
  submitApplication,
  getMyApplication,
  listPendingApplications,
  reviewApplication,
} = require('../controllers/officialApplicationController.cjs');

const { protect } = require('../middleware/authMiddleware.cjs');

router.post('/', protect, submitApplication);
router.get('/me', protect, getMyApplication);
router.get('/pending', protect, listPendingApplications);
router.patch('/:id/review', protect, reviewApplication);

module.exports = router;
