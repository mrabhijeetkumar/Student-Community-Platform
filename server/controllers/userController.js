import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { buildSafeUser, ensureUniqueUsername } from "../services/authService.js";

const publicUserSelect = "username name email profilePhoto headline bio college skills followers following role authProvider isEmailVerified createdAt updatedAt";

const formatProfileResponse = (user, viewerId) => ({
    ...buildSafeUser(user),
    stats: {
        followers: user.followers.length,
        following: user.following.length
    },
    isFollowing: viewerId ? user.followers.some((followerId) => followerId.toString() === viewerId.toString()) : false
});

export const getCurrentUser = async (req, res) => {
    const user = await User.findById(req.user._id).select(publicUserSelect);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json(formatProfileResponse(user, req.user._id));
};

export const updateCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (req.body.username && req.body.username !== user.username) {
            user.username = await ensureUniqueUsername(req.body.username);
        }

        user.name = req.body.name?.trim() || user.name;
        user.headline = req.body.headline?.trim() ?? user.headline;
        user.bio = req.body.bio?.trim() ?? user.bio;
        user.college = req.body.college?.trim() ?? user.college;
        user.profilePhoto = req.body.profilePhoto?.trim() ?? user.profilePhoto;
        user.skills = Array.isArray(req.body.skills)
            ? req.body.skills.map((skill) => skill.trim()).filter(Boolean)
            : user.skills;

        await user.save();

        const updatedUser = await User.findById(user._id).select(publicUserSelect);
        res.json(formatProfileResponse(updatedUser, req.user._id));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserDirectory = async (req, res) => {
    try {
        const query = req.query.q?.trim();
        const filter = { _id: { $ne: req.user._id } };

        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: "i" } },
                { username: { $regex: query, $options: "i" } },
                { college: { $regex: query, $options: "i" } },
                { skills: { $regex: query, $options: "i" } }
            ];
        }

        const users = await User.find(filter)
            .select("username name profilePhoto headline college skills followers following")
            .sort({ createdAt: -1 })
            .limit(24);

        res.json(users.map((user) => formatProfileResponse(user, req.user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSuggestedUsers = async (req, res) => {
    const ignoredIds = [...req.user.following, req.user._id];
    const users = await User.find({ _id: { $nin: ignoredIds } })
        .select("username name profilePhoto headline college skills followers following")
        .sort({ createdAt: -1 })
        .limit(6);

    res.json(users.map((user) => formatProfileResponse(user, req.user._id)));
};

export const getUserProfile = async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).select(publicUserSelect);

    if (!user) {
        return res.status(404).json({ message: "Profile not found" });
    }

    res.json(formatProfileResponse(user, req.user._id));
};

export const followUser = async (req, res) => {
    const targetUser = await User.findOne({ username: req.params.username });

    if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const alreadyFollowing = req.user.following.some((userId) => userId.toString() === targetUser._id.toString());

    if (alreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
    }

    req.user.following.push(targetUser._id);
    targetUser.followers.push(req.user._id);

    await Promise.all([req.user.save(), targetUser.save()]);
    await createNotification({
        userId: targetUser._id,
        actorId: req.user._id,
        type: "follow",
        title: "New follower",
        message: `${req.user.name} started following you.`,
        link: `/profile/${req.user.username}`
    });

    const refreshedUser = await User.findOne({ username: targetUser.username }).select(publicUserSelect);
    res.json(formatProfileResponse(refreshedUser, req.user._id));
};

export const unfollowUser = async (req, res) => {
    const targetUser = await User.findOne({ username: req.params.username });

    if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
    }

    req.user.following = req.user.following.filter((userId) => userId.toString() !== targetUser._id.toString());
    targetUser.followers = targetUser.followers.filter((userId) => userId.toString() !== req.user._id.toString());

    await Promise.all([req.user.save(), targetUser.save()]);

    const refreshedUser = await User.findOne({ username: targetUser.username }).select(publicUserSelect);
    res.json(formatProfileResponse(refreshedUser, req.user._id));
};
