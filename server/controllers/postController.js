import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import { buildPostResponse, getLatestFeed, getFollowingFeed, getSavedFeed, getSmartFeed, getTrendingFeed } from "../services/feedService.js";
import { createNotification } from "../services/notificationService.js";

export const createPost = async (req, res) => {
    try {
        const content = req.body?.content?.trim();

        if (!content) {
            return res.status(400).json({ message: "Post content is required" });
        }

        let community = null;

        if (req.body.communityId) {
            community = await Community.findById(req.body.communityId);

            if (!community) {
                return res.status(404).json({ message: "Community not found" });
            }
        }

        const post = await Post.create({
            author: req.user._id,
            content,
            images: Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [],
            tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [],
            community: community?._id || null
        });

        if (community) {
            community.postsCount += 1;
            await community.save();
        }

        await post.populate("author", "name username profilePhoto headline college");
        await post.populate("community", "name slug category coverGradient postsCount");
        res.status(201).json(buildPostResponse(post));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPostsFeed = async (req, res) => {
    try {
        const type = req.query.type || "smart";
        const limit = Number(req.query.limit || 20);
        const communityId = req.query.communityId || undefined;

        let posts;

        if (type === "latest") {
            posts = await getLatestFeed(limit, communityId);
        } else if (type === "following") {
            posts = await getFollowingFeed(req.user, limit, communityId);
        } else if (type === "trending") {
            posts = await getTrendingFeed(limit, communityId);
        } else if (type === "saved") {
            posts = await getSavedFeed(req.user, limit, communityId);
        } else {
            posts = await getSmartFeed(req.user, limit, communityId);
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
            .populate("community", "name slug category coverGradient postsCount")
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

        const nextCommunityId = Object.prototype.hasOwnProperty.call(req.body, "communityId") ? req.body.communityId || null : post.community?.toString() || null;

        if (nextCommunityId !== (post.community?.toString() || null)) {
            if (nextCommunityId) {
                const nextCommunity = await Community.findById(nextCommunityId);

                if (!nextCommunity) {
                    return res.status(404).json({ message: "Community not found" });
                }

                nextCommunity.postsCount += 1;
                await nextCommunity.save();
            }

            if (post.community) {
                await Community.findByIdAndUpdate(post.community, { $inc: { postsCount: -1 } });
            }
        }

        post.content = req.body.content?.trim() || post.content;
        post.images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : post.images;
        post.tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : post.tags;
        post.community = nextCommunityId;
        post.editedAt = new Date();
        await post.save();
        await post.populate("author", "name username profilePhoto headline college");
        await post.populate("community", "name slug category coverGradient postsCount");

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

        if (post.community) {
            await Community.findByIdAndUpdate(post.community, { $inc: { postsCount: -1 } });
        }

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
        await post.populate("community", "name slug category coverGradient postsCount");
        res.json(buildPostResponse(post));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleSave = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const index = post.savedBy.findIndex((savedUserId) => savedUserId.toString() === req.user._id.toString());

        if (index === -1) {
            post.savedBy.push(req.user._id);
        } else {
            post.savedBy.splice(index, 1);
        }

        await post.save();
        await post.populate("author", "name username profilePhoto headline college");
        await post.populate("community", "name slug category coverGradient postsCount");

        res.json(buildPostResponse(post));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
