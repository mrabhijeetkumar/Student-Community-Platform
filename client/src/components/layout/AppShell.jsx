import { AnimatePresence, motion } from "framer-motion";
import { ChartBarSquareIcon, InboxIcon, BellIcon, UserCircleIcon, UserGroupIcon, MagnifyingGlassIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useNotifications } from "../../context/useNotifications.js";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

const mobileNav = [
    { label: "Feed", to: "/dashboard", icon: ChartBarSquareIcon },
    { label: "Explore", to: "/explore", icon: MagnifyingGlassIcon },
    { label: "Inbox", to: "/messages", icon: InboxIcon },
    { label: "Alerts", to: "/notifications", icon: BellIcon },
    { label: "Groups", to: "/communities", icon: UserGroupIcon },
    { label: "Me", to: "/profile", icon: UserCircleIcon },
];

export default function AppShell() {
    const { user } = useAuth();
    const { unreadCount } = useNotifications();

    return (
        <div className="relative isolate flex h-dvh overflow-hidden" style={{ background: "var(--bg-base)" }}>
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div
                    className="absolute -left-24 -top-24 h-64 w-64 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(42,160,255,0.24) 0%, rgba(42,160,255,0) 70%)" }}
                />
                <div
                    className="absolute -right-20 top-24 h-72 w-72 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(255,138,0,0.2) 0%, rgba(255,138,0,0) 72%)" }}
                />
                <div
                    className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(20,115,230,0.16) 0%, rgba(20,115,230,0) 72%)" }}
                />
            </div>

            {/* Fixed left sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:flex-none lg:w-[246px] xl:w-[268px] h-dvh px-3 py-3">
                <Sidebar />
            </div>

            {/* Scrollable main content */}
            <main className="flex-1 flex flex-col min-w-0 h-dvh overflow-y-auto scrollbar-thin pb-28 lg:pb-6 pt-4 px-3 sm:px-4 lg:px-6">
                <div className="mx-auto w-full max-w-[1240px]">
                    <Navbar />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={user?._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="min-w-0 mt-2 pb-4"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile bottom nav */}
            <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden sm:inset-x-4 sm:bottom-4">
                <div
                    className="glass-surface grid grid-cols-6 gap-1 p-2 rounded-2xl"
                    style={{
                        boxShadow: "0 16px 38px rgba(9, 28, 52, 0.26)"
                    }}
                >
                    {mobileNav.map((item) => {
                        const Icon = item.icon;
                        const target = item.to === "/profile" ? `/profile/${user?.username}` : item.to;
                        const isAlert = item.to === "/notifications";

                        return (
                            <NavLink
                                key={item.label}
                                to={target}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all duration-150 relative ${isActive ? "text-white" : "text-slate-500"}`
                                }
                                style={({ isActive }) => isActive
                                    ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)", boxShadow: "0 8px 20px rgba(20,115,230,0.34)" }
                                    : {}}
                            >
                                <div className="relative">
                                    <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                                    {isAlert && unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center"
                                            style={{ background: "var(--error)", color: "white" }}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
