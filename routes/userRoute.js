const { Router } = require("express");

const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeMiddleware = require("../middlewares/authorizeMiddleware");

const router = Router();
//Get all users
router.get(
  "/",
  authMiddleware.protect,
  authorizeMiddleware.allow("mod", "admin"),
  userController.getAllUsers
);

//Get user by id
router.get("/:id", userController.getUserById);

//delete user
router.delete("/:id", userController.deleteUser);

//Add new user
router.post("/", userController.addUser);

//Update user
router.patch("/:id", userController.updateUser);

module.exports = router;
