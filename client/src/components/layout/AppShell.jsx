import { AnimatePresence, motion } from "framer-motion";
import { ChartBarSquareIcon, HomeIcon, InboxIcon, BellIcon, UserCircleIcon, MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import RightRail from "./RightRail";

const mobileNav = [
    { label: "Home", to: "/", icon: HomeIcon },
    { label: "Explore", to: "/explore", icon: MagnifyingGlassIcon },
    { label: "Inbox", to: "/messages", icon: InboxIcon },
    { label: "Alerts", to: "/notifications", icon: BellIcon },
    { label: "Groups", to: "/communities", icon: UserGroupIcon },
    { label: "Stats", to: "/dashboard", icon: ChartBarSquareIcon },
    { label: "Profile", to: "/profile", icon: UserCircleIcon }
];

export default function AppShell() {
    const { user } = useAuth();

    return (
        <div className="relative isolate min-h-screen overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="floating-orb left-[-6rem] top-[-4rem] hidden h-56 w-56 bg-brand-500/14 lg:block" />
                <div className="floating-orb right-[-4rem] top-20 hidden h-64 w-64 bg-accent-400/8 xl:block" />
                <div className="floating-orb bottom-[-6rem] left-1/3 hidden h-56 w-56 bg-sky-400/8 lg:block" />
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-500/8 via-white/[0.02] to-transparent" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-[1560px] items-start gap-4 px-3 pb-24 pt-4 sm:px-4 lg:gap-6 lg:px-6 lg:pb-8 lg:pt-6 xl:px-8">
                <Sidebar />

                <main className="min-w-0 flex-1 space-y-5 lg:space-y-6">
                    <Navbar />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={user?._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="min-w-0"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                <RightRail />
            </div>

            <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden sm:inset-x-4 sm:bottom-4">
                <div className="card-surface grid grid-cols-7 gap-1 p-2 shadow-2xl">
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
