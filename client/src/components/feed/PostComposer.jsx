import { useState } from "react";
import Notification from "../Notification";

export default function PostComposer({ onSubmit, isSubmitting = false }) {
    const [content, setContent] = useState("");
    const [imagesInput, setImagesInput] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [feedback, setFeedback] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!content.trim()) {
            setFeedback("Post content is required.");
            return;
        }

        try {
            await onSubmit({
                content: content.trim(),
                images: imagesInput.split(",").map((item) => item.trim()).filter(Boolean),
                tags: tagsInput.split(",").map((item) => item.trim()).filter(Boolean)
            });
            setContent("");
            setImagesInput("");
            setTagsInput("");
            setFeedback("");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card-surface p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Create post</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Share a project update, opportunity, or discussion.</h2>
                </div>
            </div>

            <Notification tone="warning" message={feedback} />

            <div className="mt-4 space-y-4">
                <textarea
                    rows="5"
                    className="input-control"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="What are you building, learning, or looking for?"
                />
                <div className="grid gap-4 md:grid-cols-2">
                    <input
                        className="input-control"
                        value={imagesInput}
                        onChange={(event) => setImagesInput(event.target.value)}
                        placeholder="Image URLs separated by commas"
                    />
                    <input
                        className="input-control"
                        value={tagsInput}
                        onChange={(event) => setTagsInput(event.target.value)}
                        placeholder="Tags separated by commas"
                    />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? "Publishing..." : "Publish post"}
                </button>
            </div>
        </form>
    );
}
