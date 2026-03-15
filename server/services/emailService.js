import nodemailer from "nodemailer";
import { Resend } from "resend";

let transporter;
let resendClient;
let resendClientApiKey = "";
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || 10000);

const isProduction = () => process.env.NODE_ENV === "production";

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

const buildEmailAuthError = () => {
    const error = new Error("Email provider authentication failed. Please contact support.");
    error.statusCode = 503;
    return error;
};

const readSmtpConfig = () => {
    const smtpUser = String(process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
    const smtpPass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");
    const smtpHost = String(process.env.SMTP_HOST || "smtp.gmail.com").trim();
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const smtpFrom = String(process.env.SMTP_FROM || process.env.EMAIL_FROM || `StudentHub <${smtpUser}>`).trim();

    return {
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpHost,
        smtpPort,
        smtpSecure
    };
};

const readResendConfig = () => {
    const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
    const emailFrom = String(process.env.EMAIL_FROM || process.env.SMTP_FROM || "").trim();

    return {
        resendApiKey,
        emailFrom
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
        return buildEmailAuthError();
    }

    if (
        message.includes("api key")
        || message.includes("unauthorized")
        || message.includes("forbidden")
    ) {
        return buildEmailAuthError();
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
        return null;
    }

    transporter = nodemailer.createTransport({
        host: smtpConfig.smtpHost,
        port: smtpConfig.smtpPort,
        secure: smtpConfig.smtpSecure,
        auth: {
            user: smtpConfig.smtpUser,
            pass: smtpConfig.smtpPass
        },
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS
    });

    return transporter;
};

const getResendClient = () => {
    const resendConfig = readResendConfig();

    if (!resendConfig.resendApiKey || !resendConfig.emailFrom) {
        throw buildEmailNotConfiguredError();
    }

    if (!resendClient || resendClientApiKey !== resendConfig.resendApiKey) {
        resendClient = new Resend(resendConfig.resendApiKey);
        resendClientApiKey = resendConfig.resendApiKey;
    }

    return {
        client: resendClient,
        emailFrom: resendConfig.emailFrom
    };
};

const sendWithResendTimeout = async ({ to, subject, html }) => {
    const { client, emailFrom } = getResendClient();
    let timer;

    try {
        const result = await Promise.race([
            client.emails.send({
                from: emailFrom,
                to,
                subject,
                html
            }),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(buildEmailTimeoutError()), EMAIL_SEND_TIMEOUT_MS);
            })
        ]);

        if (result?.error) {
            const resendError = new Error(result.error.message || "Failed to send email with Resend");
            resendError.code = result.error.name || "RESEND_ERROR";
            throw resendError;
        }
    } finally {
        clearTimeout(timer);
    }
};

const sendEmail = async ({ email, subject, html }) => {
    if (isProduction()) {
        await sendWithResendTimeout({ to: email, subject, html });
        return { preview: false };
    }

    const mailer = getTransporter();

    if (!mailer) {
        console.log("OTP sent to:", email);
        return { preview: true };
    }

    const smtpConfig = readSmtpConfig();
    await sendMailWithTimeout(mailer, {
        from: smtpConfig.smtpFrom,
        to: email,
        subject,
        html
    });

    return { preview: false };
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
        return await sendEmail({ email, subject, html });
    } catch (error) {
        console.error("[email] registration OTP send failed", {
            provider: isProduction() ? "resend" : "smtp",
            code: error?.code,
            command: error?.command,
            responseCode: error?.responseCode,
            message: error?.message
        });
        throw normalizeMailError(error);
    }
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
        return await sendEmail({ email, subject, html });
    } catch (error) {
        console.error("[email] password reset OTP send failed", {
            provider: isProduction() ? "resend" : "smtp",
            code: error?.code,
            command: error?.command,
            responseCode: error?.responseCode,
            message: error?.message
        });
        throw normalizeMailError(error);
    }
};