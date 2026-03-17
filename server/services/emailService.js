const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const getSender = () => ({
    name: process.env.BREVO_SENDER_NAME || "Student Community Platform",
    email: process.env.BREVO_SENDER_EMAIL || "noreply@studentcommunityplatform.com"
});

async function sendTransactionalEmail({ to, subject, htmlContent }) {
    if (!process.env.BREVO_API_KEY) {
        return {
            success: false,
            statusCode: 500,
            message: "BREVO_API_KEY is not configured"
        };
    }

    try {
        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: getSender(),
                to: [{ email: to }],
                subject,
                htmlContent
            })
        });

        if (!response.ok) {
            const details = await response.text();
            console.error("[email] Brevo API request failed", {
                status: response.status,
                details,
                to,
                subject
            });

            return {
                success: false,
                statusCode: response.status,
                message: "Unable to send email at the moment"
            };
        }

        return { success: true };
    } catch (error) {
        console.error("[email] Brevo API error", {
            message: error?.message,
            stack: error?.stack,
            to,
            subject
        });

        return {
            success: false,
            statusCode: 502,
            message: "Email delivery failed"
        };
    }
}

export async function sendVerificationEmail(email, token) {
    const verificationLink = `${CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Verify your Student Community account</h2>
            <p>Click below to verify your Gmail and complete account creation.</p>
            <p style="margin: 24px 0;">
                <a href="${verificationLink}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#1976d2;color:#fff;text-decoration:none;font-weight:700;">
                    Verify Email
                </a>
            </p>
            <p>This verification link expires in 10 minutes.</p>
            <p>If button doesn't work, use this URL:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
        </div>
    `;

    return sendTransactionalEmail({
        to: email,
        subject: "Verify your Student Community Platform account",
        htmlContent
    });
}

export async function sendPasswordResetOtpEmail({ email, otp }) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>We received a request to reset your password.</p>
            <p>Use this OTP to continue:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
            <p>This OTP expires in 10 minutes.</p>
        </div>
    `;

    return sendTransactionalEmail({
        to: email,
        subject: "Reset your Student Community Platform password",
        htmlContent
    });
}
