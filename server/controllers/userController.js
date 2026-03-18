import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { buildSafeUser, ensureUniqueUsername, hashPassword, comparePassword, validatePasswordStrength } from "../services/authService.js";

const publicUserSelect = "username name email profilePhoto coverPhoto headline bio college skills socialLinks followers following followRequestsReceived followRequestsSent isPrivate role authProvider isEmailVerified createdAt updatedAt";

const normalizeProfileLink = (value) => {
    const trimmedValue = value?.trim() || "";

    if (!trimmedValue) {
        return "";
    }

    return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
};

const includesUser = (arr = [], id) => arr.some((entry) => entry.toString() === id.toString());
const removeUser = (arr = [], id) => arr.filter((entry) => entry.toString() !== id.toString());

const getFollowRequestStatus = (user, viewerId) => {
    if (!viewerId) return "none";
    if (user._id.toString() === viewerId.toString()) return "self";

    if (includesUser(user.followers, viewerId)) return "following";
    if (includesUser(user.followRequestsReceived, viewerId)) return "requested";
    if (includesUser(user.followRequestsSent, viewerId)) return "incoming";

    return "none";
};

const formatProfileResponse = (user, viewerId) => ({
    ...buildSafeUser(user),
    isPrivate: Boolean(user.isPrivate),
    stats: {
        followers: user.followers.length,
        following: user.following.length,
        pendingFollowRequests: user.followRequestsReceived?.length || 0
    },
    isFollowing: viewerId ? user.followers.some((followerId) => followerId.toString() === viewerId.toString()) : false,
    followRequestStatus: getFollowRequestStatus(user, viewerId)
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
        user.coverPhoto = req.body.coverPhoto?.trim() ?? user.coverPhoto;
        if (typeof req.body.isPrivate === "boolean") {
            user.isPrivate = req.body.isPrivate;
        }
        user.skills = Array.isArray(req.body.skills)
            ? req.body.skills.map((skill) => skill.trim()).filter(Boolean)
            : user.skills;

        if (req.body.socialLinks && typeof req.body.socialLinks === "object") {
            user.socialLinks = {
                github: normalizeProfileLink(req.body.socialLinks.github),
                linkedin: normalizeProfileLink(req.body.socialLinks.linkedin),
                twitter: normalizeProfileLink(req.body.socialLinks.twitter),
                portfolio: normalizeProfileLink(req.body.socialLinks.portfolio)
            };
        }

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
            .select("username name profilePhoto headline college skills followers following followRequestsReceived followRequestsSent isPrivate")
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
        .select("username name profilePhoto headline college skills followers following followRequestsReceived followRequestsSent isPrivate")
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

    const alreadyFollowing = includesUser(req.user.following, targetUser._id);

    if (alreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
    }

    const alreadyRequested = includesUser(req.user.followRequestsSent, targetUser._id);
    if (alreadyRequested) {
        return res.status(400).json({ message: "Follow request already pending" });
    }

    if (targetUser.isPrivate) {
        if (!includesUser(req.user.followRequestsSent, targetUser._id)) {
            req.user.followRequestsSent.addToSet(targetUser._id);
        }

        if (!includesUser(targetUser.followRequestsReceived, req.user._id)) {
            targetUser.followRequestsReceived.addToSet(req.user._id);
        }

        await Promise.all([req.user.save(), targetUser.save()]);

        await createNotification({
            userId: targetUser._id,
            actorId: req.user._id,
            type: "follow",
            title: "New follow request",
            message: `${req.user.name} requested to follow you.`,
            link: `/profile/${req.user.username}`
        });

        const refreshedUser = await User.findOne({ username: targetUser.username }).select(publicUserSelect);
        return res.json({
            ...formatProfileResponse(refreshedUser, req.user._id),
            message: "Follow request sent"
        });
    }

    req.user.following.addToSet(targetUser._id);
    targetUser.followers.addToSet(req.user._id);

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

    const wasFollowing = includesUser(req.user.following, targetUser._id);
    const hadPendingRequest = includesUser(req.user.followRequestsSent, targetUser._id);

    req.user.following = removeUser(req.user.following, targetUser._id);
    targetUser.followers = removeUser(targetUser.followers, req.user._id);

    req.user.followRequestsSent = removeUser(req.user.followRequestsSent, targetUser._id);
    targetUser.followRequestsReceived = removeUser(targetUser.followRequestsReceived, req.user._id);

    await Promise.all([req.user.save(), targetUser.save()]);

    const refreshedUser = await User.findOne({ username: targetUser.username }).select(publicUserSelect);
    res.json({
        ...formatProfileResponse(refreshedUser, req.user._id),
        message: hadPendingRequest ? "Follow request canceled" : (wasFollowing ? "Unfollowed successfully" : "Updated")
    });
};

export const removeFollower = async (req, res) => {
    const follower = await User.findOne({ username: req.params.username });
    const currentUser = await User.findById(req.user._id);

    if (!follower || !currentUser) {
        return res.status(404).json({ message: "User not found" });
    }

    const hadFollower = includesUser(currentUser.followers, follower._id);

    currentUser.followers = removeUser(currentUser.followers, follower._id);
    follower.following = removeUser(follower.following, currentUser._id);

    currentUser.followRequestsReceived = removeUser(currentUser.followRequestsReceived, follower._id);
    follower.followRequestsSent = removeUser(follower.followRequestsSent, currentUser._id);

    await Promise.all([currentUser.save(), follower.save()]);

    const refreshedUser = await User.findOne({ username: currentUser.username }).select(publicUserSelect);
    res.json({
        ...formatProfileResponse(refreshedUser, req.user._id),
        message: hadFollower ? "Follower removed" : "Updated"
    });
};

export const getFollowRequests = async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("followRequestsReceived")
        .populate("followRequestsReceived", "username name profilePhoto headline college followers following followRequestsReceived followRequestsSent isPrivate");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json(user.followRequestsReceived.map((requester) => formatProfileResponse(requester, req.user._id)));
};

