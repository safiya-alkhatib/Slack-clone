require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
// const dotenv = require("dotenv");
const userRouter = require("./routes/userRoute");
const authRouter = require("./routes/authRouter");
const messageRouter = require("./routes/messageRouter");
const channelRouter = require("./routes/channelRouter");
const conversationRouter = require("./routes/conversationRouter");

const app = express();
app.use(express.json()); //this line must be added to allow the express to read from json

async function connectDB() {
  try {
    const connection = await mongoose.connect(
      "mongodb://127.0.0.1:27017/slack_clone"
    );
    //print connection established to the console
    console.log("Connection established successfully");
  } catch (error) {}
}
connectDB();

//Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/channels", channelRouter);
app.use("/api/v1/conversations", conversationRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
