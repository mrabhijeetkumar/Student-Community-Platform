import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import { buildPostResponse, getLatestFeed, getFollowingFeed, getSavedFeed, getSmartFeed, getTrendingFeed } from "../services/feedService.js";
import { createNotification } from "../services/notificationService.js";
import { broadcastFeedEvent } from "../socket/socket.js";

const hasUserVote = (entries = [], userId) => entries.some((entry) => entry.toString() === userId.toString());
const removeUserVote = (entries = [], userId) => entries.filter((entry) => entry.toString() !== userId.toString());

const applyVoteState = (post, userId, voteType) => {
    post.downvotes = post.downvotes || [];

    const alreadyUpvoted = hasUserVote(post.likes, userId);
    const alreadyDownvoted = hasUserVote(post.downvotes, userId);
    let becameUpvoted = false;

    if (voteType === "up") {
        if (alreadyUpvoted) {
            post.likes = removeUserVote(post.likes, userId);
        } else {
            post.likes.push(userId);
            post.downvotes = removeUserVote(post.downvotes, userId);
            becameUpvoted = true;
        }
    }

    if (voteType === "down") {
        if (alreadyDownvoted) {
            post.downvotes = removeUserVote(post.downvotes, userId);
        } else {
            post.downvotes.push(userId);
            post.likes = removeUserVote(post.likes, userId);
        }
    }

    if (voteType === "none") {
        post.likes = removeUserVote(post.likes, userId);
        post.downvotes = removeUserVote(post.downvotes, userId);
    }

    return { becameUpvoted };
};

export const createPost = async (req, res) => {
    try {
        const content = req.body?.content?.trim() || "";
        const incomingImages = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];

        if (!content && incomingImages.length === 0) {
            return res.status(400).json({ message: "Post must have content or at least one image" });
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
            images: incomingImages,
            tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [],
            community: community?._id || null
        });

        if (community) {
            community.postsCount += 1;
            await community.save();
        }

        await post.populate("author", "name username profilePhoto headline college");
        await post.populate("community", "name slug category coverGradient postsCount");
        const postData = buildPostResponse(post);
        broadcastFeedEvent("post:new", postData);
        res.status(201).json(postData);
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

        const updatedData = buildPostResponse(post);
        broadcastFeedEvent("post:updated", updatedData);
        res.json(updatedData);
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

        broadcastFeedEvent("post:deleted", { postId: post._id.toString() });
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

        const { becameUpvoted } = applyVoteState(post, req.user._id, "up");

        if (becameUpvoted && post.author.toString() !== req.user._id.toString()) {
            await createNotification({
                userId: post.author,
                actorId: req.user._id,
                type: "like",
                title: "New like on your post",
                message: `${req.user.name} liked your post.`,
                link: "/"
            });
        }

        await post.save();
        await post.populate("author", "name username profilePhoto headline college");
        await post.populate("community", "name slug category coverGradient postsCount");
        const likeData = buildPostResponse(post);
        broadcastFeedEvent("post:updated", likeData);
        res.json(likeData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const voteOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const voteType = req.body?.voteType;

        if (!["up", "down", "none"].includes(voteType)) {
            return res.status(400).json({ message: "voteType must be one of up, down, or none" });
        }

        const { becameUpvoted } = applyVoteState(post, req.user._id, voteType);

        if (becameUpvoted && post.author.toString() !== req.user._id.toString()) {
            await createNotification({
                userId: post.author,
                actorId: req.user._id,
                type: "like",
                title: "New upvote on your post",
                message: `${req.user.name} upvoted your post.`,
                link: "/"
            });
        }

        await post.save();
        await post.populate("author", "name username profilePhoto headline college");
        await post.populate("community", "name slug category coverGradient postsCount");

        const voteData = buildPostResponse(post);
        broadcastFeedEvent("post:updated", voteData);
        res.json(voteData);
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

        const saveData = buildPostResponse(post);
        broadcastFeedEvent("post:updated", saveData);
        res.json(saveData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const searchPosts = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        const tag = req.query.tag?.trim();
        const limit = Math.min(Number(req.query.limit || 20), 40);

        if (!q && !tag) {
            return res.json([]);
        }

        const filter = {};
        if (q) {
            filter.$or = [
                { content: { $regex: q, $options: "i" } },
                { tags: { $regex: q, $options: "i" } }
            ];
        }
        if (tag) {
            filter.tags = { $regex: tag, $options: "i" };
        }

        const posts = await Post.find(filter)
            .populate("author", "name username profilePhoto headline college")
            .populate("community", "name slug category coverGradient postsCount")
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(posts.map(buildPostResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
