import { AnimatePresence, motion } from "framer-motion";
import { ChartBarSquareIcon, InboxIcon, BellIcon, UserCircleIcon, UserGroupIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

const mobileNav = [
    { label: "Feed", to: "/dashboard", icon: ChartBarSquareIcon },
    { label: "Explore", to: "/explore", icon: MagnifyingGlassIcon },
    { label: "Inbox", to: "/messages", icon: InboxIcon },
    { label: "Alerts", to: "/notifications", icon: BellIcon },
    { label: "Groups", to: "/communities", icon: UserGroupIcon },
    { label: "Profile", to: "/profile", icon: UserCircleIcon }
];

export default function AppShell() {
    const { user } = useAuth();

    return (
        <div className="relative isolate flex h-screen overflow-hidden bg-transparent">

            {/* Fixed left sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:flex-none lg:w-[252px] h-screen px-3 pt-4 pb-4 xl:px-4">
                <Sidebar />
            </div>

            {/* Scrollable main content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scrollbar-thin pb-24 lg:pb-0 pt-4 px-3 sm:px-4 lg:pr-6 xl:pr-8">
                <Navbar />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={user?._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="min-w-0 mt-5 lg:mt-6"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile bottom nav */}
            <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden sm:inset-x-4 sm:bottom-4">
                <div className="card-surface grid grid-cols-6 gap-1 p-2 shadow-2xl">
                    {mobileNav.map((item) => {
                        const Icon = item.icon;
                        const target = item.to === "/profile" ? `/profile/${user?.username}` : item.to;

                        return (
                            <NavLink
                                key={item.label}
                                to={target}
                                className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium transition ${isActive ? "bg-brand-500 text-white" : "text-slate-400"}`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
