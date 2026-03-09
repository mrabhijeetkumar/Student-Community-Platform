import { MessageCircle, Bookmark, Share2, MoreHorizontal, Send, Pencil, Trash2, X, Check, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/useAuth.js";
import { votePost, toggleSavePost, getComments, createComment, updatePost, deletePost } from "../services/api.js";

function timeAgo(dateString) {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateString).toLocaleDateString();
}

export default function PostCard({ post, onUpdate, onDelete }) {
    const { user, token } = useAuth();
    const uid = user?._id;
    const isOwn = uid && post?.author?._id && String(post.author._id) === String(uid);

    const menuRef = useRef(null);

    // Like / save state
    const [localVote, setLocalVote] = useState(null);
    const [localSaved, setLocalSaved] = useState(false);
    const [localVotes, setLocalVotes] = useState(0);

    // Comments state
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [localCommentsCount, setLocalCommentsCount] = useState(0);

    // Three-dot menu
    const [menuOpen, setMenuOpen] = useState(false);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Share toast
    const [shareToast, setShareToast] = useState(false);

    // Delete loading
    const [deleting, setDeleting] = useState(false);

    // Image lightbox
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const upvotes = post?.upvotes ?? post?.likes ?? [];
        const downvotes = post?.downvotes ?? [];
        const vote = uid
            ? (upvotes.some((id) => String(id) === String(uid)) ? "up" : downvotes.some((id) => String(id) === String(uid)) ? "down" : null)
            : null;
        const saved = uid ? (post?.savedBy ?? []).some((id) => String(id) === String(uid)) : false;
        const votes = typeof post?.voteScore === "number" ? post.voteScore : upvotes.length - downvotes.length;
        setLocalVote(vote);
        setLocalSaved(saved);
        setLocalVotes(votes);
        setLocalCommentsCount(post?.commentsCount ?? 0);
    }, [post?._id, uid, post?.upvotes?.length, post?.likes?.length, post?.downvotes?.length, post?.savedBy?.length, post?.voteScore]); // eslint-disable-line

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    const handleVote = async (voteType) => {
        const previousVote = localVote;
        const nextVote = previousVote === voteType ? null : voteType;
        const deltaMap = {
            "null-up": 1,
            "null-down": -1,
            "up-null": -1,
            "down-null": 1,
            "up-down": -2,
            "down-up": 2,
        };
        const delta = deltaMap[`${previousVote ?? "null"}-${nextVote ?? "null"}`] ?? 0;

        setLocalVote(nextVote);
        setLocalVotes((score) => score + delta);

        if (!post?._id || !token) return;

        try {
            const updated = await votePost(post._id, voteType, token);
            onUpdate?.(updated);
        } catch {
            setLocalVote(previousVote);
            setLocalVotes((score) => score - delta);
        }
    };

    const handleSave = async () => {
        const wasSaved = localSaved;
        setLocalSaved(!wasSaved);
        if (!post?._id || !token) return;
        try {
            const updated = await toggleSavePost(post._id, token);
            onUpdate?.(updated);
        } catch {
            setLocalSaved(wasSaved);
        }
    };

    const handleToggleComments = async () => {
        setCommentsOpen((prev) => !prev);
        if (!commentsLoaded && post?._id && token) {
            setCommentsLoaded(true);
            try {
                const data = await getComments(post._id, token);
                setComments(Array.isArray(data) ? data : []);
            } catch {
                setComments([]);
            }
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !post?._id || !token || commentSubmitting) return;
        const text = commentText.trim();
        setCommentSubmitting(true);
        setCommentText("");
        try {
            const newComment = await createComment(post._id, { text }, token);
            setComments((prev) => [...prev, newComment]);
            setLocalCommentsCount((c) => c + 1);
        } catch {
            setCommentText(text);
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleEditStart = () => {
        setEditText(post?.content || "");
        setEditing(true);
        setMenuOpen(false);
    };

    const handleEditSave = async () => {
        if (!editText.trim() || editSubmitting || !post?._id || !token) return;
        setEditSubmitting(true);
        try {
            const updated = await updatePost(post._id, { content: editText.trim() }, token);
            onUpdate?.(updated);
            setEditing(false);
        } catch {
            // keep editing open on error
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (deleting || !post?._id || !token) return;
        setDeleting(true);
        setMenuOpen(false);
        try {
            await deletePost(post._id, token);
            onDelete?.(post._id);
        } catch {
            setDeleting(false);
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/dashboard`;
        const shareText = `"${post?.content?.slice(0, 80) || "Check this post"}" — by ${post?.author?.name || "Student"} on StudentHub`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "StudentHub Post", text: shareText, url: shareUrl });
            } else {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                setShareToast(true);
                setTimeout(() => setShareToast(false), 2500);
            }
        } catch { /* user cancelled */ }
    };

    const authorName = post?.author?.name || "Student";
    const authorAvatar =
        post?.author?.profilePhoto ||
        post?.author?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=6366f1&color=fff&bold=true&size=64`;
    const communityName =
        post?.community?.name || (typeof post?.community === "string" ? post.community : null);
    const displayTime = post?.createdAt
        ? timeAgo(post.createdAt)
        : post?.timeAgo
            ? `${post.timeAgo} ago`
            : "";

    return (
        <article
            className="card"
            style={{ opacity: deleting ? 0.4 : 1, transition: "opacity 0.3s" }}
        >
            <div className="relative">
                {/* Author row */}
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={authorAvatar}
                        className="w-10 h-10 rounded-full object-cover ring-2 shrink-0"
                        style={{ ringColor: "var(--border)" }}
                    />
                    <div className="min-w-0 flex-1">
                        <span className="text-[13.5px] font-semibold block leading-tight truncate text-white">{authorName}</span>
                        <span className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>{displayTime}</span>
                    </div>
                    {communityName && <span className="tag">{communityName}</span>}

                    {/* Three-dot menu */}
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="p-1.5 rounded-lg transition-all duration-200"
                            style={{ color: menuOpen ? "var(--text-sub)" : "var(--text-muted)", background: menuOpen ? "rgba(255,255,255,0.06)" : "transparent" }}
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-0 top-8 z-30 w-44 rounded-xl overflow-hidden"
                                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-hover)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                                >
                                    {isOwn ? (
                                        <>
                                            <button
                                                onClick={handleEditStart}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-left transition-colors hover:bg-white/5"
                                                style={{ color: "var(--text-sub)" }}
                                            >
                                                <Pencil size={13} style={{ color: "#6366f1" }} /> Edit Post
                                            </button>
                                            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
                                            <button
                                                onClick={handleDelete}
                                                className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-left transition-colors hover:bg-red-500/10"
                                                style={{ color: "#f87171" }}
                                            >
                                                <Trash2 size={13} /> Delete Post
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setMenuOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-left transition-colors hover:bg-white/5"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            Report Post
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Body / Edit */}
                {editing ? (
                    <div className="mb-3">
                        <textarea
                            className="w-full rounded-xl px-3 py-2.5 text-[13.5px] leading-relaxed outline-none resize-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.5)", color: "var(--text-main)", minHeight: "80px" }}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={handleEditSave}
                                disabled={editSubmitting || !editText.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all"
                                style={editSubmitting ? { background: "rgba(99,102,241,0.15)", color: "#818cf8", cursor: "not-allowed" } : { background: "var(--primary)", color: "white" }}
                            >
                                <Check size={12} /> {editSubmitting ? "Saving…" : "Save"}
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all"
                                style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}
                            >
                                <X size={12} /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-[14px] leading-relaxed mb-3" style={{ color: "var(--text-sub)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {post?.content || ""}
                        {post?.editedAt && <span className="text-[11px] ml-2" style={{ color: "var(--text-muted)" }}>(edited)</span>}
                    </p>
                )}

                {/* Images grid */}
                {post?.images?.length > 0 && (() => {
                    const imgs = post.images.filter(Boolean);
                    const count = imgs.length;
                    if (count === 0) return null;
                    return (
                        <div className="mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                            {count === 1 && (
                                <motion.img
                                    src={imgs[0]} alt="post image"
                                    className="w-full object-cover cursor-zoom-in"
                                    style={{ maxHeight: 420, display: "block" }}
                                    whileHover={{ scale: 1.01 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setLightboxIndex(0)}
                                />
                            )}
                            {count === 2 && (
                                <div className="grid grid-cols-2 gap-[2px]">
                                    {imgs.map((src, i) => (
                                        <motion.img key={i} src={src} alt=""
                                            className="w-full object-cover cursor-zoom-in"
                                            style={{ height: 220, display: "block" }}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => setLightboxIndex(i)}
                                        />
                                    ))}
                                </div>
                            )}
                            {count === 3 && (
                                <div className="grid gap-[2px]" style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto" }}>
                                    <motion.img src={imgs[0]} alt=""
                                        className="object-cover cursor-zoom-in col-span-2"
                                        style={{ width: "100%", height: 220, display: "block" }}
                                        whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}
                                        onClick={() => setLightboxIndex(0)}
                                    />
                                    {imgs.slice(1).map((src, i) => (
                                        <motion.img key={i} src={src} alt=""
                                            className="w-full object-cover cursor-zoom-in"
                                            style={{ height: 160, display: "block" }}
                                            whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}
                                            onClick={() => setLightboxIndex(i + 1)}
                                        />
                                    ))}
                                </div>
                            )}
                            {count === 4 && (
                                <div className="grid grid-cols-2 gap-[2px]">
                                    {imgs.map((src, i) => (
                                        <motion.img key={i} src={src} alt=""
                                            className="w-full object-cover cursor-zoom-in"
                                            style={{ height: 180, display: "block" }}
                                            whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}
                                            onClick={() => setLightboxIndex(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Lightbox */}
                <AnimatePresence>
                    {lightboxIndex !== null && (() => {
                        const imgs = (post?.images || []).filter(Boolean);
                        const total = imgs.length;
                        return (
                            <motion.div
                                key="lightbox"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="fixed inset-0 z-[200] flex items-center justify-center"
                                style={{ background: "rgba(0,0,0,0.90)" }}
                                onClick={() => setLightboxIndex(null)}
                            >
                                {/* Close */}
                                <button
                                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
                                    onClick={() => setLightboxIndex(null)}
                                >
                                    <X size={16} />
                                </button>

                                {/* Prev */}
                                {total > 1 && (
                                    <button
                                        className="absolute left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
                                        style={{ background: "rgba(255,255,255,0.10)", color: "white" }}
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + total) % total); }}
                                    >
                                        &#8592;
                                    </button>
                                )}

                                {/* Image */}
                                <motion.img
                                    key={lightboxIndex}
                                    src={imgs[lightboxIndex]}
                                    initial={{ scale: 0.88, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="rounded-2xl shadow-2xl"
                                    style={{ maxWidth: "90vw", maxHeight: "86vh", objectFit: "contain" }}
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Next */}
                                {total > 1 && (
                                    <button
                                        className="absolute right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
                                        style={{ background: "rgba(255,255,255,0.10)", color: "white" }}
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % total); }}
                                    >
                                        &#8594;
                                    </button>
                                )}

                                {/* Counter */}
                                {total > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {imgs.map((_, i) => (
                                            <div key={i} className="rounded-full transition-all"
                                                style={{
                                                    width: i === lightboxIndex ? 20 : 6, height: 6,
                                                    background: i === lightboxIndex ? "white" : "rgba(255,255,255,0.35)"
                                                }} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

                {/* Tags */}
                {post?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((t) => (
                            <span key={t} className="tag">#{t}</span>
                        ))}
                    </div>
                )}

                {/* Action bar — Instagram-style */}
                <div className="flex items-center gap-1 pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>

                    {/* Like (Heart) */}
                    <button
                        onClick={() => handleVote("up")}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-red-500/8"
                        style={{ color: localVote === "up" ? "#ef4444" : "var(--text-muted)" }}
                        aria-label="Like post"
                    >
                        <Heart
                            size={18}
                            fill={localVote === "up" ? "#ef4444" : "none"}
                            strokeWidth={localVote === "up" ? 0 : 1.8}
                            className="transition-transform active:scale-90"
                        />
                        {localVotes !== 0 && (
                            <span className="text-[12px] font-semibold tabular-nums">{localVotes > 0 ? localVotes : localVotes}</span>
                        )}
                    </button>

                    {/* Comment */}
                    <button
                        onClick={handleToggleComments}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-white/5"
                        style={{ color: commentsOpen ? "var(--primary-light)" : "var(--text-muted)" }}
                    >
                        <MessageCircle size={18} strokeWidth={1.8} />
                        {localCommentsCount > 0 && (
                            <span className="text-[12px] font-semibold tabular-nums">{localCommentsCount}</span>
                        )}
                    </button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Share */}
                    <div className="relative">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-lg transition-all hover:bg-white/5"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <Share2 size={17} strokeWidth={1.8} />
                        </button>
                        <AnimatePresence>
                            {shareToast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.9 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-9 right-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap pointer-events-none"
                                    style={{ background: "#22c55e", color: "white" }}
                                >
                                    Copied!
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        className="p-2 rounded-lg transition-all hover:bg-white/5"
                        style={{ color: localSaved ? "var(--primary-light)" : "var(--text-muted)" }}
                    >
                        <Bookmark size={17} fill={localSaved ? "var(--primary)" : "none"} strokeWidth={localSaved ? 0 : 1.8} />
                    </button>

                </div>

                {/* Comments section */}
                <AnimatePresence>
                    {commentsOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 space-y-3">
                                {comments.length > 0 && (
                                    <div className="space-y-2.5">
                                        {comments.map((c) => {
                                            const cAvatar =
                                                c.userId?.profilePhoto ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userId?.name || "U")}&background=6366f1&color=fff&bold=true&size=64`;
                                            return (
                                                <div key={c._id} className="flex gap-2.5">
                                                    <img src={cAvatar} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className="rounded-xl rounded-tl-sm px-3 py-2"
                                                            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                                                        >
                                                            <span className="text-[12px] font-semibold">{c.userId?.name || "User"}</span>
                                                            <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: "var(--text-sub)" }}>{c.text}</p>
                                                        </div>
                                                        <span className="text-[10.5px] pl-1 mt-0.5 block" style={{ color: "var(--text-faint)" }}>
                                                            {timeAgo(c.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {comments.length === 0 && commentsLoaded && (
                                    <p className="text-[12px] text-center py-2" style={{ color: "var(--text-faint)" }}>No comments yet. Be first!</p>
                                )}

                                {/* Comment input */}
                                <div className="flex gap-2.5 items-center">
                                    <img
                                        src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&bold=true&size=64`}
                                        className="w-7 h-7 rounded-full object-cover shrink-0"
                                        alt=""
                                    />
                                    <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                        <input
                                            className="flex-1 bg-transparent outline-none text-[12.5px] placeholder:text-slate-600"
                                            placeholder="Write a comment…"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                                            style={{ color: "var(--text-main)" }}
                                        />
                                        <button
                                            onClick={handleSubmitComment}
                                            disabled={!commentText.trim() || commentSubmitting}
                                            className="transition-colors"
                                            style={commentText.trim() ? { color: "var(--primary-light)" } : { color: "var(--text-faint)", cursor: "not-allowed" }}
                                        >
                                            <Send size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </article>
    );
}
