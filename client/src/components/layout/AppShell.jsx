import { AnimatePresence, motion } from "framer-motion";
import { ChartBarSquareIcon, HomeIcon, InboxIcon, BellIcon, UserCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
    { label: "Stats", to: "/dashboard", icon: ChartBarSquareIcon },
    { label: "Profile", to: "/profile", icon: UserCircleIcon }
];

export default function AppShell() {
    const { user } = useAuth();

    return (
        <div className="relative isolate min-h-screen overflow-x-clip">
            <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="pointer-events-none absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-accent-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

            <div className="relative mx-auto grid min-h-screen max-w-[1720px] grid-cols-1 gap-6 px-4 pb-24 pt-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6 lg:pb-8 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                <Sidebar />

                <main className="min-w-0 space-y-6">
                    <Navbar />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={user?._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                <RightRail />
            </div>

            <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
                <div className="card-surface grid grid-cols-6 gap-1 p-2">
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
