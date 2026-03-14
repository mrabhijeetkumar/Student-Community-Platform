import { MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import CommunityFeedPanel from "../components/CommunityFeedPanel";
import LoadingCard from "../components/ui/LoadingCard";
import Notification from "../components/Notification";
import PageTransition from "../components/ui/PageTransition";
import { useAuth } from "../context/useAuth.js";
import { getCommunities, getPosts, joinCommunity, leaveCommunity } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket.js";

// Inline CSS gradients — not Tailwind dynamic classes (those get purged at build time)
const COVER_GRADIENTS = {
    violet: "linear-gradient(135deg, #0f4f9a 0%, #2db4ff 100%)",
    sky: "linear-gradient(135deg, #1482e8 0%, #30b7ff 100%)",
    fuchsia: "linear-gradient(135deg, #0c6fb0 0%, #33d3ff 100%)",
    emerald: "linear-gradient(135deg, #0f8e72 0%, #1da3cf 100%)",
    amber: "linear-gradient(135deg, #d67818 0%, #ff9f2f 100%)",
    rose: "linear-gradient(135deg, #d15a4b 0%, #f08e34 100%)",
    indigo: "linear-gradient(135deg, #166fc9 0%, #0e8fda 100%)",
    cyan: "linear-gradient(135deg, #0f8cb4 0%, #1ca8d8 100%)",
    teal: "linear-gradient(135deg, #12889f 0%, #2a96ca 100%)",
    blue: "linear-gradient(135deg, #176fd6 0%, #24a6ff 100%)",
};

function getCoverGradient(coverGradient) {
    if (!coverGradient) return COVER_GRADIENTS.sky;
    const key = Object.keys(COVER_GRADIENTS).find((k) => coverGradient.includes(k));
    return COVER_GRADIENTS[key] || COVER_GRADIENTS.sky;
}

export default function Community() {
    const { token } = useAuth();
    const [communities, setCommunities] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");
    const [selectedCommunityId, setSelectedCommunityId] = useState("");
    const [communityPosts, setCommunityPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsFeedback, setPostsFeedback] = useState("");
    const [feedType, setFeedType] = useState("latest");

    useEffect(() => {
        let isMounted = true;

        const loadCommunities = async () => {
            setLoading(true);
            try {
                const items = await getCommunities(token, query.trim());

                if (isMounted) {
                    setCommunities(items);
                    setFeedback("");
                }
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadCommunities();

        return () => {
            isMounted = false;
        };
    }, [query, token]);

    const featuredCommunity = useMemo(
        () => communities.find((community) => community.featured) || communities[0],
        [communities]
    );
    const selectedCommunity = useMemo(
        () => communities.find((community) => community._id === selectedCommunityId) || featuredCommunity || null,
        [communities, featuredCommunity, selectedCommunityId]
    );
    const visibleCategories = useMemo(() => Array.from(new Set(communities.map((community) => community.category).filter(Boolean))).slice(0, 6), [communities]);

    useEffect(() => {
        if (!communities.length) {
            setSelectedCommunityId("");
            return;
        }

        const selectedExists = communities.some((community) => community._id === selectedCommunityId);

        if (!selectedExists) {
            setSelectedCommunityId((featuredCommunity || communities[0])._id);
        }
    }, [communities, featuredCommunity, selectedCommunityId]);

    useEffect(() => {
        if (!selectedCommunity?._id || !token) {
            setCommunityPosts([]);
            return;
        }

        let isMounted = true;

        const loadCommunityPosts = async () => {
            setPostsLoading(true);

            try {
                const items = await getPosts(feedType, token, {
                    communityId: selectedCommunity._id,
                    limit: 8
                });

                if (isMounted) {
                    setCommunityPosts(Array.isArray(items) ? items : []);
                    setPostsFeedback("");
                }
            } catch (error) {
                if (isMounted) {
                    setPostsFeedback(error.message);
                }
            } finally {
                if (isMounted) {
                    setPostsLoading(false);
                }
            }
        };

        loadCommunityPosts();

        return () => {
            isMounted = false;
        };
    }, [feedType, selectedCommunity?._id, token]);

    // Real-time socket updates for community posts
    useEffect(() => {
        if (!token) return;
        const socket = connectSocket(token, "community");
        if (!socket) return;

        const onPostNew = (post) => {
            if (post?.community?._id === selectedCommunityId || post?.community === selectedCommunityId) {
                setCommunityPosts((prev) => [post, ...prev.filter((p) => p._id !== post._id)]);
                setCommunities((prev) => prev.map((c) => c._id === selectedCommunityId ? { ...c, postsCount: (c.postsCount || 0) + 1 } : c));
            }
        };
        const onPostUpdated = (post) => {
            setCommunityPosts((prev) => prev.map((p) => p._id === post._id ? post : p));
        };
        const onPostDeleted = ({ postId }) => {
            setCommunityPosts((prev) => {
                const found = prev.find((p) => p._id === postId);
                if (found) {
                    setCommunities((cs) => cs.map((c) => c._id === selectedCommunityId ? { ...c, postsCount: Math.max(0, (c.postsCount || 0) - 1) } : c));
                }
                return prev.filter((p) => p._id !== postId);
            });
        };
        const onCommentNew = ({ postId, commentsCount }) => {
            setCommunityPosts((prev) => prev.map((p) => p._id === postId ? { ...p, commentsCount: commentsCount ?? (p.commentsCount + 1) } : p));
        };

        socket.on("post:new", onPostNew);
        socket.on("post:updated", onPostUpdated);
        socket.on("post:deleted", onPostDeleted);
        socket.on("comment:new", onCommentNew);

        return () => {
            socket.off("post:new", onPostNew);
            socket.off("post:updated", onPostUpdated);
            socket.off("post:deleted", onPostDeleted);
            socket.off("comment:new", onCommentNew);
            disconnectSocket("community");
        };
    }, [token, selectedCommunityId]);

    const handleToggleMembership = async (community) => {
        try {
            const updatedCommunity = community.isJoined
                ? await leaveCommunity(community.slug, token)
                : await joinCommunity(community.slug, token);

            setCommunities((currentCommunities) => currentCommunities.map((item) => item._id === updatedCommunity._id ? updatedCommunity : item));
            setFeedback(community.isJoined ? "Left community successfully." : "Joined community successfully.");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleCommunityPostUpdate = (updatedPost) => {
        setCommunityPosts((currentPosts) => currentPosts.map((post) => post._id === updatedPost._id ? updatedPost : post));
    };

    const handleCommunityPostDelete = (postId) => {
        setCommunityPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
        setCommunities((currentCommunities) => currentCommunities.map((community) => community._id === selectedCommunityId
            ? { ...community, postsCount: Math.max(0, (community.postsCount || 0) - 1) }
            : community));
    };

    return (
        <PageTransition className="space-y-5">
            {/* ── Header ── */}
            <div className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>Communities</h1>
                        <p className="mt-1 text-[14px]" style={{ color: "var(--text-sub)" }}>Join focused circles for hackathons, placements, research, and peer learning.</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>
                        <span><strong className="text-[15px]" style={{ color: "var(--text-main)" }}>{communities.length}</strong> communities</span>
                        <span><strong className="text-[15px]" style={{ color: "var(--primary)" }}>{communities.filter((c) => c.isJoined).length}</strong> joined</span>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                    <MagnifyingGlassIcon className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                    <input
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                        style={{ color: "var(--text-main)" }}
                        placeholder="Search communities by topic, tag, or category…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>

                {/* Categories */}
                {visibleCategories.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs uppercase tracking-widest mr-1" style={{ color: "var(--text-faint)" }}>Categories:</span>
                        {visibleCategories.map((category) => (
                            <span key={category} className="pill-tag cursor-pointer" onClick={() => setQuery(category)}>{category}</span>
                        ))}
                    </div>
                ) : null}
            </div>

            <Notification tone={feedback.includes("successfully") ? "success" : "warning"} message={feedback} />

            {/* ── Featured Community ── */}
            {featuredCommunity ? (
                <div className="card overflow-hidden p-0">
                    {/* Gradient banner */}
                    <div
                        className="relative p-6 md:p-8"
                        style={{ background: getCoverGradient(featuredCommunity.coverGradient) }}
                    >
                        {/* subtle noise overlay for depth */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")" }} />
                        <div className="relative">
                            <span
                                className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest mb-3"
                                style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.3)" }}
                            >
                                ✦ Featured community
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                                {featuredCommunity.name}
                            </h3>
                            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                                {featuredCommunity.description}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {[`${featuredCommunity.membersCount} members`, `${featuredCommunity.postsCount} posts`, featuredCommunity.category, ...(featuredCommunity.tags || []).slice(0, 3).map(t => `#${t}`)].filter(Boolean).map((label) => (
                                    <span key={label} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.95)" }} className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium">
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Clean white action bar */}
                    <div className="flex items-center gap-3 px-6 py-4" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleToggleMembership(featuredCommunity)}
                        >
                            {featuredCommunity.isJoined ? "✓ Joined" : "Join community"}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSelectedCommunityId(featuredCommunity._id)}
                        >
                            View posts
                        </button>
                        {featuredCommunity.isJoined && (
                            <span className="ml-auto text-[12px] font-medium" style={{ color: "var(--success)" }}>You're a member</span>
                        )}
                    </div>
                </div>
            ) : null}

            {/* ── Community Grid ── */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading ? Array.from({ length: 4 }).map((_, index) => <LoadingCard key={`community-loading-${index}`} lines={4} />) : null}
                {!loading && communities.map((community) => (
                    <article
                        key={community._id}
                        className="card overflow-hidden p-0 transition-all duration-200"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(10,102,194,0.14), 0 0 0 1.5px var(--primary)"}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
                    >
                        {/* Accent strip */}
                        <div
                            className="h-2 w-full"
                            style={{ background: getCoverGradient(community.coverGradient) }}
                        />
                        {/* Card body — clean white */}
                        <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                    style={{ background: getCoverGradient(community.coverGradient) }}
                                >
                                    <UserGroupIcon className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--text-main)" }}>
                                        {community.name}
                                    </h3>
                                    <p className="text-[12px] mt-0.5" style={{ color: "var(--primary-light)" }}>{community.category}</p>
                                </div>
                                {community.isJoined && (
                                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--primary-subtle)", color: "var(--primary-light)" }}>Joined</span>
                                )}
                            </div>

                            <p className="text-[13px] leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--text-sub)" }}>
                                {community.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                <span className="pill-tag text-[11px]">{community.membersCount} members</span>
                                <span className="pill-tag text-[11px]">{community.postsCount} posts</span>
                                {community.tags?.slice(0, 2).map((tag) => (
                                    <span key={tag} className="pill-tag text-[11px]">#{tag}</span>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <button
                                    type="button"
                                    className="flex-1 text-[13px] font-semibold py-2 rounded-lg transition-colors"
                                    style={community.isJoined
                                        ? { background: "var(--surface-hover)", color: "var(--text-sub)", border: "1px solid var(--border)" }
                                        : { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)" }}
                                    onClick={() => handleToggleMembership(community)}
                                >
                                    {community.isJoined ? "Leave" : "Join community"}
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 text-[13px] font-semibold py-2 rounded-lg transition-colors"
                                    style={{ background: "var(--surface-soft)", color: "var(--primary-light)", border: "1px solid var(--border)" }}
                                    onClick={() => setSelectedCommunityId(community._id)}
                                >
                                    View posts
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
                {!loading && communities.length === 0 ? (
                    <div className="card p-6 text-sm md:col-span-2 xl:col-span-3" style={{ color: "var(--text-sub)" }}>
                        No communities matched this search.
                    </div>
                ) : null}
            </div>

            <CommunityFeedPanel
                community={selectedCommunity}
                posts={communityPosts}
                loading={postsLoading}
                error={postsFeedback}
                activeFilter={feedType}
                onFilterChange={setFeedType}
                onToggleMembership={handleToggleMembership}
                onPostUpdate={handleCommunityPostUpdate}
                onPostDelete={handleCommunityPostDelete}
            />
        </PageTransition>
    );
}
