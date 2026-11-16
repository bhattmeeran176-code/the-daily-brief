import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import ResearchDesk from "./ResearchDesk";

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
  const [author, setAuthor] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageCredit, setImageCredit] = useState("");
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
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileEmail, setProfileEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [brandingFiles, setBrandingFiles] = useState({ headerLogo: null, footerLogo: null, favicon: null });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMessage, setBrandingMessage] = useState("");
  const [brandingPreview, setBrandingPreview] = useState({ headerLogo: "", footerLogo: "", favicon: "" });

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
      setProfileName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "");
      setProfileAvatarUrl(currentUser.user_metadata?.avatar_url || "");
      setProfileEmail(currentUser.email || "");
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
      setProfileName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "");
      setProfileAvatarUrl(currentUser.user_metadata?.avatar_url || "");
      setProfileEmail(currentUser.email || "");
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
        image_caption: imageCaption.trim(),
        image_credit: imageCredit.trim(),
        content: content.trim(),
        author: author.trim(),
        source_url: sourceUrl.trim(),
        correction_note: correctionNote.trim(),
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10),
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
      setAuthor("");
      setSourceUrl("");
      setCorrectionNote("");
      setTags("");
      setImageUrl("");
      setImageCaption("");
      setImageCredit("");
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

  async function toggleBreakingNews(article) {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;
    const nextValue = !article.is_breaking;
    const { data, error } = await supabase
      .from("articles")
      .update({ is_breaking: nextValue })
      .eq("id", article.id)
      .select()
      .single();
    if (error) {
      setMessage("Breaking News update failed: " + error.message);
      return;
    }
    setArticles((previous) => previous.map((item) => item.id === article.id ? data : item));
    setMessage(nextValue ? "Article marked as Breaking News." : "Breaking News label removed.");
  }

  async function toggleEditorPick(article) {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;
    const nextValue = !article.is_editor_pick;
    const { data, error } = await supabase
      .from("articles")
      .update({ is_editor_pick: nextValue })
      .eq("id", article.id)
      .select()
      .single();
    if (error) {
      setMessage("Editor's Pick update failed: " + error.message);
      return;
    }
    setArticles((previous) => previous.map((item) => item.id === article.id ? data : item));
    setMessage(nextValue ? "Article added to Editor's Picks." : "Article removed from Editor's Picks.");
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
    setAuthor(article.author || "");
    setSourceUrl(article.source_url || "");
    setCorrectionNote(article.correction_note || "");
    setTags(Array.isArray(article.tags) ? article.tags.join(", ") : (article.tags || ""));
    setImageUrl(article.image_url || "");
    setImageCaption(article.image_caption || "");
    setImageCredit(article.image_credit || "");
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


  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0] || null;
    const validationError = validateImage(file);
    if (validationError) {
      event.target.value = "";
      setProfileAvatarFile(null);
      setProfileMessage(validationError);
      return;
    }
    setProfileAvatarFile(file);
    setProfileMessage("");
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
      let finalAvatarUrl = profileAvatarUrl;
      let uploadedAvatarPath = null;
      if (profileAvatarFile) {
        const extensionByType = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };
        const fileName = `profiles/${user.id}/avatar-${Date.now()}-${crypto.randomUUID()}.${extensionByType[profileAvatarFile.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("article-images")
          .upload(fileName, profileAvatarFile, {
            contentType: profileAvatarFile.type,
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) throw uploadError;
        uploadedAvatarPath = fileName;
        const { data: publicData } = supabase.storage
          .from("article-images")
          .getPublicUrl(fileName);
        finalAvatarUrl = publicData.publicUrl;
      }
      const metadata = {
        ...user.user_metadata,
        full_name: profileName.trim(),
        avatar_url: finalAvatarUrl,
      };
      const { data, error } = await supabase.auth.updateUser({ data: metadata });
      if (error) {
        if (uploadedAvatarPath) await supabase.storage.from("article-images").remove([uploadedAvatarPath]);
        throw error;
      }
      setProfileAvatarUrl(finalAvatarUrl);
      setProfileAvatarFile(null);
      const photoInput = document.getElementById("profile-avatar-file");
      if (photoInput) photoInput.value = "";
      let notices = ["Profile details saved."];
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

  function handleBrandingFileChange(key, event) {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"].includes(file.type)) {
      event.target.value = "";
      setBrandingMessage("Choose a PNG, JPG, WEBP, SVG or ICO image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setBrandingMessage("Branding image must be 5 MB or less.");
      return;
    }
    setBrandingFiles((previous) => ({ ...previous, [key]: file }));
    setBrandingPreview((previous) => ({ ...previous, [key]: URL.createObjectURL(file) }));
    setBrandingMessage("");
  }

  async function saveBranding(event) {
    event.preventDefault();
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      setBrandingMessage("Admin authorization is required.");
      return;
    }
    const paths = { headerLogo: "header-logo", footerLogo: "footer-logo", favicon: "favicon" };
    const selected = Object.entries(brandingFiles).filter(([, file]) => file);
    if (!selected.length) {
      setBrandingMessage("Choose at least one branding image before saving.");
      return;
    }
    setBrandingSaving(true);
    setBrandingMessage("");
    try {
      for (const [key, file] of selected) {
        const { error } = await supabase.storage.from("article-images").upload(
          `site-branding/${paths[key]}`,
          file,
          { contentType: file.type, cacheControl: "0", upsert: true }
        );
        if (error) throw error;
      }
      setBrandingFiles({ headerLogo: null, footerLogo: null, favicon: null });
      setBrandingMessage("Website branding saved. Refresh the public website to see the changes.");
      ["header-logo-file", "footer-logo-file", "favicon-file"].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = "";
      });
    } catch (error) {
      setBrandingMessage(error?.message || "Website branding could not be saved.");
    } finally {
      setBrandingSaving(false);
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

  const publishedArticles = articles.filter((article) => normalizeArticleStatus(article.status) === "published");
  const draftCount = articles.filter((article) => normalizeArticleStatus(article.status) === "draft").length;
  const totalViews = publishedArticles.reduce((sum, article) => sum + Math.max(0, Number(article.views_count) || 0), 0);
  const topViewedArticles = [...publishedArticles]
    .sort((a, b) => (Number(b.views_count) || 0) - (Number(a.views_count) || 0))
    .filter((article) => (Number(article.views_count) || 0) > 0)
    .slice(0, 5);

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
          <div><h1 style={{ margin: "0 0 8px", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.8px", lineHeight: 1.15, background: "linear-gradient(100deg, #b7791f 0%, #d69e36 38%, #8b5e1a 72%, #d6a84b 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>The Daily Brief</h1><p>Admin Dashboard</p></div>
          <button style={styles.button} onClick={logout}>Log out</button>
        </div>
        <h2>Welcome, Admin</h2>
        <p>Total Articles: {articles.length}</p>
        <p>Published: {articles.filter((article) => normalizeArticleStatus(article.status) === "published").length}</p>
      </header>

      <ResearchDesk />

      <section style={styles.card}>
        <h2>Analytics Overview</h2>
        <p style={{ color: "#687386", marginTop: "-6px" }}>Performance of your published stories</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "12px", marginTop: "16px" }}>
          {[
            { label: "Total Views", value: totalViews.toLocaleString("en-IN"), accent: "#2563a6" },
            { label: "Published", value: publishedArticles.length, accent: "#21845a" },
            { label: "Drafts", value: draftCount, accent: "#8a5a32" },
            { label: "Editor's Picks", value: publishedArticles.filter((article) => article.is_editor_pick).length, accent: "#6b55a3" },
            { label: "Breaking News", value: publishedArticles.filter((article) => article.is_breaking).length, accent: "#b43b35" },
          ].map((metric) => (
            <div key={metric.label} style={{ background: "#f7f9fc", border: "1px solid #e5eaf2", borderTop: `3px solid ${metric.accent}`, borderRadius: "9px", padding: "14px 12px" }}>
              <div style={{ color: "#687386", fontSize: "13px", marginBottom: "7px" }}>{metric.label}</div>
              <strong style={{ color: "#172033", fontSize: "25px", lineHeight: 1.2 }}>{metric.value}</strong>
            </div>
          ))}
        </div>
        <h3 style={{ marginTop: "22px", marginBottom: "10px" }}>Top 5 Most Viewed Articles</h3>
        {topViewedArticles.length === 0 ? (
          <p style={{ color: "#687386" }}>No article view data is available yet. Views will appear here as readers visit your published stories.</p>
        ) : (
          <ol style={{ paddingLeft: "22px", margin: 0 }}>
            {topViewedArticles.map((article) => (
              <li key={article.id} style={{ padding: "9px 0", borderBottom: "1px solid #edf0f5" }}>
                <div style={{ fontWeight: 600, color: "#172033" }}>{article.title}</div>
                <div style={{ color: "#687386", fontSize: "13px", marginTop: "3px" }}>{(Number(article.views_count) || 0).toLocaleString("en-IN")} views · {article.category || "Uncategorised"}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={styles.card}>
        <h2>My Profile</h2>
        <p>Update the name and profile picture shown with your admin account, or change your password.</p>
        <form onSubmit={saveProfile}>
          <label htmlFor="profile-name">Profile Name</label>
          <input id="profile-name" style={styles.input} value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={100} placeholder="Your display name" />
          <label htmlFor="profile-avatar-file">Upload Profile Photo (JPG, PNG, WEBP or GIF; max 5 MB)</label>
          <input id="profile-avatar-file" style={styles.input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleProfilePhotoChange} />
          {(profileAvatarFile || profileAvatarUrl) && <img src={profileAvatarFile ? URL.createObjectURL(profileAvatarFile) : profileAvatarUrl} alt="Profile preview" referrerPolicy="no-referrer" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: "50%", display: "block", marginBottom: 16 }} />}
          <label htmlFor="profile-email">Admin Email</label>
          <input id="profile-email" style={styles.input} type="email" value={profileEmail || user.email || ""} readOnly />
          <small style={{ display: "block", color: "#687386", marginTop: -10, marginBottom: 16 }}>The admin email is fixed in the site's access allowlist, so change it only after updating the site's admin authorization settings.</small>
          <label htmlFor="profile-password">New Password (optional)</label>
          <input id="profile-password" style={styles.input} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="Leave blank to keep current password" />
          <button style={styles.button} type="submit" disabled={profileSaving}>{profileSaving ? "Saving profile…" : "Save Profile"}</button>
        </form>
        {profileMessage && <p role="status" aria-live="polite">{profileMessage}</p>}
      </section>

      <section style={styles.card}>
        <h2>Website Branding</h2>
        <p>Change the logos shown on the public website and its browser tab. Select files from your phone or computer.</p>
        <form onSubmit={saveBranding}>
          <label htmlFor="header-logo-file">Header Logo (PNG, JPG, WEBP or SVG; max 5 MB)</label>
          <input id="header-logo-file" style={styles.input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBrandingFileChange("headerLogo", event)} />
          {brandingPreview.headerLogo && <img src={brandingPreview.headerLogo} alt="Header logo preview" style={{ maxWidth: "240px", maxHeight: "90px", objectFit: "contain", display: "block", marginBottom: 16 }} />}
          <label htmlFor="footer-logo-file">Footer Logo (optional)</label>
          <input id="footer-logo-file" style={styles.input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBrandingFileChange("footerLogo", event)} />
          {brandingPreview.footerLogo && <img src={brandingPreview.footerLogo} alt="Footer logo preview" style={{ maxWidth: "220px", maxHeight: "80px", objectFit: "contain", display: "block", marginBottom: 16 }} />}
          <label htmlFor="favicon-file">Browser Favicon (PNG, JPG, WEBP, SVG or ICO)</label>
          <input id="favicon-file" style={styles.input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon" onChange={(event) => handleBrandingFileChange("favicon", event)} />
          {brandingPreview.favicon && <img src={brandingPreview.favicon} alt="Favicon preview" style={{ width: 48, height: 48, objectFit: "contain", display: "block", marginBottom: 16 }} />}
          <button style={styles.button} type="submit" disabled={brandingSaving}>{brandingSaving ? "Saving branding…" : "Save Website Branding"}</button>
        </form>
        {brandingMessage && <p role="status" aria-live="polite">{brandingMessage}</p>}
      </section>

      <section style={styles.card}>
        <h2>{editingId ? "Edit Article" : "Create New Article"}</h2>
        <form onSubmit={addArticle}>
          <label htmlFor="article-title">Article Title</label>
          <input id="article-title" style={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter article title" required />
          <label htmlFor="article-category">Category</label>
          <select id="article-category" style={styles.input} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>World</option><option>India</option><option>Jammu &amp; Kashmir</option><option>Technology</option><option>Business</option><option>Science</option><option>Culture</option>
          </select>
          <label htmlFor="article-author">Author / Byline</label>
          <input id="article-author" style={styles.input} type="text" value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={120} placeholder="e.g. The Daily Brief News Desk" />
          <label htmlFor="article-source-url">Original Source URL (optional)</label>
          <input id="article-source-url" style={styles.input} type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} maxLength={1000} placeholder="https://example.com/source-report" />
          <label htmlFor="article-correction-note">Correction / Update Note (optional)</label>
          <textarea id="article-correction-note" style={{ ...styles.input, minHeight: "75px" }} value={correctionNote} onChange={(event) => setCorrectionNote(event.target.value)} maxLength={1200} placeholder="Explain any correction or important update to this article." />
          <label htmlFor="article-tags">Article Tags (comma-separated)</label>
          <input id="article-tags" style={styles.input} type="text" value={tags} onChange={(event) => setTags(event.target.value)} maxLength={300} placeholder="e.g. AIIMS, Healthcare, Kashmir" />
          <label htmlFor="article-image-file">Upload Article Image (JPG, PNG, WEBP or GIF; max 5 MB)</label>
          <input id="article-image-file" style={styles.input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} />
          <label htmlFor="article-image-url">Or Article Image URL</label>
          <input id="article-image-url" style={styles.input} type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste image URL here" />
          <label htmlFor="article-image-caption">Image Caption (optional)</label>
          <input id="article-image-caption" style={styles.input} type="text" value={imageCaption} onChange={(event) => setImageCaption(event.target.value)} maxLength={300} placeholder="Describe what the image shows" />
          <label htmlFor="article-image-credit">Photo Credit (optional)</label>
          <input id="article-image-credit" style={styles.input} type="text" value={imageCredit} onChange={(event) => setImageCredit(event.target.value)} maxLength={160} placeholder="Photographer, agency or source" />
          <label htmlFor="article-content">Article Content</label>
          <textarea id="article-content" style={{ ...styles.input, minHeight: "150px" }} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write your article here…" required />
          <button style={styles.button} type="submit" disabled={saving}>{uploading ? "Uploading image…" : saving ? "Saving…" : editingId ? "Update Article" : "Save Article"}</button>
          {editingId && <button style={{ ...styles.button, background: "#687386" }} type="button" onClick={() => { setEditingId(null); setTitle(""); setCategory("World"); setContent(""); setAuthor(""); setSourceUrl(""); setCorrectionNote(""); setTags(""); setImageUrl(""); setImageCaption(""); setImageCredit(""); setImageFile(null); setMessage("Edit cancelled."); }}>Cancel Edit</button>}
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
            <button
              style={{ ...styles.button, background: article.is_breaking ? "#a93226" : "#8a5a32" }}
              onClick={() => toggleBreakingNews(article)}
              aria-pressed={Boolean(article.is_breaking)}
            >{article.is_breaking ? "Remove Breaking" : "Mark Breaking"}</button>
            <button style={styles.button} onClick={() => editArticle(article)}>Edit</button> 
            <button style={{ ...styles.button, background: article.is_editor_pick ? "#315b4a" : "#53677a" }} onClick={() => toggleEditorPick(article)} aria-pressed={Boolean(article.is_editor_pick)}>{article.is_editor_pick ? "Remove Editor's Pick" : "Mark Editor's Pick"}</button>
            <button style={{ ...styles.button, background: "#c0392b" }} onClick={() => deleteArticle(article.id)}>Delete</button>
          </div>
        ))}
      </section>
    </main>
  );
}
