const Auction = require("../models/auction");


const createAuction = async (req, res) => {
    try {
        const {
            title,
            description,
            startingPrice,
            minimumBidIncrement,
            startTime,
            endTime
        } = req.body;

        if (!title || !description || startingPrice===undefined || minimumBidIncrement===undefined || !startTime || !endTime
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (startingPrice < 0 || minimumBidIncrement <= 0) {
            return res.status(400).json({
                message: "Invalid price or bid increment"
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: "Invalid date format"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        const now = new Date();

        let status;

        if (now < start) {
            status = "upcoming";
        } else if (now >= start && now < end) {
            status = "active";
        } else {
            return res.status(400).json({
                message: "Auction end time cannot be in the past"
            });
        }

        const auction = new Auction({
            title,
            description,
            seller: req.user._id,
            startingPrice,
            currentPrice: startingPrice,
            minimumBidIncrement,
            startTime: start,
            endTime: end,
            status
        });

        await auction.save();

        res.status(201).json({
            message: "Auction created successfully",
            auction
        });

    } catch (error) {
        console.error("Create auction error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};



const getAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find()
            .populate("seller", "firstName lastName email")
            .populate("highestBidder", "firstName lastName email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: auctions.length,
            auctions
        });

    } catch (error) {
        console.error("Get auctions error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const getAuctionById = async (req, res) => {
    try {
        const { id } = req.params;

        const auction = await Auction.findById(id)
            .populate("seller", "name email")
            .populate("highestBidder", "name email");

        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }

        res.status(200).json({
            auction
        });

    } catch (error) {
        console.error("Get auction error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid auction ID"
            });
        }

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const updateAuction = async (req, res) => {
    try {
        const { id } = req.params;

        const auction = await Auction.findById(id);

        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }

        if (!auction.seller.equals(req.user._id)) {
            return res.status(403).json({
                message: "You are not allowed to update this auction"
            });
        }

        if (auction.status !== "upcoming") {
            return res.status(400).json({
                message: "Only upcoming auctions can be updated"
            });
        }

        const {
            title,
            description,
            startingPrice,
            minimumBidIncrement,
            startTime,
            endTime
        } = req.body;

        if (title !== undefined) {
            auction.title = title;
        }

        if (description !== undefined) {
            auction.description = description;
        }

        if (startingPrice !== undefined) {
            if (startingPrice < 0) {
                return res.status(400).json({
                    message: "Starting price cannot be negative"
                });
            }

            auction.startingPrice = startingPrice;
            auction.currentPrice = startingPrice;
        }

        if (minimumBidIncrement !== undefined) {
            if (minimumBidIncrement <= 0) {
                return res.status(400).json({
                    message: "Minimum bid increment must be greater than 0"
                });
            }

            auction.minimumBidIncrement = minimumBidIncrement;
        }

        if (startTime !== undefined) {
            auction.startTime = new Date(startTime);
        }

        if (endTime !== undefined) {
            auction.endTime = new Date(endTime);
        }

        if (auction.endTime <= auction.startTime) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        if (auction.endTime <= new Date()) {
            return res.status(400).json({
                message: "End time must be in the future"
            });
        }

        await auction.save();

        res.status(200).json({
            message: "Auction updated successfully",
            auction
        });

    } catch (error) {
        console.error("Update auction error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid auction ID"
            });
        }

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const deleteAuction = async (req, res) => {
    try {
        const { id } = req.params;

        const auction = await Auction.findById(id);

        if (!auction) {
            return res.status(404).json({
                message: "Auction not found"
            });
        }

        if (!auction.seller.equals(req.user._id)) {
            return res.status(403).json({
                message: "You are not allowed to delete this auction"
            });
        }

        if (auction.status !== "upcoming") {
            return res.status(400).json({
                message: "Only upcoming auctions can be deleted"
            });
        }

        await Auction.findByIdAndDelete(id);

        res.status(200).json({
            message: "Auction deleted successfully"
        });

    } catch (error) {
        console.error("Delete auction error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid auction ID"
            });
        }

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createAuction,
    getAuctions,
    getAuctionById,
    updateAuction,
    deleteAuction
};