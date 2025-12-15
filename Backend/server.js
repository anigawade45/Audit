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

// Define a single corsOptions object and reuse it
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            "https://audit-frontend-zeta.vercel.app",
            "http://localhost:5173"
        ];
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        console.log('Blocked CORS origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
// Handle preflight requests for all routes with SAME options

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

if (!MONGO_URI) {
    console.error("Missing MONGO_URI environment variable");
    // You can either throw or return early to avoid misleading runtime
    process.exit(1);
}

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
