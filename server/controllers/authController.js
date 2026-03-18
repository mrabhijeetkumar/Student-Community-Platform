import crypto from "crypto";
import User from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import VerificationToken from "../models/VerificationToken.js";
import {
    assertAllowedGmail,
    buildAuthResponse,
    buildSafeUser,
    comparePassword,
    ensureUniqueUsername,
    hashPassword,
    normalizeEmail,
    validatePasswordStrength
} from "../services/authService.js";
import {
    sendPasswordResetOtpEmail,
    sendVerificationEmail
} from "../services/emailService.js";
import { verifyGoogleToken } from "../services/googleService.js";

const hashVerificationToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const createVerificationToken = () => crypto.randomBytes(32).toString("hex");

const getSuperAdminEmail = () => {
    const raw = process.env.SUPER_ADMIN_EMAIL;
    if (!raw) {
        return "";
    }

    return normalizeEmail(raw);
};

export const requestRegistrationVerification = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = assertAllowedGmail(email);
        const passwordValidation = validatePasswordStrength(password);

        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const existingUser = await User.findOne({ email: normalizedEmail, role: "student" });

        if (existingUser?.authProvider === "google") {
            return res.status(409).json({ message: "This account already exists with Google sign-in" });
        }

        if (existingUser?.isEmailVerified) {
            return res.status(409).json({ message: "A student account already exists for this email" });
        }

        const passwordHash = await hashPassword(password);
        const username = await ensureUniqueUsername(name || normalizedEmail.split("@")[0]);
        const rawToken = createVerificationToken();

        await VerificationToken.findOneAndUpdate(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                name,
                username,
                passwordHash,
                tokenHash: hashVerificationToken(rawToken),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0,
                lastSentAt: new Date()
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );

        const delivery = await sendVerificationEmail(normalizedEmail, rawToken);

        if (!delivery.success) {
            return res.status(delivery.statusCode || 502).json({
                message: delivery.message || "Unable to send verification email"
            });
        }

        res.status(200).json({
            message: "Verification link sent successfully",
            requestId: delivery.messageId
        });
    } catch (error) {
        console.error("[auth] requestRegistrationVerification failed", {
            code: error?.code,
            statusCode: error?.statusCode,
            message: error?.message
        });

        if (error?.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        return res.status(500).json({ message: "Verification email sending failed" });
    }
};

