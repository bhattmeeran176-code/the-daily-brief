import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Admin() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("World");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
useEffect(() => {
  async function loadArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Error: " + error.message);
      return;
    }

    setArticles(data || []);
  }

  loadArticles();
}, []);
 async function addArticle(e) {
  e.preventDefault();
const { data: { user }, error: authError } =
  await supabase.auth.getUser();
   const { data: sessionData } = await supabase.auth.getSession();
console.log("SESSION:", sessionData.session);
setMessage(
  authError
    ? authError.message
    : user
    ? `Authenticated: ${user.email} | ID: ${user.id}`
    : "No authenticated user found"
);
if (authError || !user) {
  setMessage(
    authError
      ? authError.message
      : "No authenticated user found. Please log in again."
  );
  return;
}
   
  if (!title.trim() || !content.trim()) {
    setMessage("Please enter title and article content.");
    return;
  }
let finalImageUrl = imageUrl;

if (imageFile) {
  setUploading(true);

  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(fileName, imageFile);

  setUploading(false);

  if (uploadError) {
    setMessage("Image upload error: " + uploadError.message);
    return;
  }

  const { data: publicData } = supabase.storage
    .from('article-images')
    .getPublicUrl(fileName);

  finalImageUrl = publicData.publicUrl;
}
  const { data, error } = await supabase
    .from("articles")
    .insert([{
      title: title,
      category: category,
      image_url: finalImageUrl,
      content: content,
      status: "Draft"
    }])
    .select()
    .single();

  if (error) {
    setMessage("Error: " + error.message);
    return;
  }

  setArticles([data, ...articles]);
  setTitle("");
  setContent("");
   setImageUrl("");
  setMessage("Article saved successfully!");
 }

async function publishArticle(id) {
  const { data, error } = await supabase
    .from("articles")
    .update({ status: "Published" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    setMessage("Publish error: " + error.message);
    return;
  }

  setArticles(
    articles.map((article) =>
      article.id === id ? data : article
    )
  );

  setMessage("Article published successfully!");
}

  async function deleteArticle(id) {
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    setMessage("Delete error: " + error.message);
    return;
  }

  setArticles((prev) => prev.filter((article) => article.id !== id));
  setMessage("Article deleted successfully!");
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f6fa",
      padding: "24px",
      fontFamily: "Arial, sans-serif",
      color: "#172033",
    },
    card: {
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "20px",
      boxShadow: "0 2px 10px #0000000a",
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "8px 0 16px",
      border: "1px solid #d9deea",
      borderRadius: "7px",
      boxSizing: "border-box",
    },
    button: {
      background: "#172033",
      color: "#fff",
      padding: "11px 18px",
      border: "none",
      borderRadius: "7px",
      cursor: "pointer",
    },
  };

  return (
    <main style={styles.page}>
      <header style={styles.card}>
        <h1>The Daily Brief</h1>
        <p>Admin Dashboard</p>
        <h2>Welcome, Admin!</h2>
        <p>Total Articles: {articles.length}</p>
        <p>
          Published:{" "}
          {articles.filter((a) => a.status === "Published").length}
        </p>
      </header>

      <section style={styles.card}>
        <h2>Create New Article</h2>

        <form onSubmit={addArticle}>
          <label>Article Title</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
          />

          <label>Category</label>
          <select
            style={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>World</option>
            <option>India</option>
            <option>Jammu & Kashmir</option>
            <option>Technology</option>
            <option>Business</option>
            <option>Science</option>
          </select>
          <label>Upload Article Image</label>
<input
  style={styles.input}
  type="file"
  accept="image/*"
  onChange={(e) => setImageFile(e.target.files[0] || null)}
/>
<label>Article Image URL</label>
<input
  style={styles.input}
  type="url"
  value={imageUrl}
  onChange={(e) => setImageUrl(e.target.value)}
  placeholder="Paste image URL here"
/>
          <label>Article Content</label>
          <textarea
            style={{ ...styles.input, minHeight: "150px" }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article here..."
          />

          <button style={styles.button} type="submit">
            {uploading ? "Uploading..." : "Save Article"}
          </button>
        </form>

        {message && <p>{message}</p>}
      </section>

      <section style={styles.card}>
        <h2>Manage Articles</h2>

        {articles.length === 0 ? (
          <p>No articles added yet.</p>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "15px 0",
              }}
            >
              <h3>{article.title}</h3>
              <p>{article.category} · {article.status}</p>

              {article.status === "Draft" && (
                <button
                  style={styles.button}
                  onClick={() => publishArticle(article.id)}
                >
                  Publish
                </button>
              )}

              <button
                style={{
                  ...styles.button,
                  background: "#c0392b",
                  marginLeft: "8px",
                }}
                onClick={() => deleteArticle(article.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
