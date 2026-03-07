import { UserGroupIcon } from "@heroicons/react/24/outline";
import PageTransition from "../components/ui/PageTransition";

const communityCards = [
    { name: "Hackathon Hub", members: "2.3k", topic: "Build and ship projects", color: "from-violet-500/35 to-sky-400/20" },
    { name: "Placement Prep", members: "4.6k", topic: "Interview prep + referrals", color: "from-sky-500/30 to-indigo-400/20" },
    { name: "Design Critique", members: "1.1k", topic: "Portfolio and UI reviews", color: "from-fuchsia-500/30 to-cyan-400/20" },
    { name: "Open Source Circle", members: "1.8k", topic: "Collaboration and contribution", color: "from-emerald-500/30 to-cyan-400/20" }
];

export default function Community() {
    return (
        <PageTransition className="space-y-6">
            <div className="card-surface p-6">
                <p className="section-title">Communities</p>
                <h2 className="mt-2 text-3xl font-bold text-white">Join focused circles and collaborate faster.</h2>
                <p className="mt-2 text-sm text-slate-400">Discover active student clusters for hackathons, placements, research, and peer learning.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {communityCards.map((community) => (
                    <article key={community.name} className="card-surface overflow-hidden p-5">
                        <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${community.color} p-5`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white">
                                    <UserGroupIcon className="h-6 w-6" />
                                </div>
                                <span className="pill-tag">{community.members} members</span>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-white">{community.name}</h3>
                            <p className="mt-2 text-sm text-slate-200">{community.topic}</p>
                            <button type="button" className="btn-primary mt-5 w-full justify-center">Join community</button>
                        </div>
                    </article>
                ))}
            </div>
        </PageTransition>
    );
}
