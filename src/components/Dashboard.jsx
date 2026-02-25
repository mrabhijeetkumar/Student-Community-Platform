import React, { useState, useEffect } from "react";
import "../style.css";
import { supabase } from "../supabase";

function Dashboard() {

  /* ================== 1️⃣ ALL STATES ================== */
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [posts, setPosts] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState({});

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

  /* ================== 2️⃣ AUTH CHECK ================== */
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingUser) {
        await supabase.auth.signOut();
        window.location.href = "/signup";
        return;
      }

      setAuthUser(user);
      setLoadingAuth(false);
    };

    checkUser();
  }, []);

  /* ================== 3️⃣ DARK MODE ================== */
  useEffect(() => {
    if (theme === "Dark") document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [theme]);

  /* ================== 4️⃣ LOAD PROFILE ================== */
  useEffect(() => {
    if (!authUser?.id) return;

    const loadProfile = async () => {
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      // If no row or error, create/repair it using auth info
      if (!data || error) {
        const baseName =
          authUser.user_metadata?.full_name ||
          (authUser.email ? authUser.email.split("@")[0] : "User");
        const avatar = authUser.user_metadata?.avatar_url || "";

        const upsertPayload = {
          id: authUser.id,
          email: authUser.email || "",
          name: baseName,
          gender: "Male",
          phone: "",
          theme: "Light",
          language: "Eng",
          notification: "Allow",
          photo: avatar
        };

        const upsertRes = await supabase
          .from("users")
          .upsert(upsertPayload)
          .select()
          .maybeSingle();

        data = upsertRes.data || upsertPayload;
      }

      if (data) {
        const fallbackName =
          data.name ||
          authUser.user_metadata?.full_name ||
          (authUser.email ? authUser.email.split("@")[0] : "User");

        const finalEmail = data.email || authUser.email || "";
        const finalPhoto = data.photo || authUser.user_metadata?.avatar_url || "";

        setProfile({
          name: fallbackName,
          email: finalEmail,
          phone: data.phone || "",
          gender: data.gender || "Male",
          photo: finalPhoto
        });

        // If stored row is missing basic fields, patch it once
        const needsUpdate =
          data.name !== fallbackName ||
          data.email !== finalEmail ||
          data.photo !== finalPhoto;

        if (needsUpdate) {
          await supabase
            .from("users")
            .update({
              name: fallbackName,
              email: finalEmail,
              photo: finalPhoto
            })
            .eq("id", authUser.id);
        }

        setTheme(data.theme || "Light");
        setLanguage(data.language || "Eng");
        setNotification(data.notification || "Allow");

        setUsers(prev => ({
          ...prev,
          [authUser.id]: {
            name: fallbackName || "User",
            photo: finalPhoto || ""
          }
        }));
      }
    };

    loadProfile();
  }, [authUser]);

  /* ================== 5️⃣ LOAD POSTS ================== */
  useEffect(() => {
    const loadPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        return;
      }

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

  /* ================= SAFE PROFILE GET ================= */
  const getProfile = (uid) =>
    users[uid] || { name: "User", photo: "" };

  /* ================= PROFILE PHOTO ================= */
  const handlePhotoChange = async (e) => {
    if (!authUser) return;
    const file = e.target.files[0];
    if (!file) return;

    const filePath = `${authUser.id}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert("Upload failed");
      return;
    }

    const { data } = supabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    const url = data.publicUrl;

    setProfile(prev => ({ ...prev, photo: url }));

    await supabase
      .from("users")
      .update({ photo: url })
      .eq("id", authUser.id);
  };

  /* ================= SAVE PROFILE ================= */
  const handleProfileSave = async () => {
    await supabase.from("users").upsert({
      id: authUser.id,
      email: authUser.email,
      name: profile.name,
      phone: profile.phone,
      gender: profile.gender,
      photo: profile.photo
    });

    alert("Profile updated ✅");
  };

  /* ================= SETTINGS ================= */
  const saveSettings = async () => {
    await supabase
      .from("users")
      .update({ theme, language, notification })
      .eq("id", authUser.id);

    alert("Settings saved ✅");
  };

  /* ================= POSTS ================= */
  const addPost = async (text) => {
    if (!text.trim()) return;

    const { data } = await supabase
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

    if (data) setPosts(prev => [data, ...prev]);
  };

  const toggleLike = async (post) => {
    const likes = post.likes.includes(authUser.id)
      ? post.likes.filter(i => i !== authUser.id)
      : [...post.likes, authUser.id];

    await supabase.from("posts").update({ likes }).eq("id", post.id);

    setPosts(prev =>
      prev.map(p => p.id === post.id ? { ...p, likes } : p)
    );
  };

  const addComment = async (post, text) => {
    if (!text.trim()) return;

    const comments = [
      ...post.comments,
      { id: Date.now(), userUid: authUser.id, text }
    ];

    await supabase.from("posts").update({ comments }).eq("id", post.id);

    setPosts(prev =>
      prev.map(p => p.id === post.id ? { ...p, comments } : p)
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
      prev.map(p => p.id === post.id ? { ...p, content: txt } : p)
    );
  };

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/login";
  };

  /* ================= LOADING ================= */
  if (loadingAuth) {
    return <h2 style={{ textAlign: "center" }}>Checking access...</h2>;
  }

  /* ================= FINAL UI ================= */
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
              <textarea id="postText" />
              <button onClick={() => {
                addPost(document.getElementById("postText").value);
                document.getElementById("postText").value = "";
              }}>Post</button>

              {posts.map(post => (
                <div key={post.id} className="post-card">
                  <p>{post.content}</p>
                  <button onClick={() => toggleLike(post)}>
                    👍 {post.likes.length}
                  </button>
                </div>
              ))}
            </>
          )}
          {activeTab === "profile" && (
            <div className="profile-section" style={{ display: 'flex', gap: 32, alignItems: 'stretch', width: '100%' }}>
              {/* Left card: menu + avatar */}
              <div style={{ flex: 0.35, background: 'rgba(15,23,42,0.9)', borderRadius: 24, padding: 24, boxShadow: '0 18px 45px rgba(0,0,0,0.55)', border: '1px solid rgba(148,163,184,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="profile-photo-input" style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                    {profile.photo ? (
                      <img src={profile.photo} alt="Profile" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #38bdf8' }} />
                    ) : (
                      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(148,163,184,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#e5e7eb', border: '2px solid rgba(148,163,184,0.5)' }}>👤</div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#3b82f6', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, border: '2px solid #0f172a' }}>✎</div>
                  </label>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 18 }}>Click avatar to change photo</div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{profile.name || 'Your name'}</div>
                <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 18 }}>{profile.email || 'Email account'}</div>

                <div style={{ width: '100%', height: 1, background: 'rgba(148,163,184,0.3)', margin: '8px 0 16px' }} />

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15 }}>
                  <button style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 12, border: 'none', background: '#1d283a', color: '#e5e7eb', fontWeight: 600, cursor: 'default' }}>👤 My Profile</button>
                  <button style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'default' }}>⚙️ Settings</button>
                  <button style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'default' }}>🔔 Notification&nbsp; <span style={{ color: '#4ade80' }}>Allow</span></button>
                </div>

                <button onClick={handleLogout} style={{ marginTop: 'auto', marginBottom: 4, alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent', color: '#f97373', fontWeight: 600, cursor: 'pointer' }}>📕 Log Out</button>
              </div>

              {/* Right card: editable details */}
              <div style={{ flex: 0.65, background: 'rgba(15,23,42,0.92)', borderRadius: 24, padding: 28, boxShadow: '0 18px 45px rgba(0,0,0,0.55)', border: '1px solid rgba(148,163,184,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 20 }}>📝</span>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>Your name</h3>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.4)', background: '#020617', color: '#e5e7eb' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>Email account</label>
                  <input
                    type="text"
                    value={profile.email}
                    disabled
                    style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.4)', background: '#020617', color: '#64748b' }}
                  />
                </div>

                <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>Mobile number</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Add number"
                      style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.4)', background: '#020617', color: '#e5e7eb' }}
                    />
                  </div>
                  <div style={{ width: 160 }}>
                    <label style={{ display: 'block', fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>Location</label>
                    <input
                      type="text"
                      value="India"
                      disabled
                      style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(148,163,184,0.4)', background: '#020617', color: '#64748b' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleProfileSave}
                  style={{ marginTop: 8, padding: '10px 32px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: 999, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 25px rgba(37,99,235,0.45)' }}
                >
                  Save Change
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;