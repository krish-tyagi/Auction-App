const cron = require("node-cron");
const Auction = require("../models/auction");

const startAuctionLifecycle = (io) => {

    let isRunning = false;

    cron.schedule("*/10 * * * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            const now = new Date();

            // 1. Find upcoming auctions that should become active
            const auctionsToStart = await Auction.find({
                status: "upcoming",
                startTime: { $lte: now },
                endTime: { $gt: now }
            });

            if (auctionsToStart.length > 0) {
                const startIds = auctionsToStart.map((a) => a._id);
                await Auction.updateMany(
                    { _id: { $in: startIds } },
                    { $set: { status: "active" } }
                );

                console.log(`${auctionsToStart.length} auction(s) started`);

                if (io) {
                    for (const auction of auctionsToStart) {
                        const auctionIdStr = auction._id.toString();
                        const payload = {
                            auctionId: auctionIdStr,
                            title: auction.title,
                            startingPrice: auction.startingPrice,
                            currentPrice: auction.currentPrice,
                            minimumBidIncrement: auction.minimumBidIncrement,
                            endTime: auction.endTime
                        };

                        // Broadcast to users in the auction room
                        io.to(auctionIdStr).emit("auctionStarted", payload);

                        // Broadcast globally to every connected user (e.g., homepage/catalog)
                        io.emit("auctionStarted", payload);
                    }
                }
            }

            // 2. Find auctions that should end (both active and upcoming past their endTime)
            const auctionsToEnd = await Auction.find({
                status: { $in: ["upcoming", "active"] },
                endTime: { $lte: now }
            }).populate("highestBidder", "firstName lastName email");

            if (auctionsToEnd.length > 0) {
                const endIds = auctionsToEnd.map((a) => a._id);
                await Auction.updateMany(
                    { _id: { $in: endIds } },
                    { $set: { status: "ended" } }
                );

                console.log(`${auctionsToEnd.length} auction(s) ended`);

                if (io) {
                    for (const auction of auctionsToEnd) {
                        const auctionIdStr = auction._id.toString();
                        const endPayload = {
                            auctionId: auctionIdStr,
                            title: auction.title,
                            finalPrice: auction.currentPrice,
                            winner: auction.highestBidder
                                ? {
                                      _id: auction.highestBidder._id,
                                      firstName: auction.highestBidder.firstName,
                                      lastName: auction.highestBidder.lastName,
                                      email: auction.highestBidder.email
                                  }
                                : null
                        };

                        io.to(auctionIdStr).emit("auctionEnded", endPayload);
                        io.emit("auctionEnded", endPayload);
                    }
                }
            }

        } catch (error) {
            console.error("Auction lifecycle error:", error);
        } finally {
            isRunning = false;
        }
    });

    console.log("Auction lifecycle job started");
};

module.exports = startAuctionLifecycle;