export const verifyRegistrationToken = async (req, res) => {
    try {
        const token = (req.body?.token || req.query?.token || "").trim();

        if (!token) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        const tokenDoc = await VerificationToken.findOne({ tokenHash: hashVerificationToken(token) });

        if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
            if (tokenDoc) {
                await VerificationToken.deleteOne({ _id: tokenDoc._id });
            }
            return res.status(400).json({ message: "Verification link expired or invalid" });
        }

        const existingUser = await User.findOne({ email: tokenDoc.email, role: "student" });

        if (existingUser?.isEmailVerified) {
            await VerificationToken.deleteOne({ _id: tokenDoc._id });
            return res.status(200).json({
                message: "Email already verified",
                ...buildAuthResponse(existingUser)
            });
        }

        let user;

        if (existingUser) {
            existingUser.name = tokenDoc.name;
            existingUser.username = tokenDoc.username;
            existingUser.password = tokenDoc.passwordHash;
            existingUser.authProvider = "local";
            existingUser.isEmailVerified = true;
            existingUser.emailVerifiedAt = new Date();
            existingUser.lastLoginAt = new Date();
            user = await existingUser.save();
        } else {
            user = await User.create({
                username: tokenDoc.username,
                name: tokenDoc.name,
                email: tokenDoc.email,
                password: tokenDoc.passwordHash,
                authProvider: "local",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                lastLoginAt: new Date()
            });
        }

        await VerificationToken.deleteOne({ _id: tokenDoc._id });

        res.status(201).json({
            message: "Registration successful",
            ...buildAuthResponse(user)
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const role = ["student", "admin"].includes(req.body.role) ? req.body.role : "student";
        const user = await User.findOne({ email, role }).select("+password");
        const superAdminEmail = getSuperAdminEmail();

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (role === "admin" && user.role !== "admin") {
            return res.status(403).json({ message: "Admin panel access is restricted" });
        }

        if (role === "admin" && superAdminEmail && user.email === superAdminEmail && user.role !== "admin") {
            return res.status(403).json({ message: "Primary admin account is not initialized yet" });
        }

        if (user.authProvider === "google") {
            return res.status(400).json({ message: "Use Google sign-in for this account" });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        const isMatch = await comparePassword(req.body.password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        user.lastLoginAt = new Date();
        await user.save();

        res.json({
            message: "Login successful",
            ...buildAuthResponse(user)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginWithGoogle = async (req, res) => {
    try {
        const payload = await verifyGoogleToken(req.body.idToken);

        if (!payload.email_verified) {
            return res.status(400).json({ message: "Google account email is not verified" });
        }

        const email = assertAllowedGmail(payload.email);
        let user = await User.findOne({ email, role: "student" });

        if (!user) {
            const username = await ensureUniqueUsername(payload.name || email.split("@")[0]);
            user = await User.create({
                username,
                name: payload.name,
                email,
                role: "student",
                googleId: payload.sub,
                authProvider: "google",
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
                profilePhoto: payload.picture || "",
                headline: "Student community member"
            });
        }

        user.lastLoginAt = new Date();
        user.googleId = payload.sub;
        user.profilePhoto = user.profilePhoto || payload.picture || "";
        await user.save();

        res.json({
            message: "Google login successful",
            ...buildAuthResponse(user)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getSession = async (req, res) => {
    res.json({ user: buildSafeUser(req.user) });
};

export const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const role = ["student", "admin"].includes(req.body.role) ? req.body.role : "student";
        const superAdminEmail = getSuperAdminEmail();
        const user = await User.findOne({ email, role });

        if (!user) {
            if (role === "admin") {
                return res.status(403).json({ message: "Admin access is not allowed for this email" });
            }

            return res.status(404).json({
                message: "Email not found. Please register first.",
                otpSent: false
            });
        }

        if (role === "admin" && user.role !== "admin") {
            return res.status(403).json({ message: "Admin access is not allowed for this email" });
        }

        if (role === "admin" && superAdminEmail && email === superAdminEmail && user.role !== "admin") {
            return res.status(403).json({ message: "Primary admin account is not active yet. Contact support." });
        }

        if (user.authProvider === "google") {
            return res.status(400).json({ message: "This account uses Google sign-in. Please login with Google." });
        }

        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

        await PasswordResetToken.findOneAndUpdate(
            { email, role },
            {
                email,
                role,
                otpHash: crypto.createHash("sha256").update(otp).digest("hex"),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );

        const delivery = await sendPasswordResetOtpEmail({ email, otp });

        if (!delivery.success) {
            return res.status(delivery.statusCode || 502).json({
                message: "Could not send password reset OTP"
            });
        }

        res.status(200).json({
            message: "If an account exists with this email, an OTP has been sent.",
            otpSent: true,
            requestId: delivery.messageId
        });
    } catch (error) {
        console.error("[auth] forgotPassword failed", {
            code: error?.code,
            statusCode: error?.statusCode,
            message: error?.message
        });

        if (error?.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        return res.status(500).json({ message: "Could not send password reset OTP" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const role = ["student", "admin"].includes(req.body.role) ? req.body.role : "student";
        const otp = String(req.body.otp || "");
        const { newPassword } = req.body;

        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const resetDoc = await PasswordResetToken.findOne({ email, role });
        if (!resetDoc || resetDoc.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        if (resetDoc.attempts >= 5) {
            return res.status(429).json({ message: "Too many invalid OTP attempts" });
        }

        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        if (resetDoc.otpHash !== otpHash) {
            resetDoc.attempts += 1;
            await resetDoc.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const user = await User.findOne({ email, role }).select("+password");
        const superAdminEmail = getSuperAdminEmail();
        if (!user) {
            await PasswordResetToken.deleteOne({ _id: resetDoc._id });
            return res.status(404).json({ message: "User not found" });
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        await PasswordResetToken.deleteOne({ _id: resetDoc._id });

        return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Could not reset password" });
    }
};
