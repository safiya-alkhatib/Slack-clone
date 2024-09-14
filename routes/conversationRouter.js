const express = require("express");
const conversationController = require("../controllers/conversationController");
const authMiddleware = require("../middlewares/authMiddleware"); // Assuming you have authentication middleware

const router = express.Router();

// Protect all routes below with the authMiddleware (user must be authenticated)
router.use(authMiddleware.protect);

// Create a new conversation
router.post("/create", conversationController.createConversation);

// Get all conversations for the authenticated user
router.get("/", conversationController.getConversations);

// Send a message in a conversation
router.post("/sendMessage", conversationController.sendMessage);

// Edit a message in a conversation
router.patch("/editMessage/:messageId", conversationController.editMessage);

// Delete a message in a conversation
router.delete(
  "/deleteMessage/:messageId",
  conversationController.deleteMessage
);

// // Forward a message (to a conversation or channel)
// router.post("/forwardMessage", conversationController.forwardMessage);

// Delete a conversation (exit a conversation)
router.delete("/:conversationId", conversationController.deleteConversation);

module.exports = router;
