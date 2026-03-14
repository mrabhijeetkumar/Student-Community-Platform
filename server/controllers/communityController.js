import Community from "../models/Community.js";

const defaultCommunities = [
    {
        name: "Hackathon Hub",
        slug: "hackathon-hub",
        description: "Find teammates, validate ideas, and ship faster with students building for hackathons and startup weekends.",
        category: "Build",
        coverGradient: "from-violet-500/35 to-sky-400/20",
        tags: ["hackathon", "product", "launch"],
        featured: true
    },
    {
        name: "Placement Prep",
        slug: "placement-prep",
        description: "Discuss interviews, resume reviews, referrals, and role-specific preparation with peers.",
        category: "Career",
        coverGradient: "from-sky-500/30 to-indigo-400/20",
        tags: ["career", "placement", "interview"],
        featured: true
    },
    {
        name: "Design Critique",
        slug: "design-critique",
        description: "Share product design work, portfolios, and UI systems for grounded feedback.",
        category: "Design",
        coverGradient: "from-fuchsia-500/30 to-cyan-400/20",
        tags: ["design", "portfolio", "ui"],
        featured: true
    },
    {
        name: "Open Source Circle",
        slug: "open-source-circle",
        description: "Collaborate on repositories, mentorship threads, and contribution-ready issues.",
        category: "Engineering",
        coverGradient: "from-emerald-500/30 to-cyan-400/20",
        tags: ["opensource", "engineering", "community"],
        featured: false
    },
    {
        name: "Research Room",
        slug: "research-room",
        description: "Explore papers, research opportunities, and project collaboration across campuses.",
        category: "Research",
        coverGradient: "from-amber-500/30 to-orange-400/20",
        tags: ["research", "papers", "innovation"],
        featured: false
    },
    {
        name: "Creator Studio",
        slug: "creator-studio",
        description: "Grow content, personal branding, and creator-led communities inside the student network.",
        category: "Creator",
        coverGradient: "from-rose-500/30 to-indigo-400/20",
        tags: ["creator", "branding", "content"],
        featured: false
    }
];

const ensureSeedCommunities = async () => {
    const totalCommunities = await Community.countDocuments();

    if (totalCommunities === 0) {
        await Community.insertMany(defaultCommunities);
    }
};

const formatCommunity = (community, viewerId) => ({
    _id: community._id,
    name: community.name,
    slug: community.slug,
    description: community.description,
    category: community.category,
    coverGradient: community.coverGradient,
    tags: community.tags,
    featured: community.featured,
    postsCount: community.postsCount,
    membersCount: community.members.length,
    isJoined: viewerId
        ? community.members.some((memberId) => memberId.toString() === viewerId.toString())
        : false
});

export const getCommunities = async (req, res) => {
    try {
        await ensureSeedCommunities();

        const query = req.query.q?.trim();
        const featuredOnly = req.query.featured === "1";
        const filter = {};

        if (featuredOnly) {
            filter.featured = true;
        }

        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } }
            ];
        }

        const communities = await Community.find(filter).sort({ featured: -1, createdAt: -1 });
        const sortedCommunities = communities.sort((left, right) => {
            if (left.featured !== right.featured) {
                return Number(right.featured) - Number(left.featured);
            }

            if (left.members.length !== right.members.length) {
                return right.members.length - left.members.length;
            }

            return right.postsCount - left.postsCount;
        });

        res.json(sortedCommunities.map((community) => formatCommunity(community, req.user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const joinCommunity = async (req, res) => {
    try {
        const community = await Community.findOne({ slug: req.params.slug });

        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (!community.members.some((memberId) => memberId.toString() === req.user._id.toString())) {
            community.members.push(req.user._id);
            await community.save();
        }

        res.json(formatCommunity(community, req.user._id));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const leaveCommunity = async (req, res) => {
    try {
        const community = await Community.findOne({ slug: req.params.slug });

        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        community.members = community.members.filter((memberId) => memberId.toString() !== req.user._id.toString());
        await community.save();

        res.json(formatCommunity(community, req.user._id));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCommunityBySlug = async (req, res) => {
    try {
        await ensureSeedCommunities();
        const community = await Community.findOne({ slug: req.params.slug });

        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        res.json(formatCommunity(community, req.user._id));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};