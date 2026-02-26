import React, { useState } from "react";

function CreatePost({ posts, setPosts }) {
  const [text, setText] = useState("");
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const addPost = () => {
    if (text.trim() === "") return;

    const newPost = {
      user: user.name,
      text: text
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem("posts", JSON.stringify(updatedPosts));
    setText("");
  };

  return (
    <div className="card">
      <textarea
        placeholder="Write your doubt or idea..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={addPost}>Post</button>
    </div>
  );
}

export default CreatePost;
