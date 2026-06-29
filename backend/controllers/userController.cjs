const User = require('../models/User.cjs');
const Post = require('../models/Post.cjs');

const getSavedReports = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const savedIds = Array.isArray(req.user.savedReports) ? req.user.savedReports : [];
    const posts = await Post.find({});
    const savedReports = posts.filter((post) => savedIds.includes(String(post._id)));

    return res.status(200).json({
      savedReports,
      savedReportIds: savedIds,
    });
  } catch (error) {
    console.error(`Get saved reports error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load saved reports.' });
  }
};

const toggleSavedReport = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const reportId = req.params.id;
    const savedIds = Array.isArray(req.user.savedReports) ? [...req.user.savedReports] : [];
    const existingIndex = savedIds.indexOf(reportId);

    if (existingIndex > -1) {
      savedIds.splice(existingIndex, 1);
    } else {
      savedIds.push(reportId);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { savedReports: savedIds }, { new: true });

    return res.status(200).json({
      saved: existingIndex === -1,
      savedReportIds: updatedUser.savedReports || [],
    });
  } catch (error) {
    console.error(`Toggle saved report error: ${error.message}`);
    return res.status(500).json({ error: 'Could not update saved reports.' });
  }
};

module.exports = {
  getSavedReports,
  toggleSavedReport,
};
