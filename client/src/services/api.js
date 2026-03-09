function normalizeApiBaseUrl(url) {
    return (url || "http://localhost:5050/api").replace(/\/$/, "");
}

const API_BASE_URL = normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5050/api"
);
const STORAGE_KEY = "student-community-auth";

function getStoredToken() {
    if (typeof window === "undefined") {
        return "";
    }

    const rawSession = window.localStorage.getItem(STORAGE_KEY);

    if (!rawSession) {
        return "";
    }

    try {
        const parsedSession = JSON.parse(rawSession);
        return parsedSession?.token || "";
    } catch {
        return "";
    }
}

async function request(path, options = {}) {
    const { headers = {}, ...restOptions } = options;
    const storedToken = getStoredToken();

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...restOptions,
        headers: {
            "Content-Type": "application/json",
            ...(storedToken && !headers.Authorization ? { Authorization: `Bearer ${storedToken}` } : {}),
            ...headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed");
    }

    return data;
}

async function requestWithFallback(primaryPath, fallbackPath, options = {}) {
    try {
        return await request(primaryPath, options);
    } catch (error) {
        if (!fallbackPath) {
            throw error;
        }

        return request(fallbackPath, options);
    }
}

export function requestOtp(payload) {
    return request("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function registerUser(payload) {
    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function loginUser(payload) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function loginWithGoogle(idToken) {
    return request("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken })
    });
}

export function fetchSession(token) {
    return request("/auth/session", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getPosts(type = "smart", token, options = {}) {
    const params = new URLSearchParams({ type });

    if (options.limit) {
        params.set("limit", String(options.limit));
    }

    if (options.communityId) {
        params.set("communityId", options.communityId);
    }

    return request(`/posts?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function votePost(postId, voteType, token) {
    return request(`/posts/${postId}/vote`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
    });
}

export function createPost(payload, token) {
    return request("/posts", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export function updatePost(postId, payload, token) {
    return request(`/posts/${postId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export function deletePost(postId, token) {
    return request(`/posts/${postId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function toggleLike(postId, token) {
    return request(`/posts/${postId}/like`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function toggleSavePost(postId, token) {
    return request(`/posts/${postId}/save`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getUserPosts(userId, token) {
    return request(`/posts/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getComments(postId, token) {
    return request(`/comments/${postId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function createComment(postId, payload, token) {
    return request(`/comments/${postId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export function deleteComment(commentId, token) {
    return request(`/comments/item/${commentId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getCurrentUser(token) {
    return requestWithFallback("/users/profile", "/users/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getMyProfile(token) {
    return requestWithFallback("/users/profile", "/users/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function updateCurrentUser(payload, token) {
    return requestWithFallback("/users/profile", "/users/me", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export function updateMyProfile(payload, token) {
    return requestWithFallback("/users/profile", "/users/me", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export function getUserDirectory(token, query = "") {
    const search = query ? `?q=${encodeURIComponent(query)}` : "";

    return request(`/users/directory${search}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getSuggestedUsers(token) {
    return request("/users/suggestions", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getCommunities(token, query = "", options = {}) {
    const params = new URLSearchParams();

    if (query) {
        params.set("q", query);
    }

    if (options.featuredOnly) {
        params.set("featured", "1");
    }

    const search = params.toString() ? `?${params.toString()}` : "";

    return request(`/communities${search}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function joinCommunity(slug, token) {
    return request(`/communities/${slug}/join`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function leaveCommunity(slug, token) {
    return request(`/communities/${slug}/join`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getUserProfile(username, token) {
    return request(`/users/profile/${username}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function followUser(username, token) {
    return request(`/users/profile/${username}/follow`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function unfollowUser(username, token) {
    return request(`/users/profile/${username}/follow`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getNotifications(token) {
    return request("/notifications", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function markNotificationRead(notificationId, token) {
    return request(`/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function markAllNotificationsRead(token) {
    return request("/notifications/read-all", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getMyDashboard(token) {
    return request("/dashboard/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getAdminDashboard(token) {
    return request("/dashboard/admin", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getConversations(token) {
    return request("/messages/conversations", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function getMessagesWithUser(userId, token) {
    return request(`/messages/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function sendMessage(userId, content, token) {
    return request(`/messages/${userId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
}
