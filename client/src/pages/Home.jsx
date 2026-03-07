import { ArrowTrendingUpIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import LoadingCard from "../components/ui/LoadingCard";
import Notification from "../components/Notification";
import PageHero from "../components/ui/PageHero";
import PageTransition from "../components/ui/PageTransition";
import { useAuth } from "../context/AuthContext.jsx";
import { createPost, getCommunities, getPosts } from "../services/api";

const feedTypes = ["smart", "latest", "following", "trending", "saved"];

export default function Home() {
    const { token, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [feedType, setFeedType] = useState("smart");
    const [posts, setPosts] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [visibleCount, setVisibleCount] = useState(4);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const sentinelRef = useRef(null);
    const selectedCommunitySlug = searchParams.get("community") || "";
    const selectedCommunity = useMemo(
        () => communities.find((community) => community.slug === selectedCommunitySlug) || null,
        [communities, selectedCommunitySlug]
    );

    useEffect(() => {
        let isMounted = true;

        const loadCommunities = async () => {
            try {
                const communityItems = await getCommunities(token);

                if (isMounted) {
                    setCommunities(communityItems);
                }
            } catch {
                if (isMounted) {
                    setCommunities([]);
                }
            }
        };

        loadCommunities();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        const loadFeed = async () => {
            setLoading(true);
            try {
                const items = await getPosts(feedType, token, {
                    communityId: selectedCommunity?._id
                });
                if (isMounted) {
                    setPosts(items);
                    setVisibleCount(4);
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

        loadFeed();

        return () => {
            isMounted = false;
        };
    }, [feedType, selectedCommunity?._id, token]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                setVisibleCount((currentCount) => Math.min(currentCount + 4, posts.length));
            }
        }, { threshold: 0.2 });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [posts.length]);

    const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);
    const feedInsights = useMemo(() => {
        const creatorCount = new Set(posts.map((post) => post.author?._id).filter(Boolean)).size;
        const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
        const topTags = Array.from(posts.reduce((counts, post) => {
            (post.tags || []).forEach((tag) => {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            });

            return counts;
        }, new Map()).entries())
            .sort((left, right) => right[1] - left[1])
            .slice(0, 3)
            .map(([tag]) => tag);

        return [
            { label: "Visible posts", value: posts.length, detail: `${visiblePosts.length} on screen` },
            { label: "Active creators", value: creatorCount, detail: "Distinct student voices" },
            { label: "Total likes", value: totalLikes, detail: selectedCommunity ? `${selectedCommunity.name} feed` : (topTags.length ? `Top tags: ${topTags.join(", ")}` : "Fresh discussion mix") }
        ];
    }, [posts, selectedCommunity, visiblePosts.length]);

    const handleCreatePost = async (payload) => {
        setPosting(true);
        try {
            const createdPost = await createPost(payload, token);
            setPosts((currentPosts) => [createdPost, ...currentPosts]);
            setFeedback("");
        } catch (error) {
            setFeedback(error.message);
            throw error;
        } finally {
            setPosting(false);
        }
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts((currentPosts) => {
            const shouldStayInSavedFeed = feedType !== "saved"
                || updatedPost.savedBy?.some((savedUserId) => (typeof savedUserId === "string" ? savedUserId : savedUserId._id) === user?._id);

            if (!shouldStayInSavedFeed) {
                return currentPosts.filter((post) => post._id !== updatedPost._id);
            }

            return currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post));
        });
    };

    const handlePostDeleted = (postId) => {
        setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    return (
        <PageTransition className="space-y-6">
            <PageHero
                eyebrow="Community feed"
                title="Relevant discussions, project launches, and student momentum in one stream."
                description="Switch between smart, latest, following, trending, and saved views while the feed progressively reveals more posts as you scroll."
                orbClassName="bg-brand-500/12"
                badges={(
                    <>
                        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                            <SparklesIcon className="h-4 w-4" />
                            Social feed
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300">
                            <ArrowTrendingUpIcon className="h-4 w-4 text-accent-300" />
                            Infinite scroll enabled
                        </span>
                        {selectedCommunity ? <span className="pill-tag">Scoped to {selectedCommunity.name}</span> : null}
                    </>
                )}
                aside={(
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        {feedInsights.map((item) => (
                            <div key={item.label} className="stat-tile shadow-xl">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                                <p className="display-title mt-2 text-2xl font-bold text-white">{item.value}</p>
                                <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                )}
            >
                <div className="grid gap-3 sm:grid-cols-2 xl:max-w-2xl">
                    <div className="floating-metric px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Feed quality</p>
                        <p className="display-title mt-2 text-lg font-bold text-white">Linear-style focus, social-first utility</p>
                        <p className="mt-1 text-sm text-slate-400">Structured for scanning, discussion, and high-signal updates.</p>
                    </div>
                    <div className="floating-metric px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Experience</p>
                        <p className="display-title mt-2 text-lg font-bold text-white">Glass surfaces with motion</p>
                        <p className="mt-1 text-sm text-slate-400">Ambient depth, floating filters, and startup-grade polish.</p>
                    </div>
                </div>

                <div className="card-ghost px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Community scope</p>
                            <p className="mt-1 text-sm text-slate-300">Jump into a specific circle or pull back to the full platform feed.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className={selectedCommunity ? "btn-secondary px-4 py-2 text-xs" : "btn-primary px-4 py-2 text-xs"}
                                onClick={() => setSearchParams({})}
                            >
                                All communities
                            </button>
                            {communities.slice(0, 5).map((community) => (
                                <button
                                    key={community._id}
                                    type="button"
                                    className={selectedCommunitySlug === community.slug ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}
                                    onClick={() => setSearchParams({ community: community.slug })}
                                >
                                    {community.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card-ghost px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Feed mode</p>
                            <p className="mt-1 text-sm text-slate-300">Shift between ranking models without leaving the main stream.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {feedTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={feedType === type ? "btn-primary px-4 py-2 text-xs uppercase tracking-[0.24em]" : "btn-secondary px-4 py-2 text-xs uppercase tracking-[0.24em]"}
                                    onClick={() => setFeedType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </PageHero>

            <Notification tone="warning" message={feedback} />
            <CreatePost onSubmit={handleCreatePost} isSubmitting={posting} communities={communities} defaultCommunityId={selectedCommunity?._id || ""} />

            <div className="space-y-5">
                {loading ? Array.from({ length: 3 }).map((_, index) => <LoadingCard key={`feed-loading-${index}`} lines={5} />) : null}
                {!loading && posts.length === 0 ? (
                    <div className="card-surface p-6 text-sm text-slate-400">
                        No posts in this feed yet. Switch feed mode or create the first discussion.
                    </div>
                ) : null}
                {!loading && visiblePosts.map((post) => (
                    <PostCard key={post._id} post={post} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
                ))}
                {!loading && visiblePosts.length < posts.length ? <div ref={sentinelRef} className="h-12" /> : null}
                {!loading && visiblePosts.length >= posts.length && posts.length > 0 ? <p className="py-4 text-center text-sm text-slate-500">You are caught up for now.</p> : null}
            </div>
        </PageTransition>
    );
}
