import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },

        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        repliesCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);