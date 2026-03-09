import { Send, Search, Phone, Video, MoreHorizontal, Smile, Paperclip, Loader2, Hash, Radio, MessageSquareText } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getConversations, getMessagesWithUser, sendMessage } from "../services/api.js";
import { connectSocket, disconnectSocket, emitSocketEvent, subscribeToSocketEvent } from "../services/socket.js";

function timeStr(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(dateString) {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function formatPresenceLabel(presence) {
    if (!presence) {
        return "Offline";
    }

    if (presence.status === "online") {
        return "Online";
    }

    if (presence.status === "idle") {
        return "Idle";
    }

    if (presence.lastSeenAt) {
        return `Last seen ${new Date(presence.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    return "Offline";
}

function deliveryStatusLabel(message) {
    if (message.readAt) {
        return `Seen ${timeStr(message.readAt)}`;
    }

    if (message.deliveredAt) {
        return "Delivered";
    }

    if (String(message._id).startsWith("opt-")) {
        return "Sending...";
    }

    return "Sent";
}

export default function Messages() {
    const { user, token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [partner, setPartner] = useState(null);
    const [input, setInput] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");
    const [socketStatus, setSocketStatus] = useState("offline");
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [presenceByUserId, setPresenceByUserId] = useState({});
    const deferredSearch = useDeferredValue(search);
    const requestedUserId = searchParams.get("user");
    const messagesEndRef = useRef(null);
    const activeIdRef = useRef(activeId);
    const typingTimeoutRef = useRef(null);
    const remoteTypingTimeoutRef = useRef(null);
    const idleTimeoutRef = useRef(null);

    useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

    useEffect(() => () => {
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        if (remoteTypingTimeoutRef.current) {
            window.clearTimeout(remoteTypingTimeoutRef.current);
        }

        if (idleTimeoutRef.current) {
            window.clearTimeout(idleTimeoutRef.current);
        }
    }, []);

    const upsertConversation = (partnerData, lastMessage, nextUnreadCount) => {
        setConversations((prev) => {
            const partnerId = String(partnerData?._id);
            const existingConversation = prev.find((conversation) => String(conversation.partner._id) === partnerId);
            const mergedConversation = {
                partner: existingConversation?.partner || partnerData,
                lastMessage,
                unreadCount: nextUnreadCount ?? existingConversation?.unreadCount ?? 0
            };

            return [
                mergedConversation,
                ...prev.filter((conversation) => String(conversation.partner._id) !== partnerId)
            ];
        });
    };

    const updatePresenceEntries = (entries) => {
        setPresenceByUserId((prev) => {
            const next = { ...prev };

            entries.forEach((entry) => {
                if (!entry?.userId) {
                    return;
                }

                next[entry.userId] = {
                    status: entry.status || "offline",
                    lastSeenAt: entry.lastSeenAt || null
                };
            });

            return next;
        });
    };

    // Load conversations on mount
    useEffect(() => {
        if (!token) return;
        setLoadingConvos(true);
        getConversations(token)
            .then((data) => {
                const list = data ?? [];
                setConversations(list);

                if (requestedUserId) {
                    setActiveId(requestedUserId);
                    return;
                }

                if (list.length > 0) setActiveId(list[0].partner._id);
            })
            .catch(() => { })
            .finally(() => setLoadingConvos(false));
    }, [requestedUserId, token]); // eslint-disable-line

    useEffect(() => {
        if (!requestedUserId) {
            return;
        }

        setActiveId(requestedUserId);
    }, [requestedUserId]);

    // Load messages when conversation changes
    useEffect(() => {
        if (!activeId || !token) return;
        setLoadingMsgs(true);
        setMessages([]);
        getMessagesWithUser(activeId, token)
            .then(({ partner: p, messages: msgs }) => {
                const normalizedMessages = Array.isArray(msgs) ? msgs : [];
                const latestMessage = normalizedMessages.length > 0 ? normalizedMessages[normalizedMessages.length - 1] : null;

                setPartner(p);
                setMessages(normalizedMessages);
                setIsPartnerTyping(false);
                if (p) {
                    upsertConversation(p, latestMessage, 0);
                }
                setConversations((prev) =>
                    prev.map((c) => c.partner._id === activeId ? { ...c, unreadCount: 0 } : c)
                );

                if (requestedUserId) {
                    setSearchParams({}, { replace: true });
                }
            })
            .catch(() => { })
            .finally(() => setLoadingMsgs(false));
    }, [activeId, requestedUserId, setSearchParams, token]); // eslint-disable-line

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!conversations.length || !token) {
            return;
        }

        emitSocketEvent("presence:watch", {
            userIds: conversations.map((conversation) => conversation.partner._id)
        });
    }, [conversations, token]);

    // Socket.io real-time messages
    useEffect(() => {
        if (!token || !user?._id) {
            return;
        }

        const socket = connectSocket(token, "messages");

        if (!socket) {
            return;
        }

        const handleConnect = () => setSocketStatus("online");
        const handleDisconnect = () => setSocketStatus("offline");
        const handleConnectError = () => setSocketStatus("error");
        const handleIncomingMessage = (message) => {
            const senderId = String(message.sender?._id ?? message.sender);
            const isActiveConversation = senderId === String(activeIdRef.current);

            if (isActiveConversation) {
                setIsPartnerTyping(false);
            }

            upsertConversation(message.sender, message, isActiveConversation ? 0 : undefined);

            if (isActiveConversation) {
                setMessages((prev) => prev.some((item) => item._id === message._id) ? prev : [...prev, message]);
                setConversations((prev) => prev.map((conversation) =>
                    String(conversation.partner._id) === senderId
                        ? { ...conversation, unreadCount: 0 }
                        : conversation
                ));
                return;
            }

            setConversations((prev) => prev.map((conversation) =>
                String(conversation.partner._id) === senderId
                    ? { ...conversation, unreadCount: (conversation.unreadCount || 0) + 1 }
                    : conversation
            ));
        };
        const handlePresenceSnapshot = (snapshot) => {
            updatePresenceEntries(Array.isArray(snapshot) ? snapshot : []);
        };
        const handlePresenceUpdate = (entry) => {
            updatePresenceEntries(entry ? [entry] : []);
        };
        const handleTypingState = ({ userId: typingUserId, isTyping }) => {
            if (String(typingUserId) !== String(activeIdRef.current)) {
                return;
            }

            setIsPartnerTyping(Boolean(isTyping));

            if (remoteTypingTimeoutRef.current) {
                window.clearTimeout(remoteTypingTimeoutRef.current);
            }

            if (isTyping) {
                remoteTypingTimeoutRef.current = window.setTimeout(() => {
                    setIsPartnerTyping(false);
                }, 2200);
            }
        };
        const handleReadReceipt = ({ conversationUserId, messageIds, readAt }) => {
            if (String(conversationUserId) !== String(activeIdRef.current)) {
                return;
            }

            const readMessageIds = new Set((messageIds || []).map(String));

            setMessages((prev) => prev.map((message) => (
                readMessageIds.has(String(message._id))
                    ? { ...message, deliveredAt: message.deliveredAt || readAt, readAt }
                    : message
            )));

            setConversations((prev) => prev.map((conversation) => (
                String(conversation.partner._id) === String(conversationUserId)
                    ? {
                        ...conversation,
                        lastMessage: conversation.lastMessage && readMessageIds.has(String(conversation.lastMessage._id))
                            ? { ...conversation.lastMessage, deliveredAt: conversation.lastMessage.deliveredAt || readAt, readAt }
                            : conversation.lastMessage
                    }
                    : conversation
            )));
        };
        const handleDeliveredReceipt = ({ conversationUserId, messageIds, deliveredAt }) => {
            if (String(conversationUserId) !== String(activeIdRef.current)) {
                setConversations((prev) => prev.map((conversation) => (
                    String(conversation.partner._id) === String(conversationUserId) && conversation.lastMessage && messageIds?.includes(String(conversation.lastMessage._id))
                        ? { ...conversation, lastMessage: { ...conversation.lastMessage, deliveredAt } }
                        : conversation
                )));
                return;
            }

            const deliveredIds = new Set((messageIds || []).map(String));

            setMessages((prev) => prev.map((message) => (
                deliveredIds.has(String(message._id))
                    ? { ...message, deliveredAt }
                    : message
            )));
            setConversations((prev) => prev.map((conversation) => (
                String(conversation.partner._id) === String(conversationUserId) && conversation.lastMessage && deliveredIds.has(String(conversation.lastMessage._id))
                    ? { ...conversation, lastMessage: { ...conversation.lastMessage, deliveredAt } }
                    : conversation
            )));
        };

        const markActive = () => {
            emitSocketEvent("presence:status", { status: "online" });

            if (idleTimeoutRef.current) {
                window.clearTimeout(idleTimeoutRef.current);
            }

            idleTimeoutRef.current = window.setTimeout(() => {
                emitSocketEvent("presence:status", { status: "idle" });
            }, 60000);
        };

        handleConnect();
        markActive();
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        const unsubscribeMessage = subscribeToSocketEvent("message:new", handleIncomingMessage);
        const unsubscribePresenceSnapshot = subscribeToSocketEvent("presence:snapshot", handlePresenceSnapshot);
        const unsubscribePresenceUpdate = subscribeToSocketEvent("presence:update", handlePresenceUpdate);
        const unsubscribeTyping = subscribeToSocketEvent("message:typing", handleTypingState);
        const unsubscribeRead = subscribeToSocketEvent("message:read", handleReadReceipt);
        const unsubscribeDelivered = subscribeToSocketEvent("message:delivered", handleDeliveredReceipt);

        window.addEventListener("mousemove", markActive);
        window.addEventListener("keydown", markActive);
        window.addEventListener("focus", markActive);

        return () => {
            unsubscribeMessage();
            unsubscribePresenceSnapshot();
            unsubscribePresenceUpdate();
            unsubscribeTyping();
            unsubscribeRead();
            unsubscribeDelivered();
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            window.removeEventListener("mousemove", markActive);
            window.removeEventListener("keydown", markActive);
            window.removeEventListener("focus", markActive);

            if (idleTimeoutRef.current) {
                window.clearTimeout(idleTimeoutRef.current);
            }

            disconnectSocket("messages");
        };
    }, [token, user?._id]); // eslint-disable-line

    const handleSend = async () => {
        if (!input.trim() || !activeId || sending) return;
        const content = input.trim();
        setInput("");
        emitSocketEvent("message:typing", { recipientId: activeId, isTyping: false });
        setSending(true);
        const optimistic = {
            _id: `opt-${Date.now()}`,
            sender: { _id: user._id },
            content,
            createdAt: new Date().toISOString(),
            deliveredAt: null,
            readAt: null,
        };
        setMessages((prev) => [...prev, optimistic]);
        try {
            const sent = await sendMessage(activeId, content, token);
            setMessages((prev) => prev.map((m) => m._id === optimistic._id ? sent : m));
            upsertConversation(displayPartner, sent, 0);
        } catch {
            setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    const handleInputChange = (value) => {
        setInput(value);

        if (!activeId) {
            return;
        }

        emitSocketEvent("message:typing", {
            recipientId: activeId,
            isTyping: value.trim().length > 0
        });

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            emitSocketEvent("message:typing", {
                recipientId: activeId,
                isTyping: false
            });
        }, 1200);
    };

    const filteredConvos = conversations.filter((c) =>
        !deferredSearch || c.partner.name.toLowerCase().includes(deferredSearch.toLowerCase())
    );
    const activeConvo = conversations.find((c) => c.partner._id === activeId);
    const displayPartner = partner || activeConvo?.partner;
    const activePresence = displayPartner ? presenceByUserId[String(displayPartner._id)] : null;
    const latestReadOwnMessageId = [...messages]
        .reverse()
        .find((message) => String(message.sender?._id ?? message.sender) === String(user?._id) && message.readAt)?._id;

    const dayGroups = messages.reduce((acc, msg) => {
        const label = dayLabel(msg.createdAt);
        if (!acc[label]) acc[label] = [];
        acc[label].push(msg);
        return acc;
    }, {});

    return (
        <div className="grid h-[calc(100vh-9rem)] gap-4 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/65">
                <div className="border-b border-white/10 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Direct messages</p>
                            <h1 className="mt-1 text-lg font-bold text-white">Chat hub</h1>
                        </div>
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                            style={socketStatus === "online"
                                ? { background: "rgba(34,197,94,0.12)", color: "#86efac" }
                                : socketStatus === "error"
                                    ? { background: "rgba(244,63,94,0.12)", color: "#fda4af" }
                                    : { background: "rgba(148,163,184,0.12)", color: "#cbd5e1" }}
                        >
                            <Radio size={11} /> {socketStatus}
                        </span>
                    </div>

                    <div className="relative mt-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
                            placeholder="Search conversations"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-thin">
                    {loadingConvos ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={18} className="animate-spin text-indigo-300" />
                        </div>
                    ) : null}

                    {!loadingConvos && filteredConvos.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                            <MessageSquareText className="mx-auto h-10 w-10 text-slate-600" />
                            <p className="mt-3 text-sm font-semibold text-white">No conversations yet</p>
                            <p className="mt-1 text-xs text-slate-500">Your message history will show up here.</p>
                        </div>
                    ) : null}

                    {!loadingConvos && filteredConvos.map((conversation) => {
                        const isActive = String(conversation.partner._id) === String(activeId);

                        return (
                            <button
                                key={conversation.partner._id}
                                type="button"
                                onClick={() => setActiveId(conversation.partner._id)}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200"
                                style={isActive
                                    ? { background: "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(34,211,238,0.12))", border: "1px solid rgba(99,102,241,0.24)" }
                                    : { background: "transparent", border: "1px solid transparent" }}
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={conversation.partner.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner.name)}&background=6366f1&color=fff&bold=true&size=80`}
                                        className="h-11 w-11 rounded-2xl object-cover"
                                        alt={conversation.partner.name}
                                    />
                                    <span
                                        className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950"
                                        style={{
                                            background: presenceByUserId[String(conversation.partner._id)]?.status === "online"
                                                ? "#34d399"
                                                : presenceByUserId[String(conversation.partner._id)]?.status === "idle"
                                                    ? "#fbbf24"
                                                    : "#64748b"
                                        }}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-[13px] font-semibold text-white">{conversation.partner.name}</p>
                                        <span className="shrink-0 text-[10px] text-slate-500">{conversation.lastMessage?.createdAt ? timeStr(conversation.lastMessage.createdAt) : ""}</span>
                                    </div>
                                    <p className="mt-1 truncate text-[11.5px] text-slate-400">{conversation.lastMessage?.content || formatPresenceLabel(presenceByUserId[String(conversation.partner._id)])}</p>
                                </div>
                                {conversation.unreadCount > 0 ? (
                                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-indigo-500 px-2 py-1 text-[10px] font-bold text-white">
                                        {conversation.unreadCount}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/65">
                {!activeId ? (
                    <div className="flex flex-1 items-center justify-center px-6 text-center">
                        <div>
                            <Hash className="mx-auto h-12 w-12 text-slate-600" />
                            <h2 className="mt-4 text-lg font-semibold text-white">Pick a conversation</h2>
                            <p className="mt-2 text-sm text-slate-400">Open a thread to load chat history and start messaging in real time.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4">
                            <div className="relative shrink-0">
                                <img
                                    src={displayPartner?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayPartner?.name || "U")}&background=6366f1&color=fff&bold=true&size=80`}
                                    className="h-11 w-11 rounded-2xl object-cover"
                                    alt={displayPartner?.name || "User"}
                                />
                                <span
                                    className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-950"
                                    style={{
                                        background: activePresence?.status === "online"
                                            ? "#34d399"
                                            : activePresence?.status === "idle"
                                                ? "#fbbf24"
                                                : "#64748b"
                                    }}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-[15px] font-semibold text-white">{displayPartner?.name}</h2>
                                    <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                        style={activePresence?.status === "online"
                                            ? { background: "rgba(52,211,153,0.10)", color: "#86efac" }
                                            : activePresence?.status === "idle"
                                                ? { background: "rgba(251,191,36,0.10)", color: "#fde68a" }
                                                : { background: "rgba(148,163,184,0.10)", color: "#cbd5e1" }}>
                                        {activePresence?.status || "offline"}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-[12px] text-slate-400">{isPartnerTyping ? `${displayPartner?.name || "Someone"} is typing...` : displayPartner?.headline || displayPartner?.college || formatPresenceLabel(activePresence)}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"><Phone size={15} /></button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"><Video size={15} /></button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10"><MoreHorizontal size={15} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
                            {loadingMsgs ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 size={18} className="animate-spin text-indigo-300" />
                                </div>
                            ) : null}

                            {!loadingMsgs && Object.entries(dayGroups).map(([day, groupedMessages]) => (
                                <div key={day} className="mb-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="h-px flex-1 bg-white/10" />
                                        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{day}</span>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>

                                    <div className="space-y-3">
                                        {groupedMessages.map((message) => {
                                            const isMe = String(message.sender?._id ?? message.sender) === String(user?._id);
                                            const showSeen = isMe && latestReadOwnMessageId && String(latestReadOwnMessageId) === String(message._id);

                                            return (
                                                <motion.div
                                                    key={message._id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-lg ${isMe ? "rounded-br-md" : "rounded-bl-md"}`}
                                                        style={isMe
                                                            ? { background: "linear-gradient(135deg, #6366f1, #4338ca)", color: "white" }
                                                            : { background: "rgba(255,255,255,0.05)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.08)" }}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">{message.content}</p>
                                                        <div className={`mt-2 text-[10px] opacity-70 ${isMe ? "text-right" : "text-left"}`}>
                                                            {timeStr(message.createdAt)}
                                                        </div>
                                                        {isMe ? (
                                                            <div className="mt-1 text-[10px] opacity-70 text-right">
                                                                {showSeen ? `Seen ${timeStr(message.readAt)}` : deliveryStatusLabel(message)}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <AnimatePresence>
                                {isPartnerTyping ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="mb-4 flex justify-start"
                                    >
                                        <div className="rounded-3xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <span>{displayPartner?.name || "Someone"} is typing</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-white/10 px-4 py-4">
                            <div className="flex items-end gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
                                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-amber-300">
                                    <Smile size={16} />
                                </button>
                                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-indigo-300">
                                    <Paperclip size={15} />
                                </button>
                                <textarea
                                    className="min-h-10 max-h-32 flex-1 resize-none bg-transparent py-2 text-[13.5px] text-white outline-none placeholder:text-slate-500"
                                    placeholder={`Message ${displayPartner?.name || "this conversation"}`}
                                    value={input}
                                    onChange={(event) => handleInputChange(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white transition-all duration-200 hover:bg-indigo-400"
                                    disabled={!input.trim() || sending}
                                    style={!input.trim() || sending ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                                    onClick={handleSend}
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/65 xl:flex">
                <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Conversation info</p>
                    <h3 className="mt-2 text-base font-semibold text-white">{displayPartner?.name || "No active chat"}</h3>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    {displayPartner ? (
                        <>
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center">
                                <img
                                    src={displayPartner.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayPartner.name)}&background=6366f1&color=fff&bold=true&size=120`}
                                    className="mx-auto h-20 w-20 rounded-3xl object-cover"
                                    alt={displayPartner.name}
                                />
                                <p className="mt-4 text-sm font-semibold text-white">{displayPartner.name}</p>
                                <p className="mt-1 text-xs text-slate-400">@{displayPartner.username}</p>
                                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={activePresence?.status === "online"
                                    ? { color: "#86efac" }
                                    : activePresence?.status === "idle"
                                        ? { color: "#fde68a" }
                                        : { color: "#cbd5e1" }}>
                                    {formatPresenceLabel(activePresence)}
                                </p>
                                <p className="mt-3 text-xs leading-6 text-slate-400">{displayPartner.headline || displayPartner.college || "Student Community member"}</p>
                            </div>

                            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Thread stats</p>
                                <div className="mt-4 space-y-3 text-sm">
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Total messages</span>
                                        <span className="font-semibold text-white">{messages.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Unread</span>
                                        <span className="font-semibold text-white">{activeConvo?.unreadCount || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Realtime</span>
                                        <span className="font-semibold text-emerald-300">Socket.io</span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-300">
                                        <span>Presence</span>
                                        <span className="font-semibold text-white capitalize">{activePresence?.status || "offline"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                            Select a conversation to view thread details.
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
