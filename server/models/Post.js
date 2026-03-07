import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        images: [{
            type: String,
            trim: true
        }],

        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],

        community: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Community",
            default: null
        },

        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        savedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        commentsCount: {
            type: Number,
            default: 0
        },

        editedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ community: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);