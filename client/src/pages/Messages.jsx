import { SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Notification from "../components/Notification";
import PageTransition from "../components/ui/PageTransition";
import LoadingCard from "../components/ui/LoadingCard";
import { useAuth } from "../context/AuthContext.jsx";
import { getConversations, getMessagesWithUser, getUserDirectory, sendMessage } from "../services/api";

export default function Messages() {
    const { token, user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draftMessage, setDraftMessage] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadBaseData = async () => {
            setLoading(true);
            try {
                const [conversationData, directoryData] = await Promise.all([
                    getConversations(token),
                    getUserDirectory(token)
                ]);

                if (!isMounted) {
                    return;
                }

                setConversations(conversationData);
                setDirectory(directoryData);
                if (conversationData.length > 0) {
                    setSelectedPartner(conversationData[0].partner);
                }
                setFeedback("");
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

        loadBaseData();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        const loadMessages = async () => {
            if (!selectedPartner?._id) {
                setMessages([]);
                return;
            }

            try {
                const response = await getMessagesWithUser(selectedPartner._id, token);
                if (isMounted) {
                    setMessages(response.messages);
                    setSelectedPartner(response.partner);
                }
            } catch (error) {
                if (isMounted) {
                    setFeedback(error.message);
                }
            }
        };

        loadMessages();

        return () => {
            isMounted = false;
        };
    }, [selectedPartner?._id, token]);

    const filteredDirectory = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return directory;
        }

        return directory.filter((entry) => {
            return [entry.name, entry.username, entry.college].some((value) => value?.toLowerCase().includes(normalizedSearch));
        });
    }, [directory, search]);

    const handleSendMessage = async () => {
        if (!selectedPartner?._id || !draftMessage.trim()) {
            return;
        }

        try {
            const createdMessage = await sendMessage(selectedPartner._id, draftMessage, token);
            setMessages((currentMessages) => [...currentMessages, createdMessage]);
            setDraftMessage("");
            setFeedback("");

            setConversations((currentConversations) => {
                const rest = currentConversations.filter((conversation) => conversation.partner._id !== selectedPartner._id);
                return [{ partner: selectedPartner, lastMessage: createdMessage, unreadCount: 0 }, ...rest];
            });
        } catch (error) {
            setFeedback(error.message);
        }
    };

    return (
        <PageTransition className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="card-surface p-5">
                <div>
                    <p className="section-title">Direct messages</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Conversations</h2>
                </div>
                <input
                    className="input-control mt-5"
                    placeholder="Search students by name, username, or college"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <div className="mt-5 space-y-3">
                    {loading ? <LoadingCard lines={5} /> : null}
                    {!loading && filteredDirectory.map((entry) => {
                        const conversation = conversations.find((item) => item.partner._id === entry._id);
                        const isActive = selectedPartner?._id === entry._id;

                        return (
                            <button
                                key={entry._id}
                                type="button"
                                onClick={() => setSelectedPartner(entry)}
                                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${isActive ? "border-brand-400/30 bg-brand-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-white">{entry.name}</p>
                                        <p className="text-sm text-slate-400">@{entry.username}</p>
                                    </div>
                                    {conversation?.unreadCount ? <span className="rounded-full bg-brand-500 px-2 py-1 text-xs font-semibold text-white">{conversation.unreadCount}</span> : null}
                                </div>
                                <p className="mt-2 text-xs uppercase tracking-wide text-accent-300">{entry.college || "Student"}</p>
                                <p className="mt-3 line-clamp-2 text-sm text-slate-400">{conversation?.lastMessage?.content || entry.headline || "Start a conversation"}</p>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <div className="card-surface flex min-h-[680px] flex-col p-5">
                <Notification tone="warning" message={feedback} />
                {selectedPartner ? (
                    <>
                        <div className="border-b border-white/10 pb-4">
                            <p className="text-xl font-bold text-white">{selectedPartner.name}</p>
                            <p className="text-sm text-slate-400">@{selectedPartner.username} • {selectedPartner.college || selectedPartner.headline || "Student"}</p>
                        </div>

                        <div className="scrollbar-subtle flex-1 space-y-4 overflow-y-auto py-5">
                            {messages.map((message) => {
                                const isOwnMessage = message.sender?._id === user?._id;

                                return (
                                    <div key={message._id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[75%] rounded-[1.75rem] px-4 py-3 text-sm leading-6 ${isOwnMessage ? "bg-brand-500 text-white" : "bg-white/[0.06] text-slate-100"}`}>
                                            <p>{message.content}</p>
                                            <p className={`mt-2 text-[11px] ${isOwnMessage ? "text-brand-100" : "text-slate-500"}`}>{new Date(message.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {messages.length === 0 ? <p className="text-sm text-slate-400">No messages yet. Start the thread.</p> : null}
                        </div>

                        <div className="flex gap-3 border-t border-white/10 pt-4">
                            <textarea
                                rows="3"
                                className="input-control"
                                placeholder={`Message ${selectedPartner.name}`}
                                value={draftMessage}
                                onChange={(event) => setDraftMessage(event.target.value)}
                            />
                            <button type="button" className="btn-primary self-end" onClick={handleSendMessage}>
                                <SendHorizontal size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Select a student to load the conversation.</div>
                )}
            </div>
        </PageTransition>
    );
}
