import { MagnifyingGlassIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useDeferredValue, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Notification from "../components/Notification.jsx";
import PostCard from "../components/PostCard.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import LoadingCard from "../components/ui/LoadingCard.jsx";
import { useAuth } from "../context/useAuth.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import {
    followUser,
    getCommunities,
    getPosts,
    getUserDirectory,
    joinCommunity,
    leaveCommunity,
    searchPosts,
    unfollowUser
} from "../services/api.js";

function getInitials(name) {
    return (name || "Student")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function Explore() {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const deferredQuery = useDeferredValue(query.trim());

    const [directory, setDirectory] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [searchedPosts, setSearchedPosts] = useState([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [communityLoading, setCommunityLoading] = useState(true);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [searchPostsLoading, setSearchPostsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [busyStudentUsername, setBusyStudentUsername] = useState("");
    const [busyCommunitySlug, setBusyCommunitySlug] = useState("");

    useEffect(() => {
        const nextQuery = searchParams.get("q") || "";
        setQuery((currentQuery) => (currentQuery === nextQuery ? currentQuery : nextQuery));
    }, [searchParams]);

    useEffect(() => {
        setSearchParams(deferredQuery ? { q: deferredQuery } : {}, { replace: true });
    }, [deferredQuery, setSearchParams]);

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        const loadDirectory = async () => {
            setDirectoryLoading(true);

            try {
                const users = await getUserDirectory(token, deferredQuery);

                if (!isMounted) {
                    return;
                }

                setDirectory(Array.isArray(users) ? users : []);
                setFeedback("");
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
                    setDirectory([]);
                }
            } finally {
                if (isMounted) {
                    setDirectoryLoading(false);
                }
            }
        };

        loadDirectory();

        return () => {
            isMounted = false;
        };
    }, [deferredQuery, token]);

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        const loadCommunities = async () => {
            setCommunityLoading(true);

            try {
                const items = await getCommunities(token, deferredQuery);

                if (!isMounted) {
                    return;
                }

                setCommunities(Array.isArray(items) ? items.slice(0, 6) : []);
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
                    setCommunities([]);
                }
            } finally {
                if (isMounted) {
                    setCommunityLoading(false);
                }
            }
        };

        loadCommunities();

        return () => {
            isMounted = false;
        };
    }, [deferredQuery, token]);

    // Search posts when there is a query
    useEffect(() => {
        if (!token) return;
        if (!deferredQuery) { setSearchedPosts([]); return; }

        let isMounted = true;
        setSearchPostsLoading(true);

        searchPosts(deferredQuery, token, { limit: 10 })
            .then((posts) => { if (isMounted) setSearchedPosts(Array.isArray(posts) ? posts : []); })
            .catch(() => { if (isMounted) setSearchedPosts([]); })
            .finally(() => { if (isMounted) setSearchPostsLoading(false); });

        return () => { isMounted = false; };
    }, [deferredQuery, token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;

        const loadTrending = async () => {
            setTrendingLoading(true);

            try {
                const posts = await getPosts("trending", token, { limit: 4 });

                if (!isMounted) {
                    return;
                }

                setTrendingPosts(Array.isArray(posts) ? posts : []);
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
                    setTrendingPosts([]);
                }
            } finally {
                if (isMounted) {
                    setTrendingLoading(false);
                }
            }
        };

        loadTrending();

        return () => {
            isMounted = false;
        };
    }, [token]);

    // Real-time socket updates
    useEffect(() => {
        if (!token) return;
        const socket = connectSocket(token, "explore");
        if (!socket) return;

        const onPostUpdated = (data) => {
            const p = data?.post ?? data;
            if (!p?._id) return;
            setTrendingPosts((prev) => prev.map((post) => post._id === p._id ? p : post));
            setSearchedPosts((prev) => prev.map((post) => post._id === p._id ? p : post));
        };

        const onPostDeleted = ({ postId }) => {
            setTrendingPosts((prev) => prev.filter((p) => p._id !== postId));
            setSearchedPosts((prev) => prev.filter((p) => p._id !== postId));
        };

        socket.on("post:updated", onPostUpdated);
        socket.on("post:deleted", onPostDeleted);

        return () => {
            socket.off("post:updated", onPostUpdated);
            socket.off("post:deleted", onPostDeleted);
            disconnectSocket("explore");
        };
    }, [token]);

    const handlePostUpdate = (updatedPost) => {
        setTrendingPosts((currentPosts) => currentPosts.map((post) => (
            post._id === updatedPost._id ? updatedPost : post
        )));
        setSearchedPosts((currentPosts) => currentPosts.map((post) => (
            post._id === updatedPost._id ? updatedPost : post
        )));
    };

    const handlePostDelete = (postId) => {
        setTrendingPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
        setSearchedPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    const handleStudentFollowToggle = async (student) => {
        if (!student?.username || busyStudentUsername) {
            return;
        }

        setBusyStudentUsername(student.username);
        const previousStudent = student;
        try {
            const updatedStudent = (student.isFollowing || student.followRequestStatus === "requested")
                ? await unfollowUser(student.username, token)
                : await followUser(student.username, token);

            setDirectory((currentStudents) => currentStudents.map((item) => (
                item._id === updatedStudent._id ? updatedStudent : item
            )));
        } catch (error) {
            setDirectory((currentStudents) => currentStudents.map((item) => (
                item._id === previousStudent._id ? previousStudent : item
            )));
            setFeedback(error.message);
        } finally {
            setBusyStudentUsername("");
        }
    };

    const handleCommunityToggle = async (community) => {
        if (!community?.slug || busyCommunitySlug) {
            return;
        }

        setBusyCommunitySlug(community.slug);
        const previousCommunity = community;
        const optimisticCommunity = {
            ...community,
            isJoined: !community.isJoined,
            membersCount: Math.max(0, (community.membersCount || 0) + (community.isJoined ? -1 : 1))
        };

        setCommunities((currentCommunities) => currentCommunities.map((item) => (
            item._id === community._id ? optimisticCommunity : item
        )));

        try {
            const updatedCommunity = community.isJoined
                ? await leaveCommunity(community.slug, token)
                : await joinCommunity(community.slug, token);

            setCommunities((currentCommunities) => currentCommunities.map((item) => (
                item._id === updatedCommunity._id ? updatedCommunity : item
            )));
        } catch (error) {
            setCommunities((currentCommunities) => currentCommunities.map((item) => (
                item._id === previousCommunity._id ? previousCommunity : item
            )));
            setFeedback(error.message);
        } finally {
            setBusyCommunitySlug("");
        }
    };

    return (
        <PageTransition className="space-y-5">
            {/* ── Header + Search ── */}
            <div className="card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                    <div className="flex-1 min-w-0">
                        <p className="section-title mb-1">Explore</p>
                        <h1 className="display-title text-[22px] font-bold" style={{ color: "var(--text-main)" }}>
                            Find students &amp; communities
                        </h1>
                        <p className="text-[14px] mt-1" style={{ color: "var(--text-sub)" }}>
                            Search by name, college, skill, or topic to discover who and what matters to you.
                        </p>
                    </div>

                    <div className="flex-1 min-w-0 max-w-sm">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                            <input
                                className="input pl-9"
                                placeholder="Search by name, username, skill, or topic"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="pill-tag flex items-center gap-1.5">
                        <SparklesIcon className="h-3 w-3" />
                        Real discovery
                    </span>
                    <span className="pill-tag">{directoryLoading ? "Searching..." : `${directory.length} people`}</span>
                    <span className="pill-tag">{communityLoading ? "Loading..." : `${communities.length} communities`}</span>
                    <div className="ml-auto">
                        <Link to="/communities" className="btn-secondary py-1.5 px-3 text-xs">Browse communities</Link>
                    </div>
                </div>
            </div>

            <Notification tone="warning" message={feedback} />

            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                    {/* Students */}
                    <section className="card p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "var(--primary-subtle)" }}>
                                <UserGroupIcon className="h-4 w-4" style={{ color: "var(--primary-light)" }} />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-main)" }}>Students</h2>
                                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Discover people by skill set, college, or momentum</p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {directoryLoading ? Array.from({ length: 4 }).map((_, index) => (
                                <LoadingCard key={`directory-loading-${index}`} lines={4} />
                            )) : null}

                            {!directoryLoading && directory.map((student) => (
                                <motion.article
                                    key={student._id}
                                    whileHover={{ y: -2 }}
                                    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                                >
                                    <Link
                                        to={`/profile/${student.username}`}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
                                        style={{ background: "var(--primary)" }}
                                    >
                                        {student.profilePhoto ? (
                                            <img src={student.profilePhoto} alt={student.name} className="h-full w-full object-cover" />
                                        ) : (
                                            getInitials(student.name)
                                        )}
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                        <Link to={`/profile/${student.username}`} className="block truncate text-[14px] font-semibold hover:underline" style={{ color: "var(--text-main)" }}>
                                            {student.name}
                                        </Link>
                                        <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>@{student.username}</p>
                                        <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--text-sub)" }}>{student.headline || student.college || "Student"}</p>
                                        {student.skills?.length ? (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {student.skills.slice(0, 3).map((skill) => (
                                                    <span key={skill} className="pill-tag text-[12px]">{skill}</span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        className="text-[12px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
                                        style={student.isFollowing
                                            ? { background: "var(--surface-hover)", color: "var(--text-sub)", border: "1px solid var(--border)" }
                                            : { background: "var(--primary-subtle)", color: "var(--primary-light)", border: "1px solid rgba(99,102,241,0.25)" }}
                                        onClick={() => handleStudentFollowToggle(student)}
                                        disabled={busyStudentUsername === student.username}
                                    >
                                        {busyStudentUsername === student.username ? "…" : student.isFollowing ? "Following" : "Follow"}
                                    </button>
                                </motion.article>
                            ))}

                            {!directoryLoading && directory.length === 0 ? (
                                <div className="md:col-span-2 rounded-xl p-5 text-[14px]" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }}>
                                    No students matched this search yet. Try a different name, skill, or college keyword.
                                </div>
                            ) : null}
                        </div>
                    </section>

                    {/* Communities */}
                    <section className="card p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.12)" }}>
                                <SparklesIcon className="h-4 w-4" style={{ color: "var(--warning)" }} />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-main)" }}>Communities</h2>
                                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Join active circles around shared goals and interests</p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {communityLoading ? Array.from({ length: 4 }).map((_, index) => (
                                <LoadingCard key={`community-loading-${index}`} lines={4} />
                            )) : null}

                            {!communityLoading && communities.map((community) => (
                                <motion.article key={community._id} whileHover={{ y: -2 }} className="rounded-xl p-4 transition-colors" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-main)" }}>{community.name}</p>
                                            <p className="mt-0.5 text-[12px]" style={{ color: "var(--primary-light)" }}>{community.category}</p>
                                        </div>
                                        <span className="pill-tag shrink-0">{community.membersCount} members</span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed" style={{ color: "var(--text-sub)" }}>{community.description}</p>
                                    {(community.tags || []).length ? (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {community.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className="pill-tag text-[12px]">#{tag}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <Link to="/communities" className="text-[12px] font-semibold transition-colors" style={{ color: "var(--primary-light)" }}>
                                            Open community →
                                        </Link>
                                        <button
                                            type="button"
                                            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
                                            style={community.isJoined
                                                ? { background: "var(--surface-hover)", color: "var(--text-sub)", border: "1px solid var(--border)" }
                                                : { background: "var(--primary-subtle)", color: "var(--primary-light)", border: "1px solid rgba(99,102,241,0.25)" }}
                                            onClick={() => handleCommunityToggle(community)}
                                            disabled={busyCommunitySlug === community.slug}
                                        >
                                            {busyCommunitySlug === community.slug ? "…" : community.isJoined ? "Joined" : "Join"}
                                        </button>
                                    </div>
                                </motion.article>
                            ))}

                            {!communityLoading && communities.length === 0 ? (
                                <div className="md:col-span-2 rounded-xl p-5 text-[14px]" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }}>
                                    No communities matched this search yet. Try a broader topic or open the communities page.
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>

                {/* Post search results (only when query is active) */}
                {deferredQuery ? (
                    <section className="card p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="h-8 w-8 flex items-center justify-center rounded-xl" style={{ background: "var(--primary-subtle)" }}>
                                <MagnifyingGlassIcon className="h-4 w-4" style={{ color: "var(--primary-light)" }} />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-main)" }}>Posts</h2>
                                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Matching posts for &ldquo;{deferredQuery}&rdquo;</p>
                            </div>
                            {!searchPostsLoading && (
                                <span className="pill-tag ml-auto">{searchedPosts.length} found</span>
                            )}
                        </div>

                        {searchPostsLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => <LoadingCard key={`sp-${i}`} lines={4} />)}
                            </div>
                        ) : searchedPosts.length > 0 ? (
                            <div className="space-y-3">
                                {searchedPosts.map((post) => (
                                    <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl p-5 text-[14px]" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }}>
                                No posts found for this search.
                            </div>
                        )}
                    </section>
                ) : null}

                {/* Trending posts */}
                <section className="space-y-4">
                    <div className="card p-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-main)" }}>Trending posts</h2>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>Most engagement on the platform</p>
                        </div>
                        <span className="pill-tag">Top 4</span>
                    </div>

                    {trendingLoading ? Array.from({ length: 2 }).map((_, index) => (
                        <LoadingCard key={`trending-loading-${index}`} lines={5} />
                    )) : null}

                    {!trendingLoading && trendingPosts.map((post) => (
                        <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
                    ))}

                    {!trendingLoading && trendingPosts.length === 0 ? (
                        <div className="card p-5 text-[14px]" style={{ color: "var(--text-sub)" }}>
                            No trending posts available right now.
                        </div>
                    ) : null}
                </section>
            </div>
        </PageTransition>
    );
}
