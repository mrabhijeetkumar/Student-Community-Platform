import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {

        token = req.headers.authorization.split(" ")[1];

        try {

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "User not found" });
            }

            if (!req.user.isEmailVerified) {
                return res.status(403).json({ message: "Verify your email to access the platform" });
            }

            if (req.user.isBanned) {
                return res.status(403).json({ message: "Your account has been suspended. Contact support for assistance." });
            }

            next();

        } catch (error) {

            res.status(401).json({ message: "Not authorized" });

        }

    } else {

        res.status(401).json({ message: "No token provided" });

    }

};

export default protect;