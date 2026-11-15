import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

const ADMIN_EMAIL = "thedailybrieffff@gmail.com";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function normalizeArticleStatus(status) {
  return String(status || "").trim().replace(/^['"]|['"]$/g, "").toLowerCase();
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("World");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterBody, setNewsletterBody] = useState("");
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const loadArticles = useCallback(async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("Articles could not be loaded: " + error.message);
      return;
    }
    setArticles(data || []);
  }, []);

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      const currentUser = data?.user;
      if (error || !currentUser) {
        window.location.replace("/admin");
        return;
      }
      if ((currentUser.email || "").toLowerCase() !== ADMIN_EMAIL) {
        setMessage("This account is not authorized to access the admin dashboard.");
        setAuthLoading(false);
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    }
    verifyAdmin();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      if (!currentUser) {
        window.location.replace("/admin");
        return;
      }
      if ((currentUser.email || "").toLowerCase() !== ADMIN_EMAIL) {
        setUser(null);
        setMessage("This account is not authorized to access the admin dashboard.");
        return;
      }
      setUser(currentUser);
    });
    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) loadArticles();
  }, [user, loadArticles]);

  function validateImage(file) {
    if (!file) return "";
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return "Please choose a JPG, PNG, WEBP or GIF image.";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return "Image size must be 5 MB or less.";
    }
    return "";
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    const validationError = validateImage(file);
    if (validationError) {
      event.target.value = "";
      setImageFile(null);
      setMessage(validationError);
      return;
    }
    setImageFile(file);
    setMessage("");
  }

  async function addArticle(event) {
    event.preventDefault();
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      setMessage("Admin authorization is required. Please log in again.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setMessage("Please enter the article title and content.");
      return;
    }
    const imageError = validateImage(imageFile);
    if (imageError) {
      setMessage(imageError);
      return;
    }

    setSaving(true);
    let uploadedPath = null;
    let finalImageUrl = imageUrl.trim();

    try {
      if (imageFile) {
        setUploading(true);
        const extensionByType = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${extensionByType[imageFile.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("article-images")
          .upload(fileName, imageFile, {
            contentType: imageFile.type,
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) throw uploadError;
        uploadedPath = fileName;
        const { data: publicData } = supabase.storage
          .from("article-images")
          .getPublicUrl(fileName);
        finalImageUrl = publicData.publicUrl;
      }

      const articleValues = {
        title: title.trim(),
        category,
        image_url: finalImageUrl,
        content: content.trim(),
      };

      const result = editingId
        ? await supabase.from("articles").update(articleValues).eq("id", editingId).select().single()
        : await supabase.from("articles").insert([{ ...articleValues, status: "Draft" }]).select().single();

      if (result.error) throw result.error;
      setArticles((previous) =>
        editingId
          ? previous.map((article) => article.id === result.data.id ? result.data : article)
          : [result.data, ...previous]
      );
      setTitle("");
      setCategory("World");
      setContent("");
      setImageUrl("");
      setImageFile(null);
      setEditingId(null);
      const fileInput = document.getElementById("article-image-file");
      if (fileInput) fileInput.value = "";
      setMessage(editingId ? "Article updated successfully." : "Article saved as draft.");
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from("article-images").remove([uploadedPath]);
      }
      setMessage("Could not save article: " + (error?.message || "Unknown error"));
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  async function publishArticle(id) {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;
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
    setArticles((previous) => previous.map((article) => article.id === id ? data : article));
    setMessage("Article published successfully.");
  }

  async function unpublishArticle(id) {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;
    if (!window.confirm("Move this article back to Draft? It will no longer appear on the public website.")) return;
    const { data, error } = await supabase
      .from("articles")
      .update({ status: "Draft" })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      setMessage("Could not move article to draft: " + error.message);
      return;
    }
    setArticles((previous) => previous.map((article) => article.id === id ? data : article));
    setMessage("Article moved to Draft. It is no longer public.");
  }

  function editArticle(article) {
    setTitle(article.title || "");
    setCategory(article.category || "World");
    setContent(article.content || "");
    setImageUrl(article.image_url || "");
    setImageFile(null);
    setEditingId(article.id);
    setMessage("Editing article. Choose a new image only if you want to replace the current one.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteArticle(id) {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;
    if (!window.confirm("Delete this article? This cannot be undone.")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      setMessage("Delete error: " + error.message);
      return;
    }
    setArticles((previous) => previous.filter((article) => article.id !== id));
    setMessage("Article deleted successfully.");
  }

  async function sendNewsletter(event) {
    event.preventDefault();
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      setNewsletterResult("Admin authorization is required.");
      return;
    }
    if (!newsletterSubject.trim() || !newsletterBody.trim()) {
      setNewsletterResult("Enter a subject and newsletter message.");
      return;
    }
    if (!window.confirm("Send this newsletter to all active subscribers? This action cannot be undone.")) return;

    setNewsletterSending(true);
    setNewsletterResult("Sending newsletter…");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Your admin session has expired. Please log in again.");

      const { data, error } = await supabase.functions.invoke("newsletter-send", {
        body: { subject: newsletterSubject.trim(), text: newsletterBody.trim() },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNewsletterResult(`Delivery finished: ${data.sent || 0} sent, ${data.failed || 0} failed, out of ${data.total || 0} active subscribers.`);
      if ((data.sent || 0) > 0 && (data.failed || 0) === 0) {
        setNewsletterSubject("");
        setNewsletterBody("");
      }
    } catch (error) {
      setNewsletterResult(error?.message || "Newsletter could not be sent.");
    } finally {
      setNewsletterSending(false);
    }
  }


  async function saveProfile(event) {
    event.preventDefault();
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      setProfileMessage("Admin authorization is required.");
      return;
    }
    setProfileSaving(true);
    setProfileMessage("");
    try {
      const metadata = {
        ...user.user_metadata,
        full_name: profileName.trim(),
        avatar_url: profileAvatarUrl.trim(),
      };
      const { data, error } = await supabase.auth.updateUser({ data: metadata });
      if (error) throw error;
      let notices = ["Profile details saved."];
      if (profileEmail.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: profileEmail.trim().toLowerCase() });
        if (emailError) throw emailError;
        notices.push("Email change requested. Confirm it using the link sent by Supabase.");
      }
      if (newPassword) {
        if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        notices.push("Password updated.");
        setNewPassword("");
      }
      if (data?.user) setUser(data.user);
      setProfileMessage(notices.join(" "));
    } catch (error) {
      setProfileMessage(error?.message || "Profile could not be updated.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage("Logout error: " + error.message);
      return;
    }
    window.location.replace("/admin");
  }

  const styles = {
    page: { minHeight: "100vh", background: "#f4f6fa", padding: "24px", fontFamily: "Arial, sans-serif", color: "#172033" },
    card: { background: "#fff", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 2px 10px #0000000a" },
    input: { width: "100%", padding: "12px", margin: "8px 0 16px", border: "1px solid #d9deea", borderRadius: "7px", boxSizing: "border-box" },
    button: { background: "#172033", color: "#fff", padding: "11px 18px", border: "none", borderRadius: "7px", cursor: "pointer", marginRight: "8px", marginTop: "8px" },
  };

  if (authLoading) {
    return <main style={styles.page}><section style={styles.card}>Checking admin access…</section></main>;
  }
  if (!user) {
    return <main style={styles.page}><section style={styles.card}><h2>Access restricted</h2><p>{message || "This account cannot access the admin dashboard."}</p><a href="/admin">Go to admin login</a></section></main>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div><h1>The Daily Brief</h1><p>Admin Dashboard</p></div>
          <button style={styles.button} onClick={logout}>Log out</button>
        </div>
        <h2>Welcome, Admin</h2>
        <p>Total Articles: {articles.length}</p>
        <p>Published: {articles.filter((article) => normalizeArticleStatus(article.status) === "published").length}</p>
      </header>

      <section style={styles.card}>
        <h2>{editingId ? "Edit Article" : "Create New Article"}</h2>
        <form onSubmit={addArticle}>
          <label htmlFor="article-title">Article Title</label>
          <input id="article-title" style={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter article title" required />
          <label htmlFor="article-category">Category</label>
          <select id="article-category" style={styles.input} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>World</option><option>India</option><option>Jammu &amp; Kashmir</option><option>Technology</option><option>Business</option><option>Science</option><option>Culture</option>
          </select>
          <label htmlFor="article-image-file">Upload Article Image (JPG, PNG, WEBP or GIF; max 5 MB)</label>
          <input id="article-image-file" style={styles.input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} />
          <label htmlFor="article-image-url">Or Article Image URL</label>
          <input id="article-image-url" style={styles.input} type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste image URL here" />
          <label htmlFor="article-content">Article Content</label>
          <textarea id="article-content" style={{ ...styles.input, minHeight: "150px" }} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your article here…" required />
          <button style={styles.button} type="submit" disabled={saving}>{uploading ? "Uploading image…" : saving ? "Saving…" : editingId ? "Update Article" : "Save Article"}</button>
          {editingId && <button style={{ ...styles.button, background: "#687386" }} type="button" onClick={() => { setEditingId(null); setTitle(""); setCategory("World"); setContent(""); setImageUrl(""); setImageFile(null); setMessage("Edit cancelled."); }}>Cancel Edit</button>}
        </form>
        {message && <p role="status" aria-live="polite">{message}</p>}
      </section>

      <section style={styles.card}>
        <h2>Send Newsletter</h2>
        <p>Send an update to all active subscribers. Every email includes an unsubscribe link.</p>
        <form onSubmit={sendNewsletter}>
          <label htmlFor="newsletter-subject">Email Subject</label>
          <input id="newsletter-subject" style={styles.input} value={newsletterSubject} onChange={(event) => setNewsletterSubject(event.target.value)} maxLength={180} required placeholder="The Daily Brief — Weekly Update" />
          <label htmlFor="newsletter-body">Message</label>
          <textarea id="newsletter-body" style={{ ...styles.input, minHeight: "180px" }} value={newsletterBody} onChange={(event) => setNewsletterBody(event.target.value)} required placeholder="Write the newsletter message…" />
          <button style={styles.button} type="submit" disabled={newsletterSending}>{newsletterSending ? "Sending…" : "Send to Subscribers"}</button>
        </form>
        {newsletterResult && <p role="status" aria-live="polite">{newsletterResult}</p>}
      </section>


      <section style={styles.card}>
        <h2>Manage Articles</h2>
        {articles.length === 0 ? <p>No articles added yet.</p> : articles.map((article) => (
          <div key={article.id} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
            <h3>{article.title}</h3>
            <p>{article.category} · {normalizeArticleStatus(article.status) === "published" ? "Published" : "Draft"}</p>
            {normalizeArticleStatus(article.status) === "draft"
              ? <button style={styles.button} onClick={() => publishArticle(article.id)}>Publish</button>
              : <button style={{ ...styles.button, background: "#687386" }} onClick={() => unpublishArticle(article.id)}>Move to Draft</button>}
            <button style={styles.button} onClick={() => editArticle(article)}>Edit</button>
            <button style={{ ...styles.button, background: "#c0392b" }} onClick={() => deleteArticle(article.id)}>Delete</button>
          </div>
        ))}
      </section>
    </main>
  );
}
