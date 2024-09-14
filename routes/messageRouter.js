const { Router } = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware"); // Protect routes (assuming you have this middleware)

const router = Router();

// Route to send a new message in a channel
router.post(
  "/:channelId",
  authMiddleware.protect,
  messageController.sendMessageInChannel
);

// Route to get all messages from a specific channel
router.get(
  "/:channelId",
  authMiddleware.protect,
  messageController.getMessagesByChannel
);

// Route to edit a message (assuming the message belongs to the user)
router.patch(
  "/:messageId",
  authMiddleware.protect,
  messageController.editMessageInChannel
);

// Route to delete a message (assuming the message belongs to the user or a moderator)
router.delete(
  "/:messageId",
  authMiddleware.protect,
  messageController.deleteMessageInChannel
);

router.patch(
  "/marking/markAsRead",
  authMiddleware.protect,
  messageController.markMessagesAsRead
);

// Start or create a conversation
router.post("/conversations", conversationController.startConversation);

// Send a message in a conversation
router.post(
  "/conversations/:conversationId",
  messageController.sendMessageInConversation
);

// Get all messages in a conversation
router.get(
  "/conversations/:conversationId",
  messageController.getMessagesByConversation
);

module.exports = router;
