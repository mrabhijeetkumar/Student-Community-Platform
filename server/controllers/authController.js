import User from "../models/User.js";
import VerificationToken from "../models/VerificationToken.js";
import {
    assertAllowedGmail,
    buildAuthResponse,
    buildSafeUser,
    comparePassword,
    createOtp,
    ensureUniqueUsername,
    hashOtp,
    hashPassword,
    normalizeEmail
} from "../services/authService.js";
import { sendRegistrationOtpEmail } from "../services/emailService.js";
import { verifyGoogleToken } from "../services/googleService.js";

export const requestRegistrationOtp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = assertAllowedGmail(email);

        if (await User.exists({ email: normalizedEmail })) {
            return res.status(409).json({ message: "An account already exists for this email" });
        }

        const otp = createOtp();
        const username = await ensureUniqueUsername(name || normalizedEmail.split("@")[0]);
        const passwordHash = await hashPassword(password);

        await VerificationToken.findOneAndUpdate(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                name,
                username,
                passwordHash,
                otpHash: hashOtp(otp),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        const delivery = await sendRegistrationOtpEmail({ email: normalizedEmail, name, otp });

        res.status(200).json({
            message: "OTP sent successfully",
            previewOtp: delivery.preview && process.env.NODE_ENV !== "production" ? otp : undefined
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const registerUser = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);
        const verification = await VerificationToken.findOne({ email: normalizedEmail });

        if (!verification || verification.expiresAt < new Date()) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }

        if (verification.attempts >= 5) {
            return res.status(429).json({ message: "Too many invalid OTP attempts" });
        }

        if (verification.otpHash !== hashOtp(req.body.otp)) {
            verification.attempts += 1;
            await verification.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const user = await User.create({
            username: verification.username,
            name: verification.name,
            email: verification.email,
            password: verification.passwordHash,
            authProvider: "local",
            isEmailVerified: true,
            emailVerifiedAt: new Date()
        });

        await VerificationToken.deleteOne({ _id: verification._id });

        res.status(201).json({
            message: "Registration successful",
            ...buildAuthResponse(user)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (user.authProvider === "google") {
            return res.status(400).json({ message: "Use Google sign-in for this account" });
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
        let user = await User.findOne({ email });

        if (!user) {
            const username = await ensureUniqueUsername(payload.name || email.split("@")[0]);
            user = await User.create({
                username,
                name: payload.name,
                email,
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