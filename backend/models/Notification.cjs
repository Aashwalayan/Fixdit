const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const MongooseNotification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

if (!global.memoryNotifications) {
  global.memoryNotifications = [];
}

const isMongoConnected = () => mongoose.connection.readyState === 1;

const Notification = {
  schema: notificationSchema,
  MongooseModel: MongooseNotification,

  create: async (data) => {
    const notificationData = {
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      readAt: data.readAt || null,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isMongoConnected()) {
      try {
        return await MongooseNotification.create(notificationData);
      } catch (err) {
        console.error('Notification create error, falling back to memory:', err);
      }
    }

    const inMemNotification = {
      _id: 'mem_notification_' + Math.random().toString(36).substring(2, 11),
      ...notificationData,
    };
    global.memoryNotifications.push(inMemNotification);
    return inMemNotification;
  },

  find: async (query = {}) => {
    if (isMongoConnected()) {
      try {
        return await MongooseNotification.find(query)
          .populate('recipient', 'username email role displayName')
          .sort({ createdAt: -1 });
      } catch (err) {
        console.error('Notification find error, falling back to memory:', err);
      }
    }

    return global.memoryNotifications
      .filter((notification) => {
        if (query.recipient && String(notification.recipient) !== String(query.recipient)) return false;
        if (query.readAt !== undefined) {
          const isRead = notification.readAt !== null;
          if (query.readAt === null && isRead) return false;
          if (query.readAt !== null && !isRead) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findByIdAndUpdate: async (id, update, options = { new: true }) => {
    if (isMongoConnected() && !String(id).startsWith('mem_')) {
      try {
        return await MongooseNotification.findByIdAndUpdate(id, update, options);
      } catch (err) {
        console.error('Notification update error, falling back to memory:', err);
      }
    }

    const index = global.memoryNotifications.findIndex((notification) => String(notification._id) === String(id));
    if (index === -1) return null;

    const updatedNotification = {
      ...global.memoryNotifications[index],
      ...(update.$set || update),
      updatedAt: new Date(),
    };

    global.memoryNotifications[index] = updatedNotification;
    return updatedNotification;
  },
};

module.exports = Notification;
