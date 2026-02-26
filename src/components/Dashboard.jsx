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

function Dashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [postText, setPostText] = useState("");
  const [commentText, setCommentText] = useState({});
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", gender: "Male", photo: "" });

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

    const load = async () => {
      const [user, postRows] = await Promise.all([getUserProfile(authUser.id), listPosts()]);

      if (user) {
        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          gender: user.gender || "Male",
          photo: user.photo || "",
        });
      }

      setPosts(postRows.map((p) => ({ ...p, likes: p.likes || [], comments: p.comments || [] })));
    };

    load();
  }, [authUser]);

  const postsWithUser = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        userName: post.user_id === authUser?.id ? profile.name || "You" : "Community Member",
      })),
    [posts, authUser, profile.name]
  );

  const addPost = async () => {
    if (!postText.trim() || !authUser?.id) return;
    const created = await createPost({ userId: authUser.id, content: postText.trim() });
    setPosts((prev) => [created, ...prev]);
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
    const comments = [...post.comments, { user_id: authUser.id, text }];
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
      photo: profile.photo,
    });
    alert("Profile updated");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setProfile((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    signOut();
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
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
          {(activeTab === "dashboard" || activeTab === "posts") && (
            <>
              <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Share something with your community..." />
              <button onClick={addPost}>Post</button>

              {postsWithUser.map((post) => (
                <div key={post.id} className="post-card">
                  <p><b>{post.userName}</b></p>
                  <p>{post.content}</p>
                  <button onClick={() => toggleLike(post)}>👍 {post.likes.length}</button>

                  <div style={{ marginTop: 12 }}>
                    {post.comments.map((comment, index) => (
                      <p key={`${post.id}-${index}`}>💬 {comment.text}</p>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      value={commentText[post.id] || ""}
                      onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment"
                    />
                    <button onClick={() => addComment(post)}>Comment</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === "profile" && (
            <div className="profile-section" style={{ maxWidth: 600 }}>
              <h3>Your Profile</h3>
              <input type="text" value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" />
              <input type="email" value={profile.email} disabled placeholder="Email" />
              <input type="text" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
              <select value={profile.gender} onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
              {profile.photo && <img src={profile.photo} alt="Profile" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "50%" }} />}
              <button onClick={saveProfile}>Save Profile</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
