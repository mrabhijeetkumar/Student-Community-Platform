import Post from "../models/Post.js";

const postPopulate = [
    { path: "author", select: "name username profilePhoto headline college" }
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
    likes: post.likes,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    editedAt: post.editedAt,
    author: post.author
});

export const getLatestFeed = async (limit = 20) => populatePostQuery(
    Post.find().sort({ createdAt: -1 }).limit(limit)
);

export const getFollowingFeed = async (user, limit = 20) => populatePostQuery(
    Post.find({ author: { $in: [...user.following, user._id] } }).sort({ createdAt: -1 }).limit(limit)
);

export const getTrendingFeed = async (limit = 20) => {
    const posts = await Post.aggregate([
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                trendScore: {
                    $add: [
                        { $multiply: [{ $size: "$likes" }, 2] },
                        { $multiply: ["$commentsCount", 3] }
                    ]
                }
            }
        },
        { $sort: { trendScore: -1, createdAt: -1 } },
        { $limit: limit }
    ]);

    return populatePostQuery(Post.find({ _id: { $in: posts.map((post) => post._id) } }).sort({ createdAt: -1 }));
};

export const getSmartFeed = async (user, limit = 20) => {
    if (user.following.length === 0) {
        return getLatestFeed(limit);
    }

    const followingPosts = await getFollowingFeed(user, limit);

    if (followingPosts.length >= Math.ceil(limit * 0.7)) {
        return followingPosts;
    }

    const trendingPosts = await getTrendingFeed(limit);
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