
import { sendEmail } from "../utils/sendEmail.js";

export async function sendRegistrationOtpEmail({ email, name, otp }) {
    const subject = "Verify your Student Community Platform account";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Verify your account</h2>
            <p>Hello ${name},</p>
            <p>Your one-time password for Student Community Platform is:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
            <p>This code expires in 5 minutes.</p>
        </div>
    `;
    await sendEmail({ to: email, subject, html });
}

export async function sendPasswordResetOtpEmail({ email, otp }) {
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
    await sendEmail({ to: email, subject, html });
}
