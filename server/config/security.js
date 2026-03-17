const DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "https://studentcommunityplatform.netlify.app"
];

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/$/, "");

export const getAllowedOrigins = () => {
    const envOrigins = [
        process.env.CLIENT_URL,
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [])
    ];

    return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]
        .map(normalizeOrigin)
        .filter(Boolean))];
};

export const validateRuntimeConfig = () => {
    const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    const secret = process.env.JWT_SECRET || "";

    if (process.env.NODE_ENV === "production" && secret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters in production");
    }

    if (process.env.NODE_ENV !== "production" && ["studenthub_secret", "changeme", "secret"].includes(secret)) {
        console.warn("[security] Weak JWT_SECRET detected for development. Use a stronger secret before production deployment.");
    }
    if (!process.env.CLIENT_URL) {
        console.warn("[security] CLIENT_URL is not set. Email verification links may be incorrect.");
    }

    if (!process.env.BREVO_API_KEY) {
        console.warn("[security] BREVO_API_KEY is missing. Verification and password emails will fail.");
    }
};