export const acceptFollowRequest = async (req, res) => {
    const requester = await User.findOne({ username: req.params.username });
    const currentUser = await User.findById(req.user._id);

    if (!requester || !currentUser) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!includesUser(currentUser.followRequestsReceived, requester._id)) {
        return res.status(400).json({ message: "No pending follow request" });
    }

    currentUser.followRequestsReceived = removeUser(currentUser.followRequestsReceived, requester._id);
    requester.followRequestsSent = removeUser(requester.followRequestsSent, currentUser._id);

    if (!includesUser(currentUser.followers, requester._id)) {
        currentUser.followers.addToSet(requester._id);
    }
    if (!includesUser(requester.following, currentUser._id)) {
        requester.following.addToSet(currentUser._id);
    }

    await Promise.all([currentUser.save(), requester.save()]);

    await createNotification({
        userId: requester._id,
        actorId: currentUser._id,
        type: "follow",
        title: "Follow request accepted",
        message: `${currentUser.name} accepted your follow request.`,
        link: `/profile/${currentUser.username}`
    });

    const refreshedUser = await User.findOne({ username: currentUser.username }).select(publicUserSelect);
    res.json({ ...formatProfileResponse(refreshedUser, req.user._id), message: "Follow request accepted" });
};

export const rejectFollowRequest = async (req, res) => {
    const requester = await User.findOne({ username: req.params.username });
    const currentUser = await User.findById(req.user._id);

    if (!requester || !currentUser) {
        return res.status(404).json({ message: "User not found" });
    }

    currentUser.followRequestsReceived = removeUser(currentUser.followRequestsReceived, requester._id);
    requester.followRequestsSent = removeUser(requester.followRequestsSent, currentUser._id);

    await Promise.all([currentUser.save(), requester.save()]);

    const refreshedUser = await User.findOne({ username: currentUser.username }).select(publicUserSelect);
    res.json({ ...formatProfileResponse(refreshedUser, req.user._id), message: "Follow request removed" });
};

export const getUserFollowers = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select("followers")
            .populate("followers", "username name profilePhoto headline college followers following followRequestsReceived followRequestsSent isPrivate");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.followers.map((follower) => formatProfileResponse(follower, req.user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserFollowing = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select("following")
            .populate("following", "username name profilePhoto headline college followers following followRequestsReceived followRequestsSent isPrivate");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.following.map((followed) => formatProfileResponse(followed, req.user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const passwordValidation = validatePasswordStrength(newPassword);

        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const user = await User.findById(req.user._id).select("+password");

        if (!user) return res.status(404).json({ message: "User not found" });

        // If user has a local password, verify current password
        if (user.authProvider === "local" && user.password) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required" });
            }
            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
