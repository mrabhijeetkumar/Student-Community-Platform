import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const blockedDomains = new Set([
    "10minutemail.com",
    "10minutemail.net",
    "mailinator.com",
    "guerrillamail.com",
    "temp-mail.org",
    "yopmail.com",
    "trashmail.com"
]);

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const assertAllowedGmail = (email) => {
    const normalizedEmail = normalizeEmail(email);
    const domain = normalizedEmail.split("@")[1] || "";

    if (blockedDomains.has(domain)) {
        throw new Error("Temporary email domains are not allowed");
    }

    if (!["gmail.com", "googlemail.com"].includes(domain)) {
        throw new Error("Only verified Gmail accounts are allowed");
    }

    return normalizedEmail;
};

export const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

export const createOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

export const getUserRoles = (user) => {
    if (Array.isArray(user?.roles) && user.roles.length > 0) {
        return [...new Set(user.roles)];
    }

    return user?.role ? [user.role] : ["student"];
};

export const hasRole = (user, role) => getUserRoles(user).includes(role);

export const buildSafeUser = (user, activeRole = null) => ({
    _id: user._id,
    username: user.username,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    coverPhoto: user.coverPhoto,
    headline: user.headline,
    bio: user.bio,
    college: user.college,
    skills: user.skills,
    socialLinks: user.socialLinks,
    role: activeRole || user.role,
    roles: getUserRoles(user),
    isPrivate: Boolean(user.isPrivate),
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
    followers: user.followers,
    following: user.following,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

export const buildAuthResponse = (user, activeRole = null) => ({
    token: generateToken(user, activeRole),
    user: buildSafeUser(user, activeRole)
});

const sanitizeUsername = (input) => input.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 24);

export const ensureUniqueUsername = async (seedValue) => {
    const base = sanitizeUsername(seedValue) || `student${Date.now()}`;
    let username = base;
    let counter = 1;

    while (await User.exists({ username })) {
        username = `${base}${counter}`.slice(0, 30);
        counter += 1;
    }

    return username;
};

export const validatePasswordStrength = (password = "") => {
    if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters" };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "Password must include at least one uppercase letter" };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, message: "Password must include at least one lowercase letter" };
    }

    if (!/\d/.test(password)) {
        return { valid: false, message: "Password must include at least one number" };
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return { valid: false, message: "Password must include at least one special character" };
    }

    return { valid: true };
};

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);
