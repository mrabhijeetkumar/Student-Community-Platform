import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { useEffect, useState } from "react";
import Notification from "../components/Notification";
import PageTransition from "../components/ui/PageTransition";
import LoadingCard from "../components/ui/LoadingCard";
import { useAuth } from "../context/AuthContext.jsx";
import { getAdminDashboard, getMyDashboard } from "../services/api";

function StatCard({ label, value, accent }) {
    return (
        <div className="stat-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
            <p className={`mt-3 text-3xl font-extrabold ${accent}`}>{value}</p>
        </div>
    );
}

export default function Dashboard() {
    const { token, user } = useAuth();
    const [userDashboard, setUserDashboard] = useState(null);
    const [adminDashboard, setAdminDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            setLoading(true);
            try {
                const [userData, adminData] = await Promise.all([
                    getMyDashboard(token),
                    user?.role === "admin" ? getAdminDashboard(token) : Promise.resolve(null)
                ]);

                if (!isMounted) {
                    return;
                }

                setUserDashboard(userData);
                setAdminDashboard(adminData);
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

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, [token, user?.role]);

    if (loading) {
        return (
            <div className="space-y-5">
                <LoadingCard lines={4} />
                <LoadingCard lines={6} />
            </div>
        );
    }

    return (
        <PageTransition className="space-y-6">
            <div className="card-surface overflow-hidden p-6">
                <div className="floating-orb right-8 top-8 h-24 w-24 bg-accent-400/10" />
                <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] xl:items-end">
                    <div>
                        <p className="section-title">Dashboard</p>
                        <h2 className="display-title mt-2 text-balance text-3xl font-bold text-white sm:text-[2.35rem]">Track your activity and platform health.</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">User analytics surface your posting and network growth. Admin analytics add ecosystem-wide engagement trends and platform visibility.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="card-subtle px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">View</p>
                            <p className="display-title mt-2 text-lg font-bold text-white">Operational snapshot</p>
                            <p className="mt-1 text-sm text-slate-400">Key metrics, movement, and recent events in one place.</p>
                        </div>
                        <div className="card-subtle px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Role</p>
                            <p className="display-title mt-2 text-lg font-bold text-white">{user?.role === "admin" ? "Admin control" : "Member analytics"}</p>
                            <p className="mt-1 text-sm text-slate-400">{user?.role === "admin" ? "Oversee growth, engagement, and ecosystem signals." : "Monitor your publishing and network momentum."}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Notification tone="warning" message={feedback} />

            {userDashboard ? (
                <div className="card-surface p-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard label="Posts" value={userDashboard.stats.totalPosts} accent="text-brand-200" />
                        <StatCard label="Followers" value={userDashboard.stats.totalFollowers} accent="text-accent-300" />
                        <StatCard label="Following" value={userDashboard.stats.totalFollowing} accent="text-amber-300" />
                        <StatCard label="Saved" value={userDashboard.stats.totalSavedPosts} accent="text-emerald-300" />
                        <StatCard label="Communities" value={userDashboard.stats.joinedCommunities} accent="text-fuchsia-300" />
                    </div>
                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <div>
                            <p className="text-sm font-semibold text-white">Recent activity</p>
                            <div className="mt-4 space-y-3">
                                {userDashboard.recentActivity.length === 0 ? <p className="text-sm text-slate-400">No recent activity yet.</p> : null}
                                {userDashboard.recentActivity.map((activity) => (
                                    <div key={activity._id} className="card-subtle px-4 py-4">
                                        <p className="font-semibold text-white">{activity.title || activity.content || "Activity"}</p>
                                        <p className="mt-1 text-sm text-slate-400">{activity.message || activity.content || "No additional details"}</p>
                                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card-ghost p-4">
                            <p className="text-sm font-semibold text-white">Engagement trend</p>
                            <div className="mt-4 h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[
                                        { name: "Posts", value: userDashboard.stats.totalPosts },
                                        { name: "Followers", value: userDashboard.stats.totalFollowers },
                                        { name: "Following", value: userDashboard.stats.totalFollowing }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} dot={{ fill: "#6366f1" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {adminDashboard ? (
                <div className="card-surface p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="section-title">Admin analytics</p>
                            <h3 className="display-title mt-2 text-2xl font-bold text-white">Weekly growth and engagement</h3>
                        </div>
                        <p className="text-sm text-slate-400">Engagement rate: {adminDashboard.stats.engagementRate}</p>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard label="Users" value={adminDashboard.stats.totalUsers} accent="text-brand-200" />
                        <StatCard label="Verified" value={adminDashboard.stats.verifiedUsers} accent="text-emerald-300" />
                        <StatCard label="Posts" value={adminDashboard.stats.totalPosts} accent="text-accent-300" />
                        <StatCard label="Comments" value={adminDashboard.stats.totalComments} accent="text-amber-300" />
                        <StatCard label="Communities" value={adminDashboard.stats.totalCommunities} accent="text-fuchsia-300" />
                    </div>

                    <div className="mt-8 h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={adminDashboard.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip />
                                <Bar dataKey="users" fill="#6366f1" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="posts" fill="#38bdf8" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="comments" fill="#818cf8" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : null}
        </PageTransition>
    );
}
