import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Rss, Sparkles, TrendingUp, Users, UserPlus, FileText, Heart, MessagesSquare, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CreatePost from "../components/CreatePost.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/useAuth.js";
import { getPosts, getMyDashboard, getSuggestedUsers, followUser, unfollowUser } from "../services/api.js";
import { connectSocket, disconnectSocket, subscribeToSocketEvent } from "../services/socket.js";
import LoadingCard from "../components/ui/LoadingCard.jsx";

const FEED_TABS = [
    { id: "latest", label: "Latest", Icon: Rss },
    { id: "trending", label: "Trending", Icon: TrendingUp },
    { id: "following", label: "Following", Icon: Users },
    { id: "saved", label: "Saved", Icon: Bookmark },
];

export default function Dashboard() {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [feedType, setFeedType] = useState("latest");
    const feedTypeRef = useRef("latest");
    const setFeedTypeSync = useCallback((type) => {
        feedTypeRef.current = type;
        setFeedType(type);
    }, []);
    const [recentFeedPosts, setRecentFeedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const composerSectionRef = useRef(null);
    const [dashStats, setDashStats] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    const loadDashboard = async ({ showLoading = true, type } = {}) => {
        if (!token) return;
        if (showLoading) { setLoading(true); setError(""); }
        try {
            const postItems = await getPosts(type || feedType, token, { limit: 15 });
            const normalizedPosts = Array.isArray(postItems) ? postItems : (postItems?.posts ?? []);
            setRecentFeedPosts(normalizedPosts);
        } catch (err) {
            if (showLoading) setError(err.message || "Failed to load feed");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Reload when feed type changes
    useEffect(() => {
        loadDashboard({ showLoading: true, type: feedType }).catch(() => undefined);
    }, [token, feedType]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load dashboard stats & suggestions once
    useEffect(() => {
        if (!token) return;
        getMyDashboard(token).then(setDashStats).catch(() => { });
        getSuggestedUsers(token).then((data) => {
            const list = Array.isArray(data) ? data : (data?.users ?? []);
            setSuggestions(list.slice(0, 5));
        }).catch(() => { });
    }, [token]);

    const handleToggleFollow = async (targetUser) => {
        if (!token) return;
        try {
            const updated = (targetUser.isFollowing || targetUser.followRequestStatus === "requested")
                ? await unfollowUser(targetUser.username, token)
                : await followUser(targetUser.username, token);

            setSuggestions((prev) => prev.map((item) => (
                item._id === targetUser._id ? { ...item, ...updated } : item
            )));
        } catch {
            // noop
        }
    };

    // Socket: real-time post events
    useEffect(() => {
        if (!token || !user?._id) return;

        const socket = connectSocket(token, "dashboard");
        if (!socket) return;

        const onPostNew = (post) => {
            // Use ref to read current feedType without closure staleness
            if (feedTypeRef.current === "latest") {
                setRecentFeedPosts((prev) => [post, ...prev.filter((p) => p._id !== post._id)]);
            }
        };

        const onPostUpdated = (post) => {
            setRecentFeedPosts((prev) => prev.map((p) => (p._id === post._id ? post : p)));
        };

        const onPostDeleted = ({ postId }) => {
            setRecentFeedPosts((prev) => prev.filter((p) => p._id !== postId));
        };

        const onCommentNew = (data) => {
            if (typeof data?.commentsCount === "number") {
                setRecentFeedPosts((prev) => prev.map((p) => p._id === data.postId ? { ...p, commentsCount: data.commentsCount } : p));
            }
        };

        const onCommentDeleted = (data) => {
            setRecentFeedPosts((prev) => prev.map((p) => p._id === data?.postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1) } : p));
        };

        socket.on("post:new", onPostNew);
        socket.on("post:updated", onPostUpdated);
        socket.on("post:deleted", onPostDeleted);
        socket.on("comment:new", onCommentNew);
        socket.on("comment:deleted", onCommentDeleted);

        return () => {
            socket.off("post:new", onPostNew);
            socket.off("post:updated", onPostUpdated);
            socket.off("post:deleted", onPostDeleted);
            socket.off("comment:new", onCommentNew);
            socket.off("comment:deleted", onCommentDeleted);
            disconnectSocket("dashboard");
        };
    }, [token, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Background refresh every 60s when tab is visible
    useEffect(() => {
        if (!token) return;
        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== "visible") return;
            loadDashboard({ showLoading: false }).catch(() => undefined);
        }, 60000);
        return () => window.clearInterval(intervalId);
    }, [token, feedType]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePostUpdate = (updatedPost) => {
        setRecentFeedPosts((currentPosts) => currentPosts.map((post) => (
            post._id === updatedPost._id ? updatedPost : post
        )));
    };

    const handlePostDelete = (postId) => {
        setRecentFeedPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    const handleCreatePost = (newPost) => {
        if (!newPost?._id) return;
        setRecentFeedPosts((currentPosts) => [newPost, ...currentPosts.filter((post) => post._id !== newPost._id)]);
    };

    const emptyMessages = {
        latest: { title: "Your feed is empty", sub: "Create the first post or follow students to see their updates here." },
        trending: { title: "Nothing trending yet", sub: "Trending posts appear once your community starts engaging." },
        following: { title: "No posts from people you follow", sub: "Follow students to see their posts in this feed." },
        saved: { title: "No saved posts", sub: "Tap the bookmark icon on any post to save it here." },
    };

    const empty = emptyMessages[feedType] || emptyMessages.latest;

    return (
        <div className="mx-auto max-w-[960px]">
            {error ? (
                <div className="rounded-lg px-4 py-3 mb-4 text-[14px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#dc2626" }}>
                    {error}
                </div>
            ) : null}

            {/* ═══ WELCOME STATS STRIP ═══ */}
            {dashStats?.stats && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="card mb-3 px-5 py-4"
                >
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <p className="text-[16px] font-bold" style={{ color: "var(--text-main)" }}>
                                Welcome back, {user?.name?.split(" ")[0] || "Student"} 👋
                            </p>
                            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                Here's your activity overview {dashStats.stats.isEmailVerified ? "• Verified account" : "• Email verification pending"}
                            </p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                                {[
                                { icon: FileText, label: "Posts", value: dashStats.stats.totalPosts, color: "var(--primary)" },
                                { icon: Users, label: "Followers", value: dashStats.stats.totalFollowers, color: "#0f8e72" },
                                { icon: UserPlus, label: "Requests", value: dashStats.stats.pendingFollowRequests || 0, color: "#7c3aed" },
                                { icon: Heart, label: "Saved", value: dashStats.stats.totalSavedPosts, color: "#d96a1c" },
                                { icon: MessagesSquare, label: "Communities", value: dashStats.stats.joinedCommunities, color: "#10b981" },
                            ].map(({ icon: Icon, label, value, color }) => (
                                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                                        <Icon size={14} style={{ color }} />
                                    </div>
                                    <div>
                                        <p className="text-[16px] font-black leading-none" style={{ color: "var(--text-main)" }}>{value}</p>
                                        <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="flex gap-4">
                {/* ═══ MAIN FEED COLUMN ═══ */}
                <div className="flex-1 min-w-0 max-w-[680px] space-y-3">
                    {/* Compose */}
                    <div className="card" ref={composerSectionRef}>
                        <CreatePost onPost={handleCreatePost} />
                    </div>

                    {/* Feed type tabs */}
                    <div className="card px-3 py-2">
                        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                            {FEED_TABS.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setFeedTypeSync(id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shrink-0"
                                    style={feedType === id
                                        ? { background: "var(--primary-subtle)", color: "var(--primary-light)", border: "1px solid rgba(99,102,241,0.2)" }
                                        : { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" }}
                                >
                                    <Icon size={13} />
                                    {label}
                                </button>
                            ))}
                            <div className="ml-auto shrink-0 flex items-center gap-1 pl-2" style={{ borderLeft: "1px solid var(--border)" }}>
                                <Sparkles size={12} style={{ color: "var(--text-muted)" }} />
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Smart feed</span>
                            </div>
                        </div>
                    </div>

                    {/* Posts */}
                    <div className="space-y-3">
                        {loading && !recentFeedPosts.length
                            ? Array.from({ length: 3 }).map((_, i) => <LoadingCard key={`fp-${i}`} lines={5} />)
                            : null}

                        {recentFeedPosts.map((post) => (
                            <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
                        ))}

                        {!recentFeedPosts.length && !loading ? (
                            <div className="card text-center py-16">
                                <div
                                    className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                                    style={{ background: "var(--primary-subtle)" }}
                                >
                                    <Rss size={24} style={{ color: "var(--primary)" }} />
                                </div>
                                <p className="text-[15px] font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>
                                    {empty.title}
                                </p>
                                <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                                    {empty.sub}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* ═══ RIGHT SIDEBAR ═══ */}
                <div className="hidden lg:block w-[260px] shrink-0 space-y-3">
                    {/* People You May Know */}
                    {suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                            className="card p-4"
                        >
                            <p className="text-[13px] font-bold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-sub)" }}>
                                <UserPlus size={13} /> People You May Know
                            </p>
                            <div className="space-y-2.5">
                                {suggestions.map((s) => {
                                    const isFollowing = s.isFollowing;
                                    const avatar = s.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "U")}&background=0a66c2&color=fff&bold=true&size=64`;
                                    return (
                                        <div key={s._id} className="flex items-center gap-2.5">
                                            <img
                                                src={avatar}
                                                className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer"
                                                alt={s.name}
                                                onClick={() => navigate(`/profile/${s.username}`)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/profile/${s.username}`} className="text-[13px] font-semibold leading-tight truncate block" style={{ color: "var(--text-main)", textDecoration: "none" }}>
                                                    {s.name}
                                                </Link>
                                                <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                                                    {s.headline || `@${s.username}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleFollow(s)}
                                                className="shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-all"
                                                style={isFollowing
                                                    ? { background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                                                    : { background: "var(--primary-subtle)", color: "var(--primary)", border: "1px solid rgba(10,102,194,0.2)" }
                                                }
                                            >
                                                {isFollowing ? "Following" : s.followRequestStatus === "requested" ? "Requested" : "Follow"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => navigate("/explore")}
                                className="mt-3 w-full text-[12px] font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                                style={{ color: "var(--primary)", background: "transparent" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-subtle)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                                Discover more <ArrowRight size={12} />
                            </button>
                        </motion.div>
                    )}

                    {/* Quick Links */}
                    <div className="card p-4">
                        <p className="text-[13px] font-bold mb-2" style={{ color: "var(--text-sub)" }}>Quick Links</p>
                        <div className="space-y-1">
                            {[
                                { label: "Explore Communities", to: "/communities", icon: Users },
                                { label: "Saved Posts", action: () => setFeedTypeSync("saved"), icon: Bookmark },
                                { label: "Your Profile", to: `/profile/${user?.username}`, icon: UserPlus },
                            ].map(({ label, to, action, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => { if (action) action(); else if (to) navigate(to); }}
                                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] font-medium transition-colors text-left"
                                    style={{ color: "var(--text-sub)" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                    <Icon size={13} style={{ color: "var(--text-muted)" }} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-2 py-2">
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
                            StudentHub Community Platform &middot; Built for students, by students.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
