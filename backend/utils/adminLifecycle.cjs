const bcrypt = require('bcryptjs');
const User = require('../models/User.cjs');

const OFFICIAL_ROLES = ['official', 'employee', 'staff', 'moderator'];

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const isOfficialRole = (role) => OFFICIAL_ROLES.includes(normalizeRole(role));

const getAdminUsers = async () => User.find({ role: 'admin' });

const getTransferTargets = async () => {
  const users = await User.find({
    role: { $in: OFFICIAL_ROLES },
    emailVerified: true,
  });

  return users
    .filter((user) => normalizeRole(user.role) !== 'admin')
    .map((user) => ({
      id: String(user._id),
      username: user.username,
      email: user.email,
      role: normalizeRole(user.role),
      profilePicture: user.profilePicture || '',
      createdAt: user.createdAt,
    }));
};

const bootstrapAdminFromEnv = async () => {
  const adminName = String(process.env.FIXDIT_ADMIN_NAME || '').trim();
  const adminEmail = String(process.env.FIXDIT_ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.FIXDIT_ADMIN_PASSWORD || '');
  const adminUsername = String(process.env.FIXDIT_ADMIN_USERNAME || '').trim();

  if (!adminName || !adminEmail || !adminPassword) {
    return { created: false, skipped: true, reason: 'missing-env' };
  }

  const existingAdmins = await getAdminUsers();
  if (existingAdmins.length > 0) {
    return { created: false, skipped: true, reason: 'admin-already-exists' };
  }

  const derivedUsername = adminUsername || adminName.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || adminEmail.split('@')[0];
  const existingAccount = await User.findOne({ $or: [{ email: adminEmail }, { username: derivedUsername }] });
  if (existingAccount) {
    throw new Error('Bootstrap admin email or username already exists. Refusing to auto-promote an existing account.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  const createdAdmin = await User.create(
    {
      username: derivedUsername,
      email: adminEmail,
      password: hashedPassword,
      emailVerified: true,
      role: 'admin',
      profilePicture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(derivedUsername)}`,
    },
    { allowAdminCreation: true }
  );

  return {
    created: true,
    skipped: false,
    admin: {
      id: String(createdAdmin._id),
      username: createdAdmin.username,
      email: createdAdmin.email,
      role: createdAdmin.role,
    },
  };
};

const transferAdminRole = async ({ requesterId, targetUserId }) => {
  const requester = await User.findById(requesterId);
  const target = await User.findById(targetUserId);

  if (!requester || normalizeRole(requester.role) !== 'admin') {
    throw new Error('Only the active administrator can transfer admin privileges.');
  }

  if (!target) {
    throw new Error('Selected official account was not found.');
  }

  if (String(requester._id) === String(target._id)) {
    throw new Error('The current administrator cannot transfer admin privileges to themselves.');
  }

  if (!isOfficialRole(target.role)) {
    throw new Error('Admin privileges can only be transferred to an existing official account.');
  }

  const activeAdmins = await getAdminUsers();
  if (activeAdmins.length !== 1 || String(activeAdmins[0]._id) !== String(requester._id)) {
    throw new Error('The system must have exactly one active administrator before transfer.');
  }

  const mongooseConnected = User.MongooseModel?.db?.readyState === 1;

  if (mongooseConnected && !String(requester._id).startsWith('mem_') && !String(target._id).startsWith('mem_')) {
    const session = await User.MongooseModel.startSession();
    try {
      let updatedRequester;
      let updatedTarget;

      await session.withTransaction(async () => {
        updatedRequester = await User.MongooseModel.findOneAndUpdate(
          { _id: requester._id, role: 'admin' },
          { $set: { role: 'official' } },
          { new: true, session }
        );

        if (!updatedRequester) {
          throw new Error('Current administrator could not be downgraded.');
        }

        updatedTarget = await User.MongooseModel.findOneAndUpdate(
          { _id: target._id, role: { $in: OFFICIAL_ROLES } },
          { $set: { role: 'admin' } },
          { new: true, session }
        );

        if (!updatedTarget) {
          throw new Error('Selected official could not be promoted.');
        }
      });

      return {
        previousAdmin: {
          id: String(updatedRequester._id),
          username: updatedRequester.username,
          email: updatedRequester.email,
          role: updatedRequester.role,
        },
        newAdmin: {
          id: String(updatedTarget._id),
          username: updatedTarget.username,
          email: updatedTarget.email,
          role: updatedTarget.role,
        },
      };
    } finally {
      session.endSession();
    }
  }

  const requesterIndex = global.memoryUsers.findIndex((user) => String(user._id) === String(requester._id));
  const targetIndex = global.memoryUsers.findIndex((user) => String(user._id) === String(target._id));

  if (requesterIndex === -1 || targetIndex === -1) {
    throw new Error('Unable to complete the transfer in memory mode.');
  }

  const nextRequester = {
    ...global.memoryUsers[requesterIndex],
    role: 'official',
    updatedAt: new Date(),
  };
  const nextTarget = {
    ...global.memoryUsers[targetIndex],
    role: 'admin',
    updatedAt: new Date(),
  };

  global.memoryUsers[requesterIndex] = nextRequester;
  global.memoryUsers[targetIndex] = nextTarget;

  return {
    previousAdmin: {
      id: String(nextRequester._id),
      username: nextRequester.username,
      email: nextRequester.email,
      role: nextRequester.role,
    },
    newAdmin: {
      id: String(nextTarget._id),
      username: nextTarget.username,
      email: nextTarget.email,
      role: nextTarget.role,
    },
  };
};

module.exports = {
  OFFICIAL_ROLES,
  bootstrapAdminFromEnv,
  getTransferTargets,
  transferAdminRole,
};
