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
        ta.style.height = Math.max(expanded ? 96 : 48, ta.scrollHeight) + "px";
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
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=1473e6&color=fff&bold=true&size=64`;

    // SVG arc counter
    const r = 11;
    const circ = 2 * Math.PI * r;
    const fill = Math.min(text.length / MAX_CHARS, 1) * circ;
    const ringColor = remaining < 30 ? (remaining < 0 ? "#f43f5e" : "#f59e0b") : "#6366f1";

    return (
        <motion.div
            animate={{ borderColor: expanded ? "var(--border-focus)" : "var(--border)" }}
            transition={{ duration: 0.2 }}
            className="card"
        >
            <div className="flex gap-3">
                {/* Avatar */}
                <img src={avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        placeholder="Share an idea, ask a question, or post a project update…"
                        className="w-full resize-none bg-transparent outline-none leading-relaxed placeholder:opacity-40"
                        style={{
                            minHeight: expanded ? "96px" : "48px",
                            maxHeight: "280px",
                            color: "var(--text-main)",
                            fontSize: "15px",
                            caretColor: "var(--primary)",
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
                                className="flex gap-2 mt-2 pb-1 overflow-x-auto"
                                style={{ scrollbarWidth: "none" }}
                            >
                                {images.map((src, i) => (
                                    <div key={i} className="relative shrink-0 rounded-xl overflow-hidden group"
                                        style={{ width: 90, height: 68, border: "1px solid var(--border)" }}>
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                                        <button
                                            onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: "rgba(0,0,0,0.8)", color: "white" }}
                                        >
                                            <X size={9} />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 4 && (
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="shrink-0 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                                        style={{ width: 68, height: 68, border: "1.5px dashed var(--border-hover)", color: "var(--text-muted)" }}
                                    >
                                        <ImagePlus size={14} />
                                        <span className="text-[12px]">Add</span>
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick tags */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-wrap gap-1.5 mt-2.5"
                            >
                                {QUICK_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className="text-[12px] px-2.5 py-1 rounded-lg font-medium transition-all duration-150"
                                        style={
                                            activeTags.includes(tag)
                                                ? { background: "var(--primary-subtle)", border: "1px solid rgba(99,102,241,0.35)", color: "var(--primary-light)" }
                                                : { background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                                        }
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-[14px] mt-2 px-3 py-2 rounded-lg"
                                style={{ color: "#fb7185", background: "var(--error-bg)", border: "1px solid rgba(244,63,94,0.2)" }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer toolbar */}
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-1">
                    <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />

                    {/* Image */}
                    <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={images.length >= 4 || imageLoading}
                        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 relative"
                        style={{ color: images.length > 0 ? "var(--primary-light)" : "var(--text-muted)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        title="Upload images (max 4)"
                    >
                        {imageLoading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                        {images.length > 0 && !imageLoading && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[12px] font-bold flex items-center justify-center"
                                style={{ background: "var(--primary)", color: "white" }}>
                                {images.length}
                            </span>
                        )}
                    </button>

                    {/* Hash */}
                    <button onClick={() => insertAtCursor(" #")}
                        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        title="Hashtag">
                        <Hash size={15} />
                    </button>

                    {/* Emoji */}
                    <div className="relative" ref={emojiRef}>
                        <button onClick={() => setShowEmoji(v => !v)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
                            style={{ color: showEmoji ? "var(--warning)" : "var(--text-muted)", background: showEmoji ? "var(--warning-bg)" : "transparent" }}
                            title="Emoji">
                            <Smile size={15} />
                        </button>

                        <AnimatePresence>
                            {showEmoji && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.94 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.94 }}
                                    transition={{ duration: 0.14 }}
                                    className="absolute bottom-10 left-0 z-50 rounded-2xl overflow-hidden"
                                    style={{
                                        width: 268,
                                        background: "var(--surface-elevated)",
                                        border: "1px solid var(--border-hover)",
                                        boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
                                    }}
                                >
                                    <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                                        {EMOJI_CATEGORIES.map((cat, i) => (
                                            <button key={i} onClick={() => setEmojiCat(i)}
                                                className="flex-1 py-2.5 text-lg transition-colors"
                                                style={{ background: emojiCat === i ? "var(--primary-subtle)" : "transparent" }}>
                                                {cat.icon}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-2 grid grid-cols-8 gap-0.5">
                                        {EMOJI_CATEGORIES[emojiCat].emojis.map((em) => (
                                            <button key={em} onClick={() => { insertAtCursor(em); setShowEmoji(false); }}
                                                className="flex items-center justify-center rounded-lg text-lg hover:bg-white/8 transition-colors"
                                                style={{ aspectRatio: "1" }}>
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {expanded && (
                        <span className="ml-2 text-[12px] hidden sm:block select-none" style={{ color: "var(--text-faint)" }}>
                            ⌘↵ to post
                        </span>
                    )}
                </div>

                {/* Right: counter + post button */}
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {text.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                className="relative" style={{ width: 26, height: 26 }}>
                                <svg width="26" height="26" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 26 26">
                                    <circle cx="13" cy="13" r={r} fill="none" stroke="var(--surface-hover)" strokeWidth="2.5" />
                                    <circle cx="13" cy="13" r={r} fill="none" stroke={ringColor} strokeWidth="2.5" strokeLinecap="round"
                                        strokeDasharray={`${fill} ${circ}`} style={{ transition: "stroke-dasharray 0.15s, stroke 0.2s" }} />
                                </svg>
                                {remaining <= 50 && (
                                    <span className="absolute inset-0 flex items-center justify-center font-bold"
                                        style={{ fontSize: "7px", color: ringColor }}>{remaining}</span>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={handlePost}
                        disabled={!canPost || loading}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-[14px] transition-all duration-150 select-none"
                        style={
                            !canPost
                                ? { background: "var(--surface-hover)", color: "var(--text-muted)", cursor: "not-allowed" }
                                : postSuccess
                                    ? { background: "var(--success)", color: "white" }
                                    : { background: "var(--primary)", color: "white" }
                        }
                    >
                        {loading ? (
                            <><Loader2 size={13} className="animate-spin" /> Posting…</>
                        ) : postSuccess ? (
                            <>✓ Posted!</>
                        ) : (
                            <><Send size={13} /> Post</>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

