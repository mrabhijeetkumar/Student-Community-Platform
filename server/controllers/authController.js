import User from "../models/User.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import {
    assertAllowedGmail,
    buildAuthResponse,
    buildSafeUser,
    comparePassword,
    createOtp,
    ensureUniqueUsername,
    hashOtp,
    hashPassword,
    normalizeEmail,
    validatePasswordStrength
} from "../services/authService.js";
import { sendRegistrationOtpEmail, sendPasswordResetOtpEmail } from "../services/emailService.js";
import { verifyGoogleToken } from "../services/googleService.js";

export const requestRegistrationOtp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = assertAllowedGmail(email);
        const passwordValidation = validatePasswordStrength(password);

        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const otp = createOtp();
        const otpHash = hashOtp(otp);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const now = new Date();

        const existingUser = await User.findOne({ email: normalizedEmail, role: "student" }).select("+password");

        if (existingUser?.authProvider === "google") {
            return res.status(409).json({ message: "This account already exists with Google sign-in" });
        }

        if (existingUser?.isEmailVerified) {
            return res.status(409).json({ message: "A student account already exists for this email" });
        }

        if (
            existingUser?.otpLastSentAt
            && (Date.now() - existingUser.otpLastSentAt.getTime()) < 1000
        ) {
            return res.status(429).json({ message: "Please wait before requesting another OTP" });
        }

        const passwordHash = await hashPassword(password);

        if (existingUser) {
            existingUser.name = name;
            existingUser.password = passwordHash;
            existingUser.authProvider = "local";
            existingUser.otpHash = otpHash;
            existingUser.otpExpiresAt = otpExpiresAt;
            existingUser.otpAttempts = 0;
            existingUser.otpLastSentAt = now;
            await existingUser.save();
        } else {
            const username = await ensureUniqueUsername(name || normalizedEmail.split("@")[0]);

            await User.create({
                username,
                name,
                email: normalizedEmail,
                password: passwordHash,
                authProvider: "local",
                isEmailVerified: false,
                otpHash,
                otpExpiresAt,
                otpAttempts: 0,
                otpLastSentAt: now
            });
        }

        const delivery = await sendRegistrationOtpEmail({ email: normalizedEmail, name, otp });
        console.log("OTP sent to:", normalizedEmail);

        res.status(200).json({
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("[auth] requestRegistrationOtp failed", {
            code: error?.code,
            statusCode: error?.statusCode,
            message: error?.message
        });

        if (error?.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        return res.status(500).json({ message: "OTP sending failed" });
    }
};

export const registerUser = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);
        const user = await User.findOne({
            email: normalizedEmail,
            role: "student",
            authProvider: "local"
        }).select("+password");

        if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        if (user.otpAttempts >= 5) {
            return res.status(429).json({ message: "Too many invalid OTP attempts" });
        }

        if (user.otpHash !== hashOtp(req.body.otp)) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();
        user.otpHash = undefined;
        user.otpExpiresAt = null;
        user.otpAttempts = 0;
        user.otpLastSentAt = null;
        await user.save();

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

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (user.authProvider === "google") {
            return res.status(400).json({ message: "Use Google sign-in for this account" });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Please verify OTP before logging in" });
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
        const user = await User.findOne({ email, role });

        if (!user) {
            return res.status(200).json({ message: "If an account exists with this email, an OTP has been sent." });
        }

        if (user.authProvider === "google") {
            return res.status(400).json({ message: "This account uses Google sign-in. Please login with Google." });
        }

        const otp = createOtp();

        await PasswordResetToken.findOneAndUpdate(
            { email, role },
            {
                email,
                role,
                otpHash: hashOtp(otp),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );

        const delivery = await sendPasswordResetOtpEmail({ email, otp });

        res.status(200).json({
            message: "If an account exists with this email, an OTP has been sent."
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

        return res.status(500).json({ message: "OTP sending failed" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const role = ["student", "admin"].includes(req.body.role) ? req.body.role : "student";
        const { otp, newPassword } = req.body;
        const passwordValidation = validatePasswordStrength(newPassword);

        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const resetToken = await PasswordResetToken.findOne({ email, role });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        if (resetToken.attempts >= 5) {
            return res.status(429).json({ message: "Too many invalid attempts. Request a new OTP." });
        }

        if (resetToken.otpHash !== hashOtp(otp)) {
            resetToken.attempts += 1;
            await resetToken.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const user = await User.findOne({ email, role });
        if (!user) {
            return res.status(400).json({ message: "Account not found" });
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        await PasswordResetToken.deleteOne({ _id: resetToken._id });

        res.status(200).json({ message: "Password reset successful. You can now log in." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};