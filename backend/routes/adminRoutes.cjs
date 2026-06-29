const express = require('express');
const router = express.Router();

const {
  listTransferTargets,
  transferAdmin,
} = require('../controllers/adminController.cjs');

const { protect } = require('../middleware/authMiddleware.cjs');

router.get('/officials', protect, listTransferTargets);
router.post('/transfer', protect, transferAdmin);

module.exports = router;
