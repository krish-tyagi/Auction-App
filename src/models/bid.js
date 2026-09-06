const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'auction',
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('bid', bidSchema);