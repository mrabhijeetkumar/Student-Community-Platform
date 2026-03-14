export default function Notification({ title, message, tone = "info" }) {
    if (!message) {
        return null;
    }

    const toneClasses = {
        info: "border-accent-400/25 bg-accent-400/10 text-accent-700",
        success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-700",
        warning: "border-amber-400/25 bg-amber-400/10 text-amber-700"
    };

    return (
        <div className={`mt-4 rounded-3xl border px-4 py-3 text-sm ${toneClasses[tone] || toneClasses.info}`}>
            {title ? <p className="font-semibold">{title}</p> : null}
            <p className="mt-1">{message}</p>
        </div>
    );
}
