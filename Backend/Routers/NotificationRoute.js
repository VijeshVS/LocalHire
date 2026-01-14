const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middleware/Authentication.js");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  getUnreadCount
} = require("../Controllers/NotificationController.js");

// All routes require authentication
router.use(verifyToken);

// Get all notifications
router.get("/", getNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark single notification as read
router.patch("/:notification_id/read", markAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// Delete single notification
router.delete("/:notification_id", deleteNotification);

// Clear all notifications
router.delete("/", clearAll);

module.exports = router;
