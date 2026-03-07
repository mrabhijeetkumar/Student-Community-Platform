import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { buildPostResponse, getLatestFeed, getFollowingFeed, getSmartFeed, getTrendingFeed } from "../services/feedService.js";
import { createNotification } from "../services/notificationService.js";

export const createPost = async (req, res) => {
    try {
        const content = req.body?.content?.trim();

        if (!content) {
            return res.status(400).json({ message: "Post content is required" });
        }

        const post = await Post.create({
            author: req.user._id,
            content,
            images: Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [],
            tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : []
        });

        await post.populate("author", "name username profilePhoto headline college");
        res.status(201).json(buildPostResponse(post));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPostsFeed = async (req, res) => {
    try {
        const type = req.query.type || "smart";
        const limit = Number(req.query.limit || 20);

        let posts;

        if (type === "latest") {
            posts = await getLatestFeed(limit);
        } else if (type === "following") {
            posts = await getFollowingFeed(req.user, limit);
        } else if (type === "trending") {
            posts = await getTrendingFeed(limit);
        } else {
            posts = await getSmartFeed(req.user, limit);
        }

        res.json(posts.map(buildPostResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .populate("author", "name username profilePhoto headline college")
            .sort({ createdAt: -1 });

        res.json(posts.map(buildPostResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "You cannot edit this post" });
        }

        post.content = req.body.content?.trim() || post.content;
        post.images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : post.images;
        post.tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : post.tags;
        post.editedAt = new Date();
        await post.save();
        await post.populate("author", "name username profilePhoto headline college");

        res.json(buildPostResponse(post));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "You cannot delete this post" });
        }

        await Promise.all([
            Post.deleteOne({ _id: post._id }),
            Comment.deleteMany({ postId: post._id })
        ]);

        res.json({ message: "Post deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const index = post.likes.findIndex(
            (like) => like.toString() === req.user._id.toString()
        );

        if (index === -1) {
            post.likes.push(req.user._id);

            if (post.author.toString() !== req.user._id.toString()) {
                await createNotification({
                    userId: post.author,
                    actorId: req.user._id,
                    type: "like",
                    title: "New like on your post",
                    message: `${req.user.name} liked your post.`,
                    link: "/"
                });
            }
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        await post.populate("author", "name username profilePhoto headline college");
        res.json(buildPostResponse(post));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};