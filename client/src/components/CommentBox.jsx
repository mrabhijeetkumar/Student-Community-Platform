import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createComment, deleteComment, getComments } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import Notification from "./Notification";

function CommentThread({ comment, depth, onReply, onDelete, activeReplyId, setActiveReplyId, replyText, setReplyText, currentUser }) {
    const canDelete = currentUser && (currentUser._id === comment.userId?._id || currentUser.role === "admin");

    return (
        <motion.div layout className={`rounded-3xl border border-white/10 bg-white/[0.04] p-4 ${depth > 0 ? "ml-4 mt-3" : ""}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-white">{comment.userId?.name || "Student"}</p>
                    <p className="text-xs text-slate-400">@{comment.userId?.username || "community"}</p>
                </div>
                <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{comment.text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setActiveReplyId(activeReplyId === comment._id ? "" : comment._id)}>
                    Reply
                </button>
                {canDelete ? (
                    <button type="button" className="btn-secondary gap-2 px-3 py-2 text-xs" onClick={() => onDelete(comment._id)}>
                        <TrashIcon className="h-4 w-4" />
                        Delete
                    </button>
                ) : null}
            </div>
            <AnimatePresence>
                {activeReplyId === comment._id ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-3 overflow-hidden">
                        <textarea
                            rows="3"
                            className="input-control"
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Write a reply"
                        />
                        <button type="button" className="btn-primary gap-2 px-4 py-2 text-xs" onClick={() => onReply(comment._id)}>
                            <PaperAirplaneIcon className="h-4 w-4" />
                            Post reply
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
            {comment.replies?.map((reply) => (
                <CommentThread
                    key={reply._id}
                    comment={reply}
                    depth={depth + 1}
                    onReply={onReply}
                    onDelete={onDelete}
                    activeReplyId={activeReplyId}
                    setActiveReplyId={setActiveReplyId}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    currentUser={currentUser}
                />
            ))}
        </motion.div>
    );
}

export default function CommentBox({ postId, isOpen, commentsCount = 0 }) {
    const { token, user } = useAuth();
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [activeReplyId, setActiveReplyId] = useState("");
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await getComments(postId, token);
            setComments(data);
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        loadComments();
    }, [isOpen, postId, token]);

    const handleCreateComment = async () => {
        try {
            await createComment(postId, { text: commentText }, token);
            setCommentText("");
            setFeedback("");
            await loadComments();
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleReply = async (parentComment) => {
        try {
            await createComment(postId, { text: replyText, parentComment }, token);
            setReplyText("");
            setActiveReplyId("");
            setFeedback("");
            await loadComments();
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleDelete = async (commentId) => {
        try {
            await deleteComment(commentId, token);
            await loadComments();
        } catch (error) {
            setFeedback(error.message);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-[1.75rem] border border-white/10 bg-slate-950/30 p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-accent-300" />
                    <h3 className="text-sm font-semibold text-white">Threaded comments</h3>
                </div>
                <span className="text-xs uppercase tracking-wide text-slate-500">{commentsCount} total</span>
            </div>
            <Notification tone="warning" message={feedback} />
            <div className="space-y-3">
                <textarea
                    rows="3"
                    className="input-control"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder={`Reply as ${user?.name || "student"}`}
                />
                <button type="button" className="btn-primary gap-2 px-4 py-2 text-sm" onClick={handleCreateComment}>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    Add comment
                </button>
            </div>
            <div className="mt-5 space-y-3">
                {loading ? <p className="text-sm text-slate-500">Loading comments...</p> : null}
                {!loading && comments.length === 0 ? <p className="text-sm text-slate-500">No comments yet.</p> : null}
                {comments.map((comment) => (
                    <CommentThread
                        key={comment._id}
                        comment={comment}
                        depth={0}
                        onReply={handleReply}
                        onDelete={handleDelete}
                        activeReplyId={activeReplyId}
                        setActiveReplyId={setActiveReplyId}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        currentUser={user}
                    />
                ))}
            </div>
        </motion.section>
    );
}
