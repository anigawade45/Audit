const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        // Fetch the user from DB to ensure they still exist & are valid
        const user = await User.findById(decoded.userId).select("-passwordHash");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
        };

        next();
    } catch (err) {
        console.error("JWT verification error:", err.message);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = { requireAuth };
