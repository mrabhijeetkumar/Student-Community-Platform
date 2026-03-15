import nodemailer from "nodemailer";

let transporter;
let resolvedSmtpConfig;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || 10000);

const buildEmailTimeoutError = () => {
    const error = new Error("Email service timeout. Please retry in a few seconds.");
    error.statusCode = 503;
    return error;
};

const buildEmailServiceUnavailableError = () => {
    const error = new Error("Email service unavailable right now. Please try again shortly.");
    error.statusCode = 503;
    return error;
};

const buildEmailNotConfiguredError = () => {
    const error = new Error("Email service is not configured on the server. Please contact support.");
    error.statusCode = 503;
    return error;
};

const readSmtpConfig = () => {
    if (resolvedSmtpConfig) {
        return resolvedSmtpConfig;
    }

    const smtpUser = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
    const smtpPass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");
    const smtpFrom = String(process.env.SMTP_FROM || process.env.EMAIL_FROM || smtpUser).trim();
    const smtpService = String(process.env.SMTP_SERVICE || "gmail").toLowerCase();
    const smtpHost = String(process.env.SMTP_HOST || "").trim();
    const smtpPort = Number(process.env.SMTP_PORT || (smtpHost === "smtp.gmail.com" ? 587 : 465));
    const smtpSecure = String(process.env.SMTP_SECURE || String(smtpPort === 465)).toLowerCase() === "true";

    resolvedSmtpConfig = {
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpService,
        smtpHost,
        smtpPort,
        smtpSecure
    };

    return resolvedSmtpConfig;
};

const buildTransportConfig = (smtpConfig) => {
    if (smtpConfig.smtpHost) {
        return {
            host: smtpConfig.smtpHost,
            port: smtpConfig.smtpPort,
            secure: smtpConfig.smtpSecure,
            requireTLS: !smtpConfig.smtpSecure,
            connectionTimeout: SMTP_TIMEOUT_MS,
            greetingTimeout: SMTP_TIMEOUT_MS,
            socketTimeout: SMTP_TIMEOUT_MS,
            auth: {
                user: smtpConfig.smtpUser,
                pass: smtpConfig.smtpPass
            }
        };
    }

    // Keep Gmail's built-in transport behavior as default unless host is explicitly set.
    return {
        service: smtpConfig.smtpService,
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
        auth: {
            user: smtpConfig.smtpUser,
            pass: smtpConfig.smtpPass
        }
    };
};

const normalizeMailError = (error) => {
    if (error?.statusCode) {
        return error;
    }

    const message = String(error?.message || "").toLowerCase();

    if (message.includes("connection timeout") || message.includes("timed out") || error?.code === "ETIMEDOUT") {
        return buildEmailServiceUnavailableError();
    }

    if (message.includes("invalid login") || error?.code === "EAUTH") {
        const authError = new Error("SMTP authentication failed. Please contact support.");
        authError.statusCode = 503;
        return authError;
    }

    return buildEmailServiceUnavailableError();
};

const sendMailWithTimeout = async (mailer, mailOptions) => {
    let timer;

    try {
        return await Promise.race([
            mailer.sendMail(mailOptions),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(buildEmailTimeoutError()), EMAIL_SEND_TIMEOUT_MS);
            })
        ]);
    } finally {
        clearTimeout(timer);
    }
};

const getTransporter = () => {
    if (transporter) {
        return transporter;
    }

    const smtpConfig = readSmtpConfig();

    if (!smtpConfig.smtpUser || !smtpConfig.smtpPass) {
        if (process.env.NODE_ENV === "production") {
            throw buildEmailNotConfiguredError();
        }

        return null;
    }

    transporter = nodemailer.createTransport(buildTransportConfig(smtpConfig));

    return transporter;
};

export const sendRegistrationOtpEmail = async ({ email, name, otp }) => {
    const subject = "Verify your Student Community Platform account";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Verify your account</h2>
            <p>Hello ${name},</p>
            <p>Your one-time password for Student Community Platform is:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
            <p>This code expires in 10 minutes.</p>
        </div>
    `;

    try {
        const mailer = getTransporter();

        if (!mailer) {
            console.log(`OTP for ${email}: ${otp}`);
            return { preview: true };
        }

        const smtpConfig = readSmtpConfig();
        await sendMailWithTimeout(mailer, {
            from: smtpConfig.smtpFrom,
            to: email,
            subject,
            html
        });
    } catch (error) {
        console.error("[email] registration OTP send failed", {
            code: error?.code,
            command: error?.command,
            responseCode: error?.responseCode,
            message: error?.message
        });
        throw normalizeMailError(error);
    }

    return { preview: false };
};

export const sendPasswordResetOtpEmail = async ({ email, otp }) => {
    const subject = "Reset your Student Community Platform password";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Use this OTP to proceed:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
            <p>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
    `;

    try {
        const mailer = getTransporter();

        if (!mailer) {
            console.log(`Password reset OTP for ${email}: ${otp}`);
            return { preview: true };
        }

        const smtpConfig = readSmtpConfig();
        await sendMailWithTimeout(mailer, {
            from: smtpConfig.smtpFrom,
            to: email,
            subject,
            html
        });
    } catch (error) {
        console.error("[email] password reset OTP send failed", {
            code: error?.code,
            command: error?.command,
            responseCode: error?.responseCode,
            message: error?.message
        });
        throw normalizeMailError(error);
    }

    return { preview: false };
};