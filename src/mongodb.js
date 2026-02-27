import CryptoJS from "crypto-js";

const DATA_API_BASE_URL = process.env.REACT_APP_MONGODB_DATA_API_URL || "";
const DATA_API_KEY = process.env.REACT_APP_MONGODB_DATA_API_KEY || "";
const DATA_SOURCE = process.env.REACT_APP_MONGODB_DATA_SOURCE || "Cluster0";
const DATABASE = process.env.REACT_APP_MONGODB_DATABASE || "student_community";

const SESSION_KEY = "auth_session";
const USERS_KEY = "users";
const POSTS_KEY = "posts";
const AUTH_EVENT = "auth_state_change";
const DATA_EVENT = "community_data_change";
const PENDING_SIGNUPS_KEY = "pending_signups";
const EMAIL_VERIFICATION_WEBHOOK = process.env.REACT_APP_EMAIL_VERIFICATION_WEBHOOK || "";
const OTP_TTL_MS = 10 * 60 * 1000;

const hasAtlasConfig = Boolean(DATA_API_BASE_URL && DATA_API_KEY);

function validateGmailAddress(email) {
  const cleanEmail = email.trim().toLowerCase();
  const gmailPattern = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@gmail\.com$/i;

  if (!gmailPattern.test(cleanEmail)) {
    throw new Error("Please use a valid Google Gmail address (@gmail.com only)");
  }

  return cleanEmail;
}

const getPendingSignups = () => JSON.parse(localStorage.getItem(PENDING_SIGNUPS_KEY) || "{}");
const setPendingSignups = (value) => localStorage.setItem(PENDING_SIGNUPS_KEY, JSON.stringify(value));

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

