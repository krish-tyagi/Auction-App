const cron = require("node-cron");
const Auction = require("../models/auction");

const startAuctionLifecycle = () => {

    let isRunning = false;

    cron.schedule("*/10 * * * * *", async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            const now = new Date();

            const activated = await Auction.updateMany(
                {
                    status: "upcoming",
                    startTime: { $lte: now },
                    endTime: { $gt: now }
                },
                {
                    $set: {
                        status: "active"
                    }
                }
            );

            // Catch both active auctions and upcoming auctions whose endTime has passed
            const ended = await Auction.updateMany(
                {
                    status: { $in: ["upcoming", "active"] },
                    endTime: { $lte: now }
                },
                {
                    $set: {
                        status: "ended"
                    }
                }
            );

            if (activated.modifiedCount > 0) {
                console.log(
                    `${activated.modifiedCount} auction(s) started`
                );
            }

            if (ended.modifiedCount > 0) {
                console.log(
                    `${ended.modifiedCount} auction(s) ended`
                );
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