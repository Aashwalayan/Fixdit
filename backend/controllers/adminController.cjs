const User = require('../models/User.cjs');
const { getTransferTargets, transferAdminRole } = require('../utils/adminLifecycle.cjs');

const requireActiveAdmin = (req, res) => {
  if (!req.user || String(req.user.role).toLowerCase() !== 'admin') {
    res.status(403).json({ error: 'Only the active administrator can access this resource.' });
    return false;
  }
  return true;
};

const listTransferTargets = async (req, res) => {
  try {
    if (!requireActiveAdmin(req, res)) return;

    const officials = await getTransferTargets();
    return res.status(200).json({
      officials,
      count: officials.length,
    });
  } catch (error) {
    console.error(`List transfer targets error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load official accounts.' });
  }
};

const transferAdmin = async (req, res) => {
  try {
    if (!requireActiveAdmin(req, res)) return;

    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Please select an official account to receive admin privileges.' });
    }

    const result = await transferAdminRole({
      requesterId: req.user._id,
      targetUserId,
    });

    return res.status(200).json({
      message: 'Admin privileges transferred successfully.',
      ...result,
    });
  } catch (error) {
    console.error(`Transfer admin error: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  listTransferTargets,
  transferAdmin,
};
