const { Router } = require("express");
const channelController = require("../controllers/channelController");
const authMiddleware = require("../middlewares/authMiddleware"); // Protect routes (assuming you have this middleware)

const router = Router();

// Route to create a new channel
router.post("/", authMiddleware.protect, channelController.createChannel);

// Route to get all public channels or those where the user is a member
router.get("/", authMiddleware.protect, channelController.getChannels);

// Route to add a user to a channel (invite)
router.post(
  "/addUser",
  authMiddleware.protect,
  channelController.addUserToChannel
);

// Route to delete a channel
router.delete(
  "/:channelId",
  authMiddleware.protect,
  channelController.deleteChannel
);

// PATCH - Update channel details (only by channel creator)
router.patch(
  "/:channelId",
  authMiddleware.protect,
  channelController.updateChannelDetails
);

// Assign a role to a user in a channel by channelId
router.post(
  "/:channelId/assignRole",
  authMiddleware.protect,
  channelController.assignRole
);

// Logged in user exits the channel
router.delete(
  "/:channelId/exit",
  authMiddleware.protect,
  channelController.exitChannel
);

// Owner or Admin deletes a user from the channel
router.delete(
  "/:channelId/removeUser",
  authMiddleware.protect,
  channelController.removeUserFromChannel
);

module.exports = router;
