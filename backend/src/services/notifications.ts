import { Notification } from '../models';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await Notification.create({
    userId,
    type,
    title,
    message,
    link,
    isRead: false,
  });
}

export async function getUserNotifications(userId: string, limit = 20) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
}

export async function markAllNotificationsRead(userId: string) {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false });
}
