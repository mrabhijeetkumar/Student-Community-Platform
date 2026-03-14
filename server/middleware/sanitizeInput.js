const MAX_STRING_LENGTH = Number(process.env.MAX_INPUT_LENGTH || 5000);

const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const isUnsafeKey = (key) => key.startsWith("$") || key.includes(".");

const sanitizeString = (value) => {
    const trimmed = value.trim();
    return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed;
};

const sanitizeValue = (value) => {
    if (typeof value === "string") {
        return sanitizeString(value);
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (isPlainObject(value)) {
        const result = {};

        for (const [key, child] of Object.entries(value)) {
            if (isUnsafeKey(key)) {
                continue;
            }

            result[key] = sanitizeValue(child);
        }

        return result;
    }

    return value;
};

const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body);
    }

    if (req.query && typeof req.query === "object") {
        const sanitizedQuery = sanitizeValue(req.query);

        for (const key of Object.keys(req.query)) {
            delete req.query[key];
        }

        Object.assign(req.query, sanitizedQuery);
    }

    if (req.params && typeof req.params === "object") {
        req.params = sanitizeValue(req.params);
    }

    next();
};

export default sanitizeInput;
