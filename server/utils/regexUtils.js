// Escapes special regex characters so user-supplied search input can never be
// interpreted as a regex pattern. Prevents ReDoS attacks (e.g. "(a+)+$") and
// unintended wildcard matching when values are used inside $regex queries.
export const escapeRegex = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Builds a safe case-insensitive "contains" regex from raw user input.
// Also caps input length to keep the resulting regex cheap to evaluate.
export const buildSafeContainsRegex = (value = "", maxLength = 100) => {
    const trimmed = String(value).slice(0, maxLength);
    return new RegExp(escapeRegex(trimmed), "i");
};
