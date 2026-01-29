import React, { useState, useEffect } from "react";
import "../style.css";

// 🔥 SUPABASE
import { supabase } from "../supabase";

function Dashboard({ user }) {
  console.log("DASHBOARD USER:", user);

  const [posts, setPosts] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState({});

  /* ================= LOAD ALL USERS ================= */
  useEffect(() => {
    const loadUsers = async () => {
      const { data } = await supabase.from("users").select("*");
      if (data) {
        const map = {};
        data.forEach(u => {
          map[u.id] = u;
        });
        setUsers(map);
      }
    };
    loadUsers();
  }, []);

  /* ================= SAFE PROFILE GET ================= */
  const getProfile = (uid) => {
    return users[uid] || { name: "User", photo: "" };
  };

  /* ================= PROFILE STATE ================= */
  const [profile, setProfile] = useState({
    name: "",
    email: user.email,
    phone: "",
    gender: "Male",
    photo: ""
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState("Allow"); // Allow | Mute
  const [theme, setTheme] = useState("Light"); // Light | Dark
  const [language, setLanguage] = useState("Eng"); // Eng | Hindi

  /* ================= 🌑 DARK MODE EFFECT ================= */
  useEffect(() => {
    if (theme === "Dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  /* ================= LOAD CURRENT USER PROFILE & SETTINGS (✅ STEP 4 UPDATED) ================= */
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.uid)
        .single();

      if (data) {
        // Load Profile Data
        setProfile({
          name: data.name || "",
          email: data.email || user.email,
          phone: data.phone || "",
          gender: data.gender || "Male",
          photo: data.photo || ""
        });

        // ✅ Load Settings Data
        setTheme(data.theme || "Light");
        setLanguage(data.language || "Eng");
        setNotification(data.notification || "Allow");
      }
    };

    loadProfile();
  }, [user]);

  /* ================= LOAD POSTS ================= */
  useEffect(() => {
    const loadPosts = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (data) {
        setPosts(
          data.map(p => ({
            ...p,
            likes: Array.isArray(p.likes) ? p.likes : [],
            comments: Array.isArray(p.comments) ? p.comments : []
          }))
        );
      }
    };
    loadPosts();
  }, []);

  /* ================= PROFILE PHOTO UPLOAD ================= */
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filePath = `${user.uid}.jpg`;

    const { error } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert("Image upload failed ❌");
      return;
    }

    const { data } = supabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    setProfile(prev => ({ ...prev, photo: data.publicUrl }));
  };

  /* ================= SAVE PROFILE ================= */
  const handleProfileSave = async () => {
    const { error } = await supabase.from("users").upsert({
      id: user.uid,
      email: user.email,
      name: profile.name,
      phone: profile.phone || "",
      gender: profile.gender,
      photo: profile.photo || ""
    });

    if (error) alert("Profile save failed ❌");
    else alert("Profile updated successfully ✅");
  };

  /* ================= SAVE SETTINGS (✅ STEP 5 ADDED) ================= */
  const saveSettings = async () => {
    const { error } = await supabase.from("users").update({
      theme,
      language,
      notification
    }).eq("id", user.uid);

    if (error) alert("Settings save failed ❌");
    else alert("Settings saved successfully ✅");
  };

  /* ================= ADD POST ================= */
  const addPost = async (text) => {
    if (!text.trim()) return;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_uid: user.uid,
        content: text,
        likes: [],
        comments: [],
        deleted: false
      })
      .select()
      .single();

    if (!error && data) {
      setPosts(prev => [data, ...prev]);
    }
  };

  /* ================= LIKE ================= */
  const toggleLike = async (post) => {
    const likes = post.likes.includes(user.uid)
      ? post.likes.filter(e => e !== user.uid)
      : [...post.likes, user.uid];

    await supabase.from("posts").update({ likes }).eq("id", post.id);

    // ✅ REALTIME UI UPDATE
    setPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, likes } : p))
    );
  };

  /* ================= COMMENT ================= */
  const addComment = async (post, text) => {
    if (!text.trim()) return;

    const newComment = {
      id: Date.now(),
      userUid: user.uid,
      text
    };

    const comments = [...post.comments, newComment];

    await supabase
      .from("posts")
      .update({ comments })
      .eq("id", post.id);

    // ✅ REALTIME UI UPDATE
    setPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, comments } : p))
    );
  };

  const deletePost = async (post) => {
    await supabase.from("posts").update({ deleted: true }).eq("id", post.id);

    // ✅ REALTIME UI UPDATE
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  const editPost = async (post) => {
    const txt = prompt("Edit post", post.content);
    if (!txt) return;

    await supabase.from("posts").update({ content: txt }).eq("id", post.id);

    // ✅ REALTIME UI UPDATE
    setPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, content: txt } : p))
    );
  };

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ================= POST UI ================= */
  const renderPost = (post) => {
    const postProfile = getProfile(post.user_uid);

    return (
      <div className="post-card" key={post.id}>
        <div className="post-header">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <img
              src={postProfile.photo || "https://via.placeholder.com/40"}
              alt="profile"
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />
            <strong>{postProfile.name}</strong>
          </div>

          {post.user_uid === user.uid && (
            <div className="menu-wrapper">
              <span
                className="three-dots"
                onClick={() =>
                  setMenuOpenId(menuOpenId === post.id ? null : post.id)
                }
              >
                ⋮
              </span>

              {menuOpenId === post.id && (
                <div className="menu-box">
                  <p onClick={() => editPost(post)}>✏️ Edit</p>
                  <p onClick={() => deletePost(post)}>🗑 Delete</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p>{post.content}</p>

        <button className="like-btn" onClick={() => toggleLike(post)}>
          👍 Like ({post.likes.length})
        </button>

        <div className="comment-section">
          {post.comments.map(c => {
            const cProfile = getProfile(c.userUid);
            return (
              <p key={c.id}>
                <b>{cProfile.name}:</b> {c.text}
              </p>
            );
          })}

          <div className="comment-box">
            <input id={`c-${post.id}`} placeholder="Write a comment..." />
            <button
              onClick={() => {
                const i = document.getElementById(`c-${post.id}`);
                addComment(post, i.value);
                i.value = "";
              }}
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="topbar">
        <h3>Student Community Platform</h3>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-body">
        <div className="sidebar">
          <p onClick={() => setActiveTab("dashboard")}>🏠 Dashboard</p>
          <p onClick={() => setActiveTab("posts")}>📝 Posts</p>
          <p onClick={() => setActiveTab("profile")}>👤 Profile</p>
        </div>

        <div className="content">
          {activeTab === "dashboard" && (
            <>
              <h1>Welcome, {profile.name} 👋</h1>

              <div className="card-box">
                <textarea
                  id="postText"
                  className="post-input"
                  placeholder="What's on your mind?"
                />
                <button
                  className="post-btn"
                  onClick={() => {
                    const t = document.getElementById("postText").value;
                    addPost(t);
                    document.getElementById("postText").value = "";
                  }}
                >
                  Post
                </button>
              </div>

              {posts.map(renderPost)}
            </>
          )}

          {activeTab === "profile" && (
            <div className="profile-layout">
              {/* LEFT PROFILE MENU */}
              <div className="profile-sidebar">
                <div className="profile-user">
                  <img
                    src={profile.photo || "https://via.placeholder.com/60"}
                    alt="user"
                  />
                  <div>
                    <h4>{profile.name || "Your name"}</h4>
                    <p>{profile.email}</p>
                  </div>
                </div>

                <div className="profile-menu">
                  <div className="menu-item active">👤 My Profile</div>
                  <div className="menu-item" onClick={() => setShowSettings(true)}>
                    ⚙️ Settings
                  </div>

                  <div
                    className="menu-item"
                    onClick={() => setShowNotification(!showNotification)}
                  >
                    🔔 Notification
                    <span className="menu-action">{notification}</span>

                    {showNotification && (
                      <div className="notification-dropdown">
                        <p onClick={() => {
                          setNotification("Allow");
                          setShowNotification(false);
                        }}>Allow</p>

                        <p onClick={() => {
                          setNotification("Mute");
                          setShowNotification(false);
                        }}>Mute</p>
                      </div>
                    )}
                  </div>

                  <div className="menu-item logout" onClick={handleLogout}>
                    🚪 Log Out
                  </div>
                </div>
              </div>

              {/* RIGHT PROFILE DETAILS */}
              <div className="profile-details">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <img
                      src={profile.photo || "https://via.placeholder.com/80"}
                      alt="profile"
                    />
                    <label className="edit-avatar">
                      ✏️
                      <input type="file" hidden onChange={handlePhotoChange} />
                    </label>
                  </div>

                  <div>
                    <h3>{profile.name || "Your name"}</h3>
                    <p>{profile.email}</p>
                  </div>
                </div>

                <div className="profile-form">
                  <div className="form-row">
                    <label>Name</label>
                    <input
                      value={profile.name}
                      onChange={e =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <label>Email account</label>
                    <input value={profile.email} disabled />
                  </div>

                  <div className="form-row">
                    <label>Mobile number</label>
                    <input
                      placeholder="Add number"
                      value={profile.phone}
                      onChange={e =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <label>Location</label>
                    <input placeholder="India" />
                  </div>

                  <button
                    className="save-profile-btn"
                    onClick={handleProfileSave}
                  >
                    Save Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && posts.map(renderPost)}
        </div>
      </div>

      {/* 🔥 SETTINGS POPUP (✅ STEP 6 UPDATED WITH SAVE BUTTON) */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-card">
            <div className="settings-header">
              <h3>Settings</h3>
              <span onClick={() => setShowSettings(false)}>✖</span>
            </div>

            <div className="settings-row">
              <label>Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>

            <div className="settings-row">
              <label>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>Eng</option>
                <option>Hindi</option>
              </select>
            </div>

            {/* ✅ SAVE BUTTON ADDED */}
            <button
              className="save-btn"
              style={{ marginTop: "10px" }}
              onClick={() => {
                saveSettings();
                setShowSettings(false);
              }}
            >
              Save Change
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;