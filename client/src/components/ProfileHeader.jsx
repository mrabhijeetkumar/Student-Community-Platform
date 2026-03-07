import { PencilSquareIcon, UserPlusIcon, UserMinusIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

function getInitials(name) {
    return (name || "Student")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function ProfileHeader({ profile, postsCount, isOwnProfile, onFollowToggle, onEditClick, isSaving }) {
    const descriptor = profile.headline || profile.college || "Campus member";

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card-surface overflow-hidden p-0"
        >
            <div className="relative h-48 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-400">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.28),transparent_30%)]" />
            </div>
            <div className="px-6 pb-6">
                <div className="-mt-16 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
                    <div className="space-y-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-canvas-dark bg-slate-900 text-3xl font-bold text-white shadow-2xl">
                                {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name} className="h-full w-full object-cover" /> : getInitials(profile.name)}
                            </div>
                            <div>
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="pill-tag">Student profile</span>
                                    <span className="pill-tag">{descriptor}</span>
                                </div>
                                <h1 className="display-title text-3xl font-bold text-white">{profile.name}</h1>
                                <p className="mt-1 text-sm text-slate-300">@{profile.username} • {profile.college || "Campus member"}</p>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{profile.bio || profile.headline || "Building a visible student identity across projects, opportunities, and collaboration."}</p>
                            </div>
                        </div>

                        {profile.skills?.length ? (
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill) => (
                                    <span key={skill} className="pill-tag">{skill}</span>
                                ))}
                            </div>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="stat-tile text-center">
                                <p className="text-2xl font-bold text-white">{postsCount}</p>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Posts</p>
                            </div>
                            <div className="stat-tile text-center">
                                <p className="text-2xl font-bold text-white">{profile.stats?.followers || 0}</p>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Followers</p>
                            </div>
                            <div className="stat-tile text-center">
                                <p className="text-2xl font-bold text-white">{profile.stats?.following || 0}</p>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Following</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-ghost p-5 shadow-xl">
                        <p className="section-title">Profile actions</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">Keep this profile visible and current.</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Use this surface to shape how collaborators, recruiters, and peers experience your public identity.</p>
                        <div className="mt-5 flex flex-col gap-3">
                            {isOwnProfile ? (
                                <button type="button" className="btn-primary gap-2 justify-center" onClick={onEditClick} disabled={isSaving}>
                                    <PencilSquareIcon className="h-5 w-5" />
                                    {isSaving ? "Saving..." : "Edit profile"}
                                </button>
                            ) : (
                                <button type="button" className="btn-primary gap-2 justify-center" onClick={onFollowToggle}>
                                    {profile.isFollowing ? <UserMinusIcon className="h-5 w-5" /> : <UserPlusIcon className="h-5 w-5" />}
                                    {profile.isFollowing ? "Unfollow" : "Follow"}
                                </button>
                            )}
                            <div className="card-subtle px-4 py-4">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Identity signal</p>
                                <p className="mt-2 text-sm font-semibold text-white">{descriptor}</p>
                                <p className="mt-1 text-sm text-slate-400">Public positioning and trust cues are surfaced here before people scroll into posts.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
