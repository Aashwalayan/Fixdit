const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} = require('../controllers/postController.cjs');
const { protect } = require('../middleware/authMiddleware.cjs');

// Public routes for browsing/reading posts
router.get('/', getPosts);
router.get('/:id', getPostById);

// Protected routes (require user login)
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
