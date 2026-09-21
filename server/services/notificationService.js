const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Centralized Notification Service
 */

// Helper function to create notification idempotently
const createNotification = async (data) => {
  const {
    recipient,
    recipientRole = 'USER',
    type,
    title,
    message,
    relatedResourceType = 'ORDER',
    relatedResourceId = '',
    metadata = {},
    referenceId
  } = data;

  if (!recipient || !type || !title || !message) {
    throw new Error('Missing required fields for creating notification');
  }

  // Deduplication check via referenceId
  if (referenceId) {
    const existing = await Notification.findOne({ referenceId });
    if (existing) {
      return existing;
    }
  }

  try {
    const notification = await Notification.create({
      recipient,
      recipientRole,
      type,
      title,
      message,
      relatedResourceType,
      relatedResourceId: String(relatedResourceId),
      metadata,
      referenceId
    });
    return notification;
  } catch (error) {
    // If duplicate key error on referenceId due to race condition, find and return existing
    if (error.code === 11000 && referenceId) {
      return await Notification.findOne({ referenceId });
    }
    throw error;
  }
};

// Create a customer notification
const createCustomerNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedResourceType = 'ORDER',
  relatedResourceId = '',
  metadata = {},
  referenceId
}) => {
  return createNotification({
    recipient,
    recipientRole: 'USER',
    type,
    title,
    message,
    relatedResourceType,
    relatedResourceId,
    metadata,
    referenceId
  });
};

// Create admin notification(s) for all admin users
const createAdminNotification = async ({
  type,
  title,
  message,
  relatedResourceType = 'ORDER',
  relatedResourceId = '',
  metadata = {},
  referenceId
}) => {
  const admins = await User.find({ role: 'ADMIN' }).select('_id');
  const createdNotifications = [];

  for (const admin of admins) {
    const adminRefId = referenceId ? `${referenceId}_admin_${admin._id}` : undefined;
    const notif = await createNotification({
      recipient: admin._id,
      recipientRole: 'ADMIN',
      type,
      title,
      message,
      relatedResourceType,
      relatedResourceId,
      metadata,
      referenceId: adminRefId
    });
    if (notif) createdNotifications.push(notif);
  }

  return createdNotifications;
};

// Get notifications for a user with pagination & filtering
const getNotifications = async (recipientId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { recipient: recipientId };

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === 'true' || query.isRead === true;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: recipientId, isRead: false })
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

// Get unread notification count
const getUnreadCount = async (recipientId) => {
  const count = await Notification.countDocuments({ recipient: recipientId, isRead: false });
  return count;
};

// Mark single notification as read (with recipient ownership check)
const markAsRead = async (notificationId, recipientId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: recipientId
  });

  if (!notification) {
    return null;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

// Mark all notifications as read for a recipient
const markAllAsRead = async (recipientId) => {
  const result = await Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return result;
};

module.exports = {
  createNotification,
  createCustomerNotification,
  createAdminNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
