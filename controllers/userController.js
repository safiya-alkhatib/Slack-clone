const User = require("../models/user");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res
      .status(200)
      .send({ status: "success", result: users.length, data: users });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).send({ status: "success", data: user });
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }
    return res.status(200).send({ status: "success", data: user });
  } catch (error) {
    return res.status(500).send({ status: "fail", message: error.message });
  }
};
exports.deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }
    return res
      .status(200)
      .send({ status: "success", message: "User delteted successfully!" });
  } catch (error) {
    return res.status(500).send({ status: "fail", message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .send({ status: "fail", message: "User not found!" });
    }
    return res.status(200).send({ status: "success", data: user });
  } catch (error) {
    return res.status(500).send({ status: "fail", message: error.message });
  }
};
