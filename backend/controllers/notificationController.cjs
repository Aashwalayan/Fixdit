const Notification = require('../models/Notification.cjs');

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const listMyNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const notifications = await Notification.find({ recipient: req.user._id });
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error(`List notifications error: ${error.message}`);
    return res.status(500).json({ error: 'Could not load notifications.' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { readAt: new Date() },
      { new: true }
    );

    if (!notification || String(notification.recipient?._id || notification.recipient) !== String(req.user._id)) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    return res.status(200).json({ notification });
  } catch (error) {
    console.error(`Mark notification read error: ${error.message}`);
    return res.status(500).json({ error: 'Could not update notification.' });
  }
};

const markAllRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const notifications = await Notification.find({ recipient: req.user._id });
    const unreadNotifications = notifications.filter((notification) => !notification.readAt);

    await Promise.all(
      unreadNotifications.map((notification) =>
        Notification.findByIdAndUpdate(notification._id, { readAt: new Date() }, { new: true })
      )
    );

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error(`Mark all notifications read error: ${error.message}`);
    return res.status(500).json({ error: 'Could not update notifications.' });
  }
};

const createNotification = async ({ recipient, type, title, message, metadata = {} }) => {
  if (!recipient) return null;
  return Notification.create({
    recipient,
    type,
    title,
    message,
    metadata,
  });
};

module.exports = {
  listMyNotifications,
  markNotificationRead,
  markAllRead,
  createNotification,
};
