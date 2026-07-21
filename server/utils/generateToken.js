import jwt from "jsonwebtoken";

const generateToken = (user, activeRole = null) => {

    return jwt.sign(
        {
            id: user._id,
            role: activeRole || user.role,
            roles: Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role || "student"],
            emailVerified: user.isEmailVerified
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

};

export default generateToken;
