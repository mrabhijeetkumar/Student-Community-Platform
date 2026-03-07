const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

async function request(path, options = {}) {
    const { headers = {}, ...restOptions } = options;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...restOptions,
        headers: {
            "Content-Type": "application/json",
            ...headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed");
    }

    return data;
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

export function getPosts(type = "smart", token) {
    return request(`/posts/feed?type=${type}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
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
    return request("/users/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export function updateCurrentUser(payload, token) {
    return request("/users/me", {
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
