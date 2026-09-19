const jwt = require("jsonwebtoken");
const User = require("../models/user");

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!await user.checkPassword(password)) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        res.status(200).json({
            user: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

module.exports = {
    signup,
    login,
    getCurrentUser
};