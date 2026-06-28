const mongoose = require('mongoose');

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
    if (isMongoConnected()) {
      try {
        return await MongooseUser.findOne(query);
      } catch (err) {
        console.error('Mongoose findOne error, falling back to memory:', err);
      }
    }
    
    return global.memoryUsers.find(u => {
      if (query.email && u.email === query.email.toLowerCase()) return true;
      if (query.username && u.username === query.username) return true;
      if (query.verificationOTP && u.verificationOTP === query.verificationOTP) return true;
      
      if (query.$or && Array.isArray(query.$or)) {
        return query.$or.some(q => {
          if (q.email && u.email === q.email.toLowerCase()) return true;
          if (q.username && u.username === q.username) return true;
          return false;
        });
      }
      return false;
    });
  },

  create: async (data) => {
    const userData = {
      username: data.username,
      email: data.email.toLowerCase(),
      password: data.password,
      emailVerified: data.emailVerified !== undefined ? data.emailVerified : false,
      role: data.role || 'user',
      profilePicture: data.profilePicture || '',
      verificationOTP: data.verificationOTP || '',
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

  findByIdAndUpdate: async (id, update) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongooseUser.findByIdAndUpdate(id, update, { new: true });
      } catch (err) {
        console.error('Mongoose findByIdAndUpdate error, falling back to memory:', err);
      }
    }

    const index = global.memoryUsers.findIndex(u => String(u._id) === String(id));
    if (index !== -1) {
      const updatedUser = {
        ...global.memoryUsers[index],
        ...update,
        updatedAt: new Date(),
      };
      global.memoryUsers[index] = updatedUser;
      return updatedUser;
    }
    return null;
  },
};

module.exports = User;
