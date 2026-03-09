import mongoose from "mongoose";
import Post from "../models/Post.js";

const postPopulate = [
    { path: "author", select: "name username profilePhoto headline college" },
    { path: "community", select: "name slug category coverGradient postsCount" }
];

const populatePostQuery = (query) => postPopulate.reduce(
    (currentQuery, populateOption) => currentQuery.populate(populateOption),
    query
);

export const buildPostResponse = (post) => ({
    _id: post._id,
    content: post.content,
    images: post.images,
    tags: post.tags,
    community: post.community,
    likes: post.likes,
    upvotes: post.likes,
    downvotes: post.downvotes || [],
    voteScore: (post.likes?.length || 0) - (post.downvotes?.length || 0),
    savedBy: post.savedBy,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    editedAt: post.editedAt,
    author: post.author
});

const buildCommunityFilter = (communityId) => (communityId ? { community: communityId } : {});

const populatePostsByOrderedIds = async (orderedIds) => {
    const posts = await populatePostQuery(Post.find({ _id: { $in: orderedIds } }));
    const postMap = new Map(posts.map((post) => [post._id.toString(), post]));

    return orderedIds.map((id) => postMap.get(id.toString())).filter(Boolean);
};

export const getLatestFeed = async (limit = 20, communityId) => populatePostQuery(
    Post.find(buildCommunityFilter(communityId)).sort({ createdAt: -1 }).limit(limit)
);

export const getFollowingFeed = async (user, limit = 20, communityId) => populatePostQuery(
    Post.find({ author: { $in: [...user.following, user._id] }, ...buildCommunityFilter(communityId) }).sort({ createdAt: -1 }).limit(limit)
);

export const getTrendingFeed = async (limit = 20, communityId) => {
    const matchStage = communityId ? [{ $match: { community: new mongoose.Types.ObjectId(communityId) } }] : [];
    const posts = await Post.aggregate([
        ...matchStage,
        {
            $addFields: {
                likesCount: { $size: { $ifNull: ["$likes", []] } },
                downvotesCount: { $size: { $ifNull: ["$downvotes", []] } },
                trendScore: {
                    $add: [
                        { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 2] },
                        { $multiply: [{ $size: { $ifNull: ["$downvotes", []] } }, -1] },
                        { $multiply: ["$commentsCount", 3] }
                    ]
                }
            }
        },
        { $sort: { trendScore: -1, createdAt: -1 } },
        { $limit: limit }
    ]);

    return populatePostsByOrderedIds(posts.map((post) => post._id));
};

export const getSavedFeed = async (user, limit = 20, communityId) => populatePostQuery(
    Post.find({ savedBy: user._id, ...buildCommunityFilter(communityId) }).sort({ createdAt: -1 }).limit(limit)
);

export const getSmartFeed = async (user, limit = 20, communityId) => {
    if (user.following.length === 0) {
        return getLatestFeed(limit, communityId);
    }

    const followingPosts = await getFollowingFeed(user, limit, communityId);

    if (followingPosts.length >= Math.ceil(limit * 0.7)) {
        return followingPosts;
    }

    const trendingPosts = await getTrendingFeed(limit, communityId);
    const merged = [...followingPosts];
    const seenIds = new Set(followingPosts.map((post) => post._id.toString()));

    for (const post of trendingPosts) {
        if (seenIds.has(post._id.toString())) {
            continue;
        }

        merged.push(post);

        if (merged.length >= limit) {
            break;
        }
    }

    return merged;
};