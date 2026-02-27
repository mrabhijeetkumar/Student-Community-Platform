import React, { useEffect, useMemo, useState, useRef } from "react";
import "../style.css";
import {
  createPost,
  getSession,
  getUserProfile,
  listPosts,
  listUsers,
  signOut,
  subscribeToCommunityUpdates,
  updatePost,
  updateUserProfile,
} from "../mongodb";

const OPPORTUNITIES = [
  {
    title: "Google Summer of Code Mentor Connect",
    type: "Open Source",
    deadline: "2026-03-15",
    link: "https://summerofcode.withgoogle.com/",
  },
  {
    title: "Frontend Intern - Remote (Startup)",
    type: "Internship",
    deadline: "2026-03-03",
    link: "https://www.linkedin.com/jobs/",
  },
  {
    title: "Community Hackathon: Build for Students",
    type: "Hackathon",
    deadline: "2026-03-20",
    link: "https://devpost.com/hackathons",
  },
];

const CATEGORY_COLORS = {
  Announcement: "#1e293b",
  Project: "#4f46e5",
  "Doubt/Help": "#0f766e",
  "Career/Internship": "#7c2dd9",
};

const REPORT_REASONS = ["Spam", "Abusive language", "Off-topic", "Fake information"];
const FLAGGED_TERMS = ["hate", "abuse", "fake-news"];
const LEARNING_RESOURCES = [
  { title: "DSA Roadmap", type: "Interview Prep", link: "https://neetcode.io/roadmap" },
  { title: "System Design Primer", type: "Architecture", link: "https://github.com/donnemartin/system-design-primer" },
  { title: "Open Source Guide", type: "Community", link: "https://opensource.guide/how-to-contribute/" },
  { title: "Resume Checklist", type: "Career", link: "https://www.overleaf.com/latex/templates/tagged/cv" },
];

const formatDate = (value) => new Date(value).toLocaleString();

function Dashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [postText, setPostText] = useState("");
  const [postCategory, setPostCategory] = useState("Project");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [commentText, setCommentText] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", gender: "Male", photo: "", skills: "" });
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState([]);

  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => () => window.clearTimeout(toastTimeoutRef.current), []);

  useEffect(() => {
    const session = getSession();
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }
    setAuthUser(session.user);
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;

    const savedBookmarks = JSON.parse(localStorage.getItem(`bookmarks_${authUser.id}`) || "[]");
    setBookmarks(savedBookmarks);

    const hydrateDashboard = async () => {
      const [user, postRows, allUsers] = await Promise.all([getUserProfile(authUser.id), listPosts(), listUsers()]);

      if (user) {
        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          gender: user.gender || "Male",
          photo: user.photo || "",
          skills: user.skills || "",
        });
      }

      setUsersById(
        allUsers.reduce((accumulator, item) => {
          accumulator[item.id] = {
            name: item.name || "Community Member",
            photo: item.photo || "",
          };
          return accumulator;
        }, {})
      );

      setPosts(
        postRows.map((p) => ({
          ...p,
          likes: p.likes || [],
          comments: p.comments || [],
          reports: p.reports || [],
          category: p.category || "Project",
          tags: p.tags || [],
        }))
      );
    };

    hydrateDashboard();
    const unsubscribeLive = subscribeToCommunityUpdates(hydrateDashboard);

    return () => {
      unsubscribeLive();
    };
  }, [authUser]);

  useEffect(() => {
    if (!authUser?.id) return;
    const savedGoals = JSON.parse(localStorage.getItem(`goals_${authUser.id}`) || "[]");
    setGoals(savedGoals);
  }, [authUser]);

  useEffect(() => {
    if (!authUser?.id) return;
    localStorage.setItem(`goals_${authUser.id}`, JSON.stringify(goals));
  }, [goals, authUser]);

  const postsWithUser = useMemo(() => {
    const decorated = posts.map((post) => ({
      ...post,
      score: post.likes.length * 2 + post.comments.length,
      userName: usersById[post.user_id]?.name || "Community Member",
    }));

    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? decorated.filter(
        (post) =>
          post.content.toLowerCase().includes(keyword) ||
          post.category.toLowerCase().includes(keyword) ||
          post.tags.some((tag) => tag.toLowerCase().includes(keyword))
      )
      : decorated;

    return [...filtered].sort((a, b) => {
      if (sortBy === "trending") return b.score - a.score;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [posts, usersById, search, sortBy]);

  const flaggedPosts = useMemo(
    () => postsWithUser.filter((post) => post.reports.length > 0).sort((a, b) => b.reports.length - a.reports.length),
    [postsWithUser]
  );

  const analytics = useMemo(() => {
    if (!authUser?.id) return { myPosts: 0, myLikesReceived: 0, myCommentsReceived: 0, streakDays: 0 };

    const mine = posts.filter((p) => p.user_id === authUser.id);
    const myLikesReceived = mine.reduce((sum, p) => sum + p.likes.length, 0);
    const myCommentsReceived = mine.reduce((sum, p) => sum + p.comments.length, 0);

    const days = new Set(
      mine
        .filter((p) => {
          const diff = Date.now() - new Date(p.created_at).getTime();
          return diff <= 7 * 24 * 60 * 60 * 1000;
        })
        .map((p) => new Date(p.created_at).toISOString().slice(0, 10))
    );

    return { myPosts: mine.length, myLikesReceived, myCommentsReceived, streakDays: days.size };
  }, [posts, authUser]);

  const leaderboard = useMemo(() => {
    const byUser = posts.reduce((accumulator, post) => {
      if (!accumulator[post.user_id]) {
        accumulator[post.user_id] = { points: 0, posts: 0 };
      }
      accumulator[post.user_id].posts += 1;
      accumulator[post.user_id].points += (post.likes?.length || 0) * 2 + (post.comments?.length || 0);
      return accumulator;
    }, {});

    return Object.entries(byUser)
      .map(([userId, stats]) => ({
        userId,
        name: usersById[userId]?.name || "Community Member",
        points: stats.points,
        posts: stats.posts,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [posts, usersById]);

  const profileCompletion = useMemo(() => {
    const fields = [profile.name, profile.phone, profile.gender, profile.skills, profile.photo];
    const completed = fields.filter((field) => String(field || "").trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [profile]);

  const skillTags = useMemo(
    () => profile.skills.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 8),
    [profile.skills]
  );

  const profileChecklist = useMemo(
    () => [
      { label: "Professional photo", done: Boolean(profile.photo) },
      { label: "Contact number", done: Boolean(profile.phone.trim()) },
      { label: "At least 3 skills", done: skillTags.length >= 3 },
      { label: "Active posting streak", done: analytics.streakDays >= 2 },
    ],
    [profile.photo, profile.phone, skillTags.length, analytics.streakDays]
  );

  const achievementBadges = useMemo(() => {
    const badges = [];
    if (analytics.myPosts >= 3) badges.push("🚀 Consistent Builder");
    if (analytics.myLikesReceived >= 5) badges.push("🔥 Community Impact");
    if (profileCompletion >= 80) badges.push("✅ Profile Pro");
    if (skillTags.length >= 4) badges.push("🧠 Skill Rich");
    return badges.length ? badges : ["🌱 Rising Member"];
  }, [analytics.myPosts, analytics.myLikesReceived, profileCompletion, skillTags.length]);

  const toggleBookmark = (postId) => {
    if (!authUser?.id) return;
    const updated = bookmarks.includes(postId) ? bookmarks.filter((id) => id !== postId) : [...bookmarks, postId];
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${authUser.id}`, JSON.stringify(updated));
  };

  const addGoal = () => {
    const clean = goalInput.trim();
    if (!clean) return;
    const newGoal = { id: crypto.randomUUID(), title: clean, completed: false, created_at: new Date().toISOString() };
    setGoals((previous) => [newGoal, ...previous]);
    setGoalInput("");
    showToast("Goal added to your weekly tracker.");
  };

  const toggleGoal = (goalId) => {
    setGoals((previous) =>
      previous.map((goal) => (goal.id === goalId ? { ...goal, completed: !goal.completed } : goal))
    );
  };

  const removeGoal = (goalId) => {
    setGoals((previous) => previous.filter((goal) => goal.id !== goalId));
  };

  const addPost = async () => {
    if (!postText.trim() || !authUser?.id) return;

    const lowered = postText.trim().toLowerCase();
    const hasFlaggedTerm = FLAGGED_TERMS.some((term) => lowered.includes(term));
    if (hasFlaggedTerm) {
      showToast("Post blocked: content violates community quality guidelines.");
      return;
    }

    const tags = (postText.match(/#[a-zA-Z0-9_]+/g) || []).map((tag) => tag.toLowerCase());
    const created = await createPost({
      userId: authUser.id,
      content: postText.trim(),
      category: postCategory,
      tags,
    });
    setPosts((prev) => [{ ...created, category: postCategory, tags, reports: [] }, ...prev]);
    setPostText("");
    showToast("Post published successfully.");
  };

  const toggleLike = async (post) => {
    if (!authUser?.id) return;
    const isLiked = post.likes.includes(authUser.id);
    const likes = isLiked ? post.likes.filter((id) => id !== authUser.id) : [...post.likes, authUser.id];
    await updatePost(post.id, { likes });
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, likes } : p)));
  };

  const addComment = async (post) => {
    const text = (commentText[post.id] || "").trim();
    if (!text || !authUser?.id) return;
    const comments = [...post.comments, { user_id: authUser.id, text, created_at: new Date().toISOString() }];
    await updatePost(post.id, { comments });
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, comments } : p)));
    setCommentText((prev) => ({ ...prev, [post.id]: "" }));
  };

  const reportPost = async (post, reason) => {
    if (!authUser?.id || post.user_id === authUser.id) return;

    const alreadyReported = post.reports.some((report) => report.user_id === authUser.id);
    if (alreadyReported) {
      showToast("You have already reported this post.");
      return;
    }

    const nextReports = [...post.reports, { user_id: authUser.id, reason, created_at: new Date().toISOString() }];
    await updatePost(post.id, { reports: nextReports });
    setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, reports: nextReports } : item)));
    showToast("Post reported. Thanks for helping keep community safe.");
  };

  const resolveReports = async (post) => {
    await updatePost(post.id, { reports: [] });
    setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, reports: [] } : item)));
    showToast("Reports resolved for this post.");
  };

  const deletePost = async (post) => {
    if (!authUser?.id || post.user_id !== authUser.id) return;

    const shouldDelete = window.confirm("Are you sure you want to delete this post?");
    if (!shouldDelete) return;

    await updatePost(post.id, { deleted: true });
    setPosts((prev) => prev.filter((item) => item.id !== post.id));
    setCommentText((prev) => {
      const next = { ...prev };
      delete next[post.id];
      return next;
    });
  };

  const saveProfile = async () => {
    if (!authUser?.id) return;
    const updatedUser = await updateUserProfile(authUser.id, {
      name: profile.name,
      phone: profile.phone,
      gender: profile.gender,
      skills: profile.skills,
      photo: profile.photo,
    });

    if (updatedUser) {
      setAuthUser((previous) => (previous ? { ...previous, name: updatedUser.name || previous.name } : previous));
      setUsersById((previous) => ({
        ...previous,
        [authUser.id]: {
          ...(previous[authUser.id] || {}),
          name: updatedUser.name || "Community Member",
          photo: updatedUser.photo || "",
        },
      }));
    }

    showToast("Profile updated successfully.");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, photo: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarButtonClick = () => {
    setAvatarMenuOpen((previous) => !previous);
  };

  const handleAvatarUploadClick = () => {
    setAvatarMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarRemove = () => {
    setAvatarMenuOpen(false);
    setProfile((previous) => ({ ...previous, photo: "" }));
  };

  const exportPortfolio = () => {
    const summary = {
      name: profile.name,
      email: profile.email,
      skills: profile.skills,
      stats: analytics,
      topPosts: postsWithUser.slice(0, 3).map((post) => ({
        content: post.content,
        category: post.category,
        likes: post.likes.length,
        comments: post.comments.length,
      })),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "student-community-portfolio.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    signOut();
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      {toast && <div className="dashboard-toast">{toast}</div>}
      <div className="topbar modern-topbar">
        <div>
          <h3>Student Community Platform</h3>
          <p className="topbar-subtitle">Build. Network. Get hired.</p>
        </div>
        <div className="topbar-actions">
          <button onClick={() => setActiveTab("analytics")}>📈 Analytics</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="sidebar">
          <button className={`sidebar-nav-btn ${activeTab === "feed" ? "active" : ""}`} onClick={() => setActiveTab("feed")}>🏠 Smart Feed</button>
          <button className={`sidebar-nav-btn ${activeTab === "bookmarks" ? "active" : ""}`} onClick={() => setActiveTab("bookmarks")}>🔖 Saved Posts</button>
          <button className={`sidebar-nav-btn ${activeTab === "opportunities" ? "active" : ""}`} onClick={() => setActiveTab("opportunities")}>🚀 Opportunities</button>
          <button className={`sidebar-nav-btn ${activeTab === "resources" ? "active" : ""}`} onClick={() => setActiveTab("resources")}>📚 Learning Hub</button>
          <button className={`sidebar-nav-btn ${activeTab === "goals" ? "active" : ""}`} onClick={() => setActiveTab("goals")}>🎯 Weekly Goals</button>
          <button className={`sidebar-nav-btn ${activeTab === "moderation" ? "active" : ""}`} onClick={() => setActiveTab("moderation")}>🛡️ Moderation ({flaggedPosts.length})</button>
          <button className={`sidebar-nav-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>👤 Profile</button>
        </div>

        <div className="content">
          {(activeTab === "feed" || activeTab === "bookmarks") && (
            <>
              <div className="compose-row">
                <textarea
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  placeholder="Share project updates, hackathon ideas, or internship tips..."
                />
                <div className="compose-actions">
                  <select value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>
                    <option>Project</option>
                    <option>Announcement</option>
                    <option>Doubt/Help</option>
                    <option>Career/Internship</option>
                  </select>
                  <button onClick={addPost}>Post</button>
                </div>
              </div>

              <div className="feed-toolbar">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by text, category, or #tag"
                />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="latest">Latest</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              {postsWithUser
                .filter((post) => (activeTab === "bookmarks" ? bookmarks.includes(post.id) : true))
                .map((post) => (
                  <div key={post.id} className="post-card modern-post-card">
                    <div className="post-head">
                      <p>
                        <b>{post.userName}</b> · <span className="post-time">{formatDate(post.created_at)}</span>
                      </p>
                      <div className="post-head-actions">
                        {post.user_id === authUser?.id && (
                          <button className="delete-post-btn" onClick={() => deletePost(post)}>
                            Delete
                          </button>
                        )}
                        {post.user_id !== authUser?.id && (
                          <select className="report-select" defaultValue="" onChange={(event) => reportPost(post, event.target.value)}>
                            <option value="" disabled>Report</option>
                            {REPORT_REASONS.map((reason) => (
                              <option key={`${post.id}-${reason}`} value={reason}>{reason}</option>
                            ))}
                          </select>
                        )}
                        <button className="bookmark-btn" onClick={() => toggleBookmark(post.id)}>
                          {bookmarks.includes(post.id) ? "★ Saved" : "☆ Save"}
                        </button>
                      </div>
                    </div>

                    <span className="category-chip" style={{ background: CATEGORY_COLORS[post.category] || "#475569" }}>
                      {post.category}
                    </span>
                    <p>{post.content}</p>

                    <div className="tags-row">
                      {post.tags.map((tag) => (
                        <span key={`${post.id}-${tag}`} className="tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="action-row">
                      <button onClick={() => toggleLike(post)}>👍 {post.likes.length}</button>
                      <span>💬 {post.comments.length}</span>
                      <span>🔥 Score {post.score}</span>
                      {post.reports.length > 0 && <span className="report-count">🚩 {post.reports.length}</span>}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {post.comments.map((comment, index) => (
                        <p key={`${post.id}-${index}`}>💬 <b>{usersById[comment.user_id]?.name || "Community Member"}</b>: {comment.text}</p>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        value={commentText[post.id] || ""}
                        onChange={(event) => setCommentText((prev) => ({ ...prev, [post.id]: event.target.value }))}
                        placeholder="Write a comment"
                      />
                      <button onClick={() => addComment(post)}>Comment</button>
                    </div>
                  </div>
                ))}
            </>
          )}

          {activeTab === "moderation" && (
            <div className="profile-section moderation-panel" style={{ maxWidth: 900 }}>
              <h3>Community Moderation Queue</h3>
              <p>Review flagged posts quickly and keep discussion professional.</p>
              {flaggedPosts.length === 0 && <p className="empty-state">No flagged posts. Community looks healthy ✅</p>}
              {flaggedPosts.map((post) => (
                <div key={`flagged-${post.id}`} className="opportunity-card moderation-card">
                  <div>
                    <h4>{post.userName}</h4>
                    <p>{post.content}</p>
                    <small>
                      Reports: {post.reports.length} · Reasons: {post.reports.map((item) => item.reason).join(", ")}
                    </small>
                  </div>
                  <button onClick={() => resolveReports(post)}>Resolve</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "opportunities" && (
            <div className="profile-section" style={{ maxWidth: 900 }}>
              <h3>Career & Growth Opportunities</h3>
              {OPPORTUNITIES.map((item) => (
                <div key={item.title} className="opportunity-card">
                  <div>
                    <h4>{item.title}</h4>
                    <p>
                      {item.type} · Deadline: {item.deadline}
                    </p>
                  </div>
                  <a href={item.link} target="_blank" rel="noreferrer">
                    Apply / Explore
                  </a>
                </div>
              ))}
            </div>
          )}

          {activeTab === "resources" && (
            <div className="profile-section" style={{ maxWidth: 900 }}>
              <h3>Learning Hub</h3>
              <p>Curated resources for interviews, open source and career growth.</p>
              <div className="resource-grid">
                {LEARNING_RESOURCES.map((resource) => (
                  <a key={resource.title} href={resource.link} target="_blank" rel="noreferrer" className="resource-card">
                    <small>{resource.type}</small>
                    <h4>{resource.title}</h4>
                    <span>Open resource →</span>
                  </a>
                ))}
              </div>

              <h4 style={{ marginTop: 20 }}>Top Contributors Leaderboard</h4>
              <div className="leaderboard-wrap">
                {leaderboard.length === 0 && <p className="empty-state">No activity yet. Be the first contributor 🚀</p>}
                {leaderboard.map((item, index) => (
                  <div key={item.userId} className="leaderboard-item">
                    <b>#{index + 1} {item.name}</b>
                    <span>{item.points} pts · {item.posts} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="profile-section" style={{ maxWidth: 900 }}>
              <h3>Weekly Goal Tracker</h3>
              <p>Track your progress for consistency in learning and shipping.</p>
              <div className="goal-input-row">
                <input
                  value={goalInput}
                  onChange={(event) => setGoalInput(event.target.value)}
                  placeholder="Ex: Solve 5 DSA problems / Build 1 mini project"
                />
                <button onClick={addGoal}>Add Goal</button>
              </div>

              <div className="goal-list-wrap">
                {goals.length === 0 && <p className="empty-state">No goals yet. Add one and start building momentum.</p>}
                {goals.map((goal) => (
                  <div key={goal.id} className="goal-item">
                    <label>
                      <input type="checkbox" checked={goal.completed} onChange={() => toggleGoal(goal.id)} />
                      <span className={goal.completed ? "goal-done" : ""}>{goal.title}</span>
                    </label>
                    <button onClick={() => removeGoal(goal.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="profile-section" style={{ maxWidth: 900 }}>
              <h3>Impact Analytics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <p>Total Posts</p>
                  <h2>{analytics.myPosts}</h2>
                </div>
                <div className="stat-card">
                  <p>Total Likes Received</p>
                  <h2>{analytics.myLikesReceived}</h2>
                </div>
                <div className="stat-card">
                  <p>Comments Received</p>
                  <h2>{analytics.myCommentsReceived}</h2>
                </div>
                <div className="stat-card">
                  <p>7-day Consistency</p>
                  <h2>{analytics.streakDays} days</h2>
                </div>
              </div>
              <button onClick={exportPortfolio}>Export Resume-ready Portfolio JSON</button>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="profile-modern-wrap">
              <div className="profile-summary-card">
                <div className="profile-avatar-wrap exact-avatar">
                  <div className="avatar-ring-outer">
                    <div className="avatar-ring-inner">
                      <div className="avatar-photo-holder">
                        {profile.photo ? (
                          <img src={profile.photo} alt="Profile" />
                        ) : (
                          <div className="avatar-placeholder">
                            {(profile.name || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="avatar-camera-btn"
                    onClick={handleAvatarButtonClick}
                  >
                    📷
                  </button>

                  {avatarMenuOpen && (
                    <div className="profile-avatar-menu">
                      <button onClick={handleAvatarUploadClick}>Upload photo</button>
                      <button onClick={handleAvatarRemove} disabled={!profile.photo}>
                        Remove photo
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoChange}
                  />
                </div>

                <h3>{profile.name || "Your Name"}</h3>
                <p>{profile.email || "email@example.com"}</p>

                <div className="profile-badge-wrap">
                  {achievementBadges.map((badge) => (
                    <span key={badge} className="profile-badge">{badge}</span>
                  ))}
                </div>

                <div className="profile-completion-card">
                  <p>Profile Strength</p>
                  <div className="profile-progress-track">
                    <div className="profile-progress-fill" style={{ width: `${profileCompletion}%` }} />
                  </div>
                  <small>{profileCompletion}% complete</small>
                </div>

                <div className="profile-mini-stats">
                  <div>
                    <span>{analytics.myPosts}</span>
                    <small>Posts</small>
                  </div>
                  <div>
                    <span>{analytics.myLikesReceived}</span>
                    <small>Likes</small>
                  </div>
                  <div>
                    <span>{analytics.streakDays}</span>
                    <small>Streak</small>
                  </div>
                </div>

                {skillTags.length > 0 && (
                  <div className="skill-chip-wrap">
                    {skillTags.map((skill) => (
                      <span key={skill} className="skill-chip">{skill}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-edit-card">
                <div className="profile-hero-strip">
                  <div>
                    <h3>Talent Snapshot</h3>
                    <p>Industry-grade profile card for recruiters, mentors, and collaborators.</p>
                  </div>
                  <span className="availability-pill">Open to internships</span>
                </div>

                <div className="profile-heading">
                  <h3>Profile Details</h3>
                  <p>Make your profile stand out to recruiters and peers.</p>
                </div>

                <div className="profile-form-grid">
                  <div>
                    <label>Full Name</label>
                    <input type="text" value={profile.name} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enter your full name" />
                  </div>

                  <div>
                    <label>Email</label>
                    <input type="email" value={profile.email} disabled placeholder="Email" />
                  </div>

                  <div>
                    <label>Phone</label>
                    <input type="text" value={profile.phone} onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+91 98xxxxxx" />
                  </div>

                  <div>
                    <label>Gender</label>
                    <select value={profile.gender} onChange={(event) => setProfile((prev) => ({ ...prev, gender: event.target.value }))}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label>Skills</label>
                  <input
                    type="text"
                    value={profile.skills}
                    onChange={(event) => setProfile((prev) => ({ ...prev, skills: event.target.value }))}
                    placeholder="React, Node.js, MongoDB, DSA, UI/UX"
                  />
                </div>

                <div className="profile-checklist-card">
                  <h4>Recruiter Readiness Checklist</h4>
                  {profileChecklist.map((item) => (
                    <p key={item.label} className="checklist-item">
                      <span>{item.done ? "✅" : "⬜"}</span> {item.label}
                    </p>
                  ))}
                </div>

                <button className="save-profile-btn" onClick={saveProfile}>Save Profile</button>
              </div>
              <button onClick={exportPortfolio}>Export Resume-ready Portfolio JSON</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
