import React from "react";

function Post({ post }) {
  return (
    <div className="post">
      <strong>{post.user}</strong>
      <p>{post.text}</p>
    </div>
  );
}

export default Post;
