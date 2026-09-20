const express = require("express");

const { placeBid,getMyBids,getAuctionBids } = require("../controller/bidController");
const authMiddleware = require("../middleware/auth");
const { bidLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/", authMiddleware, bidLimiter, placeBid);
router.get('/mybids',authMiddleware, getMyBids);
router.get('/:auctionId',authMiddleware, getAuctionBids);

module.exports = router;