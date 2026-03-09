import { ChatBubbleLeftRightIcon, ClockIcon, FireIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import PostCard from "./PostCard";
import LoadingCard from "./ui/LoadingCard";

const FEED_FILTERS = [
    { id: "latest", label: "Latest", icon: ClockIcon },
    { id: "trending", label: "Trending", icon: FireIcon }
];

export default function CommunityFeedPanel({
    community,
    posts,
    loading,
    error,
    activeFilter,
    onFilterChange,
    onToggleMembership,
    onPostUpdate,
    onPostDelete
}) {
    if (!community) {
        return null;
    }

    return (
        <section className="card-surface overflow-hidden p-2">
            <div className={`rounded-[2rem] border border-white/10 bg-gradient-to-br ${community.coverGradient} p-6`}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
                    <div>
                        <p className="section-title text-white/80">Community feed</p>
                        <h3 className="display-title mt-3 text-3xl font-bold text-white">{community.name}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100">{community.description}</p>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <span className="pill-tag">{community.membersCount} members</span>
                            <span className="pill-tag">{community.postsCount} posts</span>
                            <span className="pill-tag">{community.category}</span>
                            {(community.tags || []).map((tag) => (
                                <span key={tag} className="pill-tag">#{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-[1.5rem] border border-white/15 bg-slate-950/20 px-4 py-4 backdrop-blur-md">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Membership</p>
                            <p className="mt-2 text-sm text-slate-100">
                                {community.isJoined ? "You are part of this community." : "Join this community to keep it in your network."}
                            </p>
                            <button type="button" className={community.isJoined ? "btn-secondary mt-4 w-full justify-center" : "btn-primary mt-4 w-full justify-center"} onClick={() => onToggleMembership(community)}>
                                {community.isJoined ? "Leave community" : "Join community"}
                            </button>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/15 bg-slate-950/20 px-4 py-4 backdrop-blur-md">
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/60">
                                <UserGroupIcon className="h-4 w-4" />
                                Community stats
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white">
                                <div>
                                    <p className="text-white/60">Members</p>
                                    <p className="mt-1 text-xl font-bold">{community.membersCount}</p>
                                </div>
                                <div>
                                    <p className="text-white/60">Posts</p>
                                    <p className="mt-1 text-xl font-bold">{community.postsCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-2 pb-2 pt-5 md:px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Posts</p>
                        <h4 className="mt-1 text-lg font-semibold text-white">Discussion inside {community.name}</h4>
                    </div>

                    <div className="inline-flex gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-1">
                        {FEED_FILTERS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onFilterChange(id)}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all duration-200"
                                style={activeFilter === id ? { background: "rgba(255,255,255,0.12)", color: "white" } : { color: "rgb(148 163 184)" }}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {error ? (
                    <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                        {error}
                    </div>
                ) : null}

                <div className="mt-5 space-y-4">
                    {loading ? Array.from({ length: 2 }).map((_, index) => (
                        <LoadingCard key={`community-post-loading-${community._id}-${index}`} lines={5} />
                    )) : null}

                    {!loading && !error && posts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 px-6 py-10 text-center"
                        >
                            <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-slate-500" />
                            <p className="mt-4 text-base font-semibold text-white">No posts in this community yet</p>
                            <p className="mt-2 text-sm text-slate-400">Join the community and start the first conversation.</p>
                        </motion.div>
                    ) : null}

                    {!loading && posts.map((post) => (
                        <PostCard key={post._id} post={post} onUpdate={onPostUpdate} onDelete={onPostDelete} />
                    ))}
                </div>
            </div>
        </section>
    );
}