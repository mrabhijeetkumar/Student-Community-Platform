import express from "express";
import { body } from "express-validator";
import {
    getSession,
    loginUser,
    loginWithGoogle,
    registerUser,
    requestRegistrationOtp
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import { loginLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

router.post(
    "/request-otp",
    otpLimiter,
    [
        body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
        body("email").isEmail().withMessage("Valid email required"),
        body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    ],
    validateRequest,
    requestRegistrationOtp
);

router.post(
    "/register",
    [
        body("email").isEmail().withMessage("Valid email required"),
        body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
    ],
    validateRequest,
    registerUser
);

router.post(
    "/login",
    loginLimiter,
    [
        body("email").isEmail().withMessage("Valid email required"),
        body("password").notEmpty().withMessage("Password is required")
    ],
    validateRequest,
    loginUser
);

router.post(
    "/google",
    [body("idToken").notEmpty().withMessage("Google token is required")],
    validateRequest,
    loginWithGoogle
);

router.get("/session", protect, getSession);

export default router;