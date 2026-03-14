export const notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (error, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    const isProduction = process.env.NODE_ENV === "production";
    const shouldExposeMessage = statusCode < 500 || !isProduction;

    res.status(statusCode).json({
        message: shouldExposeMessage ? error.message : "Internal server error",
        stack: isProduction ? undefined : error.stack
    });
};
