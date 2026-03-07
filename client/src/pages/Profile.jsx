import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Notification from "../components/Notification";
import PostCard from "../components/PostCard";
import ProfileHeader from "../components/ProfileHeader";
import PageTransition from "../components/ui/PageTransition";
import LoadingCard from "../components/ui/LoadingCard";
import { useAuth } from "../context/AuthContext.jsx";
import {
    followUser,
    getCurrentUser,
    getUserPosts,
    getUserProfile,
    unfollowUser,
    updateCurrentUser
} from "../services/api";

export default function Profile() {
    const { username } = useParams();
    const { token, user, updateUser } = useAuth();
    const isOwnProfile = !username || username === user?.username;
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ name: "", headline: "", bio: "", college: "", profilePhoto: "", skills: "" });

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            setLoading(true);
            try {
                const profileData = isOwnProfile ? await getCurrentUser(token) : await getUserProfile(username, token);
                const postData = await getUserPosts(profileData._id, token);

                if (!isMounted) {
                    return;
                }

                setProfile(profileData);
                setPosts(postData);
                setForm({
                    name: profileData.name || "",
                    headline: profileData.headline || "",
                    bio: profileData.bio || "",
                    college: profileData.college || "",
                    profilePhoto: profileData.profilePhoto || "",
                    skills: (profileData.skills || []).join(", ")
                });
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

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [isOwnProfile, token, username]);

    const handleFormChange = (field) => (event) => {
        setForm((currentState) => ({ ...currentState, [field]: event.target.value }));
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const updatedProfile = await updateCurrentUser({
                ...form,
                skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
            }, token);
            setProfile(updatedProfile);
            updateUser(updatedProfile);
            setFeedback("Profile updated successfully.");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!profile) {
            return;
        }

        try {
            const updatedProfile = profile.isFollowing
                ? await unfollowUser(profile.username, token)
                : await followUser(profile.username, token);
            setProfile(updatedProfile);
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts((currentPosts) => currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    };

    const handlePostDeleted = (postId) => {
        setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    };

    if (loading) {
        return (
            <div className="space-y-5">
                <LoadingCard lines={5} />
                <LoadingCard lines={4} />
            </div>
        );
    }

    if (!profile) {
        return <Notification tone="warning" message={feedback || "Profile not found."} />;
    }

    return (
        <PageTransition className="space-y-6">
            <ProfileHeader
                profile={profile}
                postsCount={posts.length}
                isOwnProfile={isOwnProfile}
                onFollowToggle={handleFollowToggle}
                onEditClick={() => setEditOpen((currentState) => !currentState)}
                isSaving={saving}
            />

            <Notification tone={feedback.includes("successfully") ? "success" : "warning"} message={feedback} />

            {isOwnProfile && editOpen ? (
                <form onSubmit={handleSaveProfile} className="card-surface p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="section-title">Edit profile</p>
                            <h3 className="mt-2 text-xl font-bold text-white">Keep your public student identity current.</h3>
                            <p className="mt-2 text-sm text-slate-400">Update your banner details, public bio, and skills shown across the network.</p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <input className="input-control" placeholder="Full name" value={form.name} onChange={handleFormChange("name")} />
                        <input className="input-control" placeholder="Headline" value={form.headline} onChange={handleFormChange("headline")} />
                        <input className="input-control" placeholder="College" value={form.college} onChange={handleFormChange("college")} />
                        <input className="input-control" placeholder="Profile photo URL" value={form.profilePhoto} onChange={handleFormChange("profilePhoto")} />
                        <textarea className="input-control md:col-span-2" rows="4" placeholder="Bio" value={form.bio} onChange={handleFormChange("bio")} />
                        <input className="input-control md:col-span-2" placeholder="Skills separated by commas" value={form.skills} onChange={handleFormChange("skills")} />
                    </div>
                    <div className="mt-5 flex gap-3">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save profile"}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>
                            Close
                        </button>
                    </div>
                </form>
            ) : null}

            <div className="card-surface p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="section-title">Profile feed</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Recent posts by {isOwnProfile ? "you" : profile.name}</h2>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                        {profile.stats?.followers || 0} followers following this profile
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {posts.map((post) => (
                    <PostCard key={post._id} post={post} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
                ))}
                {posts.length === 0 ? <div className="card-surface p-6 text-sm text-slate-400">No posts published yet.</div> : null}
            </div>
        </PageTransition>
    );
}
