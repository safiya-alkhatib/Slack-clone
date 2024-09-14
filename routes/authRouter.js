const { Router } = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const authRouter = Router();

//Register
authRouter.post("/register", authController.singup);
authRouter.post("/login", authController.login);
authRouter.post("/forgotpassword", authController.forgotPassword);
authRouter.post("/resetpassword/:token", authController.resetPassword);
authRouter.patch(
  "/updatepassword",
  authMiddleware.protect,
  authController.updatePassword
);

module.exports = authRouter;
