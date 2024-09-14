const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Channel name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Channel name should be at least 3 characters long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        lastSeen: {
          type: Date,
          default: null, // Track the last time the user interacted with the channel
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Ensure there is at least one member in the channel
channelSchema.pre("save", function (next) {
  if (this.members.length === 0) {
    return next(new Error("A channel must have at least one member."));
  }
  next();
});

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel;
