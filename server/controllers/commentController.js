import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { createNotification } from "../services/notificationService.js";
import { broadcastFeedEvent } from "../socket/socket.js";

const buildCommentTree = (comments) => {
    const byId = new Map();
    const roots = [];

    comments.forEach((comment) => {
        byId.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
    });

    byId.forEach((comment) => {
        if (comment.parentComment) {
            const parent = byId.get(comment.parentComment.toString());
            if (parent) {
                parent.replies.push(comment);
                return;
            }
        }

        roots.push(comment);
    });

    return roots;
};

export const createComment = async (req, res) => {
    try {
        const text = req.body?.text?.trim();

        if (!text) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        const post = await Post.findById(req.params.postId).populate("author", "name username");

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const parentComment = req.body.parentComment || null;

        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent) {
                return res.status(404).json({ message: "Parent comment not found" });
            }
            parent.repliesCount += 1;
            await parent.save();
        }

        const comment = await Comment.create({
            postId: req.params.postId,
            userId: req.user._id,
            text,
            parentComment
        });

        post.commentsCount += 1;
        await post.save();

        await comment.populate("userId", "name username profilePhoto");

        if (post.author._id.toString() !== req.user._id.toString()) {
            await createNotification({
                userId: post.author._id,
                actorId: req.user._id,
                type: "comment",
                title: "New comment on your post",
                message: `${req.user.name} commented on your post.`,
                link: "/",
                meta: { postId: post._id }
            });
        }

        broadcastFeedEvent("comment:new", { postId: post._id.toString(), comment, commentsCount: post.commentsCount });
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId })
            .populate("userId", "name username profilePhoto")
            .sort({ createdAt: 1 });

        res.json(buildCommentTree(comments));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "You cannot delete this comment" });
        }

        await Comment.deleteOne({ _id: comment._id });
        await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

        if (comment.parentComment) {
            await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } });
        }

        broadcastFeedEvent("comment:deleted", { postId: comment.postId.toString(), commentId: comment._id.toString() });
        res.json({ message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};