async function ensureEmailAvailable(cleanEmail) {
  if (!hasAtlasConfig) {
    const exists = getLocalUsers().some((u) => u.email === cleanEmail);
    if (exists) throw new Error("Email already exists");
    return;
  }

  const { document: existingUser } = await dataApi("findOne", {
    collection: "users",
    filter: { email: cleanEmail },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }
}

async function dispatchVerificationOtp({ email, otp, name }) {
  if (!EMAIL_VERIFICATION_WEBHOOK) {
    return { delivery: "local", debugOtp: otp };
  }

  const response = await fetch(EMAIL_VERIFICATION_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      otp,
      subject: "Verify your Student Community account",
      message: `Hi ${name}, your verification OTP is ${otp}. It expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send verification email right now. Please try again.");
  }

  return { delivery: "email" };
}

export async function requestSignupVerification({ name, email, password, gender }) {
  const cleanEmail = validateGmailAddress(email);
  await ensureEmailAvailable(cleanEmail);

  const otp = generateOtp();
  const pendingSignups = getPendingSignups();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  pendingSignups[cleanEmail] = {
    name: name.trim(),
    email: cleanEmail,
    gender,
    passwordHash: CryptoJS.SHA256(password).toString(),
    otpHash: CryptoJS.SHA256(otp).toString(),
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  setPendingSignups(pendingSignups);

  const result = await dispatchVerificationOtp({ email: cleanEmail, otp, name: name.trim() });
  return { expiresAt, ...result };
}

export async function verifySignupOtpAndCreateUser({ email, otp }) {
  const cleanEmail = validateGmailAddress(email);
  const pendingSignups = getPendingSignups();
  const pending = pendingSignups[cleanEmail];

  if (!pending) {
    throw new Error("Verification request not found. Please request OTP again.");
  }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    delete pendingSignups[cleanEmail];
    setPendingSignups(pendingSignups);
    throw new Error("OTP expired. Please request a new verification OTP.");
  }

  const providedHash = CryptoJS.SHA256(String(otp || "").trim()).toString();
  if (providedHash !== pending.otpHash) {
    throw new Error("Invalid OTP. Please check and try again.");
  }

  await ensureEmailAvailable(cleanEmail);

  const userDoc = {
    id: crypto.randomUUID(),
    name: pending.name,
    email: pending.email,
    gender: pending.gender,
    passwordHash: pending.passwordHash,
    phone: "",
    photo: "",
    theme: "Light",
    language: "Eng",
    notification: "Allow",
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (!hasAtlasConfig) {
    const users = getLocalUsers();
    users.push(userDoc);
    setLocalUsers(users);
  } else {
    await dataApi("insertOne", { collection: "users", document: userDoc });
  }

  delete pendingSignups[cleanEmail];
  setPendingSignups(pendingSignups);
  return userDoc;
}

const getLocalUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const setLocalUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  emitDataChange("users");
};

const getLocalPosts = () => JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
const setLocalPosts = (posts) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  emitDataChange("posts");
};

const emitAuthChange = (session) => {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: session }));
};

const emitDataChange = (scope = "all") => {
  window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: { scope, at: Date.now() } }));
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
  await ensureEmailAvailable(cleanEmail);

  if (!hasAtlasConfig) {
    const users = getLocalUsers();

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
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    users.push(user);
    setLocalUsers(users);
    return user;
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
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
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
  if (!user.emailVerified) {
    throw new Error("Email not verified. Please complete OTP verification before login.");
  }

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

export async function listUsers() {
  if (!hasAtlasConfig) {
    return getLocalUsers();
  }

  const { documents } = await dataApi("find", {
    collection: "users",
    filter: {},
    projection: {
      _id: 0,
      id: 1,
      name: 1,
      email: 1,
      photo: 1,
      gender: 1,
      phone: 1,
      skills: 1,
      theme: 1,
      language: 1,
      notification: 1,
    },
  });

  return documents || [];
}

export async function updateUserProfile(userId, updates) {
  if (!hasAtlasConfig) {
    const users = getLocalUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    setLocalUsers(users);

    const session = getSession();
    if (session?.user?.id === userId) {
      const nextSession = {
        user: {
          ...session.user,
          name: users[index].name || session.user.name,
          phone: users[index].phone || "",
          photo: users[index].photo || "",
          gender: users[index].gender || "Male",
        },
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      emitAuthChange(nextSession);
    }

    return users[index];
  }

  await dataApi("updateOne", {
    collection: "users",
    filter: { id: userId },
    update: { $set: updates },
  });

  const updatedUser = await getUserProfile(userId);

  const session = getSession();
  if (session?.user?.id === userId && updatedUser) {
    const nextSession = {
      user: {
        ...session.user,
        name: updatedUser.name || session.user.name,
        phone: updatedUser.phone || "",
        photo: updatedUser.photo || "",
        gender: updatedUser.gender || "Male",
      },
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    emitAuthChange(nextSession);
  }

  emitDataChange("users");
  return updatedUser;
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
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (!hasAtlasConfig) {
    const posts = getLocalPosts();
    posts.unshift(post);
    setLocalPosts(posts);
    return post;
  }

  await dataApi("insertOne", { collection: "posts", document: post });
  emitDataChange("posts");
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

  emitDataChange("posts");
}

export function subscribeToCommunityUpdates(callback, options = {}) {
  const intervalMs = options.intervalMs ?? (hasAtlasConfig ? 5000 : 0);

  const onDataEvent = () => callback();
  const onStorageEvent = (event) => {
    if ([USERS_KEY, POSTS_KEY].includes(event.key)) {
      callback();
    }
  };

  window.addEventListener(DATA_EVENT, onDataEvent);
  window.addEventListener("storage", onStorageEvent);

  const intervalId = intervalMs > 0 ? window.setInterval(callback, intervalMs) : null;

  return () => {
    window.removeEventListener(DATA_EVENT, onDataEvent);
    window.removeEventListener("storage", onStorageEvent);
    if (intervalId) window.clearInterval(intervalId);
  };
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

  emitDataChange("users");
}

export const atlasEnabled = hasAtlasConfig;
