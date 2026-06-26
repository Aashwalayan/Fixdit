const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const aiAnalysisSchema = new mongoose.Schema({
  summary: { type: String, default: '' },
  category: { type: String, default: '' },
  severity: { type: String, default: '' },
  confidence: { type: Number, default: 0 },
  suggestedAction: { type: String, default: '' },
  generatedAt: { type: Date, default: Date.now }
}, { _id: false });

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  coordinates: {
    type: pointSchema,
    required: true
  }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true
    },
    images: {
      type: [imageSchema],
      default: []
    },
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: null
    },
    aiSummary: {
      type: String,
      default: ''
    },
    assignedDepartment: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Please specify a category']
    },
    severity: {
      type: String,
      required: [true, 'Please specify severity'],
      default: 'Medium'
    },
    status: {
      type: String,
      default: 'Pending'
    },
    location: {
      type: locationSchema,
      required: [true, 'Please provide location details']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must be associated with an author']
    },
    stats: {
      upvotes: { type: Number, default: 0 },
      downvotes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 }
    },
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    comments: {
      type: [commentSchema],
      default: []
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Define indexes for performant queries
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });
// 2dsphere index for GeoJSON geospatial queries
postSchema.index({ 'location.coordinates': '2dsphere' });

const MongoosePost = mongoose.models.Post || mongoose.model('Post', postSchema);

// In-memory fallback
if (!global.memoryPosts) {
  global.memoryPosts = [];
}

const isMongoConnected = () => mongoose.connection.readyState === 1;

const Post = {
  schema: postSchema,
  MongooseModel: MongoosePost,

  find: async (filter = {}) => {
    const query = { deletedAt: null, ...filter };
    if (isMongoConnected()) {
      try {
        return await MongoosePost.find(query)
          .populate('author', 'username email profilePicture')
          .populate('verifiedBy', 'username email')
          .populate('comments.user', 'username email profilePicture')
          .sort({ createdAt: -1 });
      } catch (err) {
        console.error('Mongoose find error, falling back to memory:', err);
      }
    }
    
    // In-memory fallback querying
    let results = global.memoryPosts.filter(p => p.deletedAt === null);
    
    if (query.category) {
      results = results.filter(p => p.category === query.category);
    }
    if (query.status) {
      results = results.filter(p => p.status === query.status);
    }
    if (query.severity) {
      results = results.filter(p => p.severity === query.severity);
    }
    if (query.author) {
      results = results.filter(p => String(p.author) === String(query.author));
    }
    if (query.isAnonymous !== undefined) {
      results = results.filter(p => p.isAnonymous === query.isAnonymous);
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results;
  },

  findById: async (id) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongoosePost.findById(id)
          .populate('author', 'username email profilePicture')
          .populate('verifiedBy', 'username email')
          .populate('comments.user', 'username email profilePicture');
      } catch (err) {
        console.error('Mongoose findById error, falling back to memory:', err);
      }
    }
    return global.memoryPosts.find(p => String(p._id) === String(id) && p.deletedAt === null);
  },

  create: async (data) => {
    const postData = {
      title: data.title,
      description: data.description,
      images: data.images || [],
      aiAnalysis: data.aiAnalysis || null,
      aiSummary: data.aiSummary || '',
      assignedDepartment: data.assignedDepartment || '',
      category: data.category,
      severity: data.severity || 'Medium',
      status: data.status || 'Pending',
      location: {
        address: data.location?.address || '',
        city: data.location?.city || '',
        state: data.location?.state || '',
        country: data.location?.country || '',
        coordinates: {
          type: 'Point',
          coordinates: data.location?.coordinates?.coordinates || data.location?.coordinates || [0, 0]
        }
      },
      author: data.author,
      stats: {
        upvotes: data.stats?.upvotes || data.upvotes || 0,
        downvotes: data.stats?.downvotes || data.downvotes || 0,
        comments: data.stats?.comments || (data.comments ? data.comments.length : 0)
      },
      upvotes: data.upvotes || data.stats?.upvotes || 0,
      downvotes: data.downvotes || data.stats?.downvotes || 0,
      comments: data.comments || [],
      isAnonymous: data.isAnonymous || false,
      viewCount: data.viewCount || 0,
      verifiedBy: data.verifiedBy || null,
      resolvedAt: data.resolvedAt || null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected()) {
      try {
        const mongoPost = await MongoosePost.create(postData);
        return mongoPost;
      } catch (err) {
        console.error('Mongoose Post create error, falling back to memory:', err);
      }
    }

    const inMemPost = {
      _id: 'mem_post_' + Math.random().toString(36).substring(2, 11),
      ...postData
    };
    global.memoryPosts.push(inMemPost);
    return inMemPost;
  },

  findByIdAndUpdate: async (id, update, options = { new: true }) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongoosePost.findByIdAndUpdate(id, update, options)
          .populate('author', 'username email profilePicture')
          .populate('verifiedBy', 'username email')
          .populate('comments.user', 'username email profilePicture');
      } catch (err) {
        console.error('Mongoose Post findByIdAndUpdate error, falling back to memory:', err);
      }
    }

    const index = global.memoryPosts.findIndex(p => String(p._id) === String(id) && p.deletedAt === null);
    if (index !== -1) {
      const existing = global.memoryPosts[index];
      
      let updatedFields = {};
      if (update.$set) {
        updatedFields = { ...update.$set };
      } else {
        updatedFields = { ...update };
      }

      const stats = updatedFields.stats ? { ...existing.stats, ...updatedFields.stats } : existing.stats;
      const location = updatedFields.location ? { ...existing.location, ...updatedFields.location } : existing.location;
      const aiAnalysis = updatedFields.aiAnalysis !== undefined ? updatedFields.aiAnalysis : existing.aiAnalysis;
      const comments = updatedFields.comments !== undefined ? updatedFields.comments : existing.comments;

      const updatedPost = {
        ...existing,
        ...updatedFields,
        stats,
        location,
        aiAnalysis,
        comments,
        updatedAt: new Date()
      };

      global.memoryPosts[index] = updatedPost;
      return updatedPost;
    }
    return null;
  }
};

module.exports = Post;
