const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
const register = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // Required fields check
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if email or username already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            username,
            email,
            passwordHash: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!process.env.JWT_SECRET) {
            console.error("Missing JWT_SECRET environment variable");
            return res.status(500).json({ message: "Server misconfigured: JWT secret not set" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { register, login };
