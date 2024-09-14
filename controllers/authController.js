const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
exports.singup = async (req, res) => {
  const body = req.body;
  try {
    if (body.password !== body.confirmPassword) {
      return res
        .status(500)
        .send({ status: "fail", message: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(body.password, 12);
    console.log(hashedPassword);
    body.password = hashedPassword;
    const user = await User.create(body);
    res.status(201).send({ status: "success", data: user });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.login = async (req, res) => {
  const body = req.body;
  try {
    if (!body.email || !body.password) {
      return res
        .status(400)
        .send({ status: "fail", message: "Provide email and password" });
    }
    const user = await User.findOne({ email: body.email });
    if (!user) {
      return res
        .status(400)
        .send({ status: "fail", message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ status: "fail", message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).send({ status: "success", token: token });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const email = req.body.email;
  try {
    if (!email) {
      return res
        .status(403)
        .send({ status: "fail", message: "Please provide an email" });
    }
    const user = await User.findOne({ email: email });
    if (!user)
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiresIn = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = hashedToken;
    user.passwordTokenExpiredAt = expiresIn;
    await user.save();
    res
      .status(200)
      .send({ status: "success", message: "Check your email", token: token });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res
        .status(404)
        .send({ status: "fail", message: "Not token provide" });
    }
    if (!req.body.password || !req.body.confirmPassword) {
      return res.status(404).send({
        status: "fail",
        message: "Pasword and confirm Passowrd are required",
      });
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(404).send({
        status: "fail",
        message: "Password do not match",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log(hashedToken);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      passwordTokenExpiredAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).send({
        status: "fail",
        message: "No user with this token or expired token",
      });
    }
    user.password = await bcrypt.hash(req.body.password, 12);
    user.resetPasswordToken = "";
    user.passwordChangedAt = Date.now();
    await user.save();
    res.status(200).send({ status: "success", message: "Password resetted" });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const body = req.body;
    if (!body.currentPassword || !body.newPassword || !body.confirmPassword) {
      return res.status(403).send({
        status: "fail",
        message: "Provide all fields",
      });
    }
    const match = await bcrypt.compare(body.currentPassword, req.user.password);
    if (!match) {
      return res.status(403).send({
        status: "fail",
        message: "Incorrect Password",
      });
    }
    if (body.newPassword !== body.confirmPassword) {
      return res.status(403).send({
        status: "fail",
        message: "Passwords do not match",
      });
    }
    const hashedPassword = await bcrypt.hash(body.newPassword, 12);
    const user = await User.findOneAndUpdate(req.user._id, {
      password: hashedPassword,
      passwordChangedAt: Date.now(),
    });
    if (!user) {
      return res.status(403).send({
        status: "fail",
        message: "Failed to update the password",
      });
    }
    const token = await jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
    res.status(200).send({ status: "success", token: token });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};
