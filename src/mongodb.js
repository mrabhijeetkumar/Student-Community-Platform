import CryptoJS from "crypto-js";

const DATA_API_BASE_URL = process.env.REACT_APP_MONGODB_DATA_API_URL || "";
const DATA_API_KEY = process.env.REACT_APP_MONGODB_DATA_API_KEY || "";
const DATA_SOURCE = process.env.REACT_APP_MONGODB_DATA_SOURCE || "Cluster0";
const DATABASE = process.env.REACT_APP_MONGODB_DATABASE || "student_community";

const SESSION_KEY = "auth_session";
const AUTH_EVENT = "auth_state_change";

const hasAtlasConfig = Boolean(DATA_API_BASE_URL && DATA_API_KEY);

function validateGmailAddress(email) {
  const cleanEmail = email.trim().toLowerCase();
  const gmailPattern = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@gmail\.com$/i;

  if (!gmailPattern.test(cleanEmail)) {
    throw new Error("Please use a valid Google Gmail address (@gmail.com only)");
  }

  return cleanEmail;
}

const getLocalUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
const setLocalUsers = (users) => localStorage.setItem("users", JSON.stringify(users));

const getLocalPosts = () => JSON.parse(localStorage.getItem("posts") || "[]");
const setLocalPosts = (posts) => localStorage.setItem("posts", JSON.stringify(posts));

const emitAuthChange = (session) => {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
};

async function dataApi(action, payload) {
  const res = await fetch(`${DATA_API_BASE_URL.replace(/\/$/, "")}/action/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": DATA_API_KEY,
    },
    body: JSON.stringify({
      dataSource: DATA_SOURCE,
      database: DATABASE,
      ...payload,
    }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || json.error_message || "MongoDB request failed");
  }
  return json;
}

export async function registerUser({ name, email, password, gender }) {
  const cleanEmail = validateGmailAddress(email);
  const passwordHash = CryptoJS.SHA256(password).toString();

  if (!hasAtlasConfig) {
    const users = getLocalUsers();
    const exists = users.some((u) => u.email === cleanEmail);
    if (exists) throw new Error("Email already exists");

    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: cleanEmail,
      gender,
      passwordHash,
      phone: "",
      photo: "",
      theme: "Light",
      language: "Eng",
      notification: "Allow",
      created_at: new Date().toISOString(),
    };

    users.push(user);
    setLocalUsers(users);
    return user;
  }

  const { document: existingUser } = await dataApi("findOne", {
    collection: "users",
    filter: { email: cleanEmail },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const userDoc = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: cleanEmail,
    gender,
    passwordHash,
    phone: "",
    photo: "",
    theme: "Light",
    language: "Eng",
    notification: "Allow",
    created_at: new Date().toISOString(),
  };

  await dataApi("insertOne", { collection: "users", document: userDoc });
  return userDoc;
}

export async function loginUser({ email, password }) {
  const cleanEmail = validateGmailAddress(email);
  const passwordHash = CryptoJS.SHA256(password).toString();

  let user = null;

  if (!hasAtlasConfig) {
    user = getLocalUsers().find((u) => u.email === cleanEmail && u.passwordHash === passwordHash);
  } else {
    const { document } = await dataApi("findOne", {
      collection: "users",
      filter: { email: cleanEmail, passwordHash },
    });
    user = document;
  }

  if (!user) throw new Error("Invalid email or password");

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender || "Male",
    phone: user.phone || "",
    photo: user.photo || "",
    theme: user.theme || "Light",
    language: user.language || "Eng",
    notification: user.notification || "Allow",
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify({ user: safeUser }));
  emitAuthChange({ user: safeUser });
  return safeUser;
}

export function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  emitAuthChange(null);
}

export function onAuthStateChange(callback) {
  const handler = (event) => callback("SIGNED_IN", event.detail);
  const storageHandler = (event) => {
    if (event.key === SESSION_KEY) callback("SIGNED_IN", getSession());
  };

  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return {
    subscription: {
      unsubscribe: () => {
        window.removeEventListener(AUTH_EVENT, handler);
        window.removeEventListener("storage", storageHandler);
      },
    },
  };
}

export async function getUserProfile(userId) {
  if (!hasAtlasConfig) {
    return getLocalUsers().find((u) => u.id === userId) || null;
  }

  const { document } = await dataApi("findOne", {
    collection: "users",
    filter: { id: userId },
  });

  return document || null;
}

export async function updateUserProfile(userId, updates) {
  if (!hasAtlasConfig) {
    const users = getLocalUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return;
    users[index] = { ...users[index], ...updates };
    setLocalUsers(users);
    return users[index];
  }

  await dataApi("updateOne", {
    collection: "users",
    filter: { id: userId },
    update: { $set: updates },
  });

  return getUserProfile(userId);
}

export async function listPosts() {
  if (!hasAtlasConfig) {
    return getLocalPosts()
      .filter((p) => !p.deleted)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const { documents } = await dataApi("find", {
    collection: "posts",
    filter: { deleted: { $ne: true } },
    sort: { created_at: -1 },
  });

  return documents || [];
}

export async function createPost({ userId, content, category = "Project", tags = [] }) {
  const post = {
    id: crypto.randomUUID(),
    user_id: userId,
    content,
    category,
    tags,
    likes: [],
    comments: [],
    deleted: false,
    created_at: new Date().toISOString(),
  };

  if (!hasAtlasConfig) {
    const posts = getLocalPosts();
    posts.unshift(post);
    setLocalPosts(posts);
    return post;
  }

  await dataApi("insertOne", { collection: "posts", document: post });
  return post;
}

export async function updatePost(postId, updates) {
  if (!hasAtlasConfig) {
    const posts = getLocalPosts();
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) return;
    posts[index] = { ...posts[index], ...updates };
    setLocalPosts(posts);
    return;
  }

  await dataApi("updateOne", {
    collection: "posts",
    filter: { id: postId },
    update: { $set: updates },
  });
}

export async function resetPassword({ email, newPassword }) {
  const cleanEmail = validateGmailAddress(email);
  const passwordHash = CryptoJS.SHA256(newPassword).toString();

  if (!hasAtlasConfig) {
    const users = getLocalUsers();
    const index = users.findIndex((u) => u.email === cleanEmail);
    if (index === -1) throw new Error("Email not found");
    users[index].passwordHash = passwordHash;
    setLocalUsers(users);
    return;
  }

  await dataApi("updateOne", {
    collection: "users",
    filter: { email: cleanEmail },
    update: { $set: { passwordHash } },
  });
}

export const atlasEnabled = hasAtlasConfig;
