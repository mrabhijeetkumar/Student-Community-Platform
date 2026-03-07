import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 400
        },
        category: {
            type: String,
            default: "General",
            trim: true
        },
        coverGradient: {
            type: String,
            default: "from-brand-500/30 to-accent-400/20"
        },
        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        featured: {
            type: Boolean,
            default: false
        },
        postsCount: {
            type: Number,
            default: 0
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    { timestamps: true }
);

communitySchema.index({ slug: 1 }, { unique: true });
communitySchema.index({ featured: 1, createdAt: -1 });

export default mongoose.model("Community", communitySchema);