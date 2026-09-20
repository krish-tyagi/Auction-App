const express = require("express");
const { signup, login, getCurrentUser } = require("../controller/authController");
const authMiddleware = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;