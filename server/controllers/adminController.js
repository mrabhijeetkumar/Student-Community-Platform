import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Message from "../models/Message.js";

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
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(users);
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

        await User.findByIdAndDelete(req.params.id);

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

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete comment", error: error.message });
    }
};
