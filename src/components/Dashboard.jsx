import React, { useState, useEffect } from "react";
import "../style.css";

// 🔥 SUPABASE
import { supabase } from "../supabase";

function Dashboard() {

  /* ================= AUTH USER (ADDED) ================= */
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setAuthUser(user);
    };

    fetchUser();
  }, []);

  console.log("DASHBOARD USER:", authUser);

  const [posts, setPosts] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState({});

  /* ================= LOAD ALL USERS ================= */
  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        console.error("Error loading users:", error.message);
        return;
      }

      if (data && isMounted) {
        const map = {};
        data.forEach(u => {
          map[u.id] = u;
        });
        setUsers(map);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================= SAFE PROFILE GET ================= */
  const getProfile = (uid) => {
    if (!uid) return { name: "User", photo: "" };
    return users[uid] || { name: "User", photo: "" };
  };

  /* ================= PROFILE STATE ================= */
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "Male",
    photo: ""
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState("Allow");
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("Eng");

  /* ================= DARK MODE ================= */
  useEffect(() => {
    if (theme === "Dark") document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [theme]);

  /* ================= LOAD CURRENT USER PROFILE ================= */
  useEffect(() => {
    if (!authUser?.id) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Profile load error:", error.message);
        return;
      }

      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || authUser.email,
          phone: data.phone || "",
          gender: data.gender || "Male",
          photo: data.photo || ""
        });

        setTheme(data.theme || "Light");
        setLanguage(data.language || "Eng");
        setNotification(data.notification || "Allow");
      }
    };

    loadProfile();
  }, [authUser]);

  /* ================= LOAD POSTS ================= */
  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading posts:", error.message);
        return;
      }

      if (data && isMounted) {
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

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================= PROFILE PHOTO UPLOAD (FIXED) ================= */
  const handlePhotoChange = async (e) => {
    if (!authUser) return;

    const file = e.target.files[0];
    if (!file) return;

    // Realtime preview
    const previewUrl = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, photo: previewUrl }));

    // Unique filename to avoid cache
    const filePath = `${authUser.id}-${Date.now()}.jpg`;

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

    const publicUrl = data.publicUrl;

    // Update state
    setProfile(prev => ({ ...prev, photo: publicUrl }));

    // Save in users table
    await supabase
      .from("users")
      .update({ photo: publicUrl })
      .eq("id", authUser.id);

    // Update users map so posts/sidebar update instantly
    setUsers(prev => ({
      ...prev,
      [authUser.id]: { ...(prev[authUser.id] || {}), photo: publicUrl }
    }));
  };

  /* ================= SAVE PROFILE ================= */
  const handleProfileSave = async () => {
    if (!authUser) return;

    const { error } = await supabase.from("users").upsert({
      id: authUser.id,
      email: authUser.email,
      name: profile.name,
      phone: profile.phone || "",
      gender: profile.gender,
      photo: profile.photo || ""
    });

    if (error) alert("Profile save failed ❌");
    else alert("Profile updated successfully ✅");
  };
  /* ================= SAVE SETTINGS ================= */
  const saveSettings = async () => {
    if (!authUser) return;

    const { error } = await supabase
      .from("users")
      .update({
        theme,
        language,
        notification
      })
      .eq("id", authUser.id);

    if (error) alert("Settings save failed ❌");
    else alert("Settings saved successfully ✅");
  };

  /* ================= ADD POST ================= */
  const addPost = async (text) => {
    if (!text.trim() || !authUser) return;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_uid: authUser.id,
        content: text,
        likes: [],
        comments: [],
        deleted: false
      })
      .select()
      .single();

    if (!error && data) setPosts(prev => [data, ...prev]);
  };
  /* ================= LIKE ================= */
  const toggleLike = async (post) => {
    if (!authUser) return;

    const likes = post.likes.includes(authUser.id)
      ? post.likes.filter(e => e !== authUser.id)
      : [...post.likes, authUser.id];

    await supabase.from("posts").update({ likes }).eq("id", post.id);

    setPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, likes } : p))
    );
  };

  /* ================= COMMENT ================= */
  const addComment = async (post, text) => {
    if (!text.trim() || !authUser) return;

    const newComment = { id: Date.now(), userUid: authUser.id, text };
    const comments = [...post.comments, newComment];

    await supabase.from("posts").update({ comments }).eq("id", post.id);

    setPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, comments } : p))
    );
  };

  const deletePost = async (post) => {
    await supabase.from("posts").update({ deleted: true }).eq("id", post.id);
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  const editPost = async (post) => {
    const txt = prompt("Edit post", post.content);
    if (!txt) return;

    await supabase.from("posts").update({ content: txt }).eq("id", post.id);

    setPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, content: txt } : p))
    );
  };
  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
    }

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
              src={
                postProfile.photo
                  ? postProfile.photo + "?v=" + Date.now()
                  : "https://via.placeholder.com/40"
              }
              alt="profile"
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />
            <strong>{postProfile.name}</strong>
          </div>

          {authUser && post.user_uid === authUser.id && (
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
    <div className={`dashboard ${theme === "Dark" ? "dark-mode" : ""}`}>

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
              <div className="profile-sidebar">
                <div className="profile-user">
                  <img
                    src={
                      profile.photo
                        ? profile.photo + "?v=" + Date.now()
                        : "https://via.placeholder.com/60"
                    }
                    alt="user"
                  />
                  <div>
                    <h4>{profile.name || "Your name"}</h4>
                    <p>{profile.email || ""}</p>
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

              <div className="profile-details">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <img
                      src={
                        profile.photo
                          ? profile.photo + "?v=" + Date.now()
                          : "https://via.placeholder.com/80"
                      }
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
                onChange={(e) => {
                  const selectedTheme = e.target.value;
                  setTheme(selectedTheme);

                  supabase
                    .from("users")
                    .update({ theme: selectedTheme })
                    .eq("id", authUser.id);
                }}
              >
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>

            <div className="settings-row">
              <label>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option>Eng</option>
                <option>Hindi</option>
              </select>
            </div>

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