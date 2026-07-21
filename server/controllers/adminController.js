import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Message from "../models/Message.js";
import { hasRole } from "../services/authService.js";

const getSuperAdminEmail = () => process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim() || "";

// GET /api/admin/stats
export const getStats = async (req, res) => {
    try {
        const [users, posts, comments, communities, messages] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Comment.countDocuments(),
            Community.countDocuments(),
            Message.countDocuments(),
        ]);

        res.json({ users, posts, comments, communities, messages });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch stats", error: error.message });
    }
};

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        // Bounded pagination — an unbounded User.find() could be used to pull
        // the entire user table (including emails) in one request as the
        // platform grows, which is both a performance and data-exposure risk.
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);

        const [users, total] = await Promise.all([
            User.find()
                .select("-password")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments()
        ]);

        res.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

// DELETE /api/admin/user/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        // Prevent any admin from deleting the primary super-admin account,
        // regardless of which admin endpoint is used.
        const superAdminEmail = getSuperAdminEmail();
        if (superAdminEmail && user.email === superAdminEmail && hasRole(user, "admin")) {
            return res.status(403).json({ message: "Cannot delete the super-admin account" });
        }

        await User.findByIdAndDelete(req.params.id);
        // Keep related data consistent with the rest of the platform when an
        // account is removed (previously left orphaned posts/comments/etc).
        await Promise.all([
            Post.deleteMany({ author: req.params.id }),
            Comment.deleteMany({ userId: req.params.id })
        ]);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
};

// DELETE /api/admin/post/:id
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        await Post.findByIdAndDelete(req.params.id);
        // Remove all comments belonging to this post
        await Comment.deleteMany({ postId: req.params.id });

        if (post.community) {
            await Community.findByIdAndUpdate(post.community, { $inc: { postsCount: -1 } });
        }

        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete post", error: error.message });
    }
};

// DELETE /api/admin/comment/:id
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        await Comment.findByIdAndDelete(req.params.id);
        // Keep the parent post's commentsCount accurate (previously left stale).
        await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete comment", error: error.message });
    }
};
