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
          map[u.id] = u; // auth.uid
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

  /* ================= LOAD CURRENT USER PROFILE ================= */
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.uid)
        .single();

      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || user.email,
          phone: data.phone || "",
          gender: data.gender || "Male",
          photo: data.photo || ""
        });
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

    const filePath = `profiles/${user.uid}.jpg`;

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

  /* ================= ADD POST (FIXED) ================= */
  const addPost = async (text) => {
    if (!text.trim()) return;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_uid: user.uid,   // ✅ FIX
        content: text,
        likes: [],
        comments: [],
        deleted: false
      })
      .select()
      .single();

    console.log("POST DATA:", data);
    console.log("POST ERROR:", error);

    if (!error && data) {
      setPosts(prev => [data, ...prev]); // ✅ UI update
    }
  };

  /* ================= LIKE ================= */
  const toggleLike = async (post) => {
    const likes = post.likes.includes(user.uid)
      ? post.likes.filter(e => e !== user.uid)
      : [...post.likes, user.uid];

    await supabase
      .from("posts")
      .update({ likes })
      .eq("id", post.id);
  };

  /* ================= COMMENT ================= */
  const addComment = async (post, text) => {
    if (!text.trim()) return;

    await supabase
      .from("posts")
      .update({
        comments: [
          ...post.comments,
          { id: Date.now(), userUid: user.uid, text }
        ]
      })
      .eq("id", post.id);
  };

  const deletePost = async (post) => {
    await supabase.from("posts").update({ deleted: true }).eq("id", post.id);
  };

  const editPost = async (post) => {
    const txt = prompt("Edit post");
    if (!txt) return;
    await supabase.from("posts").update({ content: txt }).eq("id", post.id);
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
            <>
              <h2>Edit Profile</h2>

              <div className="profile-card">
                <div className="profile-photo">
                  <img
                    src={profile.photo || "https://via.placeholder.com/120"}
                    alt="profile"
                  />
                  <label className="photo-upload">
                    📷
                    <input type="file" hidden onChange={handlePhotoChange} />
                  </label>
                </div>

                <input
                  value={profile.name}
                  onChange={e =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />

                <input
                  value={profile.phone}
                  onChange={e =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="Phone"
                />

                <input value={profile.email} disabled />

                <button className="save-btn" onClick={handleProfileSave}>
                  Save Profile
                </button>
              </div>
            </>
          )}

          {activeTab === "posts" && posts.map(renderPost)}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
