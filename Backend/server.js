// Top-level imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const SocietyRoutes = require("./routes/societyRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const cashBookRoutes = require("./routes/cashBookRoutes");
const accountHeadRoutes = require("./routes/accountHeadsRoutes");

dotenv.config();

const app = express();

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            
            // List of allowed origins
            const allowedOrigins = [
                "https://audit-frontend-zeta.vercel.app",
                "http://localhost:5173"
            ];
            
            // Check if the origin matches any allowed pattern
            if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                return callback(null, true);
            }
            
            // For development, log the origin that's being blocked
            console.log('Blocked CORS origin:', origin);
            return callback(new Error('Not allowed by CORS'));
        },
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
        credentials: true,
    })
);

// Handle preflight requests for all routes
app.options("*", cors());

// **Parse JSON BEFORE routes**
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/societies", SocietyRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/cashbook", cashBookRoutes);
app.use("/api/account-heads", accountHeadRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB with better error handling for Vercel
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
});

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Start server - but for Vercel, we export the app
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
