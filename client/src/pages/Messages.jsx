import { Send, Search, Phone, Video, MoreHorizontal, Smile, Paperclip, Loader2, Hash, Radio, MessageSquareText, ArrowLeft } from "lucide-react";
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
        <div className="grid h-[calc(100dvh-10.25rem)] gap-3 lg:h-[calc(100dvh-9.25rem)] lg:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_260px]">
            {/* ── Conversations sidebar ── */}
            <aside
                className={`${activeId ? "hidden lg:flex" : "flex"} min-h-0 flex-col overflow-hidden rounded-xl`}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
                {/* Sidebar header */}
                <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h1 className="text-[16px] font-bold" style={{ color: "var(--text-main)" }}>Messages</h1>
                        <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={socketStatus === "online"
                                ? { background: "var(--success-bg)", color: "var(--success)" }
                                : socketStatus === "error"
                                    ? { background: "var(--error-bg)", color: "var(--error)" }
                                    : { background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                        >
                            <Radio size={9} />
                            {socketStatus}
                        </span>
                    </div>
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                        <input
                            className="w-full rounded-lg py-2 pl-8 pr-3 text-[13px] outline-none"
                            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                            placeholder="Search conversations…"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin" }}>
                    {loadingConvos ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                        </div>
                    ) : null}

                    {!loadingConvos && filteredConvos.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                            <MessageSquareText className="mx-auto h-9 w-9 mb-3" style={{ color: "var(--text-faint)" }} />
                            <p className="text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>No conversations yet</p>
                            <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>Your messages will appear here.</p>
                        </div>
                    ) : null}

                    {!loadingConvos && filteredConvos.map((conversation) => {
                        const isActive = String(conversation.partner._id) === String(activeId);
                        const presence = presenceByUserId[String(conversation.partner._id)];

                        return (
                            <button
                                key={conversation.partner._id}
                                type="button"
                                onClick={() => setActiveId(conversation.partner._id)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                                style={isActive
                                    ? { background: "var(--primary-subtle)", border: "1px solid rgba(10,102,194,0.18)" }
                                    : { background: "transparent", border: "1px solid transparent" }}
                            >
                                {/* Avatar + presence dot */}
                                <div className="relative shrink-0">
                                    <img
                                        src={conversation.partner.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner.name)}&background=0a66c2&color=fff&bold=true&size=80`}
                                        className="h-10 w-10 rounded-xl object-cover"
                                        alt={conversation.partner.name}
                                    />
                                    <span
                                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
                                        style={{
                                            borderColor: "var(--surface)",
                                            background: presence?.status === "online" ? "var(--success)" : presence?.status === "idle" ? "var(--warning)" : "var(--text-faint)"
                                        }}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <p className="truncate text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>{conversation.partner.name}</p>
                                        <span className="shrink-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
                                            {conversation.lastMessage?.createdAt ? timeStr(conversation.lastMessage.createdAt) : ""}
                                        </span>
                                    </div>
                                    <p className="truncate text-[12px]" style={{ color: isActive ? "var(--primary)" : "var(--text-sub)" }}>
                                        {conversation.lastMessage?.content || formatPresenceLabel(presence)}
                                    </p>
                                </div>

                                {conversation.unreadCount > 0 ? (
                                    <span
                                        className="shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[11px] font-bold px-1.5"
                                        style={{ background: "var(--primary)", color: "#fff" }}
                                    >
                                        {conversation.unreadCount}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Chat panel ── */}
            <section
                className={`${activeId ? "flex" : "hidden lg:flex"} min-h-0 flex-col overflow-hidden rounded-xl`}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
                {!activeId ? (
                    <div className="flex flex-1 items-center justify-center px-6 text-center">
                        <div>
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--primary-subtle)" }}>
                                <Hash className="h-8 w-8" style={{ color: "var(--primary)" }} />
                            </div>
                            <h2 className="text-[16px] font-bold" style={{ color: "var(--text-main)" }}>Pick a conversation</h2>
                            <p className="mt-2 text-[13px] max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-sub)" }}>
                                Select a chat from the left to view history and start messaging in real time.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
                                style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }}
                                onClick={() => setActiveId(null)}
                                title="Back to conversations"
                            >
                                <ArrowLeft size={16} />
                            </button>

                            <div className="relative shrink-0">
                                <img
                                    src={displayPartner?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayPartner?.name || "U")}&background=0a66c2&color=fff&bold=true&size=80`}
                                    className="h-10 w-10 rounded-xl object-cover"
                                    alt={displayPartner?.name || "User"}
                                />
                                <span
                                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
                                    style={{
                                        borderColor: "var(--surface)",
                                        background: activePresence?.status === "online" ? "var(--success)" : activePresence?.status === "idle" ? "var(--warning)" : "var(--text-faint)"
                                    }}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-[15px] font-bold" style={{ color: "var(--text-main)" }}>{displayPartner?.name}</h2>
                                    <span
                                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                        style={activePresence?.status === "online"
                                            ? { background: "var(--success-bg)", color: "var(--success)" }
                                            : activePresence?.status === "idle"
                                                ? { background: "var(--warning-bg)", color: "var(--warning)" }
                                                : { background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                        {activePresence?.status || "offline"}
                                    </span>
                                </div>
                                <p className="truncate text-[12px] mt-0.5" style={{ color: isPartnerTyping ? "var(--primary)" : "var(--text-muted)" }}>
                                    {isPartnerTyping ? `${displayPartner?.name || "Someone"} is typing…` : displayPartner?.headline || displayPartner?.college || formatPresenceLabel(activePresence)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }} title="Voice call"><Phone size={14} /></button>
                                <button className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }} title="Video call"><Video size={14} /></button>
                                <button className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }} title="More options"><MoreHorizontal size={14} /></button>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "thin" }}>
                            {loadingMsgs ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary-light)" }} />
                                </div>
                            ) : null}

                            {!loadingMsgs && Object.entries(dayGroups).map(([day, groupedMessages]) => (
                                <div key={day} className="mb-5">
                                    {/* Day separator */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "var(--surface-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                            {day}
                                        </span>
                                        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                                    </div>

                                    <div className="space-y-2">
                                        {groupedMessages.map((message) => {
                                            const isMe = String(message.sender?._id ?? message.sender) === String(user?._id);
                                            const showSeen = isMe && latestReadOwnMessageId && String(latestReadOwnMessageId) === String(message._id);

                                            return (
                                                <motion.div
                                                    key={message._id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className="max-w-[72%]">
                                                        <div
                                                            className={`rounded-2xl px-4 py-2.5 ${isMe ? "rounded-br-md" : "rounded-bl-md"}`}
                                                            style={isMe
                                                                ? { background: "var(--primary)", color: "#fff" }
                                                                : { background: "var(--surface-soft)", color: "var(--text-main)", border: "1px solid var(--border)" }}
                                                        >
                                                            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">{message.content}</p>
                                                        </div>
                                                        <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${isMe ? "justify-end" : "justify-start"}`} style={{ color: "var(--text-muted)" }}>
                                                            <span>{timeStr(message.createdAt)}</span>
                                                            {isMe && <span>· {showSeen ? `Seen ${timeStr(message.readAt)}` : deliveryStatusLabel(message)}</span>}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            <AnimatePresence>
                                {isPartnerTyping ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className="flex justify-start mb-3"
                                    >
                                        <div className="rounded-2xl rounded-bl-md px-4 py-2.5 text-[13px]" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-sub)" }}>
                                            <div className="flex items-center gap-2">
                                                <span>{displayPartner?.name || "Someone"} is typing</span>
                                                <span className="flex items-center gap-0.5">
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.2s]" style={{ background: "var(--text-muted)" }} />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.1s]" style={{ background: "var(--text-muted)" }} />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full" style={{ background: "var(--text-muted)" }} />
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                            <div className="flex items-end gap-2 rounded-xl px-3 py-2" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors" style={{ color: "var(--text-muted)" }} title="Emoji">
                                    <Smile size={16} />
                                </button>
                                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors" style={{ color: "var(--text-muted)" }} title="Attach">
                                    <Paperclip size={15} />
                                </button>
                                <textarea
                                    className="min-h-[36px] max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[14px] outline-none leading-relaxed"
                                    style={{ color: "var(--text-main)" }}
                                    placeholder={`Message ${displayPartner?.name || "this conversation"}…`}
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
                                    disabled={!input.trim() || sending}
                                    onClick={handleSend}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all"
                                    style={input.trim() && !sending
                                        ? { background: "var(--primary)", color: "#fff" }
                                        : { background: "var(--surface-hover)", color: "var(--text-muted)" }}
                                >
                                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                </button>
                            </div>
                            <p className="mt-1.5 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>Enter to send · Shift+Enter for new line</p>
                        </div>
                    </>
                )}
            </section>

            {/* ── Info panel ── */}
            <aside className="hidden min-h-0 flex-col overflow-hidden rounded-xl 2xl:flex" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-main)" }}>Conversation info</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{displayPartner?.name || "No active chat"}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
                    {displayPartner ? (
                        <>
                            {/* Profile card */}
                            <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                <img
                                    src={displayPartner.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayPartner.name)}&background=0a66c2&color=fff&bold=true&size=120`}
                                    className="mx-auto h-16 w-16 rounded-xl object-cover mb-3"
                                    alt={displayPartner.name}
                                />
                                <p className="text-[15px] font-bold" style={{ color: "var(--text-main)" }}>{displayPartner.name}</p>
                                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>@{displayPartner.username}</p>
                                <span
                                    className="inline-block mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                    style={activePresence?.status === "online"
                                        ? { background: "var(--success-bg)", color: "var(--success)" }
                                        : activePresence?.status === "idle"
                                            ? { background: "var(--warning-bg)", color: "var(--warning)" }
                                            : { background: "var(--surface-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                                    {formatPresenceLabel(activePresence)}
                                </span>
                                {(displayPartner.headline || displayPartner.college) && (
                                    <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--text-sub)" }}>
                                        {displayPartner.headline || displayPartner.college}
                                    </p>
                                )}
                            </div>

                            {/* Thread stats */}
                            <div className="rounded-xl p-4" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                <p className="text-[12px] font-bold mb-3" style={{ color: "var(--text-muted)" }}>Thread stats</p>
                                <div className="space-y-2.5">
                                    {[
                                        { label: "Total messages", value: messages.length, color: "var(--text-main)" },
                                        { label: "Unread", value: activeConvo?.unreadCount || 0, color: "var(--text-main)" },
                                        { label: "Realtime", value: "Socket.io", color: "var(--success)" },
                                        { label: "Presence", value: activePresence?.status || "offline", color: "var(--text-main)" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="text-[13px]" style={{ color: "var(--text-sub)" }}>{label}</span>
                                            <span className="text-[13px] font-semibold capitalize" style={{ color }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                            <MessageSquareText className="mx-auto h-8 w-8 mb-3" style={{ color: "var(--text-faint)" }} />
                            <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>Select a conversation to view details.</p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
