import { ArrowTrendingUpIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import LoadingCard from "../components/ui/LoadingCard";
import Notification from "../components/Notification";
import PageTransition from "../components/ui/PageTransition";
import { useAuth } from "../context/AuthContext.jsx";
import { createPost, getPosts } from "../services/api";

const feedTypes = ["smart", "latest", "following", "trending"];

export default function Home() {
    const { token } = useAuth();
    const [feedType, setFeedType] = useState("smart");
    const [posts, setPosts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(4);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const sentinelRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const loadFeed = async () => {
            setLoading(true);
            try {
                const items = await getPosts(feedType, token);
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
    }, [feedType, token]);

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
            { label: "Total likes", value: totalLikes, detail: topTags.length ? `Top tags: ${topTags.join(", ")}` : "Fresh discussion mix" }
        ];
    }, [posts, visiblePosts.length]);

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
        setPosts((currentPosts) => currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    };

    const handlePostDeleted = (postId) => {
        setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    return (
        <PageTransition className="space-y-6">
            <div className="card-surface overflow-hidden p-5">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] xl:items-end">
                    <div>
                        <div className="mb-5 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                                <SparklesIcon className="h-4 w-4" />
                                Social feed
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300">
                                <ArrowTrendingUpIcon className="h-4 w-4 text-accent-300" />
                                Infinite scroll enabled
                            </span>
                        </div>
                        <p className="section-title">Community feed</p>
                        <h2 className="mt-2 text-balance text-3xl font-bold text-white">Relevant discussions, project launches, and student momentum in one stream.</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">Switch between smart, latest, following, and trending views while the feed progressively reveals more posts as you scroll.</p>

                        <div className="mt-5 flex flex-wrap gap-2">
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

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        {feedInsights.map((item) => (
                            <div key={item.label} className="stat-tile">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                                <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Notification tone="warning" message={feedback} />
            <CreatePost onSubmit={handleCreatePost} isSubmitting={posting} />

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
