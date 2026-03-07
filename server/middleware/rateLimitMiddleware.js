import rateLimit from "express-rate-limit";

const buildLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
});

export const loginLimiter = buildLimiter(15 * 60 * 1000, 8, "Too many login attempts. Try again later.");
export const otpLimiter = buildLimiter(10 * 60 * 1000, 5, "Too many OTP requests. Try again later.");