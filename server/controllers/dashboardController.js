import Comment from "../models/Comment.js";
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
    const [totalPosts, recentNotifications, recentMessages] = await Promise.all([
        Post.countDocuments({ author: req.user._id }),
        Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(5),
        req.models?.Message
            ? req.models.Message.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(5)
            : []
    ]);

    res.json({
        stats: {
            totalPosts,
            totalFollowers: req.user.followers.length,
            totalFollowing: req.user.following.length
        },
        recentActivity: [...recentNotifications, ...recentMessages].sort(
            (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
        ).slice(0, 8)
    });
};

export const getAdminDashboard = async (req, res) => {
    const [totalUsers, totalPosts, totalComments, verifiedUsers] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Comment.countDocuments(),
        User.countDocuments({ isEmailVerified: true })
    ]);

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
            engagementRate: totalUsers === 0 ? 0 : Number(((totalPosts + totalComments) / totalUsers).toFixed(2))
        },
        chart
    });
};