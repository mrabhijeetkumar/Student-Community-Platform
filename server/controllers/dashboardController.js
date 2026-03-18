import Comment from "../models/Comment.js";
import Community from "../models/Community.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

const buildLastSevenDays = () => {
    const days = [];

    for (let index = 6; index >= 0; index -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - index);
        days.push(date);
    }

    return days;
};

export const getUserDashboard = async (req, res) => {
    const [totalPosts, totalSavedPosts, joinedCommunities, recentNotifications, recentMessages] = await Promise.all([
        Post.countDocuments({ author: req.user._id }),
        Post.countDocuments({ savedBy: req.user._id }),
        Community.countDocuments({ members: req.user._id }),
        Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(5),
        req.models?.Message
            ? req.models.Message.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(5)
            : []
    ]);

    res.json({
        stats: {
            totalPosts,
            totalSavedPosts,
            joinedCommunities,
            totalFollowers: req.user.followers.length,
            totalFollowing: req.user.following.length,
            pendingFollowRequests: req.user.followRequestsReceived?.length || 0,
            isEmailVerified: Boolean(req.user.isEmailVerified)
        },
        recentActivity: [...recentNotifications, ...recentMessages].sort(
            (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
        ).slice(0, 8)
    });
};

export const getAdminDashboard = async (req, res) => {
    const [totalUsers, totalPosts, totalComments, verifiedUsers, totalCommunities, totalNotifications, totalMessages] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Comment.countDocuments(),
        User.countDocuments({ isEmailVerified: true }),
        Community.countDocuments(),
        Notification.countDocuments(),
        req.models?.Message ? req.models.Message.countDocuments() : 0
    ]);

    const adminCount = await User.countDocuments({ role: "admin" });
    const totalLikes = await Post.aggregate([{ $project: { count: { $size: "$likes" } } }, { $group: { _id: null, total: { $sum: "$count" } } }]);
    const totalSaves = await Post.aggregate([{ $project: { count: { $size: "$savedBy" } } }, { $group: { _id: null, total: { $sum: "$count" } } }]);

    const days = buildLastSevenDays();
    const chart = await Promise.all(days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const [users, posts, comments] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: date, $lt: nextDay } }),
            Post.countDocuments({ createdAt: { $gte: date, $lt: nextDay } }),
            Comment.countDocuments({ createdAt: { $gte: date, $lt: nextDay } })
        ]);

        return {
            date: date.toISOString().slice(5, 10),
            users,
            posts,
            comments
        };
    }));

    res.json({
        stats: {
            totalUsers,
            totalPosts,
            totalComments,
            verifiedUsers,
            totalCommunities,
            totalNotifications,
            totalMessages,
            adminCount,
            totalLikes: totalLikes[0]?.total || 0,
            totalSaves: totalSaves[0]?.total || 0,
            engagementRate: totalUsers === 0 ? 0 : Number(((totalPosts + totalComments) / totalUsers).toFixed(2))
        },
        chart
    });
};

