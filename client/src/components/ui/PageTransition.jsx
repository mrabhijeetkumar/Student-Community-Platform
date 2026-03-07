import { motion } from "framer-motion";

export default function PageTransition({ children, className = "" }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.section>
    );
}
