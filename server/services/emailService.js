import nodemailer from "nodemailer";

let transporter;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || 10000);

const buildEmailTimeoutError = () => {
    const error = new Error("Email service timeout. Please retry in a few seconds.");
    error.statusCode = 503;
    return error;
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

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }

    transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || "gmail",
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    return transporter;
};

export const sendRegistrationOtpEmail = async ({ email, name, otp }) => {
    const mailer = getTransporter();
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

    if (!mailer) {
        console.log(`OTP for ${email}: ${otp}`);
        return { preview: true };
    }

    await sendMailWithTimeout(mailer, {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        html
    });

    return { preview: false };
};

export const sendPasswordResetOtpEmail = async ({ email, otp }) => {
    const mailer = getTransporter();
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

    if (!mailer) {
        console.log(`Password reset OTP for ${email}: ${otp}`);
        return { preview: true };
    }

    await sendMailWithTimeout(mailer, {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        html
    });

    return { preview: false };
};