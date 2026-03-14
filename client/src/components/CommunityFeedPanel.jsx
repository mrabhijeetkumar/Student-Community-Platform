import { ChatBubbleLeftRightIcon, ClockIcon, FireIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import PostCard from "./PostCard";
import LoadingCard from "./ui/LoadingCard";

const FEED_FILTERS = [
    { id: "latest", label: "Latest", icon: ClockIcon },
    { id: "trending", label: "Trending", icon: FireIcon }
];

// Same gradient map as Community.jsx — inline CSS, not Tailwind dynamic classes
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

    const gradient = getCoverGradient(community.coverGradient);

    return (
        <section className="card overflow-hidden p-0">
            {/* ── Gradient banner ── */}
            <div className="relative p-6 md:p-8" style={{ background: gradient }}>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                    {/* Left: community info */}
                    <div>
                        <span
                            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest mb-3"
                            style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.3)" }}
                        >
                            Community feed
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                            {community.name}
                        </h3>
                        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                            {community.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[`${community.membersCount} members`, `${community.postsCount} posts`, community.category, ...(community.tags || []).map(t => `#${t}`)].filter(Boolean).map((label) => (
                                <span key={label} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.95)" }} className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: stat + membership cards */}
                    <div className="space-y-3">
                        {/* Stats */}
                        <div
                            className="rounded-xl px-4 py-4"
                            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
                        >
                            <div className="flex items-center gap-2 mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>
                                <UserGroupIcon className="h-4 w-4" />
                                <span className="text-[11px] uppercase tracking-widest font-semibold">Community stats</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>Members</p>
                                    <p className="text-2xl font-bold" style={{ color: "#fff" }}>{community.membersCount}</p>
                                </div>
                                <div>
                                    <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>Posts</p>
                                    <p className="text-2xl font-bold" style={{ color: "#fff" }}>{community.postsCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Membership action */}
                        <div
                            className="rounded-xl px-4 py-4"
                            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
                        >
                            <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {community.isJoined ? "You are a member" : "Not a member yet"}
                            </p>
                            <p className="text-[13px] mb-3" style={{ color: "rgba(255,255,255,0.88)" }}>
                                {community.isJoined ? "You're part of this community." : "Join to participate in discussions."}
                            </p>
                            <button
                                type="button"
                                onClick={() => onToggleMembership(community)}
                                className="w-full py-2 rounded-lg text-[13px] font-semibold transition-colors"
                                style={community.isJoined
                                    ? { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.3)" }
                                    : { background: "#fff", color: "#1d4ed8", border: "none" }}
                            >
                                {community.isJoined ? "Leave community" : "Join community"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Posts section ── */}
            <div className="p-4 md:p-6" style={{ background: "var(--surface)" }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                        <p className="text-[12px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>Posts</p>
                        <h4 className="mt-0.5 text-[16px] font-semibold" style={{ color: "var(--text-main)" }}>
                            Discussions in {community.name}
                        </h4>
                    </div>

                    <div className="inline-flex gap-1 rounded-lg p-1" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                        {FEED_FILTERS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onFilterChange(id)}
                                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-all duration-150"
                                style={activeFilter === id
                                    ? { background: "var(--primary)", color: "#fff" }
                                    : { background: "transparent", color: "var(--text-muted)" }}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {error ? (
                    <div className="mb-4 rounded-lg px-4 py-3 text-[13px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#dc2626" }}>
                        {error}
                    </div>
                ) : null}

                <div className="space-y-4">
                    {loading ? Array.from({ length: 2 }).map((_, index) => (
                        <LoadingCard key={`community-post-loading-${community._id}-${index}`} lines={5} />
                    )) : null}

                    {!loading && !error && posts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl px-6 py-12 text-center"
                            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                        >
                            <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10" style={{ color: "var(--text-faint)" }} />
                            <p className="mt-4 text-[15px] font-semibold" style={{ color: "var(--text-main)" }}>No posts yet</p>
                            <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
                                Join the community and start the first conversation.
                            </p>
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