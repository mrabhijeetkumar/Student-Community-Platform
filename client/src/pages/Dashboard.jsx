import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import CreatePost from "../components/CreatePost.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/useAuth.js";
import {
    getCommunities,
    getMyDashboard,
    getPosts,
    getSuggestedUsers,
    joinCommunity,
    leaveCommunity,
    followUser,
    unfollowUser
} from "../services/api.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import LoadingCard from "../components/ui/LoadingCard.jsx";

function getInitials(name) {
    return (name || "Student")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [communities, setCommunities] = useState([]);
    const [recentFeedPosts, setRecentFeedPosts] = useState([]);
    const [suggestedStudents, setSuggestedStudents] = useState([]);
    const [overviewStats, setOverviewStats] = useState({
        totalPosts: 0,
        totalFollowers: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyCommunitySlug, setBusyCommunitySlug] = useState("");
    const [busyStudentUsername, setBusyStudentUsername] = useState("");
    const composerSectionRef = useRef(null);

    const loadDashboard = async ({ showLoading = true } = {}) => {
        if (!token) {
            return;
        }

        if (showLoading) {
            setLoading(true);
            setError("");
        }

        try {
            const [communityItems, postItems, suggestedUsers, dashboardData] = await Promise.all([
                getCommunities(token, "", { featuredOnly: true }),
                getPosts("latest", token, { limit: 12 }),
                getSuggestedUsers(token),
                getMyDashboard(token)
            ]);

            const normalizedPosts = Array.isArray(postItems) ? postItems : (postItems?.posts ?? []);

            setCommunities(Array.isArray(communityItems) ? communityItems.slice(0, 4) : []);
            setRecentFeedPosts(normalizedPosts);
            setSuggestedStudents(Array.isArray(suggestedUsers) ? suggestedUsers.slice(0, 4) : []);
            setOverviewStats({
                totalPosts: dashboardData?.stats?.totalPosts ?? 0,
                totalFollowers: dashboardData?.stats?.totalFollowers ?? 0
            });
        } catch (err) {
            if (showLoading) {
                setError(err.message || "Failed to load dashboard");
            }
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadDashboard({ showLoading: true }).catch(() => undefined);
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!token || !user?._id) {
            return;
        }

        const socket = connectSocket(token, "dashboard");

        if (!socket) {
            return;
        }

        return () => {
            disconnectSocket("dashboard");
        };
    }, [token, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!token) {
            return;
        }

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== "visible") {
                return;
            }

            loadDashboard({ showLoading: false }).catch(() => undefined);
        }, 45000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePostUpdate = (updatedPost) => {
        setRecentFeedPosts((currentPosts) => currentPosts.map((post) => (
            post._id === updatedPost._id ? updatedPost : post
        )));
    };

    const handlePostDelete = (postId) => {
        setRecentFeedPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
        setOverviewStats((currentStats) => ({
            ...currentStats,
            totalPosts: Math.max(0, currentStats.totalPosts - 1)
        }));
    };

    const handleCreatePost = (newPost) => {
        if (!newPost?._id) return;
        setRecentFeedPosts((currentPosts) => [newPost, ...currentPosts.filter((post) => post._id !== newPost._id)]);
        setOverviewStats((currentStats) => ({ ...currentStats, totalPosts: currentStats.totalPosts + 1 }));
    };

    const handleCommunityToggle = async (community) => {
        if (!community?.slug || busyCommunitySlug) {
            return;
        }

        setBusyCommunitySlug(community.slug);
        const previousCommunity = community;

        setCommunities((currentCommunities) => currentCommunities.map((item) => {
            if (item.slug !== community.slug) {
                return item;
            }

            return {
                ...item,
                isJoined: !item.isJoined,
                membersCount: Math.max(0, (item.membersCount || 0) + (item.isJoined ? -1 : 1))
            };
        }));

        try {
            const updatedCommunity = community.isJoined
                ? await leaveCommunity(community.slug, token)
                : await joinCommunity(community.slug, token);

            setCommunities((currentCommunities) => currentCommunities.map((item) => (
                item._id === updatedCommunity._id ? { ...item, ...updatedCommunity } : item
            )));
        } catch {
            setCommunities((currentCommunities) => currentCommunities.map((item) => (
                item.slug === previousCommunity.slug ? previousCommunity : item
            )));
        } finally {
            setBusyCommunitySlug("");
        }
    };

    const handleStudentFollowToggle = async (student) => {
        if (!student?.username || busyStudentUsername) {
            return;
        }

        setBusyStudentUsername(student.username);
        const optimisticDelta = student.isFollowing ? -1 : 1;
        const optimisticStudent = {
            ...student,
            isFollowing: !student.isFollowing,
            stats: {
                ...(student.stats || {}),
                followers: Math.max(0, (student.stats?.followers ?? 0) + optimisticDelta)
            }
        };

        setSuggestedStudents((currentStudents) => currentStudents.map((item) => (
            item._id === student._id ? optimisticStudent : item
        )));

        try {
            const updatedStudent = student.isFollowing
                ? await unfollowUser(student.username, token)
                : await followUser(student.username, token);

            setSuggestedStudents((currentStudents) => currentStudents.map((item) => (
                item._id === updatedStudent._id ? updatedStudent : item
            )));
        } catch {
            setSuggestedStudents((currentStudents) => currentStudents.map((item) => (
                item._id === student._id ? student : item
            )));
        } finally {
            setBusyStudentUsername("");
        }
    };

    return (
        <div className="mx-auto max-w-4xl">

            {error ? (
                <div className="rounded-lg px-4 py-3 mb-4 text-[13px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5" }}>
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1fr_272px] items-start">

                {/* ── Left: Main Feed ── */}
                <div className="space-y-3 min-w-0">

                    {/* Compose */}
                    <div className="card" ref={composerSectionRef}>
                        <CreatePost onPost={handleCreatePost} />
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
                            <div className="card text-center py-14" style={{ color: "var(--text-muted)" }}>
                                <p className="text-[14px] font-medium mb-1 text-white">No posts yet</p>
                                <p className="text-[13px]">Be the first to share something with the community!</p>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* ── Right: Compact Sidebar ── */}
                <div className="hidden xl:flex flex-col gap-4 sticky top-4">

                    {/* User card + mini stats */}
                    <div className="card p-4">
                        <div
                            className="flex items-center gap-3 pb-3 mb-3 cursor-pointer"
                            style={{ borderBottom: "1px solid var(--border)" }}
                            onClick={() => navigate(`/profile/${user?.username}`)}
                        >
                            <img
                                src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&bold=true&size=64`}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-[13.5px] font-semibold text-white leading-tight truncate">{user?.name || "Student"}</p>
                                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>@{user?.username || "you"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg p-3 text-center cursor-pointer hover:bg-zinc-700/30 transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                onClick={() => navigate(`/profile/${user?.username}`)}>
                                <p className="text-[20px] font-bold text-white leading-tight">{overviewStats.totalPosts}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Posts</p>
                            </div>
                            <div className="rounded-lg p-3 text-center cursor-pointer hover:bg-zinc-700/30 transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                                onClick={() => navigate(`/profile/${user?.username}`)}>
                                <p className="text-[20px] font-bold text-white leading-tight">{overviewStats.totalFollowers}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Followers</p>
                            </div>
                        </div>
                    </div>

                    {/* Suggested students */}
                    {(loading || suggestedStudents.length > 0) && (
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[13px] font-semibold text-white">Suggested for you</p>
                                <Link to="/explore" className="text-[11.5px] font-medium" style={{ color: "var(--primary-light)" }}>See all</Link>
                            </div>

                            {loading && !suggestedStudents.length
                                ? Array.from({ length: 3 }).map((_, i) => <LoadingCard key={`sl-${i}`} lines={2} />)
                                : null}

                            <div className="space-y-3">
                                {suggestedStudents.slice(0, 4).map((student) => (
                                    <div key={student._id} className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                                            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
                                            {student.profilePhoto
                                                ? <img src={student.profilePhoto} className="h-full w-full object-cover" alt="" />
                                                : getInitials(student.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Link to={`/profile/${student.username}`}
                                                className="block text-[12.5px] font-semibold text-white truncate hover:underline">
                                                {student.name}
                                            </Link>
                                            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                                                {student.college || student.headline || "Student"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleStudentFollowToggle(student)}
                                            disabled={busyStudentUsername === student.username}
                                            className="text-[11.5px] font-semibold px-3 py-1 rounded-lg transition-colors shrink-0"
                                            style={student.isFollowing
                                                ? { background: "var(--surface-hover)", color: "var(--text-sub)", border: "1px solid var(--border)" }
                                                : { background: "rgba(99,102,241,0.12)", color: "var(--primary-light)", border: "1px solid rgba(99,102,241,0.2)" }}
                                        >
                                            {busyStudentUsername === student.username ? "…" : student.isFollowing ? "Following" : "Follow"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Communities */}
                    {(loading || communities.length > 0) && (
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[13px] font-semibold text-white">Communities</p>
                                <Link to="/communities" className="text-[11.5px] font-medium" style={{ color: "var(--primary-light)" }}>Browse all</Link>
                            </div>

                            {loading && !communities.length
                                ? Array.from({ length: 3 }).map((_, i) => <LoadingCard key={`cl-${i}`} lines={2} />)
                                : null}

                            <div className="space-y-1">
                                {communities.slice(0, 5).map((community) => (
                                    <div key={community._id}
                                        className="flex items-center justify-between gap-2 px-2 py-2.5 rounded-lg transition-colors hover:bg-zinc-700/30 cursor-pointer"
                                        onClick={() => navigate("/communities")}>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12.5px] font-medium text-white truncate">{community.name}</p>
                                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{(community.membersCount || 0).toLocaleString()} members</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCommunityToggle(community); }}
                                            disabled={busyCommunitySlug === community.slug}
                                            className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors shrink-0"
                                            style={community.isJoined
                                                ? { background: "var(--surface-hover)", color: "var(--text-sub)", border: "1px solid var(--border)" }
                                                : { background: "rgba(99,102,241,0.12)", color: "var(--primary-light)", border: "1px solid rgba(99,102,241,0.2)" }}
                                        >
                                            {busyCommunitySlug === community.slug ? "…" : community.isJoined ? "Joined" : "Join"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
