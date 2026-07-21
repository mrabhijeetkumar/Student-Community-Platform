import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        conversationKey: {
            type: String,
            index: true
        },
        readAt: {
            type: Date,
            default: null
        },
        deliveredAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

messageSchema.pre("validate", function setConversationKey() {
    if (this.sender && this.recipient) {
        this.conversationKey = [this.sender.toString(), this.recipient.toString()].sort().join(":");
    }
});

export default mongoose.model("Message", messageSchema);
