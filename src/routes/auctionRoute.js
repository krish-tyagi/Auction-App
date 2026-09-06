const express = require("express");

const {
    createAuction,
    getAuctions,
    getAuctionById,
    updateAuction,
    deleteAuction
} = require("../controller/auctionController");

const authMiddleware = require("../middleware/auth");

const router = express.Router();


router.get("/", getAuctions);
router.get("/:id", getAuctionById);


router.post("/", authMiddleware, createAuction);
router.patch("/:id", authMiddleware, updateAuction);
router.delete("/:id", authMiddleware, deleteAuction);

module.exports = router;