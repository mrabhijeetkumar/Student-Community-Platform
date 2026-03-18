import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30
        },
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: function requiredPassword() {
                return this.authProvider === "local";
            },
            select: false
        },

        profilePhoto: {
            type: String,
            default: ""
        },

        coverPhoto: {
            type: String,
            default: ""
        },

        headline: {
            type: String,
            default: ""
        },

        bio: {
            type: String,
            default: ""
        },

        college: {
            type: String,
            default: ""
        },

        skills: [{
            type: String,
            trim: true
        }],

        socialLinks: {
            github: {
                type: String,
                default: ""
            },
            linkedin: {
                type: String,
                default: ""
            },
            twitter: {
                type: String,
                default: ""
            },
            portfolio: {
                type: String,
                default: ""
            }
        },

        role: {
            type: String,
            enum: ["student", "admin"],
            default: "student"
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },

        googleId: {
            type: String,
            default: ""
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        emailVerifiedAt: {
            type: Date,
            default: null
        },

        otpHash: {
            type: String,
            default: null
        },

        otpExpiresAt: {
            type: Date,
            default: null
        },

        otpAttempts: {
            type: Number,
            default: 0
        },

        otpLastSentAt: {
            type: Date,
            default: null
        },

        lastLoginAt: {
            type: Date,
            default: null
        },

        lastSeenAt: {
            type: Date,
            default: null
        },

        followers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        following: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        isPrivate: {
            type: Boolean,
            default: false
        },

        followRequestsReceived: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        followRequestsSent: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        isBanned: {
            type: Boolean,
            default: false
        },

        bannedAt: {
            type: Date,
            default: null
        }

    },
    { timestamps: true }
);

userSchema.index({ email: 1, role: 1 }, { unique: true });

export default mongoose.model("User", userSchema);