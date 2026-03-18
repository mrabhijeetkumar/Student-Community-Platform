const adminOnly = (req, res, next) => {
    if (!req.user || req.activeRole !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    next();
};

export default adminOnly;
