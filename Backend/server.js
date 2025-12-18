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

// CORS
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
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/societies", SocietyRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/cashbook", cashBookRoutes);
app.use("/api/account-heads", accountHeadRoutes);

// Health check
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Error:", err));

// 🔴 REQUIRED FOR RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
