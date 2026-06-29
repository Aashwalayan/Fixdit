const mongoose = require('mongoose');

const ROLE_VALUES = new Set(['user', 'official', 'employee', 'staff', 'moderator', 'admin']);
const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'official', 'employee', 'staff', 'moderator', 'admin'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    verificationOTP: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { otpExpires: 1 }, 
  { 
    expireAfterSeconds: 0, 
    partialFilterExpression: { emailVerified: false } 
  }
);

// Compile or retrieve the Mongoose model
const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

// In-memory fallback database
if (!global.memoryUsers) {
  global.memoryUsers = [];
}

const isMongoConnected = () => mongoose.connection.readyState === 1;

const User = {
  schema: userSchema,
  MongooseModel: MongooseUser,

  findOne: async (query) => {
    const normalizedQuery = {
      ...query,
    };

    if (normalizedQuery.email) {
      normalizedQuery.email = String(normalizedQuery.email).trim().toLowerCase();
    }

    if (normalizedQuery.username) {
      normalizedQuery.username = String(normalizedQuery.username).trim();
    }

    if (normalizedQuery.role) {
      if (typeof normalizedQuery.role === 'string') {
        normalizedQuery.role = normalizeRole(normalizedQuery.role);
      } else if (normalizedQuery.role.$in && Array.isArray(normalizedQuery.role.$in)) {
        normalizedQuery.role = {
          ...normalizedQuery.role,
          $in: normalizedQuery.role.$in.map((value) => normalizeRole(value)),
        };
      }
    }

    if (Array.isArray(normalizedQuery.$or)) {
      normalizedQuery.$or = normalizedQuery.$or.map((clause) => {
        const normalizedClause = { ...clause };
        if (normalizedClause.email) {
          normalizedClause.email = String(normalizedClause.email).trim().toLowerCase();
        }
        if (normalizedClause.username) {
          normalizedClause.username = String(normalizedClause.username).trim();
        }
        return normalizedClause;
      });
    }

    if (isMongoConnected()) {
      try {
        return await MongooseUser.findOne(normalizedQuery);
      } catch (err) {
        console.error('Mongoose findOne error, falling back to memory:', err);
      }
    }
    
    return global.memoryUsers.find(u => {
      if (normalizedQuery.email && u.email === normalizedQuery.email) return true;
      if (normalizedQuery.username && u.username === normalizedQuery.username) return true;
      if (normalizedQuery.verificationOTP && u.verificationOTP === normalizedQuery.verificationOTP) return true;
      
      if (normalizedQuery.$or && Array.isArray(normalizedQuery.$or)) {
        return normalizedQuery.$or.some(q => {
          if (q.email && u.email === q.email.toLowerCase()) return true;
          if (q.username && u.username === q.username) return true;
          return false;
        });
      }
      return false;
    });
  },

  find: async (query = {}) => {
    const normalizedQuery = {
      ...query,
    };

    if (normalizedQuery.email) {
      normalizedQuery.email = String(normalizedQuery.email).trim().toLowerCase();
    }

    if (normalizedQuery.username) {
      normalizedQuery.username = String(normalizedQuery.username).trim();
    }

    if (normalizedQuery.role) {
      if (typeof normalizedQuery.role === 'string') {
        normalizedQuery.role = normalizeRole(normalizedQuery.role);
      } else if (normalizedQuery.role.$in && Array.isArray(normalizedQuery.role.$in)) {
        normalizedQuery.role = {
          ...normalizedQuery.role,
          $in: normalizedQuery.role.$in.map((value) => normalizeRole(value)),
        };
      }
    }

    if (Array.isArray(normalizedQuery.$or)) {
      normalizedQuery.$or = normalizedQuery.$or.map((clause) => {
        const normalizedClause = { ...clause };
        if (normalizedClause.email) {
          normalizedClause.email = String(normalizedClause.email).trim().toLowerCase();
        }
        if (normalizedClause.username) {
          normalizedClause.username = String(normalizedClause.username).trim();
        }
        if (normalizedClause.role) {
          normalizedClause.role = normalizeRole(normalizedClause.role);
        }
        return normalizedClause;
      });
    }

    if (isMongoConnected()) {
      try {
        return await MongooseUser.find(normalizedQuery);
      } catch (err) {
        console.error('Mongoose find error, falling back to memory:', err);
      }
    }

    const matchesQuery = (user) => {
      if (normalizedQuery._id && String(user._id) !== String(normalizedQuery._id)) return false;
      if (normalizedQuery.email && user.email !== normalizedQuery.email) return false;
      if (normalizedQuery.username && user.username !== normalizedQuery.username) return false;
      if (normalizedQuery.emailVerified !== undefined && user.emailVerified !== normalizedQuery.emailVerified) return false;
      if (normalizedQuery.role) {
        if (typeof normalizedQuery.role === 'string' && normalizeRole(user.role) !== normalizedQuery.role) return false;
        if (normalizedQuery.role.$in && Array.isArray(normalizedQuery.role.$in) && !normalizedQuery.role.$in.includes(normalizeRole(user.role))) return false;
      }
      if (normalizedQuery.$or && Array.isArray(normalizedQuery.$or)) {
        const matchesAny = normalizedQuery.$or.some((clause) => {
          if (clause.email && user.email === clause.email) return true;
          if (clause.username && user.username === clause.username) return true;
          if (clause.role && normalizeRole(user.role) === normalizeRole(clause.role)) return true;
          return false;
        });
        if (!matchesAny) return false;
      }
      return true;
    };

    return global.memoryUsers.filter(matchesQuery);
  },

  countDocuments: async (query = {}) => {
    const users = await User.find(query);
    return users.length;
  },

  create: async (data, options = {}) => {
    const requestedRole = normalizeRole(data.role || 'user');
    if (requestedRole === 'admin' && !options.allowAdminCreation) {
      throw new Error('Admin users can only be created through the secure bootstrap flow.');
    }

    const safeRole = ROLE_VALUES.has(requestedRole) ? requestedRole : 'user';
    const userData = {
      username: String(data.username || '').trim(),
      email: String(data.email || '').trim().toLowerCase(),
      password: data.password,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : false,
      role: safeRole,
      profilePicture: data.profilePicture || '',
      verificationOTP: data.verificationOTP || null,
      otpExpires: data.otpExpires || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      try {
        const mongoUser = await MongooseUser.create(userData);
        return mongoUser;
      } catch (err) {
        console.error('Mongoose create error, falling back to memory:', err);
      }
    }

    const inMemUser = {
      _id: 'mem_' + Math.random().toString(36).substring(2, 11),
      ...userData,
    };
    global.memoryUsers.push(inMemUser);
    return inMemUser;
  },

  findById: async (id) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongooseUser.findById(id);
      } catch (err) {
        console.error('Mongoose findById error, falling back to memory:', err);
      }
    }
    return global.memoryUsers.find(u => String(u._id) === String(id));
  },

  findByIdAndUpdate: async (id, update, mongooseOptions = { new: true }, options = {}) => {
    const nextRole = normalizeRole(update?.$set?.role ?? update?.role ?? '');
    if (nextRole === 'admin' && !options.allowAdminRole) {
      throw new Error('Admin role changes must use the transfer flow.');
    }

    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongooseUser.findByIdAndUpdate(id, update, mongooseOptions);
      } catch (err) {
        console.error('Mongoose findByIdAndUpdate error, falling back to memory:', err);
      }
    }

    const index = global.memoryUsers.findIndex(u => String(u._id) === String(id));
    if (index !== -1) {
      const updatedUser = {
        ...global.memoryUsers[index],
        ...(update.$set || update),
        updatedAt: new Date(),
      };
      if (nextRole) {
        updatedUser.role = nextRole;
      }
      global.memoryUsers[index] = updatedUser;
      return updatedUser;
    }
    return null;
  },
};

module.exports = User;
