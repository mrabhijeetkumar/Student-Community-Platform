import express from "express";
import { body } from "express-validator";
import {
    forgotPassword,
    getSession,
    loginUser,
    loginWithGoogle,
    requestRegistrationVerification,
    resendRegistrationVerification,
    resetPassword,
    verifyRegistrationToken
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import { validatePasswordStrength } from "../services/authService.js";
import { authSensitiveLimiter, loginLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";

const router = express.Router();

const sendVerificationValidators = [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email required"),
    body("password")
        .isString().withMessage("Password is required")
        .custom((value) => {
            const result = validatePasswordStrength(value);
            if (!result.valid) {
                throw new Error(result.message);
            }
            return true;
        })
];

const verifyTokenValidators = [
    body("token").trim().notEmpty().withMessage("Verification token is required")
];

router.post(
    "/request-verification",
    otpLimiter,
    sendVerificationValidators,
    validateRequest,
    requestRegistrationVerification
);

router.post(
    "/request-otp",
    otpLimiter,
    sendVerificationValidators,
    validateRequest,
    requestRegistrationVerification
);

router.post(
    "/resend-verification",
    otpLimiter,
    [body("email").trim().isEmail().withMessage("Valid email required")],
    validateRequest,
    resendRegistrationVerification
);

router.post(
    "/verify-registration",
    verifyTokenValidators,
    validateRequest,
    verifyRegistrationToken
);

router.post(
    "/register",
    verifyTokenValidators,
    validateRequest,
    verifyRegistrationToken
);

router.post(
    "/login",
    loginLimiter,
    [
        body("email").trim().isEmail().withMessage("Valid email required"),
        body("password").isString().notEmpty().withMessage("Password is required"),
        body("role").optional().isIn(["student", "admin"]).withMessage("Invalid role")
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

router.post(
    "/forgot-password",
    otpLimiter,
    [
        body("email").trim().isEmail().withMessage("Valid email required"),
        body("role").optional().isIn(["student", "admin"]).withMessage("Invalid role")
    ],
    validateRequest,
    forgotPassword
);

router.post(
    "/reset-password",
    authSensitiveLimiter,
    [
        body("email").trim().isEmail().withMessage("Valid email required"),
        body("role").optional().isIn(["student", "admin"]).withMessage("Invalid role"),
        body("otp").matches(/^\d{6}$/).withMessage("OTP must be 6 digits"),
        body("newPassword")
            .isString().withMessage("Password is required")
            .custom((value) => {
                const result = validatePasswordStrength(value);
                if (!result.valid) {
                    throw new Error(result.message);
                }
                return true;
            })
    ],
    validateRequest,
    resetPassword
);

router.get("/session", protect, getSession);

export default router;
