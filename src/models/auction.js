const mongoose=require('mongoose');

const auctionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        startingPrice: {
            type: Number,
            required: true,
            min: 0
        },

        currentPrice: {
            type: Number,
            required: true,
            min: 0
        },

        minimumBidIncrement: {
            type: Number,
            required: true,
            min: 1
        },

        highestBidder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            default: null
        },

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["upcoming", "active", "ended", "cancelled"],
            default: "upcoming"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('auction', auctionSchema);