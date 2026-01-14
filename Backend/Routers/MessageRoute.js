const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middleware/Authentication.js");
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getConversationDetails
} = require("../Controllers/MessageController.js");

// All routes require authentication
router.use(verifyToken);

// Get all conversations for current user
router.get("/conversations", getConversations);

// Create or get existing conversation
router.post("/conversations", getOrCreateConversation);

// Get conversation details
router.get("/conversations/:conversation_id", getConversationDetails);

// Get messages in a conversation
router.get("/conversations/:conversation_id/messages", getMessages);

// Send message in a conversation
router.post("/conversations/:conversation_id/messages", sendMessage);

module.exports = router;
