import { FireIcon, RectangleGroupIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCommunities, getNotifications, getPosts, getSuggestedUsers, joinCommunity, leaveCommunity } from "../../services/api";
import UserCard from "../UserCard";
import LoadingCard from "../ui/LoadingCard";

export default function RightRail() {
    const { token } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [recommendedCommunities, setRecommendedCommunities] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const trendingTopics = useMemo(() => {
        const counts = new Map();

        trendingPosts.forEach((post) => {
            (post.tags || []).forEach((tag) => {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            });
        });

        return Array.from(counts.entries())
            .sort((left, right) => right[1] - left[1])
            .slice(0, 4);
    }, [trendingPosts]);

    useEffect(() => {
        let isMounted = true;

        const loadRail = async () => {
            try {
                const [suggestedUsers, trending, notificationResponse, communityResponse] = await Promise.all([
                    getSuggestedUsers(token),
                    getPosts("trending", token),
                    getNotifications(token),
                    getCommunities(token, "", { featuredOnly: true })
                ]);

                if (!isMounted) {
                    return;
                }

                setSuggestions(suggestedUsers);
                setTrendingPosts(trending.slice(0, 3));
                setRecentActivity(notificationResponse.items?.slice(0, 3) || []);
                setRecommendedCommunities(communityResponse.slice(0, 3));
            } catch (error) {
                if (isMounted) {
                    setSuggestions([]);
                    setTrendingPosts([]);
                    setRecommendedCommunities([]);
                    setRecentActivity([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadRail();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleCommunityToggle = async (community) => {
        try {
            const updatedCommunity = community.isJoined
                ? await leaveCommunity(community.slug, token)
                : await joinCommunity(community.slug, token);

            setRecommendedCommunities((currentCommunities) => currentCommunities.map((item) => item._id === updatedCommunity._id ? updatedCommunity : item));
        } catch {
            // Keep the right rail non-blocking.
        }
    };

    return (
        <aside className="hidden xl:block xl:w-[304px] xl:flex-none">
            <div className="scrollbar-subtle sticky top-4 max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto pr-1">
                <div className="card-surface overflow-hidden p-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
                            <FireIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Trending posts</p>
                            <p className="text-sm text-slate-400">What the student network is talking about now</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? <LoadingCard lines={4} /> : null}
                        {!loading && trendingPosts.map((post, index) => (
                            <article key={post._id} className="floating-metric px-4 py-4 transition hover:-translate-y-0.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500/10 text-sm font-semibold text-brand-100">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{post.author?.name}</p>
                                            <p className="text-xs text-slate-500">{post.likes?.length || 0} likes • {post.commentsCount || 0} comments</p>
                                        </div>
                                    </div>
                                    <Link to={`/profile/${post.author?.username}`} className="text-xs font-medium text-accent-300 transition hover:text-accent-200">
                                        View
                                    </Link>
                                </div>
                                {post.community ? <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300">{post.community.name}</p> : null}
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{post.content}</p>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="card-surface overflow-hidden p-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-accent-400/10 p-3 text-accent-300">
                            <UserGroupIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Suggested users</p>
                            <p className="text-sm text-slate-400">People you may want to follow</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? <LoadingCard lines={4} /> : null}
                        {!loading && suggestions.map((user) => <UserCard key={user._id} user={user} compact />)}
                    </div>
                </div>

                <div className="card-surface overflow-hidden p-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white/[0.05] p-3 text-brand-200">
                            <RectangleGroupIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Recommended communities</p>
                            <p className="text-sm text-slate-400">Join interest clusters and discussion circles</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {recommendedCommunities.map((community) => (
                            <div key={community.name} className="floating-metric px-4 py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{community.name}</p>
                                        <p className="text-xs text-slate-400">{community.membersCount} students • {community.postsCount} posts</p>
                                    </div>
                                    <span className="pill-tag">{community.category}</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-400">{community.description}</p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <Link to={`/?community=${community.slug}`} className="text-xs font-medium uppercase tracking-[0.18em] text-accent-300 transition hover:text-accent-200">
                                        Open feed
                                    </Link>
                                    <button type="button" className={community.isJoined ? "btn-secondary px-3 py-2 text-xs" : "btn-primary px-3 py-2 text-xs"} onClick={() => handleCommunityToggle(community)}>
                                        {community.isJoined ? "Joined" : "Join"}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {trendingTopics.length ? (
                            <div className="floating-metric px-4 py-4">
                                <p className="text-sm font-semibold text-white">Trending topics</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {trendingTopics.map(([topic, count]) => (
                                        <span key={topic} className="pill-tag">
                                            #{topic} • {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="card-surface overflow-hidden p-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
                            <FireIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Recent activity</p>
                            <p className="text-sm text-slate-400">Latest reactions to your network</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {loading ? <LoadingCard lines={3} /> : null}
                        {!loading && recentActivity.length === 0 ? <p className="text-sm text-slate-400">No recent activity yet.</p> : null}
                        {!loading && recentActivity.map((item) => (
                            <div key={item._id} className="floating-metric px-4 py-4">
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-1 text-xs text-slate-400">{item.message}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
