import { FireIcon, RectangleGroupIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getNotifications, getPosts, getSuggestedUsers } from "../../services/api";
import UserCard from "../UserCard";
import LoadingCard from "../ui/LoadingCard";

const recommendedCommunities = [
    { name: "Hackathon Hub", members: "2.3k students", tag: "Build" },
    { name: "Design Critique", members: "1.1k students", tag: "Design" },
    { name: "Placement Prep", members: "4.6k students", tag: "Career" }
];

export default function RightRail() {
    const { token } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
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
                const [suggestedUsers, trending, notifications] = await Promise.all([
                    getSuggestedUsers(token),
                    getPosts("trending", token),
                    getNotifications(token)
                ]);

                if (!isMounted) {
                    return;
                }

                setSuggestions(suggestedUsers);
                setTrendingPosts(trending.slice(0, 3));
                setRecentActivity(notifications.slice(0, 3));
            } catch (error) {
                if (isMounted) {
                    setSuggestions([]);
                    setTrendingPosts([]);
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

    return (
        <aside className="hidden w-[320px] shrink-0 space-y-5 xl:block">
            <div className="card-surface p-5">
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
                        <article key={post._id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:bg-white/[0.08]">
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
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{post.content}</p>
                        </article>
                    ))}
                </div>
            </div>

            <div className="card-surface p-5">
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

            <div className="card-surface p-5">
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
                        <div key={community.name} className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{community.name}</p>
                                    <p className="text-xs text-slate-400">{community.members}</p>
                                </div>
                                <span className="pill-tag">{community.tag}</span>
                            </div>
                        </div>
                    ))}
                    {trendingTopics.length ? (
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4">
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


            <div className="card-surface p-5">
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
                        <div key={item._id} className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4">
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
