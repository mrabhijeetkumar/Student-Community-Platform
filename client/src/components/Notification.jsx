import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const TONE_CONFIG = {
    info: {
        classes: "border-accent-400/25 bg-accent-400/10 text-accent-700",
        Icon: Info
    },
    success: {
        classes: "border-emerald-400/25 bg-emerald-400/10 text-emerald-700",
        Icon: CheckCircle2
    },
    warning: {
        classes: "border-amber-400/25 bg-amber-400/10 text-amber-700",
        Icon: AlertTriangle
    },
    error: {
        classes: "border-rose-400/30 bg-rose-400/10 text-rose-700",
        Icon: AlertCircle
    }
};

export default function Notification({ title, message, tone = "info" }) {
    if (!message) {
        return null;
    }

    const { classes, Icon } = TONE_CONFIG[tone] || TONE_CONFIG.info;

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            role="alert"
            className={`mt-4 flex items-start gap-2.5 rounded-3xl border px-4 py-3 text-sm ${classes}`}
        >
            <Icon size={17} className="mt-0.5 flex-shrink-0" />
            <div>
                {title ? <p className="font-semibold">{title}</p> : null}
                <p className="mt-0.5">{message}</p>
            </div>
        </motion.div>
    );
}
