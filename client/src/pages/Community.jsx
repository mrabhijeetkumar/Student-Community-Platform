import { MagnifyingGlassIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import CommunityFeedPanel from "../components/CommunityFeedPanel";
import LoadingCard from "../components/ui/LoadingCard";
import Notification from "../components/Notification";
import PageHero from "../components/ui/PageHero";
import PageTransition from "../components/ui/PageTransition";
import { useAuth } from "../context/useAuth.js";
import { getCommunities, getPosts, joinCommunity, leaveCommunity } from "../services/api";

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
    const communityInsights = useMemo(() => {
        const totalMembers = communities.reduce((sum, community) => sum + (community.membersCount || 0), 0);
        const totalPosts = communities.reduce((sum, community) => sum + (community.postsCount || 0), 0);
        const joinedCount = communities.filter((community) => community.isJoined).length;

        return [
            { label: "Communities", value: communities.length, detail: "Active circles" },
            { label: "Joined", value: joinedCount, detail: "Spaces in your network" },
            { label: "Posts", value: totalPosts, detail: `${totalMembers} total members` }
        ];
    }, [communities]);
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
        <PageTransition className="space-y-6">
            <PageHero
                eyebrow="Communities"
                title="Join focused circles and collaborate faster."
                description="Discover active student clusters for hackathons, placements, research, peer learning, and creator-led collaboration."
                orbClassName="bg-accent-400/12"
                badges={(
                    <>
                        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                            <SparklesIcon className="h-4 w-4" />
                            Network hubs
                        </span>
                        <span className="pill-tag">{featuredCommunity ? `${featuredCommunity.name} featured` : "Fresh circles live"}</span>
                    </>
                )}
                aside={(
                    <div className="space-y-3">
                        <div className="card-ghost flex items-center gap-3 px-4 py-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                            <input
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                placeholder="Search communities by topic, tag, or category"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            {communityInsights.map((item) => (
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
                {visibleCategories.length ? (
                    <div className="card-ghost px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Popular categories</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {visibleCategories.map((category) => (
                                <span key={category} className="pill-tag">{category}</span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </PageHero>

            <Notification tone={feedback.includes("successfully") ? "success" : "warning"} message={feedback} />

            {featuredCommunity ? (
                <div className="card-surface overflow-hidden p-2">
                    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${featuredCommunity.coverGradient} p-6 md:p-8`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.34),transparent_28%)]" />
                        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-end">
                            <div>
                                <p className="section-title text-white/80">Featured community</p>
                                <h3 className="display-title mt-3 text-3xl font-bold text-white">{featuredCommunity.name}</h3>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100">{featuredCommunity.description}</p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <span className="pill-tag">{featuredCommunity.membersCount} members</span>
                                    <span className="pill-tag">{featuredCommunity.postsCount} posts</span>
                                    <span className="pill-tag">{featuredCommunity.category}</span>
                                    {(featuredCommunity.tags || []).slice(0, 3).map((tag) => (
                                        <span key={tag} className="pill-tag">#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                                <div className="rounded-[1.5rem] border border-[#355386] bg-[#172844] px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Members</p>
                                    <p className="mt-2 text-2xl font-bold text-white">{featuredCommunity.membersCount}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-[#355386] bg-[#172844] px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Posts</p>
                                    <p className="mt-2 text-2xl font-bold text-white">{featuredCommunity.postsCount}</p>
                                </div>
                                <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#355386] bg-[#172844] px-4 py-4">
                                    <button type="button" className={featuredCommunity.isJoined ? "btn-secondary justify-center" : "btn-primary justify-center"} onClick={() => handleToggleMembership(featuredCommunity)}>
                                        {featuredCommunity.isJoined ? "Joined" : "Join community"}
                                    </button>
                                    <button type="button" className="btn-secondary justify-center" onClick={() => setSelectedCommunityId(featuredCommunity._id)}>
                                        View posts
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading ? Array.from({ length: 4 }).map((_, index) => <LoadingCard key={`community-loading-${index}`} lines={4} />) : null}
                {!loading && communities.map((community) => (
                    <motion.article key={community._id} whileHover={{ y: -3 }} className="card-surface overflow-hidden p-5">
                        <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${community.coverGradient} p-5`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="rounded-2xl border border-[#355386] bg-[#172844] p-3 text-white">
                                    <UserGroupIcon className="h-6 w-6" />
                                </div>
                                <span className="pill-tag">{community.membersCount} members</span>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-white">{community.name}</h3>
                            <p className="mt-2 text-sm text-slate-200">{community.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="pill-tag">{community.category}</span>
                                <span className="pill-tag">{community.postsCount} posts</span>
                                {community.tags?.slice(0, 2).map((tag) => (
                                    <span key={tag} className="pill-tag">#{tag}</span>
                                ))}
                            </div>
                            <div className="mt-5 flex gap-3">
                                <button type="button" className={community.isJoined ? "btn-secondary flex-1 justify-center" : "btn-primary flex-1 justify-center"} onClick={() => handleToggleMembership(community)}>
                                    {community.isJoined ? "Joined" : "Join community"}
                                </button>
                                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setSelectedCommunityId(community._id)}>
                                    View posts
                                </button>
                            </div>
                        </div>
                    </motion.article>
                ))}
                {!loading && communities.length === 0 ? <div className="card-surface p-6 text-sm text-slate-400">No communities matched this search.</div> : null}
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