// GET /api/dashboard/admin/users  — full user list with stats
export const getAdminUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const search = req.query.q?.trim();

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("username name email profilePhoto role isEmailVerified isBanned createdAt lastLoginAt followers following college")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        const userIds = users.map((u) => u._id);
        const postCounts = await Post.aggregate([
            { $match: { author: { $in: userIds } } },
            { $group: { _id: "$author", posts: { $sum: 1 }, likes: { $sum: { $size: "$likes" } } } }
        ]);
        const postMap = {};
        postCounts.forEach((entry) => { postMap[String(entry._id)] = entry; });

        const enriched = users.map((u) => {
            const pm = postMap[String(u._id)] || { posts: 0, likes: 0 };
            return {
                _id: u._id,
                username: u.username,
                name: u.name,
                email: u.email,
                profilePhoto: u.profilePhoto,
                role: u.role,
                isEmailVerified: u.isEmailVerified,
                createdAt: u.createdAt,
                lastLoginAt: u.lastLoginAt,
                college: u.college,
                isBanned: u.isBanned || false,
                followers: u.followers.length,
                following: u.following.length,
                posts: pm.posts,
                likes: pm.likes
            };
        });

        res.json({ users: enriched, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/dashboard/admin/posts  — full post list
export const getAdminPosts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);

        const [posts, total] = await Promise.all([
            Post.find()
                .populate("author", "username name profilePhoto")
                .populate("community", "name slug")
                .select("content tags likes downvotes commentsCount savedBy createdAt editedAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Post.countDocuments()
        ]);

        const enriched = posts.map((p) => ({
            _id: p._id,
            content: p.content?.slice(0, 120) + (p.content?.length > 120 ? "…" : ""),
            author: p.author,
            community: p.community,
            tags: p.tags,
            likes: p.likes.length,
            downvotes: p.downvotes.length,
            saves: p.savedBy.length,
            commentsCount: p.commentsCount,
            createdAt: p.createdAt,
            editedAt: p.editedAt
        }));

        res.json({ posts: enriched, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/dashboard/admin/users/:userId/role  — grant/revoke admin
export const setUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!["student", "admin"].includes(role)) {
            return res.status(400).json({ message: "Role must be student or admin" });
        }

        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

        if (!superAdminEmail || req.user.email !== superAdminEmail) {
            return res.status(403).json({ message: "Only the primary admin can grant or revoke admin access" });
        }

        const target = await User.findById(userId).select("email role name");

        if (!target) {
            return res.status(404).json({ message: "User not found" });
        }

        if (superAdminEmail && target.email === superAdminEmail && target.role === "admin" && role !== "admin") {
            return res.status(403).json({ message: "Cannot demote the super-admin account" });
        }

        target.role = role;
        await target.save();

        res.json({ message: `${target.name} is now ${role}`, user: { _id: target._id, role: target.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/dashboard/admin/users/:userId  — delete a user account
export const deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
        const target = await User.findById(userId).select("email name role");

        if (!target) {
            return res.status(404).json({ message: "User not found" });
        }

        if (superAdminEmail && target.email === superAdminEmail && target.role === "admin") {
            return res.status(403).json({ message: "Cannot delete the super-admin account" });
        }

        // Prevent self-deletion via admin panel
        if (String(req.user._id) === String(userId)) {
            return res.status(400).json({ message: "You cannot delete your own account from the admin panel" });
        }

        await User.findByIdAndDelete(userId);
        await Post.deleteMany({ author: userId });
        await Comment.deleteMany({ userId });
        await Notification.deleteMany({ userId });

        res.json({ message: `Account for ${target.name} deleted` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/dashboard/admin/posts/:postId  — delete a post
export const deletePostByAdmin = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        await Post.findByIdAndDelete(req.params.postId);
        await Comment.deleteMany({ postId: req.params.postId });

        res.json({ message: "Post deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/dashboard/admin/comments  — paginated comment list
export const getAdminComments = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const search = req.query.q?.trim();

        const filter = {};
        if (search) {
            filter.text = { $regex: search, $options: "i" };
        }

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .populate("userId", "username name profilePhoto")
                .populate("postId", "content")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Comment.countDocuments(filter)
        ]);

        const enriched = comments.map((c) => ({
            _id: c._id,
            text: c.text?.slice(0, 160) + (c.text?.length > 160 ? "…" : ""),
            author: c.userId,
            postSnip: c.postId?.content?.slice(0, 80) + (c.postId?.content?.length > 80 ? "…" : ""),
            postId: c.postId?._id,
            replies: c.repliesCount,
            createdAt: c.createdAt,
        }));

        res.json({ comments: enriched, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/dashboard/admin/comments/:commentId
export const deleteCommentByAdmin = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        await Comment.findByIdAndDelete(req.params.commentId);
        // Decrement commentsCount on the parent post
        await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });

        res.json({ message: "Comment deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/dashboard/admin/activity  — unified recent activity feed
export const getAdminActivity = async (req, res) => {
    try {
        const limit = Math.min(60, parseInt(req.query.limit) || 40);

        const [recentUsers, recentPosts, recentComments] = await Promise.all([
            User.find()
                .select("name username profilePhoto createdAt role isEmailVerified")
                .sort({ createdAt: -1 })
                .limit(limit),
            Post.find()
                .populate("author", "username name profilePhoto")
                .populate("community", "name")
                .select("content author community likes createdAt tags")
                .sort({ createdAt: -1 })
                .limit(limit),
            Comment.find()
                .populate("userId", "username name profilePhoto")
                .populate("postId", "content")
                .select("text userId postId createdAt")
                .sort({ createdAt: -1 })
                .limit(limit),
        ]);

        const events = [
            ...recentUsers.map((u) => ({
                type: "signup",
                id: u._id,
                name: u.name,
                username: u.username,
                photo: u.profilePhoto,
                role: u.role,
                verified: u.isEmailVerified,
                createdAt: u.createdAt,
            })),
            ...recentPosts.map((p) => ({
                type: "post",
                id: p._id,
                author: p.author,
                content: p.content?.slice(0, 100) + (p.content?.length > 100 ? "…" : ""),
                community: p.community?.name,
                likes: p.likes?.length || 0,
                tags: p.tags || [],
                createdAt: p.createdAt,
            })),
            ...recentComments.map((c) => ({
                type: "comment",
                id: c._id,
                author: c.userId,
                text: c.text?.slice(0, 100) + (c.text?.length > 100 ? "…" : ""),
                postSnip: c.postId?.content?.slice(0, 60) + (c.postId?.content?.length > 60 ? "…" : ""),
                postId: c.postId?._id,
                createdAt: c.createdAt,
            })),
        ];

        // Sort newest first and trim to requested limit
        events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ events: events.slice(0, limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── COMMUNITY MANAGEMENT ──────────────────────────────────────────────────

// GET /api/dashboard/admin/communities — list all communities with stats
export const getAdminCommunities = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const search = req.query.q?.trim();

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { slug: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } }
            ];
        }

        const [communities, total] = await Promise.all([
            Community.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Community.countDocuments(filter)
        ]);

        const enriched = communities.map((c) => ({
            _id: c._id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            category: c.category,
            tags: c.tags,
            featured: c.featured,
            postsCount: c.postsCount,
            membersCount: c.members.length,
            createdAt: c.createdAt
        }));

        res.json({ communities: enriched, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/dashboard/admin/communities/:communityId — delete a community
export const deleteAdminCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });

        // Remove posts in this community and their comments
        const communityPosts = await Post.find({ community: community._id }).select("_id");
        const postIds = communityPosts.map((p) => p._id);

        await Comment.deleteMany({ postId: { $in: postIds } });
        await Post.deleteMany({ community: community._id });
        await Community.findByIdAndDelete(community._id);

        res.json({ message: `Community "${community.name}" deleted` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/dashboard/admin/communities/:communityId/featured — toggle featured
export const toggleCommunityFeatured = async (req, res) => {
    try {
        const community = await Community.findById(req.params.communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });

        community.featured = !community.featured;
        await community.save();

        res.json({ message: `"${community.name}" is now ${community.featured ? "featured" : "unfeatured"}`, featured: community.featured });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/dashboard/admin/communities/:communityId/members/:userId — remove a member
export const removeCommunityMember = async (req, res) => {
    try {
        const community = await Community.findById(req.params.communityId);
        if (!community) return res.status(404).json({ message: "Community not found" });

        const memberIndex = community.members.findIndex((id) => id.toString() === req.params.userId);
        if (memberIndex === -1) return res.status(404).json({ message: "User is not a member" });

        community.members.splice(memberIndex, 1);
        await community.save();

        const user = await User.findById(req.params.userId).select("name");
        res.json({ message: `${user?.name || "User"} removed from "${community.name}"` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── BAN / UNBAN ────────────────────────────────────────────────────────────

// POST /api/dashboard/admin/users/:userId/ban — ban or unban a user
export const toggleBanUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
        const target = await User.findById(userId).select("email name role isBanned");

        if (!target) return res.status(404).json({ message: "User not found" });
        if (superAdminEmail && target.email === superAdminEmail && target.role === "admin") {
            return res.status(403).json({ message: "Cannot ban the super-admin account" });
        }
        if (String(req.user._id) === String(userId)) {
            return res.status(400).json({ message: "You cannot ban yourself" });
        }

        target.isBanned = !target.isBanned;
        target.bannedAt = target.isBanned ? new Date() : null;
        await target.save();

        res.json({
            message: target.isBanned ? `${target.name} has been banned` : `${target.name} has been unbanned`,
            user: { _id: target._id, isBanned: target.isBanned }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
