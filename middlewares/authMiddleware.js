const jwt = require("jsonwebtoken");
const User = require("../models/user");
exports.protect = async (req, res, next) => {
  //Check if there is jwt
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send("No jwt");
    }
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("+isActive");
    if (!user) {
      return res.status(401).send({ status: "fail", message: "user deleted" });
    }
    if (!user.isActive) {
      return res.status(401).send({ status: "fail", message: "user inactive" });
    }
    const changedDate = new Date(user.passwordChangedAt).getTime() / 1000;
    if (changedDate > decoded.iat) {
      return res.status(401).send({
        status: "fail",
        message:
          "Password has been changed since last time, please login again",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).send({ status: "fail", message: error.message });
  }
};
