import { MagnifyingGlassIcon, RectangleStackIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageTransition from "../components/ui/PageTransition";
import PostCard from "../components/PostCard";
import UserCard from "../components/UserCard";
import LoadingCard from "../components/ui/LoadingCard";
import Notification from "../components/Notification";
import PageHero from "../components/ui/PageHero";
import { useAuth } from "../context/AuthContext.jsx";
import { getPosts, getUserDirectory } from "../services/api";

const communities = [
    {
        title: "Product Builders",
        description: "Peer feedback on MVPs, startup ideas, and student-led launches.",
        count: "1.8k members"
    },
    {
        title: "Open Source Guild",
        description: "Find repositories, contribution partners, and mentorship threads.",
        count: "940 members"
    },
    {
        title: "Placement Room",
        description: "Interview prep, referral requests, and role-specific discussion spaces.",
        count: "3.4k members"
    }
];

export default function Explore() {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [directory, setDirectory] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [feedback, setFeedback] = useState("");
    const deferredQuery = useDeferredValue(query.trim());
    const exploreInsights = useMemo(() => {
        return [
            { label: "People", value: directory.length, detail: deferredQuery ? `Results for ${deferredQuery}` : "Directory matches" },
            { label: "Trending", value: trendingPosts.length, detail: "High-signal posts" },
            { label: "Clusters", value: communities.length, detail: "Community prompts" }
        ];
    }, [deferredQuery, directory.length, trendingPosts.length]);

    useEffect(() => {
        const urlQuery = searchParams.get("q") || "";
        setQuery((currentQuery) => (currentQuery === urlQuery ? currentQuery : urlQuery));
    }, [searchParams]);

    useEffect(() => {
        setSearchParams(deferredQuery ? { q: deferredQuery } : {}, { replace: true });
    }, [deferredQuery, setSearchParams]);

    useEffect(() => {
        let isMounted = true;

        const loadDirectory = async () => {
            setDirectoryLoading(true);
            try {
                const users = await getUserDirectory(token, deferredQuery);
                if (isMounted) {
                    setDirectory(users);
                    setFeedback("");
                }
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
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
        let isMounted = true;

        const loadTrending = async () => {
            setTrendingLoading(true);
            try {
                const posts = await getPosts("trending", token);

                if (!isMounted) {
                    return;
                }

                setTrendingPosts(posts.slice(0, 4));
                setFeedback("");
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
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

    return (
        <PageTransition className="space-y-6">
            <PageHero
                eyebrow="Explore"
                title="Discover trending conversations, communities, and student talent."
                description="This is the discovery layer for finding peers, joining interest clusters, and browsing what is gaining momentum across the platform."
                orbClassName="bg-brand-500/12"
                badges={(
                    <>
                        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                            <SparklesIcon className="h-4 w-4" />
                            Discovery layer
                        </span>
                        <span className="pill-tag">{directoryLoading ? "Searching directory..." : `${directory.length} people found`}</span>
                        {deferredQuery ? <span className="pill-tag">Query: {deferredQuery}</span> : null}
                    </>
                )}
                aside={(
                    <div className="space-y-3">
                        <div className="card-ghost flex items-center gap-3 px-4 py-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                            <input
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                placeholder="Search by name, username, college, or skill"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            {exploreInsights.map((item) => (
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
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Browse modes</p>
                            <p className="mt-1 text-sm text-slate-300">Switch between people discovery, community prompts, and trending content from one surface.</p>
                        </div>
                        <Link to="/communities" className="btn-secondary">
                            Open communities
                        </Link>
                    </div>
                </div>
            </PageHero>

            <Notification tone="warning" message={feedback} />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                    <section className="card-surface p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <UserGroupIcon className="h-6 w-6 text-accent-300" />
                            <div>
                                <h2 className="text-xl font-semibold text-white">Suggested people</h2>
                                <p className="text-sm text-slate-400">Students aligned to your network and interests</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {directoryLoading ? Array.from({ length: 4 }).map((_, index) => <LoadingCard key={`directory-loading-${index}`} lines={4} />) : null}
                            {!directoryLoading && directory.map((entry) => <UserCard key={entry._id} user={entry} />)}
                            {!directoryLoading && directory.length === 0 ? (
                                <div className="card-ghost p-5 text-sm text-slate-400">
                                    No users matched this search yet. Try a different name, skill, or college keyword.
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <section className="card-surface p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <RectangleStackIcon className="h-6 w-6 text-brand-200" />
                            <div>
                                <h2 className="text-xl font-semibold text-white">Communities</h2>
                                <p className="text-sm text-slate-400">Interest clusters built for focused discussion</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {communities.map((community) => (
                                <article key={community.title} className="card-ghost p-4">
                                    <p className="text-sm font-semibold text-white">{community.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">{community.description}</p>
                                    <p className="mt-4 text-xs uppercase tracking-[0.22em] text-accent-300">{community.count}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="space-y-5">
                    <div className="card-surface p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Trending posts</h2>
                                <p className="mt-1 text-sm text-slate-400">High-engagement discussions currently shaping the network.</p>
                            </div>
                            <span className="pill-tag">Top 4</span>
                        </div>
                    </div>
                    {trendingLoading ? Array.from({ length: 2 }).map((_, index) => <LoadingCard key={`trending-loading-${index}`} lines={5} />) : null}
                    {!trendingLoading && trendingPosts.map((post) => (
                        <PostCard key={post._id} post={post} onUpdated={(updatedPost) => setTrendingPosts((currentPosts) => currentPosts.map((item) => item._id === updatedPost._id ? updatedPost : item))} onDeleted={(postId) => setTrendingPosts((currentPosts) => currentPosts.filter((item) => item._id !== postId))} />
                    ))}
                </section>
            </div>
        </PageTransition>
    );
}