import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        role: {
            type: String,
            enum: ["student", "admin"],
            required: true,
            default: "student"
        },
        otpHash: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }
        },
        attempts: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

passwordResetTokenSchema.index({ email: 1, role: 1 }, { unique: true });

export default mongoose.model("PasswordResetToken", passwordResetTokenSchema);
