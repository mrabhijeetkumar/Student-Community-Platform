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

// Rate limits by the *account* being targeted (normalized email), not just
// the caller's IP. This stops an attacker from spraying login/OTP attempts
// against one specific account from many different IP addresses to dodge
// the per-IP limiter above (credential stuffing / distributed brute force).
const buildEmailLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = String(req.body?.email || "").trim().toLowerCase();
        return email || req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({ message });
    }
});

export const loginLimiter = buildLimiter(15 * 60 * 1000, 8, "Too many login attempts. Try again later.");
export const loginEmailLimiter = buildEmailLimiter(15 * 60 * 1000, 6, "Too many login attempts for this account. Try again later.");
export const otpLimiter = buildLimiter(10 * 60 * 1000, 5, "Too many OTP requests. Try again later.");
export const otpEmailLimiter = buildEmailLimiter(10 * 60 * 1000, 4, "Too many requests for this email. Try again later.");
export const authSensitiveLimiter = buildLimiter(10 * 60 * 1000, 6, "Too many authentication requests. Try again later.");

// Prevent spam on write operations
export const createPostLimiter = buildLimiter(5 * 60 * 1000, 10, "You're posting too fast. Please wait a few minutes.");
export const createCommentLimiter = buildLimiter(5 * 60 * 1000, 30, "Too many comments in a short time. Please slow down.");
export const sendMessageLimiter = buildLimiter(60 * 1000, 40, "Too many messages. Please wait a moment.");
export const changePasswordLimiter = buildLimiter(15 * 60 * 1000, 6, "Too many password change attempts. Try again later.");