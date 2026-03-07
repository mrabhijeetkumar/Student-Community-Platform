import {
    ChatBubbleOvalLeftIcon,
    EllipsisHorizontalIcon,
    HeartIcon,
    BookmarkIcon,
    PencilSquareIcon,
    ShareIcon,
    TrashIcon
} from "@heroicons/react/24/outline";
import { BookmarkIcon as SolidBookmarkIcon, HeartIcon as SolidHeartIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { deletePost, toggleLike, toggleSavePost, updatePost } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import CommentBox from "./CommentBox";
import Notification from "./Notification";

function formatRelativeTime(dateValue) {
    const date = new Date(dateValue);
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const ranges = [
        [60, "second"],
        [3600, "minute"],
        [86400, "hour"],
        [604800, "day"],
        [2629800, "week"],
        [31557600, "month"],
        [Infinity, "year"]
    ];

    for (let index = 0; index < ranges.length; index += 1) {
        const [limit, unit] = ranges[index];
        if (Math.abs(seconds) < limit) {
            const divisor = index === 0 ? 1 : ranges[index - 1][0];
            return formatter.format(Math.round(seconds / divisor), unit);
        }
    }

    return date.toLocaleDateString();
}

function formatCompactNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

export default function PostCard({ post, onUpdated, onDeleted }) {
    const { token, user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [editing, setEditing] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [draftContent, setDraftContent] = useState(post.content);
    const [feedback, setFeedback] = useState("");
    const [likePulse, setLikePulse] = useState(false);

    const isOwner = user && (user._id === post.author?._id || user.role === "admin");
    const hasLiked = user && post.likes?.some((like) => (typeof like === "string" ? like : like._id) === user._id);
    const likesCount = post.likes?.length || 0;
    const commentsCount = post.commentsCount || 0;
    const savedCount = post.savedBy?.length || 0;
    const hasSaved = user && post.savedBy?.some((savedUser) => (typeof savedUser === "string" ? savedUser : savedUser._id) === user._id);
    const engagementCount = likesCount + commentsCount;
    const timeLabel = formatRelativeTime(post.createdAt);

    const handleLike = async () => {
        try {
            const updatedPost = await toggleLike(post._id, token);
            if (!hasLiked) {
                setLikePulse(true);
                window.setTimeout(() => setLikePulse(false), 280);
            }
            onUpdated(updatedPost);
        } catch (error) {
            setFeedback(error.message);
        }
    };


    const handleSavePost = async () => {
        try {
            const updatedPost = await toggleSavePost(post._id, token);
            onUpdated(updatedPost);
            setFeedback(hasSaved ? "Post removed from saved items." : "Post added to your saved items.");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleSave = async () => {
        if (!draftContent.trim()) {
            setFeedback("Post content cannot be empty.");
            return;
        }

        try {
            const updatedPost = await updatePost(post._id, {
                content: draftContent.trim(),
                images: post.images,
                tags: post.tags,
                communityId: post.community?._id || ""
            }, token);
            onUpdated(updatedPost);
            setEditing(false);
            setFeedback("");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post._id, token);
            onDeleted(post._id);
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleShare = async () => {
        const sharePayload = {
            title: `${post.author?.name} on Campus OS`,
            text: post.content
        };

        try {
            if (navigator.share) {
                await navigator.share(sharePayload);
                return;
            }

            await navigator.clipboard.writeText(`${post.content}\n\n${window.location.origin}/profile/${post.author?.username}`);
            setFeedback("Post details copied for sharing.");
        } catch {
            setFeedback("Share action could not be completed.");
        }
    };

    return (
        <motion.article
            layout
            whileHover={{ y: -4 }}
            transition={{ duration: 0.18 }}
            className="card-surface overflow-hidden p-5"
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent" />
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 text-sm font-bold text-white">
                        {post.author?.profilePhoto ? <img src={post.author.profilePhoto} alt={post.author.name} className="h-full w-full object-cover" /> : post.author?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="display-title font-semibold text-white">{post.author?.name}</p>
                            {isOwner ? <span className="rounded-full border border-brand-400/20 bg-brand-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-100">You</span> : null}
                            {engagementCount >= 8 ? <span className="rounded-full border border-accent-400/20 bg-accent-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-200">Hot</span> : null}
                        </div>
                        <p className="text-sm text-slate-400">@{post.author?.username} • {post.author?.headline || "Student creator"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500" title={new Date(post.createdAt).toLocaleString()}>
                            <span className="uppercase tracking-[0.22em] text-accent-300">{timeLabel}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <span>{formatCompactNumber(engagementCount)} interactions</span>
                            {post.community ? (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                                    <Link to={`/?community=${post.community.slug}`} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-accent-400/30 hover:text-white">
                                        {post.community.name}
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
                {isOwner ? (
                    <div className="relative">
                        <button type="button" className="icon-button h-10 w-10" onClick={() => setMenuOpen((currentState) => !currentState)}>
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                            {menuOpen ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className="absolute right-0 top-12 z-10 w-44 rounded-3xl border border-white/10 bg-slate-950/95 p-2 shadow-soft"
                                >
                                    <button type="button" className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]" onClick={() => { setEditing((currentState) => !currentState); setMenuOpen(false); }}>
                                        <PencilSquareIcon className="h-5 w-5" />
                                        Edit post
                                    </button>
                                    <button type="button" className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm text-rose-200 transition hover:bg-rose-500/10" onClick={handleDelete}>
                                        <TrashIcon className="h-5 w-5" />
                                        Delete post
                                    </button>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                ) : null}
            </div>

            <Notification tone="warning" message={feedback} />

            <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                    <span className="floating-metric px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Post</span>
                    {post.community ? <span className="floating-metric px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-200">{post.community.category || "Community"}</span> : null}
                </div>
                {editing ? (
                    <div className="space-y-3">
                        <textarea rows="5" className="input-control" value={draftContent} onChange={(event) => setDraftContent(event.target.value)} />
                        <div className="flex gap-3">
                            <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={handleSave}>Save changes</button>
                            <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => { setEditing(false); setDraftContent(post.content); }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-8 text-slate-200">{post.content}</p>
                )}

                {post.images?.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {post.images.map((image) => (
                            <motion.img whileHover={{ scale: 1.01 }} key={image} src={image} alt="Post attachment" className="h-64 w-full rounded-[1.75rem] object-cover" />
                        ))}
                    </div>
                ) : null}

                {post.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span key={tag} className="pill-tag">#{tag}</span>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                <motion.button type="button" whileTap={{ scale: 0.96 }} className={`btn-secondary gap-2 px-4 py-2 text-sm ${hasLiked ? "border-brand-400/30 bg-brand-500/10 text-brand-100" : ""}`} onClick={handleLike}>
                    <motion.span animate={likePulse ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.28 }}>
                        {hasLiked ? <SolidHeartIcon className="h-5 w-5 text-rose-400" /> : <HeartIcon className="h-5 w-5" />}
                    </motion.span>
                    {formatCompactNumber(likesCount)} likes
                </motion.button>
                <button type="button" className="btn-secondary gap-2 px-4 py-2 text-sm" onClick={() => setShowComments((currentState) => !currentState)}>
                    <ChatBubbleOvalLeftIcon className="h-5 w-5" />
                    {formatCompactNumber(commentsCount)} comments
                </button>
                <button type="button" className={`btn-secondary gap-2 px-4 py-2 text-sm ${hasSaved ? "border-accent-400/40 bg-accent-400/10 text-accent-100" : ""}`} onClick={handleSavePost}>
                    {hasSaved ? <SolidBookmarkIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
                    {formatCompactNumber(savedCount)} saved
                </button>
                <button type="button" className="btn-secondary gap-2 px-4 py-2 text-sm" onClick={handleShare}>
                    <ShareIcon className="h-5 w-5" />
                    Share
                </button>
            </div>

            <CommentBox postId={post._id} isOpen={showComments} commentsCount={post.commentsCount || 0} />
        </motion.article>
    );
}
