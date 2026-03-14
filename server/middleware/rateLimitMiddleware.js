import rateLimit from "express-rate-limit";

const buildLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
        res.status(429).json({ message });
    }
});

export const loginLimiter = buildLimiter(15 * 60 * 1000, 8, "Too many login attempts. Try again later.");
export const otpLimiter = buildLimiter(10 * 60 * 1000, 5, "Too many OTP requests. Try again later.");
export const authSensitiveLimiter = buildLimiter(10 * 60 * 1000, 6, "Too many authentication requests. Try again later.");

// Prevent spam on write operations
export const createPostLimiter = buildLimiter(5 * 60 * 1000, 10, "You're posting too fast. Please wait a few minutes.");
export const createCommentLimiter = buildLimiter(5 * 60 * 1000, 30, "Too many comments in a short time. Please slow down.");
export const sendMessageLimiter = buildLimiter(60 * 1000, 40, "Too many messages. Please wait a moment.");