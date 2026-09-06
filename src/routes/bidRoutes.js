const express = require("express");

const { placeBid } = require("../controller/bidController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/",authMiddleware,placeBid);

module.exports = router;