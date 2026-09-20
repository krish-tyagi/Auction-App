const rateLimit = require("express-rate-limit");

// General API limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests from this IP, please try again after 15 minutes"
    }
});

// Auth limiter (signup/login): 10 requests per 15 minutes per IP (prevents brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many authentication attempts, please try again after 15 minutes"
    }
});

// Bidding limiter: max 10 bids per minute per IP (prevents bot bid spamming)
const bidLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many bid attempts, please slow down"
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    bidLimiter
};
