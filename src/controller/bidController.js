const mongoose = require("mongoose");

const Auction = require("../models/auction");
const Bid = require("../models/bid");

const placeBid = async (req, res) => {
    try {
        const {auctionid, amount } = req.body;

        if (amount === undefined || amount === null) {
            return res.status(400).json({
                message: "Bid amount is required"
            });
        }

        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({
                message: "Invalid bid amount"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(auctionid)) {
            return res.status(400).json({
                message: "Invalid auction ID"
            });
        }

        const auction = await Auction.findById(auctionid);

        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }

        if (auction.status !== "active") {
            return res.status(400).json({
                message: "Auction is not active"
            });
        }

        const now = new Date();

        if (now < auction.startTime) {
            return res.status(400).json({
                message: "Auction has not started yet"
            });
        }

        if (now >= auction.endTime) {
            return res.status(400).json({
                message: "Auction has ended"
            });
        }

        if (auction.seller.equals(req.user._id)) {
            return res.status(403).json({
                message: "Seller cannot bid on their own auction"
            });
        }

        const minimumBid =
            auction.currentPrice + auction.minimumBidIncrement;

        if (amount < minimumBid) {
            return res.status(400).json({
                message: `Bid must be at least ${minimumBid}`
            });
        }

        const updatedAuction = await Auction.findOneAndUpdate(
            {
                _id: auctionid,
                status: "active",
                currentPrice: auction.currentPrice
            },
            {
                $set: {
                    currentPrice: amount,
                    highestBidder: req.user._id
                }
            },
            {
                new: true
            }
        );

        if (!updatedAuction) {
            return res.status(409).json({
                message: "Bid rejected. Another bid was placed. Please try again."
            });
        }

        const bid = await Bid.create({
            auction: auctionid,
            bidder: req.user._id,
            amount
        });

        res.status(201).json({
            message: "Bid placed successfully",
            bid,
            auction: {
                id: updatedAuction._id,
                currentPrice: updatedAuction.currentPrice,
                highestBidder: updatedAuction.highestBidder
            }
        });

    } catch (error) {
        console.error("Place bid error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getMyBids = async (req, res) => {
    try {
        const bids = await Bid.find({
            bidder: req.user._id
        })
            .populate("auction", "title currentPrice status startTime endTime")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Your bids fetched successfully",
            count: bids.length,
            bids
        });

    } catch (error) {
        console.error("Get my bids error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getAuctionBids = async (req, res) => {
    try {
        const { auctionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(auctionId)) {
            return res.status(400).json({
                message: "Invalid auction ID"
            });
        }

        const auction = await Auction.findById(auctionId);

        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }

        const bids = await Bid.find({
            auction: auctionId
        })
            .populate("bidder", "name email")
            .sort({ amount: -1 });

        res.status(200).json({
            message: "Auction bids fetched successfully",
            auctionId,
            count: bids.length,
            bids
        });

    } catch (error) {
        console.error("Get auction bids error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    placeBid,
    getMyBids,
    getAuctionBids
};