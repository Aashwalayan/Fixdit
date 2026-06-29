const express = require('express');
const router = express.Router();

const { DEFAULT_DEPARTMENTS } = require('../utils/departments.cjs');
const { protect } = require('../middleware/authMiddleware.cjs');

router.get('/', protect, async (req, res) => {
  try {
    return res.status(200).json({ departments: DEFAULT_DEPARTMENTS });
  } catch (error) {
    console.error(`List departments error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load departments.' });
  }
});

module.exports = router;
