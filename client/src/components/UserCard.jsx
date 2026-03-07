import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function getInitials(name) {
    return (name || "Student")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function UserCard({ user, action, compact = false }) {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18 }}
            className={`card-ghost ${compact ? "p-3" : "p-4"}`}
        >
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 text-sm font-bold text-white">
                    {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                        getInitials(user.name)
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <Link to={`/profile/${user.username}`} className="truncate text-sm font-semibold text-white transition hover:text-accent-300">
                        {user.name}
                    </Link>
                    <p className="truncate text-xs text-slate-400">@{user.username}</p>
                    {compact ? null : <p className="truncate text-xs text-slate-500">{user.headline || user.college || "Student community member"}</p>}
                </div>
                {action ? action : null}
            </div>
            {!compact && user.skills?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {user.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="pill-tag">{skill}</span>
                    ))}
                </div>
            ) : null}
        </motion.div>
    );
}
