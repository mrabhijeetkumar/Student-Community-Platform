import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import connectDB from "./config/db.js";
import { getAllowedOrigins, validateRuntimeConfig } from "./config/security.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import sanitizeInput from "./middleware/sanitizeInput.js";

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import initializeSocket from "./socket/socket.js";
import Message from "./models/Message.js";
import User from "./models/User.js";

dotenv.config();
validateRuntimeConfig();

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// database connect
connectDB().then(async () => {
    // Auto-promote SUPER_ADMIN_EMAIL on every startup (idempotent)
    const superEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    if (superEmail) {
        try {
            // Only promote if there isn't already an admin account with this email
            const existingAdmin = await User.findOne({ email: superEmail, role: "admin" });
            if (!existingAdmin) {
                const result = await User.updateOne(
                    { email: superEmail, role: { $ne: "admin" } },
                    { $set: { role: "admin" } }
                );
                if (result.modifiedCount > 0) {
                    console.log(`[superadmin] Promoted ${superEmail} to admin`);
                }
            }
        } catch (err) {
            console.log(`[superadmin] Skip promotion: ${err.message}`);
        }
    }
});

// middlewares
const allowedOrigins = getAllowedOrigins();

app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
}));

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/$/, "");

        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200 // some browsers (IE11) choke on 204
}));

// handle preflight for all routes
app.options(/.*/, cors());
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(sanitizeInput);
app.use((req, res, next) => {
    req.models = { Message };
    next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/admin", adminRoutes);

// test route
app.get("/", (req, res) => {
    res.json({
        name: "Student Community Platform API",
        status: "ok"
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});