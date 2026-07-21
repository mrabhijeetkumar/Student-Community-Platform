const MAX_STRING_LENGTH = Number(process.env.MAX_INPUT_LENGTH || 5000);
const MAX_IMAGE_DATA_URL_LENGTH = Number(process.env.MAX_IMAGE_DATA_URL_LENGTH || 2_000_000);

const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

const isUnsafeKey = (key) => key.startsWith("$") || key.includes(".");

const hasBase64Prefix = (value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(value);

const isLargeMediaField = (pathKey) => {
    const normalizedKey = String(pathKey || "").toLowerCase();

    return ["profilephoto", "coverphoto", "images", "image"].includes(normalizedKey);
};

const sanitizeString = (value, pathKey = "") => {
    const trimmed = value.trim();

    if (isLargeMediaField(pathKey) && hasBase64Prefix(trimmed)) {
        return trimmed.length > MAX_IMAGE_DATA_URL_LENGTH
            ? trimmed.slice(0, MAX_IMAGE_DATA_URL_LENGTH)
            : trimmed;
    }

    return trimmed.length > MAX_STRING_LENGTH ? trimmed.slice(0, MAX_STRING_LENGTH) : trimmed;
};

const sanitizeValue = (value, pathKey = "") => {
    if (typeof value === "string") {
        return sanitizeString(value, pathKey);
    }

    if (Array.isArray(value)) {
        return value.map((child) => sanitizeValue(child, pathKey));
    }

    if (isPlainObject(value)) {
        const result = {};

        for (const [key, child] of Object.entries(value)) {
            if (isUnsafeKey(key)) {
                continue;
            }

            result[key] = sanitizeValue(child, key);
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
