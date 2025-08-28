const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/UserRoutes");
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
                "http://localhost:5173",
                /\.vercel\.app$/ // Allow all Vercel deployments
            ];
            
            // Check if the origin matches any allowed pattern
            if (allowedOrigins.some(allowedOrigin => {
                if (typeof allowedOrigin === 'string') {
                    return origin === allowedOrigin;
                } else if (allowedOrigin instanceof RegExp) {
                    return allowedOrigin.test(origin);
                }
                return false;
            })) {
                return callback(null, true);
            }
            
            return callback(new Error('Not allowed by CORS'));
        },
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
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

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    });

app.get("/", (req, res) => {
    res.send("API is running...");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
