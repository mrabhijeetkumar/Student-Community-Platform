import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
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

verificationTokenSchema.index({ userId: 1 }, { unique: true });
verificationTokenSchema.index({ tokenHash: 1 }, { unique: true });

export default mongoose.model("VerificationToken", verificationTokenSchema);
