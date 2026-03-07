import { PaperAirplaneIcon, PhotoIcon, SparklesIcon, TagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Notification from "./Notification";

const starterPrompts = [
    "Looking for feedback on a project idea",
    "Searching for collaborators for a hackathon",
    "Sharing internship prep resources"
];

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read selected image."));
        reader.readAsDataURL(file);
    });
}

export default function CreatePost({ onSubmit, isSubmitting = false }) {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [previewImage, setPreviewImage] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [feedback, setFeedback] = useState("");

    const avatarFallback = user?.name?.charAt(0)?.toUpperCase() || "S";

    const resetComposer = () => {
        setContent("");
        setImageUrl("");
        setPreviewImage("");
        setTagInput("");
        setFeedback("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const dataUrl = await fileToDataUrl(file);
            setPreviewImage(dataUrl);
            setImageUrl("");
            setFeedback("");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!content.trim()) {
            setFeedback("Write something before posting.");
            return;
        }

        const normalizedTags = tagInput
            .split(",")
            .map((tag) => tag.trim().replace(/^#/, ""))
            .filter(Boolean)
            .slice(0, 5);

        try {
            await onSubmit({
                content: content.trim(),
                images: [previewImage || imageUrl].filter(Boolean),
                tags: normalizedTags
            });
            resetComposer();
        } catch (error) {
            setFeedback(error.message);
        }
    };

    return (
        <motion.form
            layout
            onSubmit={handleSubmit}
            className="card-surface sticky top-4 z-10 overflow-hidden p-5"
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-brand-500/18 via-accent-400/12 to-transparent" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 font-bold text-white">
                        {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" /> : avatarFallback}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">Share with your network</p>
                        <p className="text-xs text-slate-400">Post project progress, ask for feedback, or surface campus opportunities.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="hidden rounded-2xl border border-brand-400/20 bg-brand-500/10 px-3 py-2 text-xs font-medium text-brand-100 md:flex md:items-center md:gap-2">
                        <SparklesIcon className="h-4 w-4" />
                        Student feed
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300">
                        {content.trim().length}/500 chars
                    </div>
                </div>
            </div>

            <Notification tone="warning" message={feedback} />

            <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                    {starterPrompts.map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent-400/30 hover:text-white"
                            onClick={() => setContent((currentContent) => currentContent ? `${currentContent}\n${prompt}` : prompt)}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                <textarea
                    rows="5"
                    className="input-control"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Start a discussion, share a milestone, or ask the community for help."
                    maxLength={500}
                />

                {previewImage || imageUrl ? (
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
                        <img src={previewImage || imageUrl} alt="Post preview" className="max-h-80 w-full object-cover" />
                        <button
                            type="button"
                            className="icon-button absolute right-4 top-4 h-10 w-10"
                            onClick={() => {
                                setPreviewImage("");
                                setImageUrl("");
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                }
                            }}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto_auto]">
                    <input
                        className="input-control"
                        value={imageUrl}
                        onChange={(event) => {
                            setImageUrl(event.target.value);
                            setPreviewImage("");
                        }}
                        placeholder="Paste image URL or use upload"
                    />
                    <div className="relative">
                        <TagIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <input
                            className="input-control pl-11"
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            placeholder="Tags: react, ui, hackathon"
                        />
                    </div>
                    <label className="btn-secondary cursor-pointer gap-2">
                        <PhotoIcon className="h-5 w-5" />
                        Upload
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <div className="flex gap-3">
                        <button type="button" className="btn-secondary gap-2" onClick={resetComposer}>
                            Clear
                        </button>
                        <button type="submit" className="btn-primary gap-2" disabled={isSubmitting}>
                            <PaperAirplaneIcon className="h-5 w-5" />
                            {isSubmitting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </motion.form>
    );
}
