const User = require('../models/User.cjs');
const Post = require('../models/Post.cjs');
const mongoose = require('mongoose');

const isMongoConnected = () => mongoose.connection.readyState === 1;

const populatePostQuery = (query) =>
  query
    .populate('author', 'username email profilePicture role displayName department designation')
    .populate('verifiedBy', 'username email role displayName')
    .populate('comments.user', 'username email profilePicture');

const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const sortNewestFirst = (items) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const fetchPostsByIds = async (ids) => {
  const uniqueIds = [...new Set((ids || []).map(String).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  if (isMongoConnected()) {
    try {
      return await populatePostQuery(
        Post.MongooseModel.find({ _id: { $in: uniqueIds }, deletedAt: null })
      ).sort({ createdAt: -1 });
    } catch (err) {
      console.error('Fetch posts by ids error, falling back to memory:', err);
    }
  }

  const memoryPosts = (global.memoryPosts || [])
    .filter((post) => post.deletedAt === null && uniqueIds.includes(String(post._id)))
    .map(toPlain);

  return sortNewestFirst(memoryPosts);
};

const fetchPostsByAuthor = async (authorId) => {
  if (isMongoConnected()) {
    try {
      return await populatePostQuery(
        Post.MongooseModel.find({ author: authorId, deletedAt: null })
      ).sort({ createdAt: -1 });
    } catch (err) {
      console.error('Fetch posts by author error, falling back to memory:', err);
    }
  }

  const memoryPosts = (global.memoryPosts || [])
    .filter((post) => post.deletedAt === null && String(post.author) === String(authorId))
    .map(toPlain);

  return sortNewestFirst(memoryPosts);
};

const fetchCommentedPostsForUser = async (user) => {
  const username = String(user.username || '').trim();
  const userId = String(user._id || '');

  if (isMongoConnected()) {
    try {
      const posts = await populatePostQuery(
        Post.MongooseModel.find({
          deletedAt: null,
          $or: [
            { 'comments.user': userId },
            { 'comments.authorName': username },
          ],
        })
      ).sort({ createdAt: -1 });

      const seen = new Set();
      return posts.filter((post) => {
        const id = String(post._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    } catch (err) {
      console.error('Fetch commented posts error, falling back to memory:', err);
    }
  }

  const memoryPosts = (global.memoryPosts || [])
    .filter((post) => {
      if (post.deletedAt !== null) return false;
      return (Array.isArray(post.comments) ? post.comments : []).some((comment) => {
        const commentUserId = String(comment.user || '');
        const commentAuthor = String(comment.authorName || '').trim();
        return commentUserId === userId || commentAuthor === username;
      });
    })
    .map(toPlain);

  const seen = new Set();
  return sortNewestFirst(memoryPosts).filter((post) => {
    const id = String(post._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const getSavedPostIds = async (user) => {
  const savedIds = Array.isArray(user.savedReports) ? user.savedReports : [];
  return [...new Set(savedIds.map(String).filter(Boolean))];
};

const getUpvotedPostIds = async (user) => {
  const storedIds = Array.isArray(user.upvotedReports) ? user.upvotedReports.map(String).filter(Boolean) : [];
  if (storedIds.length > 0) {
    return [...new Set(storedIds)];
  }

  const username = String(user.username || '').trim();
  const userId = String(user._id || '');
  if (isMongoConnected()) {
    try {
      const posts = await Post.MongooseModel.find({
        deletedAt: null,
        $or: [
          { upvoters: userId },
          { upvoters: username },
        ],
      }).select('_id');
      return [...new Set(posts.map((post) => String(post._id)))];
    } catch (err) {
      console.error('Fetch upvoted ids error, falling back to memory:', err);
    }
  }

  return [...new Set((global.memoryPosts || [])
    .filter((post) => {
      if (post.deletedAt !== null) return false;
      const upvoters = Array.isArray(post.upvoters) ? post.upvoters : [];
      return upvoters.includes(userId) || upvoters.includes(username);
    })
    .map((post) => String(post._id)))];
};

const getSavedReports = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const savedReports = await fetchPostsByIds(await getSavedPostIds(req.user));

    return res.status(200).json({
      savedReports,
      savedReportIds: Array.isArray(req.user.savedReports) ? req.user.savedReports : [],
      posts: savedReports,
    });
  } catch (error) {
    console.error(`Get saved reports error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load saved reports.' });
  }
};

const getSavedPosts = async (req, res) => getSavedReports(req, res);

const getMyReports = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const reports = await fetchPostsByAuthor(req.user._id);
    return res.status(200).json({ posts: reports });
  } catch (error) {
    console.error(`Get my reports error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load your reports.' });
  }
};

const getUpvotedPosts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const upvotedIds = await getUpvotedPostIds(req.user);
    const posts = await fetchPostsByIds(upvotedIds);
    return res.status(200).json({ posts });
  } catch (error) {
    console.error(`Get upvoted posts error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load upvoted posts.' });
  }
};

const getCommentedPosts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const posts = await fetchCommentedPostsForUser(req.user);
    return res.status(200).json({ posts });
  } catch (error) {
    console.error(`Get commented posts error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load commented posts.' });
  }
};

const getOfficialApplicationStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const OfficialApplication = require('../models/OfficialApplication.cjs');
    const application = await OfficialApplication.findOne({ applicant: req.user._id });

    if (!application) {
      return res.status(200).json({
        status: 'not_applied',
        application: null,
      });
    }

    const normalizedStatus = String(application.status || '').toLowerCase();
    const status = normalizedStatus === 'pending'
      ? 'pending_review'
      : normalizedStatus === 'approved'
        ? 'approved'
        : 'rejected';

    return res.status(200).json({
      status,
      application: {
        id: String(application._id),
        status: normalizedStatus,
        fullName: application.fullName,
        department: application.department,
        designation: application.designation,
        employeeId: application.employeeId,
        governmentEmail: application.governmentEmail,
        proofDocument: application.proofDocument,
        rejectionReason: application.rejectionReason || '',
        reviewedAt: application.reviewedAt || null,
        submittedAt: application.createdAt || null,
      },
      approvedAt: normalizedStatus === 'approved' ? application.reviewedAt || application.updatedAt || application.createdAt || null : null,
      isOfficial: normalizedStatus === 'approved' || String(req.user.role || '').toLowerCase() === 'official',
    });
  } catch (error) {
    console.error(`Get official application status error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load official application status.' });
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
  getSavedPosts,
  getMyReports,
  getUpvotedPosts,
  getCommentedPosts,
  getOfficialApplicationStatus,
  toggleSavedReport,
};
