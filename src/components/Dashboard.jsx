import React, { useEffect, useMemo, useState } from "react";
import "../style.css";
import {
  createPost,
  getSession,
  getUserProfile,
  listPosts,
  signOut,
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
  Announcement: "#334155",
  Project: "#2563eb",
  "Doubt/Help": "#0f766e",
  "Career/Internship": "#7c3aed",
};

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
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", gender: "Male", photo: "", skills: "" });

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

    const load = async () => {
      const [user, postRows] = await Promise.all([getUserProfile(authUser.id), listPosts()]);

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

      setPosts(
        postRows.map((p) => ({
          ...p,
          likes: p.likes || [],
          comments: p.comments || [],
          category: p.category || "Project",
          tags: p.tags || [],
        }))
      );
    };

    load();
  }, [authUser]);

  const postsWithUser = useMemo(() => {
    const decorated = posts.map((post) => ({
      ...post,
      score: post.likes.length * 2 + post.comments.length,
      userName: post.user_id === authUser?.id ? profile.name || "You" : "Community Member",
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
  }, [posts, authUser, profile.name, search, sortBy]);

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

  const profileCompletion = useMemo(() => {
    const fields = [profile.name, profile.phone, profile.gender, profile.skills, profile.photo];
    const completed = fields.filter((field) => String(field || "").trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [profile]);

  const toggleBookmark = (postId) => {
    if (!authUser?.id) return;
    const updated = bookmarks.includes(postId) ? bookmarks.filter((id) => id !== postId) : [...bookmarks, postId];
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${authUser.id}`, JSON.stringify(updated));
  };

  const addPost = async () => {
    if (!postText.trim() || !authUser?.id) return;
    const tags = (postText.match(/#[a-zA-Z0-9_]+/g) || []).map((tag) => tag.toLowerCase());
    const created = await createPost({
      userId: authUser.id,
      content: postText.trim(),
      category: postCategory,
      tags,
    });
    setPosts((prev) => [{ ...created, category: postCategory, tags }, ...prev]);
    setPostText("");
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

  const saveProfile = async () => {
    if (!authUser?.id) return;
    await updateUserProfile(authUser.id, {
      name: profile.name,
      phone: profile.phone,
      gender: profile.gender,
      skills: profile.skills,
      photo: profile.photo,
    });
    alert("Profile updated");
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
                      <button className="bookmark-btn" onClick={() => toggleBookmark(post.id)}>
                        {bookmarks.includes(post.id) ? "★ Saved" : "☆ Save"}
                      </button>
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
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {post.comments.map((comment, index) => (
                        <p key={`${post.id}-${index}`}>💬 {comment.text}</p>
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
                <div className="profile-avatar-wrap">
                  {profile.photo ? (
                    <img className="profile-avatar" src={profile.photo} alt="Profile" />
                  ) : (
                    <div className="profile-avatar placeholder">
                      {(profile.name || "U").trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h3>{profile.name || "Your Name"}</h3>
                <p>{profile.email || "email@example.com"}</p>

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
              </div>

              <div className="profile-edit-card">
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
                  <label>Photo URL (Optional)</label>
                  <div className="photo-row">
                    <input
                      type="url"
                      value={profile.photo}
                      onChange={(event) => setProfile((prev) => ({ ...prev, photo: event.target.value }))}
                      placeholder="https://your-image-link.com/profile.jpg"
                    />
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={() => setProfile((prev) => ({ ...prev, photo: "" }))}
                      disabled={!profile.photo}
                    >
                      Remove Photo
                    </button>
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

                <button className="save-profile-btn" onClick={saveProfile}>Save Profile</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
