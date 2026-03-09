import { useState, useRef, useEffect } from "react";
import { ImagePlus, Hash, Smile, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth.js";
import { createPost } from "../services/api.js";

const QUICK_TAGS = ["#Project", "#Hackathon", "#Career", "#Question", "#Resource"];

const EMOJI_CATEGORIES = [
    { icon: "😀", emojis: ["😀", "😂", "😍", "🥰", "😎", "😭", "🤔", "😤", "🥳", "🤩", "😅", "💀", "😈", "🤯", "🫡", "😴"] },
    { icon: "👍", emojis: ["👍", "👎", "👏", "🙌", "🤝", "🫶", "❤️", "💪", "🤙", "✌️", "👊", "🙏", "💯", "🔥", "✨", "🎉"] },
    { icon: "💻", emojis: ["📚", "💻", "🎮", "🏆", "🎯", "📱", "💡", "🔧", "⚡", "🚀", "🎓", "📝", "🔍", "💰", "🌐", "⚙️"] },
    { icon: "🌙", emojis: ["🌙", "⭐", "🌊", "🌸", "🍎", "🌈", "🦋", "🌿", "🍀", "🌻", "🐉", "🌺", "🦅", "❄️", "🎋", "🌴"] },
];

const MAX_CHARS = 500;

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.onload = (e) => {
            const img = document.createElement("img");
            img.onerror = () => reject(new Error("Unsupported image format — use JPG or PNG"));
            img.onload = () => {
                const MAX = 800;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                    else { width = Math.round((width * MAX) / height); height = MAX; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

export default function CreatePost({ onPost }) {
    const { user, token } = useAuth();
    const [text, setText] = useState("");
    const [activeTags, setActiveTags] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [emojiCat, setEmojiCat] = useState(0);
    const [postSuccess, setPostSuccess] = useState(false);
    const [focused, setFocused] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    const textareaRef = useRef(null);
    const imageInputRef = useRef(null);
    const emojiRef = useRef(null);

    const remaining = MAX_CHARS - text.length;
    const canPost = (text.trim().length > 0 || images.length > 0) && remaining >= 0;
    const expanded = focused || text.length > 0 || images.length > 0 || imageLoading;

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.max(expanded ? 88 : 52, ta.scrollHeight) + "px";
    }, [text, expanded]);

    // Close emoji panel on outside click
    useEffect(() => {
        if (!showEmoji) return;
        const h = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [showEmoji]);

    const toggleTag = (tag) =>
        setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

    const insertAtCursor = (str) => {
        const ta = textareaRef.current;
        if (!ta) { setText((t) => t + str); return; }
        const start = ta.selectionStart ?? text.length;
        const end = ta.selectionEnd ?? text.length;
        const next = text.slice(0, start) + str + text.slice(end);
        setText(next);
        requestAnimationFrame(() => {
            ta.focus();
            const pos = start + str.length;
            ta.selectionStart = pos;
            ta.selectionEnd = pos;
        });
    };

    const handleImagePick = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 4 - images.length);
        if (!files.length) return;
        setImageLoading(true);
        setError(null);
        try {
            const compressed = await Promise.all(files.map(compressImage));
            setImages((prev) => [...prev, ...compressed].slice(0, 4));
        } catch (err) {
            setError(err.message || "Could not load image. Please use JPG or PNG.");
        } finally {
            setImageLoading(false);
        }
        e.target.value = "";
    };

    const handlePost = async () => {
        if ((!text.trim() && images.length === 0) || loading || remaining < 0) return;
        setLoading(true);
        setError(null);
        try {
            const cleanTags = activeTags.map((t) => t.replace("#", "").trim());
            const newPost = await createPost({ content: text.trim(), tags: cleanTags, images }, token);
            setText("");
            setActiveTags([]);
            setImages([]);
            setFocused(false);
            setPostSuccess(true);
            setTimeout(() => setPostSuccess(false), 2000);
            onPost?.(newPost);
        } catch (err) {
            setError(err.message || "Failed to post. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const avatarUrl = user?.profilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&bold=true&size=64`;

    // SVG arc counter
    const r = 11;
    const circ = 2 * Math.PI * r;
    const fill = Math.min(text.length / MAX_CHARS, 1) * circ;
    const ringColor = remaining < 30 ? (remaining < 0 ? "#f43f5e" : "#f59e0b") : "#6366f1";

    return (
        <motion.div
            animate={{ boxShadow: expanded ? "0 8px 40px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.25)" }}
            transition={{ duration: 0.3 }}
            className="card relative overflow-visible"
        >
            {/* Gradient top accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl pointer-events-none"
                style={{ background: "linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)" }} />

            <div className="flex gap-3 pt-0.5">
                {/* Avatar with gradient ring */}
                <div className="shrink-0 relative mt-0.5" style={{ width: 40, height: 40 }}>
                    <div className="absolute rounded-full"
                        style={{ inset: -2, background: "linear-gradient(135deg,#6366f1,#22d3ee)", borderRadius: "9999px" }}>
                        <div className="w-full h-full rounded-full" style={{ background: "var(--card-bg)", margin: "1.5px", width: "calc(100% - 3px)", height: "calc(100% - 3px)" }} />
                    </div>
                    <img src={avatarUrl} alt=""
                        className="absolute inset-0 w-full h-full rounded-full object-cover"
                        style={{ zIndex: 1 }} />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Name + handle — only shows when expanded */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="text-[12px] font-semibold mb-1.5"
                                style={{ color: "var(--text-sub)" }}
                            >
                                {user?.name}
                                <span className="ml-1.5 font-normal" style={{ color: "var(--text-muted)" }}>@{user?.username}</span>
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        placeholder="Share an idea, project, or ask the community…"
                        className="w-full resize-none bg-transparent outline-none leading-relaxed transition-all duration-300 placeholder:text-slate-600"
                        style={{
                            minHeight: expanded ? "88px" : "52px",
                            maxHeight: "260px",
                            color: "var(--text-main)",
                            fontSize: "14.5px",
                            caretColor: "#6366f1",
                        }}
                        value={text}
                        onFocus={() => setFocused(true)}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
                    />

                    {/* Image previews */}
                    <AnimatePresence>
                        {images.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex gap-2 mt-2 pb-1 overflow-x-auto"
                                style={{ scrollbarWidth: "none" }}
                            >
                                {images.map((src, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.82 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.82 }}
                                        transition={{ duration: 0.18 }}
                                        className="relative shrink-0 rounded-xl overflow-hidden group"
                                        style={{ width: 104, height: 78, border: "1px solid rgba(255,255,255,0.1)" }}
                                    >
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                        <button
                                            onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: "rgba(0,0,0,0.75)", color: "white" }}
                                        >
                                            <X size={9} />
                                        </button>
                                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1 rounded"
                                            style={{ background: "rgba(0,0,0,0.55)", color: "white" }}>
                                            {i + 1}/{images.length}
                                        </span>
                                    </motion.div>
                                ))}
                                {images.length < 4 && (
                                    <motion.button
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        onClick={() => imageInputRef.current?.click()}
                                        className="shrink-0 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-indigo-500/10 transition-colors"
                                        style={{ width: 78, height: 78, border: "1.5px dashed rgba(99,102,241,0.35)", color: "var(--text-muted)", background: "rgba(99,102,241,0.04)" }}
                                    >
                                        <ImagePlus size={15} style={{ color: "#6366f1" }} />
                                        <span className="text-[9.5px] font-medium">Add more</span>
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick tag pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {QUICK_TAGS.map((tag, i) => (
                            <motion.button
                                key={tag}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.03 * i }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleTag(tag)}
                                className="text-[11.5px] px-2.5 py-[5px] rounded-full font-medium transition-all duration-150"
                                style={
                                    activeTags.includes(tag)
                                        ? { background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.42)", color: "#a5b4fc" }
                                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)" }
                                }
                            >
                                {tag}
                            </motion.button>
                        ))}
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="text-[12px] mt-2 px-3 py-1.5 rounded-lg"
                                style={{ color: "#fb7185", background: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.2)" }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer toolbar */}
            <div className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-0.5">

                    {/* Hidden file input */}
                    <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />

                    {/* Image upload button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => imageInputRef.current?.click()}
                        disabled={images.length >= 4 || imageLoading}
                        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                        style={{
                            color: images.length > 0 ? "#6366f1" : "var(--text-muted)",
                            background: images.length > 0 || imageLoading ? "rgba(99,102,241,0.12)" : "transparent",
                            opacity: (images.length >= 4 || imageLoading) && !imageLoading ? 0.4 : 1,
                        }}
                        title="Upload image (max 4)"
                    >
                        {imageLoading
                            ? <Loader2 size={15} className="animate-spin" style={{ color: "#6366f1" }} />
                            : <ImagePlus size={15} />}
                        {!imageLoading && images.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                                style={{ background: "#6366f1", color: "white" }}>
                                {images.length}
                            </span>
                        )}
                    </motion.button>

                    {/* Hash — inserts # at cursor */}
                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => insertAtCursor(" #")}
                        className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:bg-white/[0.06]"
                        style={{ color: "var(--text-muted)" }}
                        title="Insert hashtag"
                    >
                        <Hash size={15} />
                    </motion.button>

                    {/* Emoji picker */}
                    <div className="relative" ref={emojiRef}>
                        <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setShowEmoji((v) => !v)}
                            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                            style={{
                                color: showEmoji ? "#f59e0b" : "var(--text-muted)",
                                background: showEmoji ? "rgba(245,158,11,0.12)" : "transparent",
                            }}
                            title="Emoji"
                        >
                            <Smile size={15} />
                        </motion.button>

                        <AnimatePresence>
                            {showEmoji && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.92 }}
                                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute bottom-11 left-0 z-50 rounded-2xl overflow-hidden"
                                    style={{
                                        width: 272,
                                        background: "#0d1117",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        boxShadow: "0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(99,102,241,0.1)",
                                    }}
                                >
                                    {/* Category tabs */}
                                    <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                                        {EMOJI_CATEGORIES.map((cat, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setEmojiCat(i)}
                                                className="flex-1 py-2.5 text-[18px] transition-colors"
                                                style={{ background: emojiCat === i ? "rgba(99,102,241,0.12)" : "transparent" }}
                                            >
                                                {cat.icon}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Grid */}
                                    <div className="p-2 grid grid-cols-8 gap-0.5">
                                        {EMOJI_CATEGORIES[emojiCat].emojis.map((em) => (
                                            <motion.button
                                                key={em}
                                                whileHover={{ scale: 1.3 }}
                                                transition={{ duration: 0.1 }}
                                                onClick={() => { insertAtCursor(em); setShowEmoji(false); }}
                                                className="flex items-center justify-center rounded-lg text-[19px] hover:bg-white/10 transition-colors"
                                                style={{ aspectRatio: "1", width: "100%" }}
                                            >
                                                {em}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <div className="px-3 py-1.5 text-center text-[10px]"
                                        style={{ color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                        Click to insert at cursor
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Keyboard shortcut hint */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.span
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="ml-2 text-[10px] hidden sm:block select-none"
                                style={{ color: "var(--text-muted)" }}
                            >
                                ⌘↵ to post
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: arc counter + post button */}
                <div className="flex items-center gap-3">
                    {/* SVG arc char counter */}
                    <AnimatePresence>
                        {text.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="relative"
                                style={{ width: 28, height: 28 }}
                            >
                                <svg width="28" height="28" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 28 28">
                                    <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                                    <circle
                                        cx="14" cy="14" r={r} fill="none"
                                        stroke={ringColor}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeDasharray={`${fill} ${circ}`}
                                        style={{ transition: "stroke-dasharray 0.15s, stroke 0.2s" }}
                                    />
                                </svg>
                                {remaining <= 40 && (
                                    <span className="absolute inset-0 flex items-center justify-center font-bold"
                                        style={{ fontSize: "7.5px", color: ringColor }}>
                                        {remaining}
                                    </span>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Post button */}
                    <motion.button
                        onClick={handlePost}
                        disabled={!canPost || loading}
                        whileHover={canPost && !loading ? { scale: 1.04, y: -1 } : {}}
                        whileTap={canPost && !loading ? { scale: 0.96 } : {}}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all duration-200"
                        style={
                            !canPost
                                ? { background: "rgba(99,102,241,0.18)", color: "#818cf8", cursor: "not-allowed", fontSize: "13px" }
                                : postSuccess
                                    ? { background: "linear-gradient(135deg,#10b981,#34d399)", color: "white", fontSize: "13px", boxShadow: "0 4px 16px rgba(16,185,129,0.4)" }
                                    : { background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #22d3ee 100%)", color: "white", fontSize: "13px", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }
                        }
                    >
                        {loading ? (
                            <><Loader2 size={13} className="animate-spin" /> Posting…</>
                        ) : postSuccess ? (
                            <>✓ Posted!</>
                        ) : (
                            <><Send size={13} /> Post</>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

