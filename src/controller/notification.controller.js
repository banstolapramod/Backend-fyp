const { Notification } = require("../models");

exports.createNotification = async (req, res) => {
  const notification = await Notification.create(req.body);
  res.status(201).json(notification);
};

exports.getUserNotifications = async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.params.userId },
    order: [["created_at", "DESC"]],
  });
  res.json(notifications);
};

exports.markAsRead = async (req, res) => {
  await Notification.update(
    { is_read: true },
    { where: { notification_id: req.params.id } }
  );
  res.json({ message: "Marked as read" });
};
