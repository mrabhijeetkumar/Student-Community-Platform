import { API_BASE_URL as DEFAULT_API_BASE_URL } from "../config/api";

function normalizeApiBaseUrl(url) {
    return (url || DEFAULT_API_BASE_URL).replace(/\/api\/?$/, "").replace(/\/$/, "");
}

const API_BASE_URL = normalizeApiBaseUrl(
    import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
);
const STORAGE_KEY = "student-community-auth";
const API_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

function withApiPrefix(path) {
    if (path === "/api" || path.startsWith("/api/")) {
        return path;
    }

    return `/api${path.startsWith("/") ? path : `/${path}`}`;
}

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${withApiPrefix(path)}`, {
            ...restOptions,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(storedToken && !headers.Authorization ? { Authorization: `Bearer ${storedToken}` } : {}),
                ...headers
            }
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Request timeout. Please try again.");
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }

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

export function forgotPassword(payload) {
    return request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function resetPassword(payload) {
    return request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload)
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

export function getAdminUsers(token, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.q) params.set("q", options.q);
    return request(`/dashboard/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getAdminPosts(token, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    return request(`/dashboard/admin/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function setUserRole(userId, role, token) {
    return request(`/dashboard/admin/users/${userId}/role`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role })
    });
}

export function deleteAdminUser(userId, token) {
    return request(`/dashboard/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function deleteAdminPost(postId, token) {
    return request(`/dashboard/admin/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getAdminComments(token, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.q) params.set("q", options.q);
    return request(`/dashboard/admin/comments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function deleteAdminComment(commentId, token) {
    return request(`/dashboard/admin/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getAdminActivity(token, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    return request(`/dashboard/admin/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function toggleBanUser(userId, token) {
    return request(`/dashboard/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getAdminCommunities(token, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.q) params.set("q", options.q);
    return request(`/dashboard/admin/communities?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function deleteAdminCommunity(communityId, token) {
    return request(`/dashboard/admin/communities/${communityId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function toggleCommunityFeatured(communityId, token) {
    return request(`/dashboard/admin/communities/${communityId}/featured`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function removeCommunityMember(communityId, userId, token) {
    return request(`/dashboard/admin/communities/${communityId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
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

export function searchPosts(query, token, options = {}) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (options.tag) params.set("tag", options.tag);
    if (options.limit) params.set("limit", String(options.limit));
    return request(`/posts/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getCommunityBySlug(slug, token) {
    return request(`/communities/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getUserFollowers(username, token) {
    return request(`/users/profile/${username}/followers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function getUserFollowing(username, token) {
    return request(`/users/profile/${username}/following`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export function changePassword(payload, token) {
    return request("/users/change-password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}
