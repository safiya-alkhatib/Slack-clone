const Conversation = require("../models/conversation");
const User = require("../models/user");
const Message = require("../models/message");
const Channel = require("../models/channel");

// Create a new one-to-one conversation
exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body; // The ID of the user to chat with
    const userId = req.user._id; // ID of the logged-in user

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    // Check if a conversation already exists between the two users
    const existingConversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
    });

    if (existingConversation) {
      return res.status(400).json({ message: "Conversation already exists" });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [userId, participantId],
      isGroup: false, // One-to-one conversation
    });

    res.status(201).json({
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating conversation", error: error.message });
  }
};

// Get All Conversations for a User
//Retrieve all one-to-one conversations where the user is a participant.
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isGroup: false, // Only one-to-one conversations
    }).populate("participants", "firstName lastName email"); // Populate participant details

    res.status(200).json({ status: "success", data: conversations });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};

// Send a message in a conversation
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    // Encrypt the message content (implement your own encryption method)
    const encryptedContent = encryptMessage(content);

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if the sender is a participant
    if (!conversation.participants.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this conversation" });
    }

    // Create the message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: encryptedContent,
    });

    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};

// Exit a Conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if the user is a participant
    if (!conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not a participant in this conversation" });
    }

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting conversation", error: error.message });
  }
};

// Edit a message in a conversation
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Encrypt the new message content
    const encryptedContent = encryptMessage(content);

    // Find and update the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the sender is the owner of the message
    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own messages" });
    }

    message.content = encryptedContent;
    message.edited = true;
    await message.save();

    res
      .status(200)
      .json({ message: "Message edited successfully", data: message });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error editing message", error: error.message });
  }
};

// Delete a message in a conversation
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the sender is the owner of the message
    if (message.sender.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting message", error: error.message });
  }
};

// // Forward a message to a conversation or a channel
// exports.forwardMessage = async (req, res) => {
//   try {
//     const { messageId, targetId, isChannel } = req.body; // targetId can be a conversation ID or a channel ID
//     const userId = req.user._id;

//     // Find the message
//     const message = await Message.findById(messageId);
//     if (!message) {
//       return res.status(404).json({ message: "Message not found" });
//     }

//     // Check if the sender is a participant or member in the target
//     if (isChannel) {
//       const channel = await Channel.findById(targetId);
//       if (
//         !channel ||
//         !channel.members.some(
//           (member) => member.user.toString() === userId.toString()
//         )
//       ) {
//         return res
//           .status(403)
//           .json({ message: "You are not a member of this channel" });
//       }
//     } else {
//       const conversation = await Conversation.findById(targetId);
//       if (!conversation || !conversation.participants.includes(userId)) {
//         return res
//           .status(403)
//           .json({ message: "You are not a participant in this conversation" });
//       }
//     }

//     // Create a new message in the target
//     const newMessage = await Message.create({
//       conversation: isChannel ? null : targetId,
//       channel: isChannel ? targetId : null,
//       sender: userId,
//       content: message.content, // Forward the original message content
//       forwarded: true,
//     });

//     res
//       .status(201)
//       .json({ message: "Message forwarded successfully", data: newMessage });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error forwarding message", error: error.message });
//   }
// };
