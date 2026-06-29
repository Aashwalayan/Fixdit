const express = require('express');
const router = express.Router();

const { getSavedReports, toggleSavedReport } = require('../controllers/userController.cjs');
const { protect } = require('../middleware/authMiddleware.cjs');

router.get('/me/saved-reports', protect, getSavedReports);
router.patch('/me/saved-reports/:id', protect, toggleSavedReport);

module.exports = router;
