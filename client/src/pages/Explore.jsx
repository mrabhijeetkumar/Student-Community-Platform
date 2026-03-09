import { MagnifyingGlassIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Notification from "../components/Notification.jsx";
import PostCard from "../components/PostCard.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import LoadingCard from "../components/ui/LoadingCard.jsx";
import PageHero from "../components/ui/PageHero.jsx";
import { useAuth } from "../context/useAuth.js";
import {
    followUser,
    getCommunities,
    getPosts,
    getUserDirectory,
    joinCommunity,
    leaveCommunity,
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
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [communityLoading, setCommunityLoading] = useState(true);
    const [trendingLoading, setTrendingLoading] = useState(true);
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

    const insights = useMemo(() => ([
        { label: "People", value: directory.length, detail: deferredQuery ? `Matches for \"${deferredQuery}\"` : "Student profiles" },
        { label: "Communities", value: communities.length, detail: "Relevant circles" },
        { label: "Trending", value: trendingPosts.length, detail: "High-signal posts" }
    ]), [communities.length, deferredQuery, directory.length, trendingPosts.length]);

    const handlePostUpdate = (updatedPost) => {
        setTrendingPosts((currentPosts) => currentPosts.map((post) => (
            post._id === updatedPost._id ? updatedPost : post
        )));
    };

    const handlePostDelete = (postId) => {
        setTrendingPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    const handleStudentFollowToggle = async (student) => {
        if (!student?.username || busyStudentUsername) {
            return;
        }

        setBusyStudentUsername(student.username);
        const previousStudent = student;
        const optimisticStudent = {
            ...student,
            isFollowing: !student.isFollowing,
            stats: {
                ...(student.stats || {}),
                followers: Math.max(0, (student.stats?.followers ?? 0) + (student.isFollowing ? -1 : 1))
            }
        };

        setDirectory((currentStudents) => currentStudents.map((item) => (
            item._id === student._id ? optimisticStudent : item
        )));

        try {
            const updatedStudent = student.isFollowing
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
        <PageTransition className="space-y-6">
            <PageHero
                eyebrow="Explore"
                title="Find students, communities, and posts worth your attention."
                description="Search the network by name, college, username, skill, or topic and jump straight into the people and circles that matter."
                orbClassName="bg-sky-400/12"
                badges={(
                    <>
                        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                            <SparklesIcon className="h-4 w-4" />
                            Real discovery
                        </span>
                        <span className="pill-tag">{directoryLoading ? "Searching..." : `${directory.length} people`}</span>
                        <span className="pill-tag">{communityLoading ? "Loading communities..." : `${communities.length} communities`}</span>
                    </>
                )}
                aside={(
                    <div className="space-y-3">
                        <div className="card-ghost flex items-center gap-3 px-4 py-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                            <input
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                placeholder="Search by name, username, skill, or topic"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            {insights.map((item) => (
                                <div key={item.label} className="stat-tile shadow-xl">
                                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                                    <p className="display-title mt-2 text-2xl font-bold text-white">{item.value}</p>
                                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            >
                <div className="card-ghost px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Explore mode</p>
                            <p className="mt-1 text-sm text-slate-300">This page is now powered by your live user directory, community index, and trending feed.</p>
                        </div>
                        <Link to="/communities" className="btn-secondary">
                            Open communities
                        </Link>
                    </div>
                </div>
            </PageHero>

            <Notification tone="warning" message={feedback} />

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                    <section className="card-surface p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <UserGroupIcon className="h-6 w-6 text-accent-300" />
                            <div>
                                <h2 className="text-xl font-semibold text-white">Students</h2>
                                <p className="text-sm text-slate-400">Discover people by skill set, college, or momentum</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {directoryLoading ? Array.from({ length: 4 }).map((_, index) => (
                                <LoadingCard key={`directory-loading-${index}`} lines={4} />
                            )) : null}

                            {!directoryLoading && directory.map((student) => (
                                <motion.article
                                    key={student._id}
                                    whileHover={{ y: -3 }}
                                    className="card-ghost flex items-center gap-3 p-4"
                                >
                                    <Link
                                        to={`/profile/${student.username}`}
                                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 text-sm font-bold text-white"
                                    >
                                        {student.profilePhoto ? (
                                            <img src={student.profilePhoto} alt={student.name} className="h-full w-full object-cover" />
                                        ) : (
                                            getInitials(student.name)
                                        )}
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                        <Link to={`/profile/${student.username}`} className="block truncate text-sm font-semibold text-white transition hover:text-accent-300">
                                            {student.name}
                                        </Link>
                                        <p className="truncate text-xs text-slate-400">@{student.username}</p>
                                        <p className="mt-1 truncate text-xs text-slate-500">{student.headline || student.college || "Student community member"}</p>
                                        {student.skills?.length ? (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {student.skills.slice(0, 3).map((skill) => (
                                                    <span key={skill} className="pill-tag">{skill}</span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        className={student.isFollowing ? "btn-secondary px-3 py-2 text-xs" : "btn-primary px-3 py-2 text-xs"}
                                        onClick={() => handleStudentFollowToggle(student)}
                                        disabled={busyStudentUsername === student.username}
                                    >
                                        {busyStudentUsername === student.username ? "Updating..." : student.isFollowing ? "Following" : "Follow"}
                                    </button>
                                </motion.article>
                            ))}

                            {!directoryLoading && directory.length === 0 ? (
                                <div className="card-ghost p-5 text-sm text-slate-400 md:col-span-2">
                                    No students matched this search yet. Try a different name, skill, or college keyword.
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <section className="card-surface p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <SparklesIcon className="h-6 w-6 text-brand-200" />
                            <div>
                                <h2 className="text-xl font-semibold text-white">Communities</h2>
                                <p className="text-sm text-slate-400">Join active circles around shared goals and interests</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {communityLoading ? Array.from({ length: 4 }).map((_, index) => (
                                <LoadingCard key={`community-loading-${index}`} lines={4} />
                            )) : null}

                            {!communityLoading && communities.map((community) => (
                                <motion.article key={community._id} whileHover={{ y: -3 }} className="card-ghost p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{community.name}</p>
                                            <p className="mt-1 text-xs text-accent-300">{community.category}</p>
                                        </div>
                                        <span className="pill-tag">{community.membersCount} members</span>
                                    </div>
                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{community.description}</p>
                                    {(community.tags || []).length ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {community.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className="pill-tag">#{tag}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <Link to="/communities" className="text-xs font-medium uppercase tracking-[0.18em] text-accent-300 transition hover:text-accent-200">
                                            Open community
                                        </Link>
                                        <button
                                            type="button"
                                            className={community.isJoined ? "btn-secondary px-3 py-2 text-xs" : "btn-primary px-3 py-2 text-xs"}
                                            onClick={() => handleCommunityToggle(community)}
                                            disabled={busyCommunitySlug === community.slug}
                                        >
                                            {busyCommunitySlug === community.slug ? "Updating..." : community.isJoined ? "Joined" : "Join"}
                                        </button>
                                    </div>
                                </motion.article>
                            ))}

                            {!communityLoading && communities.length === 0 ? (
                                <div className="card-ghost p-5 text-sm text-slate-400 md:col-span-2">
                                    No communities matched this search yet. Try a broader topic or open the communities page.
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>

                <section className="space-y-5">
                    <div className="card-surface p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Trending posts</h2>
                                <p className="mt-1 text-sm text-slate-400">What is currently driving the most engagement on the platform.</p>
                            </div>
                            <span className="pill-tag">Top 4</span>
                        </div>
                    </div>

                    {trendingLoading ? Array.from({ length: 2 }).map((_, index) => (
                        <LoadingCard key={`trending-loading-${index}`} lines={5} />
                    )) : null}

                    {!trendingLoading && trendingPosts.map((post) => (
                        <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
                    ))}

                    {!trendingLoading && trendingPosts.length === 0 ? (
                        <div className="card-surface p-6 text-sm text-slate-400">
                            No trending posts available right now.
                        </div>
                    ) : null}
                </section>
            </div>
        </PageTransition>
    );
}