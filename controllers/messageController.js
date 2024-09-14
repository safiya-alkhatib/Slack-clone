const Message = require("../models/message");
const Channel = require("../models/channel");

// Send a new message
exports.sendMessageInChannel = async (req, res) => {
  try {
    const { content } = req.body;
    const { channelId } = req.params; // Get channelId from params

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the user is a member of the channel
    const isMember = channel.members.some(
      (member) =>
        member.user && member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        message: "You must be a member of the channel to send a message",
      });
    }

    // Create new message
    const message = await Message.create({
      sender: req.user._id, // Assuming req.user contains the authenticated user
      content,
      channel: channelId,
    });

    // Update last seen for the sender
    channel.members.forEach((member) => {
      if (member.user.toString() === req.user._id.toString()) {
        member.lastSeen = Date.now(); // Update last seen timestamp
      }
    });

    await channel.save(); // Save the updated lastSeen timestamp

    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};

// Get all messages in a channel  and mark them as read
exports.getMessagesByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id; // Assuming req.user contains the authenticated user

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the user is a member of the channel
    const isMember = channel.members.some(
      (member) => member.user && member.user.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        message: "You must be a member of this channel to view messages",
      });
    }

    // Update last seen for the user in the channel
    channel.members.forEach((member) => {
      if (member.user.toString() === req.user._id.toString()) {
        member.lastSeen = Date.now(); // Update last seen timestamp
      }
    });

    await channel.save(); // Save the updated lastSeen timestamp

    // Get all messages from the channel
    const messages = await Message.find({ channel: channelId })
      .populate("sender", "firstName lastName profilePic")
      .sort("createdAt"); // Sort by created date

    // Mark all messages as read by the current user
    for (let message of messages) {
      if (!message.readBy.includes(req.user._id)) {
        message.readBy.push(req.user._id);
        await message.save();
      }
    }

    res.status(200).json({ data: messages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving messages", error: error.message });
  }
};

// Edit a message
exports.editMessageInChannel = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the logged-in user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to edit this message",
      });
    }

    // Update the message content
    message.content = content;
    await message.save();

    res.status(200).json({
      message: "Message updated successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error editing message",
      error: error.message,
    });
  }
};

// Delete a message
exports.deleteMessageInChannel = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id; // Assuming req.user contains the authenticated user

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Find the channel to check permissions
    const channel = await Channel.findById(message.channel);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the user is the sender of the message
    const isSender = message.sender.toString() === userId.toString();

    // Check if the user is the owner or an admin of the channel
    const isOwnerOrAdmin = channel.members.some(
      (member) =>
        member.user.toString() === userId.toString() &&
        (member.role === "owner" || member.role === "admin")
    );

    // Only allow deletion if the user is the sender, owner, or admin
    if (!isSender && !isOwnerOrAdmin) {
      return res.status(403).json({
        message: "You do not have permission to delete this message",
      });
    }

    // Delete the message
    // await message.remove();
    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting message",
      error: error.message,
    });
  }
};
// Mark one or multiple messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { messageId, messageIds } = req.body; // Can accept either a single messageId or an array of messageIds
    const userId = req.user._id; // Assuming the user's ID is in req.user

    // Check if both fields are empty
    if (!messageId && (!Array.isArray(messageIds) || messageIds.length === 0)) {
      return res.status(400).json({
        message: "Please provide a messageId or an array of messageIds",
      });
    }

    // Create an array to hold message IDs to process
    let messagesToMark = [];

    // If a single messageId is provided, push it into the array
    if (messageId) {
      messagesToMark.push(messageId);
    }

    // If an array of messageIds is provided, append it to the array
    if (Array.isArray(messageIds)) {
      messagesToMark = [...messagesToMark, ...messageIds];
    }

    // Use updateMany to update all messages in one go
    const result = await Message.updateMany(
      { _id: { $in: messagesToMark }, readBy: { $ne: userId } }, // Find messages that haven't been read by this user
      { $addToSet: { readBy: userId } } // Add the user to the readBy array
    );

    // If no messages were updated, it means they were either not found or already marked as read
    if (result.nModified === 0) {
      return res.status(404).json({
        message: "No messages updated, they may already be read or not found",
      });
    }

    res.status(200).json({ message: "Messages marked as read successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error marking messages as read",
      error: error.message,
    });
  }
};
