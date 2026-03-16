import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        throw new Error("Email service not configured");
    }
    try {
        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        if (result.error) throw new Error(result.error.message);
        return result;
    } catch (err) {
        throw new Error("Failed to send email: " + err.message);
    }
}
