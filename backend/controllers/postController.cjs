const Post = require('../models/Post.cjs');

// Helper to calculate distance in meters for the in-memory fallback
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of the earth in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// @desc    Create a new civic post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const {
      title,
      description,
      images,
      aiAnalysis,
      aiSummary,
      assignedDepartment,
      category,
      severity,
      location,
      isAnonymous,
      upvotes,
      downvotes,
      comments
    } = req.body;

    // Validation
    if (!title || !description || !category || !location) {
      return res.status(400).json({ error: 'Please provide all required fields: title, description, category, and location.' });
    }

    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Location must include coordinates in [longitude, latitude] format.' });
    }

    const normalizedImages = (images || []).map(img => {
      if (typeof img === 'string') return { url: img };
      if (img && typeof img === 'object' && img.url) return img;
      return null;
    }).filter(Boolean);

    const postData = {
      title: title.trim(),
      description: description.trim(),
      images: normalizedImages,
      aiAnalysis: aiAnalysis || null,
      aiSummary: aiSummary || (aiAnalysis ? aiAnalysis.summary : ''),
      assignedDepartment: assignedDepartment || (aiAnalysis ? aiAnalysis.suggestedAction : ''),
      category,
      severity: severity || 'Medium',
      status: req.body.status || 'Pending',
      location: {
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || 'USA',
        coordinates: {
          type: 'Point',
          coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])] // [lon, lat]
        }
      },
      author: req.user._id,
      isAnonymous: !!isAnonymous,
      upvotes: Number(upvotes) || 0,
      downvotes: Number(downvotes) || 0,
      comments: comments || []
    };

    const newPost = await Post.create(postData);
    return res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error(`Create Post error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get all posts (with filtering, searching, and proximity support)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const {
      category,
      status,
      severity,
      author,
      search,
      lat,
      lng,
      radius, // in meters, default to 5000 (5km) if lat/lng are provided
      sortBy
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (author) filter.author = author;

    // Retrieve active (non-soft-deleted) posts
    let posts = await Post.find(filter);

    // Filter by text search if present
    if (search) {
      const q = String(search).toLowerCase();
      posts = posts.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.location?.address && p.location.address.toLowerCase().includes(q))
      );
    }

    // Proximity Geospatial Filter (support for both Mongo Geospatial queries and Memory Fallback)
    if (lat && lng) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      const maxDistance = Number(radius) || 5000; // 5km default

      // Filter based on distance
      posts = posts
        .map(p => {
          let distance = Infinity;
          const coords = p.location?.coordinates?.coordinates || p.location?.coordinates;
          if (coords && Array.isArray(coords) && coords.length === 2) {
            // [longitude, latitude]
            distance = calculateDistanceInMeters(latitude, longitude, coords[1], coords[0]);
          }
          // Attach distance
          return {
            ...p,
            distanceMeters: Math.round(distance)
          };
        })
        .filter(p => p.distanceMeters <= maxDistance);
    }

    // Apply sorting
    if (sortBy === 'upvotes') {
      posts.sort((a, b) => (b.stats?.upvotes || 0) - (a.stats?.upvotes || 0));
    } else if (sortBy === 'severity') {
      const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      posts.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
    } else if (sortBy === 'comments') {
      posts.sort((a, b) => (b.stats?.comments || 0) - (a.stats?.comments || 0));
    } else {
      // Default: Sort by createdAt desc
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.json(posts);
  } catch (error) {
    console.error(`Get Posts error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found or has been deleted.' });
    }

    // Increment view count dynamically
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    return res.json(updatedPost);
  } catch (error) {
    console.error(`Get Post By ID error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Update an existing civic post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const isAuthor = String(post.author._id || post.author) === String(req.user._id);
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator' || req.user.role === 'official';

    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ error: 'Not authorized to update this post.' });
    }

    // Parse updates based on authorization
    const updates = {};
    const allowedUserFields = ['title', 'description', 'category', 'isAnonymous', 'aiSummary', 'assignedDepartment', 'upvotes', 'downvotes', 'comments'];
    const allowedStaffFields = ['status', 'severity', 'aiAnalysis', 'aiSummary', 'assignedDepartment', 'upvotes', 'downvotes', 'comments'];

    // If author, let them update standard description, category, images
    if (isAuthor) {
      allowedUserFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      if (req.body.images !== undefined) {
        updates.images = (req.body.images || []).map(img => {
          if (typeof img === 'string') return { url: img };
          if (img && typeof img === 'object' && img.url) return img;
          return null;
        }).filter(Boolean);
      }
      if (req.body.location) {
        updates.location = {
          ...post.location,
          ...req.body.location,
          coordinates: {
            type: 'Point',
            coordinates: req.body.location.coordinates || post.location.coordinates?.coordinates
          }
        };
      }
    }

    // If admin or moderator, allow changing status, severity, AI analysis, verifiedBy, resolvedAt
    if (isAdminOrMod) {
      allowedStaffFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      if (req.body.images !== undefined) {
        updates.images = (req.body.images || []).map(img => {
          if (typeof img === 'string') return { url: img };
          if (img && typeof img === 'object' && img.url) return img;
          return null;
        }).filter(Boolean);
      }

      if (req.body.status === 'Verified') {
        updates.verifiedBy = req.user._id;
      }

      if (req.body.status === 'Resolved') {
        updates.resolvedAt = new Date();
      }
    }

    // Also support incrementing stats upvotes, downvotes, comments
    if (req.body.stats) {
      updates.stats = {
        ...post.stats,
        ...req.body.stats
      };
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error(`Update Post error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Soft delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const isAuthor = String(post.author._id || post.author) === String(req.user._id);
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator' || req.user.role === 'official';

    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ error: 'Not authorized to delete this post.' });
    }

    // Soft delete by setting deletedAt timestamp
    await Post.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });

    return res.json({ message: 'Post soft deleted successfully.' });
  } catch (error) {
    console.error(`Delete Post error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
};
