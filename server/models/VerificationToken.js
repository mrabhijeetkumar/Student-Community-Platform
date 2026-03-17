import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        tokenHash: {
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
        },
        lastSentAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

export default mongoose.model("VerificationToken", verificationTokenSchema);
