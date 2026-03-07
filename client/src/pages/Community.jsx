import { useEffect, useState } from "react";
import Notification from "../components/Notification";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext.jsx";
import { createPost, getPosts } from "../services/api";

export default function Community() {
    const { token, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [postText, setPostText] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const loadPosts = async () => {
        try {
            setLoading(true);
            setMessage("");
            const data = await getPosts();
            setPosts(data);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handleCreatePost = async (event) => {
        event.preventDefault();

        if (!token) {
            setMessage("Sign in to create a post.");
            return;
        }

        try {
            const createdPost = await createPost(postText, token);
            setPosts((currentPosts) => [createdPost, ...currentPosts]);
            setPostText("");
            setMessage("");
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts((currentPosts) =>
            currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
        );
    };

    const stats = [
        { label: "Posts", value: posts.length },
        { label: "Signed in", value: user ? "Yes" : "No" },
        { label: "API", value: "Connected" }
    ];

    return (
        <section className="community-layout">
            <div className="content-column">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Community feed</p>
                        <h1>Latest student posts</h1>
                    </div>
                </div>

                <Notification tone="warning" message={message} />

                <form className="composer-card" onSubmit={handleCreatePost}>
                    <textarea
                        value={postText}
                        onChange={(event) => setPostText(event.target.value)}
                        placeholder={
                            user ? "Share an update with your community" : "Sign in to publish a post"
                        }
                        rows="4"
                    />
                    <button type="submit" className="primary-button">
                        Publish post
                    </button>
                </form>

                <div className="feed-column">
                    {loading ? <p className="muted-text">Loading posts...</p> : null}
                    {!loading && posts.length === 0 ? (
                        <p className="muted-text">No posts yet. Start the conversation.</p>
                    ) : null}

                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} onPostUpdated={handlePostUpdated} />
                    ))}
                </div>
            </div>

            <Sidebar stats={stats} />
        </section>
    );
}
