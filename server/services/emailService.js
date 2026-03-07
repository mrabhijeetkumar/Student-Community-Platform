import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
    if (transporter) {
        return transporter;
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }

    transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || "gmail",
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

    await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        html
    });

    return { preview: false };
};