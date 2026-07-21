import { MessageCircle, Bookmark, Share2, MoreHorizontal, Send, Pencil, Trash2, X, Check, Heart, ThumbsDown, Link2, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/useAuth.js";
import { votePost, toggleSavePost, getComments, createComment, updatePost, deletePost } from "../services/api.js";
import { subscribeToSocketEvent } from "../services/socket.js";

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

    // Share / report toasts
    const [shareToast, setShareToast] = useState(false);
    const [reportToast, setReportToast] = useState("");

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

    // Real-time socket updates for this post
    useEffect(() => {
        const postId = post?._id;
        if (!postId) return;
        const unsubs = [];

        unsubs.push(subscribeToSocketEvent("post:updated", (data) => {
            const p = data?.post ?? data;
            if (String(p?._id) !== String(postId)) return;
            const upvotes = p.upvotes ?? p.likes ?? [];
            const downvotes = p.downvotes ?? [];
            const vote = uid
                ? (upvotes.some((id) => String(id) === String(uid)) ? "up" : downvotes.some((id) => String(id) === String(uid)) ? "down" : null)
                : null;
            setLocalVote(vote);
            setLocalSaved(uid ? (p.savedBy ?? []).some((id) => String(id) === String(uid)) : false);
            setLocalVotes(typeof p.voteScore === "number" ? p.voteScore : upvotes.length - downvotes.length);
            if (typeof p.commentsCount === "number") setLocalCommentsCount(p.commentsCount);
        }));

        unsubs.push(subscribeToSocketEvent("comment:new", (data) => {
            if (String(data?.postId) !== String(postId)) return;
            if (typeof data.commentsCount === "number") setLocalCommentsCount(data.commentsCount);
            if (data.comment && commentsOpen) {
                setComments((prev) => {
                    if (prev.some((c) => String(c._id) === String(data.comment._id))) return prev;
                    return [...prev, data.comment];
                });
            }
        }));

        unsubs.push(subscribeToSocketEvent("comment:deleted", (data) => {
            if (String(data?.postId) !== String(postId)) return;
            setLocalCommentsCount((c) => Math.max(0, c - 1));
            if (commentsOpen) {
                setComments((prev) => prev.filter((c) => String(c._id) !== String(data.commentId)));
            }
        }));

        return () => unsubs.forEach((fn) => fn?.());
    }, [post?._id, uid, commentsOpen]);

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

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/dashboard?p=${post._id}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch { /* ignore */ }
        setMenuOpen(false);
        setReportToast("Link copied!");
        setTimeout(() => setReportToast(""), 2500);
    };

    const handleReport = () => {
        setMenuOpen(false);
        setReportToast("Post reported — we'll review it.");
        setTimeout(() => setReportToast(""), 3000);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/dashboard?p=${post._id}`;
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
        `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=1473e6&color=fff&bold=true&size=64`;
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
            {/* ── Author row ── */}
            <div className="flex items-start gap-3 mb-4">
                <img
                    src={authorAvatar}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                    alt={authorName}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-tight truncate" style={{ color: "var(--text-main)" }}>
                        {authorName}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {displayTime}
                        {communityName && <> · <span style={{ color: "var(--primary)" }}>#{communityName}</span></>}
                    </p>
                </div>

                {/* Three-dot menu */}
                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1.5 rounded-lg transition-all duration-150"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-9 z-40 w-44 rounded-xl overflow-hidden"
                                style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-hover)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                            >
                                {isOwn ? (
                                    <>
                                        <button
                                            onClick={handleEditStart}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] text-left transition-all duration-100"
                                            style={{ color: "var(--text-sub)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <Pencil size={13} style={{ color: "var(--primary-light)" }} /> Edit Post
                                        </button>
                                        <div style={{ height: "1px", background: "var(--border)" }} />
                                        <button
                                            onClick={handleDelete}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] text-left transition-all duration-100"
                                            style={{ color: "#fb7185" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <Trash2 size={13} /> Delete Post
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] text-left transition-all duration-100"
                                            style={{ color: "var(--text-sub)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <Link2 size={13} style={{ color: "var(--primary-light)" }} /> Copy link
                                        </button>
                                        <div style={{ height: "1px", background: "var(--border)" }} />
                                        <button
                                            onClick={handleReport}
                                            className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] text-left transition-all duration-100"
                                            style={{ color: "#fb7185" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <Flag size={13} /> Report post
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Body / Edit ── */}
            {editing ? (
                <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-focus)" }}>
                    <textarea
                        className="w-full px-4 py-3 text-[14px] leading-relaxed outline-none resize-none"
                        style={{ background: "var(--surface-soft)", color: "var(--text-main)", minHeight: "88px" }}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                        <button
                            onClick={handleEditSave}
                            disabled={editSubmitting || !editText.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[14px] font-semibold transition-all"
                            style={editSubmitting || !editText.trim() ? { background: "var(--primary-subtle)", color: "var(--primary-light)", opacity: 0.6 } : { background: "var(--primary)", color: "white" }}
                        >
                            <Check size={12} /> {editSubmitting ? "Saving…" : "Save"}
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[14px] font-medium transition-all"
                            style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                        >
                            <X size={12} /> Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-[15px] leading-relaxed mb-4" style={{ color: "var(--text-sub)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {post?.content || ""}
                    {post?.editedAt && <span className="text-[12px] ml-2" style={{ color: "var(--text-faint)" }}>(edited)</span>}
                </p>
            )}

            {/* ── Images grid ── */}
            {post?.images?.length > 0 && (() => {
                const imgs = post.images.filter(Boolean);
                const count = imgs.length;
                if (count === 0) return null;
                const imgStyle = { objectFit: "cover", display: "block", width: "100%", cursor: "zoom-in" };
                return (
                    <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {count === 1 && <img src={imgs[0]} alt="" style={{ ...imgStyle, maxHeight: 400 }} onClick={() => setLightboxIndex(0)} />}
                        {count === 2 && (
                            <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
                                {imgs.map((src, i) => <img key={i} src={src} alt="" style={{ ...imgStyle, height: 220 }} onClick={() => setLightboxIndex(i)} />)}
                            </div>
                        )}
                        {count === 3 && (
                            <div className="grid gap-px" style={{ gridTemplateColumns: "1fr 1fr", background: "var(--border)" }}>
                                <img src={imgs[0]} alt="" className="col-span-2" style={{ ...imgStyle, height: 220 }} onClick={() => setLightboxIndex(0)} />
                                {imgs.slice(1).map((src, i) => <img key={i} src={src} alt="" style={{ ...imgStyle, height: 160 }} onClick={() => setLightboxIndex(i + 1)} />)}
                            </div>
                        )}
                        {count >= 4 && (
                            <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
                                {imgs.slice(0, 4).map((src, i) => <img key={i} src={src} alt="" style={{ ...imgStyle, height: 170 }} onClick={() => setLightboxIndex(i)} />)}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ── Lightbox ── */}
            <AnimatePresence>
                {lightboxIndex !== null && (() => {
                    const imgs = (post?.images || []).filter(Boolean);
                    const total = imgs.length;
                    return (
                        <motion.div
                            key="lb"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center"
                            style={{ background: "rgba(0,0,0,0.92)" }}
                            onClick={() => setLightboxIndex(null)}
                        >
                            <button className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", color: "white" }} onClick={() => setLightboxIndex(null)}>
                                <X size={16} />
                            </button>
                            {total > 1 && (
                                <>
                                    <button className="absolute left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)", color: "white" }} onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + total) % total); }}>‹</button>
                                    <button className="absolute right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)", color: "white" }} onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % total); }}>›</button>
                                </>
                            )}
                            <motion.img
                                key={lightboxIndex} src={imgs[lightboxIndex]}
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.18 }}
                                className="rounded-2xl shadow-2xl" style={{ maxWidth: "90vw", maxHeight: "86vh", objectFit: "contain" }}
                                onClick={e => e.stopPropagation()}
                            />
                            {total > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {imgs.map((_, i) => (
                                        <div key={i} className="rounded-full transition-all" style={{ width: i === lightboxIndex ? 20 : 6, height: 6, background: i === lightboxIndex ? "white" : "rgba(255,255,255,0.35)" }} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* ── Tags ── */}
            {post?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
            )}

            {/* ── Action bar ── */}
            <div className="flex items-center gap-1 pt-3 mt-2" style={{ borderTop: "1px solid var(--border)" }}>

                {/* Like */}
                <button
                    onClick={() => handleVote("up")}
                    className={`action-btn ${localVote === "up" ? "liked" : ""}`}
                    aria-label="Like"
                >
                    <Heart
                        size={17}
                        fill={localVote === "up" ? "var(--like)" : "none"}
                        strokeWidth={localVote === "up" ? 0 : 1.8}
                        className={localVote === "up" ? "animate-like-pop" : ""}
                    />
                    {localVotes !== 0 && (
                        <span className="tabular-nums font-semibold text-[14px]">{localVotes}</span>
                    )}
                </button>

                {/* Comment */}
                <button
                    onClick={handleToggleComments}
                    className={`action-btn ${commentsOpen ? "" : ""}`}
                    style={{ color: commentsOpen ? "var(--primary-light)" : "var(--text-muted)" }}
                    aria-label="Comments"
                >
                    <MessageCircle size={17} strokeWidth={1.8} />
                    {localCommentsCount > 0 && (
                        <span className="tabular-nums font-semibold text-[14px]">{localCommentsCount}</span>
                    )}
                </button>

                <div className="flex-1" />

                {/* Share */}
                <div className="relative">
                    <button
                        onClick={handleShare}
                        className="action-btn"
                        aria-label="Share"
                    >
                        <Share2 size={16} strokeWidth={1.8} />
                    </button>
                    <AnimatePresence>
                        {shareToast && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.92 }}
                                transition={{ duration: 0.14 }}
                                className="absolute bottom-10 right-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap pointer-events-none"
                                style={{ background: "var(--success)", color: "white" }}
                            >
                                Link copied!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className={`action-btn ${localSaved ? "saved" : ""}`}
                    aria-label="Save"
                >
                    <Bookmark size={16} fill={localSaved ? "var(--primary)" : "none"} strokeWidth={localSaved ? 0 : 1.8} />
                </button>
            </div>

            {/* ── Copy/Report toast ── */}
            <AnimatePresence>
                {reportToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="mx-4 mb-3 px-3 py-2 rounded-lg text-[12px] font-medium"
                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }}
                    >
                        {reportToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Comments section ── */}
            <AnimatePresence>
                {commentsOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 space-y-3">
                            {/* Comment list */}
                            {comments.length > 0 && (
                                <div className="space-y-2">
                                    {comments.map((c) => {
                                        const cAvatar = c.userId?.profilePhoto ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userId?.name || "U")}&background=1473e6&color=fff&bold=true&size=64`;
                                        return (
                                            <div key={c._id} className="flex gap-2.5">
                                                <img src={cAvatar} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="rounded-xl rounded-tl-sm px-3 py-2" style={{ background: "var(--surface-soft)" }}>
                                                        <span className="text-[12px] font-semibold" style={{ color: "var(--text-main)" }}>
                                                            {c.userId?.name || "User"}
                                                        </span>
                                                        <p className="text-[14px] leading-relaxed mt-0.5" style={{ color: "var(--text-sub)" }}>
                                                            {c.text}
                                                        </p>
                                                    </div>
                                                    <span className="text-[12px] pl-2 mt-1 block" style={{ color: "var(--text-faint)" }}>
                                                        {timeAgo(c.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {comments.length === 0 && commentsLoaded && (
                                <p className="text-[14px] text-center py-3" style={{ color: "var(--text-muted)" }}>
                                    No comments yet — be the first!
                                </p>
                            )}

                            {/* Comment input */}
                            <div className="flex gap-2.5 items-center pt-1">
                                <img
                                    src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=1473e6&color=fff&bold=true&size=64`}
                                    className="w-7 h-7 rounded-full object-cover shrink-0"
                                    alt=""
                                />
                                <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                    <input
                                        className="flex-1 bg-transparent outline-none text-[14px]"
                                        placeholder="Add a comment…"
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
                                        style={{ color: "var(--text-main)" }}
                                    />
                                    <button
                                        onClick={handleSubmitComment}
                                        disabled={!commentText.trim() || commentSubmitting}
                                        className="transition-all"
                                        style={{ color: commentText.trim() ? "var(--primary-light)" : "var(--text-faint)" }}
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}
