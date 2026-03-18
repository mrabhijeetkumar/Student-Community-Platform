import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, ExternalLink, UserPlus, MessageCircle, Github, GraduationCap, Loader2, Camera, X, AlertCircle, Sparkles, Globe, Link2, Twitter, LayoutGrid, Code2, User as UserIcon, Check, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getMyProfile, getUserProfile, followUser, unfollowUser, getUserPosts, updateMyProfile, getUserFollowers, getUserFollowing } from "../services/api.js";
import PostCard from "../components/PostCard";

function normalizeExternalUrl(value) {
    const trimmedValue = value?.trim() || "";

    if (!trimmedValue) {
        return "";
    }

    return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
}

function buildCoverStyle(coverPhoto) {
    if (coverPhoto) {
        return {
            backgroundImage: `linear-gradient(135deg, rgba(6,13,31,0.28) 0%, rgba(30,27,75,0.12) 45%, rgba(8,145,178,0.16) 100%), url(${coverPhoto})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
        };
    }

    return {
        background: "linear-gradient(135deg, #060d1f 0%, #1e1b4b 25%, #4338ca 55%, #0891b2 80%, #06b6d4 100%)"
    };
}

function readImageFile(file, { maxDimension = 1600, quality = 0.82 } = {}) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type?.startsWith("image/")) {
            reject(new Error("Please select a valid image file."));
            return;
        }

        const fileReader = new FileReader();

        fileReader.onerror = () => reject(new Error("Unable to read image file."));
        fileReader.onload = () => {
            const image = new Image();

            image.onerror = () => reject(new Error("Unable to process image file."));
            image.onload = () => {
                let { width, height } = image;

                if (width > maxDimension || height > maxDimension) {
                    const scale = Math.min(maxDimension / width, maxDimension / height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                if (!context) {
                    reject(new Error("Unable to prepare image upload."));
                    return;
                }

                context.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };

            image.src = String(fileReader.result);
        };

        fileReader.readAsDataURL(file);
    });
}

function AnimatedCounter({ value, duration = 900 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const end = Number(value) || 0;
        if (end === 0) { setCount(0); return; }
        let frame = 0;
        const steps = 40;
        const timer = setInterval(() => {
            frame++;
            setCount(Math.round((frame / steps) * end));
            if (frame >= steps) clearInterval(timer);
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value, duration]); // eslint-disable-line
    return <>{count.toLocaleString()}</>;
}

export default function Profile() {
    const { username: paramUsername } = useParams();
    const { user: authUser, token, updateUser } = useAuth();
    const username = paramUsername || authUser?.username;
    const isOwn = !paramUsername || paramUsername === authUser?.username;

    const avatarInputRef = useRef(null);
    const pageCoverInputRef = useRef(null);
    const modalCoverInputRef = useRef(null);
    const statusTimeoutRef = useRef(null);
    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followRequestStatus, setFollowRequestStatus] = useState("none");
    const [activeTab, setActiveTab] = useState("Posts");
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", username: "", headline: "", bio: "", college: "", skills: "", profilePhoto: "", coverPhoto: "", github: "", linkedin: "", twitter: "", portfolio: "" });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [photoPreview, setPhotoPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [coverSaving, setCoverSaving] = useState(false);
    const [connectionsModal, setConnectionsModal] = useState(null); // "followers" | "following" | null
    const [connectionsList, setConnectionsList] = useState([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);

    const openConnectionsModal = async (type) => {
        if (!profileData?.username || connectionsLoading) return;
        setConnectionsModal(type);
        setConnectionsList([]);
        setConnectionsLoading(true);
        try {
            const data = type === "followers"
                ? await getUserFollowers(profileData.username, token)
                : await getUserFollowing(profileData.username, token);
            setConnectionsList(Array.isArray(data) ? data : (data?.users ?? []));
        } catch {
            setConnectionsList([]);
        } finally {
            setConnectionsLoading(false);
        }
    };

    const showStatusMessage = (message) => {
        setStatusMessage(message);
        window.clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = window.setTimeout(() => setStatusMessage(""), 2600);
    };

    useEffect(() => () => {
        window.clearTimeout(statusTimeoutRef.current);
    }, []);

    const buildFallbackProfile = () => {
        if (!authUser?._id) {
            return null;
        }

        return {
            ...authUser,
            stats: {
                followers: Array.isArray(authUser.followers) ? authUser.followers.length : 0,
                following: Array.isArray(authUser.following) ? authUser.following.length : 0,
            },
            coverPhoto: authUser.coverPhoto || "",
            socialLinks: authUser.socialLinks || {},
            isFollowing: false,
        };
    };

    const syncProfileState = (updates) => {
        setProfileData((currentProfile) => (currentProfile ? { ...currentProfile, ...updates } : currentProfile));

        if (isOwn) {
            updateUser({ ...(authUser || {}), ...updates });
        }
    };

    useEffect(() => {
        if (!username || !token) return;
        setLoading(true);
        setLoadError("");

        const loadProfile = async () => {
            let nextProfile = null;

            try {
                nextProfile = isOwn ? await getMyProfile(token) : await getUserProfile(username, token);
            } catch (primaryError) {
                if (isOwn && authUser?.username) {
                    try {
                        nextProfile = await getUserProfile(authUser.username, token);
                    } catch {
                        nextProfile = buildFallbackProfile();
                    }
                }

                if (!nextProfile) {
                    setLoadError(primaryError?.message || "Unable to load profile right now.");
                    setProfileData(null);
                    setPosts([]);
                    return;
                }

                setLoadError("Showing saved profile data while live profile details sync.");
            }

            setProfileData(nextProfile);
            setIsFollowing(nextProfile.isFollowing ?? false);
            setFollowRequestStatus(nextProfile.followRequestStatus || (nextProfile.isFollowing ? "following" : "none"));

            if (!nextProfile?._id) {
                setPosts([]);
                return;
            }

            try {
                const userPosts = await getUserPosts(nextProfile._id, token);
                setPosts(Array.isArray(userPosts) ? userPosts : []);
            } catch {
                setPosts([]);
            }
        };

        loadProfile().finally(() => setLoading(false));
    }, [isOwn, username, token]); // eslint-disable-line

    const handleFollow = async () => {
        if (!profileData || followLoading) return;
        setFollowLoading(true);
        try {
            let updatedProfile;
            if (isFollowing || followRequestStatus === "requested") {
                updatedProfile = await unfollowUser(profileData.username, token);
            } else {
                updatedProfile = await followUser(profileData.username, token);
            }

            setProfileData(updatedProfile);
            setIsFollowing(Boolean(updatedProfile?.isFollowing));
            setFollowRequestStatus(updatedProfile?.followRequestStatus || (updatedProfile?.isFollowing ? "following" : "none"));
        } catch {
            // keep current state on error
        } finally {
            setFollowLoading(false);
        }
    };

    const handlePostUpdate = (updatedPost) => {
        setPosts((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
    };

    const handlePostDelete = (postId) => {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    const handleEditOpen = () => {
        setEditForm({
            name: profileData?.name || "",
            username: profileData?.username || "",
            headline: profileData?.headline || "",
            bio: profileData?.bio || "",
            college: profileData?.college || "",
            skills: (profileData?.skills || []).join(", "),
            profilePhoto: profileData?.profilePhoto || "",
            coverPhoto: profileData?.coverPhoto || "",
            github: profileData?.socialLinks?.github || "",
            linkedin: profileData?.socialLinks?.linkedin || "",
            twitter: profileData?.socialLinks?.twitter || "",
            portfolio: profileData?.socialLinks?.portfolio || "",
        });
        setPhotoPreview(profileData?.profilePhoto || null);
        setCoverPreview(profileData?.coverPhoto || null);
        setEditError("");
        setEditOpen(true);
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const imageDataUrl = await readImageFile(file, { maxDimension: 720, quality: 0.82 });
            setPhotoPreview(imageDataUrl);
            setEditForm((currentForm) => ({ ...currentForm, profilePhoto: imageDataUrl }));
        } catch (error) {
            setEditError(error.message || "Unable to update profile photo.");
        } finally {
            e.target.value = "";
        }
    };

    const handleCoverPhotoChange = async (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const imageDataUrl = await readImageFile(file, { maxDimension: 1800, quality: 0.82 });
            setCoverPreview(imageDataUrl);
            setEditForm((currentForm) => ({ ...currentForm, coverPhoto: imageDataUrl }));
        } catch (error) {
            setEditError(error.message || "Unable to update cover photo.");
        } finally {
            e.target.value = "";
        }
    };

    const handleQuickCoverUpdate = async (e) => {
        const file = e.target.files?.[0];

        if (!file || !isOwn || !token || coverSaving) {
            return;
        }

        const previousCoverPhoto = profileData?.coverPhoto || "";

        setCoverSaving(true);

        try {
            const imageDataUrl = await readImageFile(file, { maxDimension: 1800, quality: 0.82 });
            syncProfileState({ coverPhoto: imageDataUrl });

            const updatedProfile = await updateMyProfile({ coverPhoto: imageDataUrl }, token);
            syncProfileState(updatedProfile);
            showStatusMessage("Cover photo updated.");
        } catch (error) {
            syncProfileState({ coverPhoto: previousCoverPhoto });
            setEditError(error?.message || "Unable to update cover photo right now.");
        } finally {
            setCoverSaving(false);
            e.target.value = "";
        }
    };

    const handleSaveProfile = async () => {
        if (editSaving) return;
        setEditError("");
        setEditSaving(true);
        try {
            const payload = {
                name: editForm.name.trim(),
                username: editForm.username.trim(),
                headline: editForm.headline.trim(),
                bio: editForm.bio.trim(),
                college: editForm.college.trim(),
                skills: editForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
                profilePhoto: editForm.profilePhoto,
                coverPhoto: editForm.coverPhoto,
                socialLinks: {
                    github: normalizeExternalUrl(editForm.github),
                    linkedin: normalizeExternalUrl(editForm.linkedin),
                    twitter: normalizeExternalUrl(editForm.twitter),
                    portfolio: normalizeExternalUrl(editForm.portfolio),
                }
            };
            const updated = await updateMyProfile(payload, token);
            syncProfileState(updated);
            setEditOpen(false);
            showStatusMessage("Profile updated.");
        } catch (err) {
            setEditError(err?.message || "Failed to save. Please try again.");
        } finally {
            setEditSaving(false);
        }
    };

    const openSocialLink = (url) => {
        if (!url) {
            if (isOwn) {
                handleEditOpen();
            }

            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary-light)" }} />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="text-center py-24">
                <p className="text-[15px] font-semibold" style={{ color: "var(--text-sub)" }}>
                    {loadError || "User not found"}
                </p>
            </div>
        );
    }

    const avatarUrl = profileData.profilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || "U")}&background=0a66c2&color=fff&bold=true&size=200`;
    const coverStyle = buildCoverStyle(profileData.coverPhoto);
    const joinedDate = profileData.createdAt
        ? new Date(profileData.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "";

    return (
        <div>
            {loadError ? (
                <div className="mb-4 rounded-2xl px-4 py-3 text-[14px]" style={{ background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.18)", color: "var(--primary-dark)" }}>
                    {loadError}
                </div>
            ) : null}
            {statusMessage ? (
                <div className="mb-4 rounded-xl px-4 py-3 text-[14px] font-medium flex items-center gap-2" style={{ background: "var(--success-bg)", border: "1px solid rgba(5,118,66,0.22)", color: "var(--success)" }}>
                    <Check size={14} />{statusMessage}
                </div>
            ) : null}
            {/* ═══ HERO CARD ═══ */}
            <div className="rounded-2xl overflow-hidden relative" style={{ border: "1px solid var(--border)", background: "var(--card-bg)" }}>
                {/* Cover */}
                <div className="h-52 sm:h-64 relative overflow-hidden" style={coverStyle}>
                    <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none" style={{ background: "linear-gradient(to top, var(--card-bg), transparent)" }} />
                    {isOwn && (
                        <button type="button" onClick={() => pageCoverInputRef.current?.click()} className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all duration-200 opacity-60 hover:opacity-100"
                            style={{ background: "rgba(0,0,0,0.60)", color: "white", border: "1px solid rgba(255,255,255,0.18)" }}>
                            <Camera size={10} /> {coverSaving ? "Updating..." : "Change Cover"}
                        </button>
                    )}
                    <input ref={pageCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleQuickCoverUpdate} />
                </div>

                {/* Below cover */}
                <div className="px-5 sm:px-6 pb-5">
                    {/* Avatar + action row */}
                    <div className="flex items-end justify-between -mt-16 mb-3.5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <img
                                src={avatarUrl}
                                className="relative w-[108px] h-[108px] sm:w-28 sm:h-28 rounded-full object-cover"
                                style={{ boxShadow: "0 0 0 3px var(--primary), 0 0 0 5px var(--card-bg), 0 8px 32px rgba(0,0,0,0.55)", zIndex: 2 }}
                                alt={profileData.name}
                            />
                            {/* Online dot */}
                            <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2" style={{ background: "var(--success)", borderColor: "var(--card-bg)", zIndex: 3 }} />
                            {isOwn && (
                                <button
                                    onClick={handleEditOpen}
                                    className="absolute rounded-full flex items-center justify-center transition-all duration-200"
                                    style={{ inset: 0, background: "rgba(0,0,0,0)", color: "transparent", zIndex: 4 }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.55)"; e.currentTarget.style.color = "white"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0)"; e.currentTarget.style.color = "transparent"; }}
                                >
                                    <Camera size={20} />
                                </button>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2 pb-1">
                            {isOwn ? (
                                <button
                                    onClick={handleEditOpen}
                                    className="px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200"
                                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <Link to={`/messages?user=${profileData._id}`}>
                                        <button
                                            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                                            style={{ background: "var(--surface-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                                        >
                                            <MessageCircle size={15} />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-bold transition-all duration-200"
                                        style={
                                            isFollowing
                                                ? { background: "var(--surface-hover)", border: "1px solid var(--border)", color: "var(--text-main)", opacity: followLoading ? 0.6 : 1 }
                                                : { background: "var(--primary)", color: "white", boxShadow: "0 4px 12px rgba(10,102,194,0.35)", opacity: followLoading ? 0.6 : 1 }
                                        }
                                    >
                                        <UserPlus size={13} />
                                        {followLoading ? "..." : isFollowing ? "Following" : followRequestStatus === "requested" ? "Requested" : "Follow"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Name + bio */}
                    <div className="mb-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="profile-name-gradient">{profileData.name}</span>
                            {profileData.role === "admin" && (
                                <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(10,102,194,0.10)", color: "var(--primary)", border: "1px solid rgba(10,102,194,0.2)" }}>Admin</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>@{profileData.username}</span>
                            {profileData.college && (
                                <>
                                    <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>·</span>
                                    <span className="flex items-center gap-1 text-[13px]" style={{ color: "var(--text-sub)" }}>
                                        <GraduationCap size={12} style={{ opacity: 0.7 }} />
                                        {profileData.college}
                                    </span>
                                </>
                            )}
                            {joinedDate && (
                                <>
                                    <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>·</span>
                                    <span className="flex items-center gap-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
                                        <Calendar size={12} style={{ opacity: 0.7 }} />
                                        {joinedDate}
                                    </span>
                                </>
                            )}
                        </div>

                        {profileData.headline && (
                            <p className="mt-2 text-[14px] font-semibold" style={{ color: "var(--primary)" }}>
                                {profileData.headline}
                            </p>
                        )}

                        {profileData.bio && (
                            <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--text-main)", maxWidth: "520px" }}>
                                {profileData.bio}
                            </p>
                        )}
                    </div>

                    <div className="flex items-stretch rounded-2xl overflow-hidden mt-4 mb-4" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                        {[
                            { label: "Posts", value: posts.length, onClick: null },
                            { label: "Followers", value: profileData.stats?.followers ?? 0, onClick: () => openConnectionsModal("followers") },
                            { label: "Following", value: profileData.stats?.following ?? 0, onClick: () => openConnectionsModal("following") },
                        ].map((s, i) => (
                            <div
                                key={s.label}
                                className="flex-1 flex flex-col items-center py-4 transition-colors duration-150"
                                style={{
                                    ...(i > 0 ? { borderLeft: "1px solid var(--border)" } : {}),
                                    cursor: s.onClick ? "pointer" : "default",
                                }}
                                onClick={s.onClick || undefined}
                                onMouseEnter={(e) => { if (s.onClick) e.currentTarget.style.background = "var(--surface-hover)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                                <span className="text-[24px] font-black leading-none display-title">
                                    <AnimatedCounter value={s.value} />
                                </span>
                                <span className="text-[12px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: "var(--text-sub)" }}>
                                    {s.label}
                                    {s.onClick && <Users size={10} style={{ opacity: 0.5 }} />}
                                </span>
                            </div>
                        ))}
                    </div>

                    {profileData.skills?.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                            {profileData.skills.map((s) => <span key={s} className="tag shrink-0">{s}</span>)}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ STICKY TAB BAR ═══ */}
            < div className="sticky top-0 z-20 mt-3" style={{ background: "var(--bg-base)" }}>
                <div className="flex relative" style={{ borderBottom: "1.5px solid var(--border)" }}>
                    {[
                        { id: "Posts", icon: <LayoutGrid size={15} /> },
                        { id: "About", icon: <UserIcon size={15} /> },
                    ].map(({ id, icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className="relative flex-1 py-3 flex flex-col items-center gap-1.5 transition-colors duration-200"
                            style={{ color: activeTab === id ? "var(--primary)" : "var(--text-muted)" }}
                        >
                            <span style={{ opacity: activeTab === id ? 1 : 0.55, transform: activeTab === id ? "scale(1.12)" : "scale(1)", transition: "all 0.2s" }}>{icon}</span>
                            <span className="text-[12px] font-semibold leading-none">
                                {id}
                                {id === "Posts" && posts.length > 0 && (
                                    <span className="ml-1 text-[12px] px-1 py-0.5 rounded-full align-middle" style={{ background: "var(--primary-subtle)", color: "var(--primary)" }}>{posts.length}</span>
                                )}
                            </span>
                            {activeTab === id && (
                                <motion.div
                                    layoutId="tab-underline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                    style={{ background: "var(--primary)" }}
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div >

            {/* ═══ TAB CONTENT ═══ */}
            < AnimatePresence mode="wait" >
                {activeTab === "Posts" && (
                    <motion.div key="posts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="mt-4 space-y-4">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center py-16 rounded-2xl" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: "var(--primary-subtle)", border: "1px solid rgba(10,102,194,0.15)" }}>✍️</div>
                                <p className="text-[15px] font-bold mb-1">No posts yet</p>
                                <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
                                    {isOwn ? "Share your first thought with the community!" : "This user hasn't posted yet."}
                                </p>
                            </div>
                        ) : (
                            posts.map((post) => <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />)
                        )}
                    </motion.div>
                )}

                {
                    activeTab === "About" && (
                        <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="mt-4 space-y-3">

                            {/* Profile Completeness — own profile only */}
                            {isOwn && (() => {
                                const fields = [!!profileData.name, !!profileData.headline, !!profileData.bio, !!profileData.college, (profileData.skills?.length > 0), !!profileData.profilePhoto, posts.length > 0];
                                const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);
                                return (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl p-4" style={{ background: "var(--primary-subtle)", border: "1px solid rgba(10,102,194,0.15)" }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[14px] font-bold flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
                                                <Sparkles size={12} style={{ color: "var(--primary)" }} /> Profile Strength
                                            </p>
                                            <span className="text-[14px] font-black" style={{ color: pct === 100 ? "#057642" : "var(--primary)" }}>{pct}%</span>
                                        </div>
                                        <div className="rounded-full overflow-hidden h-1.5 mb-2" style={{ background: "var(--border)" }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} className="h-full rounded-full" style={{ background: pct === 100 ? "#057642" : "var(--primary)" }} />
                                        </div>
                                        {pct < 100 && (
                                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                                                {!profileData.headline && "Add a headline · "}
                                                {!profileData.bio && "Add a bio · "}
                                                {!profileData.college && "Add college · "}
                                                {!profileData.profilePhoto && "Upload a photo · "}
                                                {!(profileData.skills?.length > 0) && "Add skills"}
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })()}

                            {/* Bio */}
                            {(profileData.headline || profileData.bio) && (
                                <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                                    <p className="text-[12px] font-bold uppercase tracking-wide mb-2.5" style={{ color: "var(--text-sub)" }}>About</p>
                                    {profileData.headline && (
                                        <p className="text-[14px] font-semibold mb-2" style={{ color: "var(--primary)" }}>
                                            {profileData.headline}
                                        </p>
                                    )}
                                    {profileData.bio && (
                                        <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-main)", borderLeft: "3px solid var(--primary)", paddingLeft: "12px" }}>{profileData.bio}</p>
                                    )}
                                </div>
                            )}

                            {/* Social Links */}
                            <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                                <p className="text-[12px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: "var(--text-sub)" }}>
                                    <Link2 size={11} /> Connect
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: "GitHub", icon: <Github size={12} />, color: "var(--text-main)", bg: "var(--surface-soft)", border: "var(--border)", value: profileData.socialLinks?.github },
                                        { label: "LinkedIn", icon: <Globe size={12} />, color: "#0ea5e9", bg: "rgba(14,165,233,0.10)", border: "rgba(14,165,233,0.25)", value: profileData.socialLinks?.linkedin },
                                        { label: "Twitter", icon: <Twitter size={12} />, color: "#38bdf8", bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.25)", value: profileData.socialLinks?.twitter },
                                        { label: "Portfolio", icon: <ExternalLink size={12} />, color: "var(--primary)", bg: "var(--primary-subtle)", border: "rgba(10,102,194,0.25)", value: profileData.socialLinks?.portfolio },
                                    ].filter((link) => link.value || isOwn).map((link) => (
                                        <motion.button key={link.label} whileHover={{ scale: 1.05, y: -1 }} transition={{ duration: 0.15 }}
                                            type="button"
                                            onClick={() => openSocialLink(link.value)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold"
                                            style={{ color: link.color, background: link.bg, border: `1px solid ${link.border}`, opacity: link.value ? 1 : 0.78 }}>
                                            {link.icon} {link.value ? link.label : `Add ${link.label}`}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Education timeline */}
                            {profileData.college ? (
                                <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                                    <p className="text-[12px] font-bold uppercase tracking-wide mb-4 flex items-center gap-1.5" style={{ color: "var(--text-sub)" }}>
                                        <GraduationCap size={11} /> Education
                                    </p>
                                    <div className="relative pl-5" style={{ borderLeft: "2px solid rgba(10,102,194,0.3)" }}>
                                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full" style={{ background: "var(--primary)", boxShadow: "0 0 8px rgba(10,102,194,0.5)" }} />
                                        <p className="text-[14px] font-bold">{profileData.college}</p>
                                        {joinedDate && <p className="text-[12px] mt-1" style={{ color: "var(--text-faint, #334155)" }}>Member since {joinedDate}</p>}
                                    </div>
                                </div>
                            ) : null}

                            {/* Skills */}
                            {profileData.skills?.length > 0 && (
                                <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                                    <p className="text-[12px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: "var(--text-sub)" }}>
                                        <Code2 size={11} style={{ color: "var(--primary)" }} /> Skills
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.skills.map((s, i) => (
                                            <motion.span key={s}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.04 * i, duration: 0.25 }}
                                                className="tag"
                                            >{s}</motion.span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick details */}
                            <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                                <p className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-sub)" }}>Details</p>
                                <div className="space-y-2.5">
                                    {[
                                        { label: "Username", value: `@${profileData.username}` },
                                        profileData.college && { label: "College", value: profileData.college },
                                        joinedDate && { label: "Joined", value: joinedDate },
                                        { label: "Posts", value: posts.length },
                                        { label: "Followers", value: (profileData.stats?.followers ?? 0).toLocaleString() },
                                    ].filter(Boolean).map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between text-[14px]">
                                            <span style={{ color: "var(--text-muted)" }}>{label}</span>
                                            <span className="font-semibold" style={{ color: "var(--text-main)" }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Edit Profile Modal — portalled to body to escape transform stacking context */}
            {
                editOpen && createPortal(
                    <AnimatePresence>
                        {editOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-40"
                                    style={{ background: "rgba(0,0,0,0.80)" }}
                                    onClick={() => !editSaving && setEditOpen(false)}
                                />
                                {/* Centering wrapper — flex so framer-motion y-animation doesn't break centering */}
                                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 pointer-events-none">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                        className="w-full max-w-md rounded-2xl overflow-hidden pointer-events-auto"
                                        style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
                                    >
                                        {/* Cover banner + avatar */}
                                        <div className="relative">
                                            <div
                                                className="h-24 w-full"
                                                style={buildCoverStyle(coverPreview || editForm.coverPhoto)}
                                            />
                                            {/* Close button on cover */}
                                            <button
                                                onClick={() => !editSaving && setEditOpen(false)}
                                                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                                                style={{ background: "rgba(0,0,0,0.35)", color: "white" }}
                                            >
                                                <X size={15} />
                                            </button>
                                            {/* Avatar overlapping cover */}
                                            <div className="absolute -bottom-10 left-5">
                                                <div className="relative group/editphoto">
                                                    <img
                                                        src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name || "U")}&background=0a66c2&color=fff&bold=true&size=200`}
                                                        className="w-20 h-20 rounded-2xl object-cover"
                                                        style={{ boxShadow: "0 0 0 4px var(--surface-elevated), 0 0 0 6px rgba(10,102,194,0.25)" }}
                                                        alt="Profile"
                                                    />
                                                    <button
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        className="absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity"
                                                        style={{ background: "rgba(0,0,0,0.55)", opacity: 0 }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                                    >
                                                        <Camera size={18} style={{ color: "white" }} />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Change photo button top-right of avatar zone */}
                                            <div className="absolute -bottom-8 left-28">
                                                <button
                                                    onClick={() => avatarInputRef.current?.click()}
                                                    className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                                                    style={{ color: "var(--primary)", background: "var(--primary-subtle)", border: "1px solid rgba(10,102,194,0.2)" }}
                                                >
                                                    <Camera size={11} /> Change Photo
                                                </button>
                                            </div>
                                            <div className="absolute top-3 left-5">
                                                <button
                                                    type="button"
                                                    onClick={() => modalCoverInputRef.current?.click()}
                                                    className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                                                    style={{ color: "white", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.18)" }}
                                                >
                                                    <Camera size={11} /> Change Cover
                                                </button>
                                            </div>
                                            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                            <input ref={modalCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPhotoChange} />
                                        </div>

                                        {/* Title row */}
                                        <div className="mt-14 px-5 pb-2">
                                            <h3 className="text-[16px] font-black display-title">Edit Profile</h3>
                                            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>Changes are saved to your account instantly.</p>
                                        </div>

                                        {/* Form fields */}
                                        <div className="px-5 pt-3 pb-4 space-y-3.5 overflow-y-auto" style={{ maxHeight: "48vh" }}>
                                            {/* Name + Username side by side */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label>
                                                    <input
                                                        className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                                        placeholder="Your name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Username</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] select-none" style={{ color: "var(--text-muted)" }}>@</span>
                                                        <input
                                                            className="w-full rounded-xl pl-6 pr-3 py-2.5 text-[14px] outline-none transition-all"
                                                            style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                            value={editForm.username}
                                                            onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                                                            placeholder="handle"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Headline</label>
                                                <input
                                                    className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                    value={editForm.headline}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, headline: e.target.value }))}
                                                    placeholder="e.g. Full-stack developer and community builder"
                                                />
                                            </div>

                                            {/* Bio */}
                                            <div>
                                                <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Bio</label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none resize-none transition-all"
                                                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                    value={editForm.bio}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                                                    placeholder="Tell others about yourself..."
                                                />
                                            </div>

                                            {/* College */}
                                            <div>
                                                <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>College / University</label>
                                                <input
                                                    className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                    value={editForm.college}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, college: e.target.value }))}
                                                    placeholder="e.g. IIT Delhi, NIT Surathkal..."
                                                />
                                            </div>

                                            {/* Skills */}
                                            <div>
                                                <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                                                    Skills <span className="font-normal normal-case opacity-50">— comma separated</span>
                                                </label>
                                                <input
                                                    className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                    onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                    value={editForm.skills}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))}
                                                    placeholder="React, Node.js, Python..."
                                                />
                                                {editForm.skills.trim() && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {editForm.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                                                            <span key={s} className="tag">{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>GitHub</label>
                                                    <input
                                                        className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                        value={editForm.github}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, github: e.target.value }))}
                                                        placeholder="github.com/username"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>LinkedIn</label>
                                                    <input
                                                        className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                        value={editForm.linkedin}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, linkedin: e.target.value }))}
                                                        placeholder="linkedin.com/in/username"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Twitter</label>
                                                    <input
                                                        className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                        value={editForm.twitter}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, twitter: e.target.value }))}
                                                        placeholder="x.com/username"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Portfolio</label>
                                                    <input
                                                        className="w-full rounded-xl px-3 py-2.5 text-[14px] outline-none transition-all"
                                                        style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-main)" }}
                                                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                                                        value={editForm.portfolio}
                                                        onChange={(e) => setEditForm((f) => ({ ...f, portfolio: e.target.value }))}
                                                        placeholder="yourportfolio.com"
                                                    />
                                                </div>
                                            </div>

                                            {/* Error */}
                                            {editError && (
                                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[14px]"
                                                    style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185" }}>
                                                    <AlertCircle size={13} /> {editError}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
                                            <button
                                                onClick={() => !editSaving && setEditOpen(false)}
                                                className="px-4 py-2 rounded-xl text-[14px] font-semibold transition-colors"
                                                style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}
                                                disabled={editSaving}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={editSaving || !editForm.name.trim()}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200"
                                                style={
                                                    editSaving || !editForm.name.trim()
                                                        ? { background: "var(--primary-subtle)", color: "var(--text-muted)", cursor: "not-allowed" }
                                                        : { background: "var(--primary)", color: "white", boxShadow: "0 4px 12px rgba(10,102,194,0.35)" }
                                                }
                                            >
                                                {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                                {editSaving ? "Saving..." : "Save Changes"}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                    , document.body)
            }

            {/* ═══ CONNECTIONS MODAL (Followers / Following) ═══ */}
            {connectionsModal && createPortal(
                <AnimatePresence>
                    {connectionsModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40"
                                style={{ background: "rgba(0,0,0,0.70)" }}
                                onClick={() => setConnectionsModal(null)}
                            />
                            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full max-w-sm rounded-2xl overflow-hidden pointer-events-auto"
                                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: "70vh", display: "flex", flexDirection: "column" }}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
                                        <h3 className="text-[16px] font-bold display-title flex items-center gap-2">
                                            <Users size={16} style={{ color: "var(--primary)" }} />
                                            {connectionsModal === "followers" ? "Followers" : "Following"}
                                        </h3>
                                        <button
                                            onClick={() => setConnectionsModal(null)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                                            style={{ color: "var(--text-muted)" }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                                        {connectionsLoading ? (
                                            Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                                                    <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "var(--surface-soft)" }} />
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="h-3 rounded-full w-2/3" style={{ background: "var(--surface-soft)" }} />
                                                        <div className="h-2.5 rounded-full w-1/2" style={{ background: "var(--surface-soft)" }} />
                                                    </div>
                                                </div>
                                            ))
                                        ) : connectionsList.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Users size={32} className="mx-auto mb-3 opacity-20" />
                                                <p className="text-[14px] font-semibold" style={{ color: "var(--text-sub)" }}>No {connectionsModal} yet</p>
                                            </div>
                                        ) : (
                                            connectionsList.map((u) => {
                                                const avatar = u.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=0a66c2&color=fff&bold=true&size=64`;
                                                return (
                                                    <Link
                                                        key={u._id}
                                                        to={`/profile/${u.username}`}
                                                        onClick={() => setConnectionsModal(null)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                                        style={{ textDecoration: "none" }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        <img src={avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt={u.name} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-main)" }}>{u.name}</p>
                                                            <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                                                                {u.headline || `@${u.username}`}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>
                , document.body)
            }
        </div >
    );
}
