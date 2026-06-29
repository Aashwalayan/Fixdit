const mongoose = require('mongoose');

const officialApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    governmentEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    proofDocument: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseOfficialApplication = mongoose.models.OfficialApplication || mongoose.model('OfficialApplication', officialApplicationSchema);

if (!global.memoryOfficialApplications) {
  global.memoryOfficialApplications = [];
}

const isMongoConnected = () => mongoose.connection.readyState === 1;

const OfficialApplication = {
  schema: officialApplicationSchema,
  MongooseModel: MongooseOfficialApplication,

  find: async (query = {}) => {
    if (isMongoConnected()) {
      try {
        return await MongooseOfficialApplication.find(query)
          .populate('applicant', 'username email profilePicture role displayName department designation')
          .populate('reviewedBy', 'username email role displayName');
      } catch (err) {
        console.error('OfficialApplication find error, falling back to memory:', err);
      }
    }

    return global.memoryOfficialApplications.filter((application) => {
      if (query.status && application.status !== query.status) return false;
      if (query.applicant && String(application.applicant) !== String(query.applicant)) return false;
      return true;
    });
  },

  findOne: async (query = {}) => {
    const results = await OfficialApplication.find(query);
    return results[0] || null;
  },

  findById: async (id) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongooseOfficialApplication.findById(id)
          .populate('applicant', 'username email profilePicture role displayName department designation')
          .populate('reviewedBy', 'username email role displayName');
      } catch (err) {
        console.error('OfficialApplication findById error, falling back to memory:', err);
      }
    }

    return global.memoryOfficialApplications.find((application) => String(application._id) === String(id)) || null;
  },

  create: async (data) => {
    const applicationData = {
      applicant: data.applicant,
      fullName: String(data.fullName || '').trim(),
      department: String(data.department || '').trim(),
      designation: String(data.designation || '').trim(),
      employeeId: String(data.employeeId || '').trim(),
      governmentEmail: String(data.governmentEmail || '').trim().toLowerCase(),
      proofDocument: String(data.proofDocument || '').trim(),
      status: data.status || 'pending',
      rejectionReason: String(data.rejectionReason || '').trim(),
      reviewedBy: data.reviewedBy || null,
      reviewedAt: data.reviewedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      try {
        return await MongooseOfficialApplication.create(applicationData);
      } catch (err) {
        console.error('OfficialApplication create error, falling back to memory:', err);
      }
    }

    const inMemApplication = {
      _id: 'mem_application_' + Math.random().toString(36).substring(2, 11),
      ...applicationData,
    };
    global.memoryOfficialApplications.push(inMemApplication);
    return inMemApplication;
  },

  findByIdAndUpdate: async (id, update, options = { new: true }) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongooseOfficialApplication.findByIdAndUpdate(id, update, options)
          .populate('applicant', 'username email profilePicture role displayName department designation')
          .populate('reviewedBy', 'username email role displayName');
      } catch (err) {
        console.error('OfficialApplication findByIdAndUpdate error, falling back to memory:', err);
      }
    }

    const index = global.memoryOfficialApplications.findIndex((application) => String(application._id) === String(id));
    if (index === -1) return null;

    const updatedApplication = {
      ...global.memoryOfficialApplications[index],
      ...(update.$set || update),
      updatedAt: new Date(),
    };

    global.memoryOfficialApplications[index] = updatedApplication;
    return updatedApplication;
  },
};

module.exports = OfficialApplication;
