const Channel = require("../models/channel");
const User = require("../models/user"); // Adjust the path according to your project structure

// Create a new channel
exports.createChannel = async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({ name });
    if (existingChannel) {
      return res.status(400).json({ message: "Channel name already exists" });
    }

    // Create new channel
    const channel = await Channel.create({
      name,
      description,
      isPrivate,
      createdBy: req.user._id, // Assuming req.user contains the authenticated user
      members: [
        {
          user: req.user._id, // Add creator as a member
          role: "owner", // Assign the role of owner to the creator
        },
      ],
      moderators: [req.user._id], // Add creator as a moderator
    });

    res
      .status(201)
      .json({ message: "Channel created successfully", data: channel });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating channel", error: error.message });
  }
};

// Get all channels (Public and those where user is a member)
exports.getChannels = async (req, res) => {
  try {
    const userId = req.user._id;

    const channels = await Channel.find({
      $or: [
        { isPrivate: false }, // Public channels
        { "members.user": userId }, // Channels where the user is a member
      ],
    })
      .populate("members.user", "firstName lastName email") // Populating members with user details
      .populate("createdBy", "firstName lastName") // Populating channel creator
      .populate("moderators", "firstName lastName"); // Populating moderators

    res.status(200).json({
      status: "success",
      data: channels,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Error fetching channels",
      error: error.message,
    });
  }
};

// Add a user to a channel (invite)
exports.addUserToChannel = async (req, res) => {
  try {
    const { channelId, userId } = req.body; // The ID of the user to add
    const requestingUserId = req.user._id; // The ID of the user making the request (assuming req.user is set via auth middleware)

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the user to be added is already a member
    const isUserAlreadyMember = channel.members.some(
      (member) => member.user && member.user.toString() === userId.toString()
    );
    if (isUserAlreadyMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of the channel" });
    }

    // Check if the channel is private
    if (channel.isPrivate) {
      // Ensure only the channel creator can add users to a private channel
      if (
        !channel.createdBy ||
        channel.createdBy.toString() !== requestingUserId.toString()
      ) {
        return res.status(403).json({
          message: "Only the creator can add users to this private channel",
        });
      }
    }

    // Add the user to the channel's members
    channel.members.push({ user: userId, role: "member" });
    await channel.save();

    res.status(200).json({
      message: "User added to channel successfully",
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding user to channel",
      error: error.message,
    });
  }
};

// Delete a channel
exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const requestingUserId = req.user.id; // Get the user making the request

    // Find the channel
    const channel = await Channel.findById(channelId);

    // Check if the channel exists
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the requesting user is the creator of the channel
    if (channel.createdBy.toString() !== requestingUserId) {
      return res
        .status(403)
        .json({ message: "Only the channel creator can delete this channel" });
    }

    // Delete the channel
    await Channel.findByIdAndDelete(channelId);

    res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting channel", error: error.message });
  }
};

// Update Channel Details
exports.updateChannelDetails = async (req, res) => {
  try {
    const { channelId } = req.params; // Channel ID from URL
    const requestingUserId = req.user.id; // User ID from auth middleware

    // Find the channel by ID
    const channel = await Channel.findById(channelId);

    // Check if the channel exists
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the requesting user is the creator of the channel
    if (channel.createdBy.toString() !== requestingUserId) {
      return res
        .status(403)
        .json({ message: "Only the channel creator can update this channel" });
    }

    // Define allowed updates (for example, name and isPrivate)
    const allowedUpdates = ["name", "isPrivate"];
    const updates = Object.keys(req.body);

    // Check if all requested updates are allowed
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ message: "Invalid updates!" });
    }

    // Apply the updates to the channel
    updates.forEach((update) => {
      channel[update] = req.body[update];
    });

    // Save the updated channel
    await channel.save();

    res.status(200).json({
      message: "Channel updated successfully",
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating channel",
      error: error.message,
    });
  }
};

// Assign a role to a user within a channel
exports.assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const { channelId } = req.params; // Get channelId from params

    // Check if the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the requesting user is the owner
    if (channel.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the channel owner can assign roles" });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the role is valid
    const validRoles = ["owner", "admin", "member"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if the user is already a member of the channel
    const userInChannel = channel.members.find(
      (member) => member.user && member.user.toString() === userId.toString()
    );
    if (!userInChannel) {
      return res
        .status(404)
        .json({ message: "User is not a member of the channel" });
    }

    // Assign the role to the user in the channel
    userInChannel.role = role;
    await channel.save();

    res.status(200).json({
      message: `User assigned the role of ${role} successfully`,
      data: channel,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error assigning role", error: error.message });
  }
};

// Owner or Admin removes a user from the channel
exports.removeUserFromChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.body; // Get userId from the body
    const requestingUserId = req.user._id; // Assuming req.user contains the authenticated user

    // Check if the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the requesting user is the owner or admin
    const requestingUserRole = channel.members.find(
      (member) =>
        member.user && member.user.toString() === requestingUserId.toString()
    )?.role;
    if (requestingUserRole !== "owner" && requestingUserRole !== "admin") {
      return res.status(403).json({
        message: "You do not have permission to remove users from this channel",
      });
    }

    // Check if the user to be removed is a member of the channel
    const userIndex = channel.members.findIndex(
      (member) => member.user && member.user.toString() === userId.toString()
    );
    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found in the channel" });
    }

    // Remove the user from the channel
    channel.members.splice(userIndex, 1);
    await channel.save();

    res.status(200).json({ message: "User removed from channel successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error removing user from channel",
      error: error.message,
    });
  }
};

// Allow a user to exit a channel by themselves
exports.exitChannel = async (req, res) => {
  try {
    const channelId = req.params.channelId; // The ID of the channel
    const userId = req.user._id; // The ID of the logged-in user

    // Check if the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the user is a member of the channel
    const userIndex = channel.members.findIndex(
      (member) => member.user && member.user.toString() === userId.toString()
    );
    if (userIndex === -1) {
      return res
        .status(404)
        .json({ message: "You are not a member of this channel" });
    }

    // Remove the user from the channel
    channel.members.splice(userIndex, 1);
    await channel.save();

    res.status(200).json({
      message: "You have successfully exited the channel",
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error exiting the channel",
      error: error.message,
    });
  }
};
