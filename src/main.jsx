import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search, Menu, ArrowUpRight, Clock3, Globe2, X, ChevronRight, Mail, Share2, Copy, Check, Bookmark, Moon, Sun, Eye, Printer, ArrowUp, Minus, Plus, Maximize2, Minimize2} from 'lucide-react';
import './styles.css';
import AdminLogin from './AdminLogin.jsx';
import PasswordReset from './PasswordReset.jsx';
import Admin from './admin.jsx';
import { supabase } from './supabase';
const categories=['All','World','India','Jammu & Kashmir','Business','Technology','Science','Culture'];
const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const cleanForm = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      subject: form.subject.trim(),
      message: form.message.trim()
    };

    if (!cleanForm.name || !cleanForm.email || !cleanForm.subject || !cleanForm.message) {
      setStatus("Please complete all fields before sending.");
      return;
    }

    setSending(true);
    setStatus("Sending...");

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([cleanForm]);

      if (error) throw error;

      setStatus("Message sent successfully!");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main style={{ maxWidth: "700px", margin: "50px auto", padding: "30px", background: "#fff", color: "#252525" }}>
      <a href="/">← Back to Home</a>
      <h1>Contact Us</h1>
      <p>Have a question or feedback? Send us a message.</p>

      <form onSubmit={handleSubmit}>
        {["name", "email", "subject"].map((field) => (
          <div key={field} style={{ marginBottom: "18px" }}>
            <label htmlFor={`contact-${field}`}>{field.toUpperCase()}</label>
            <input
              id={`contact-${field}`}
              name={field}
              required
              maxLength={field === "subject" ? 160 : field === "name" ? 100 : 254}
              autoComplete={field === "name" ? "name" : field === "email" ? "email" : "off"}
              type={field === "email" ? "email" : "text"}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              style={{ display: "block", width: "100%", padding: "12px", boxSizing: "border-box" }}
            />
          </div>
        ))}

        <label htmlFor="contact-message">MESSAGE</label>
        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={5000}
          rows="6"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          style={{ display: "block", width: "100%", padding: "12px", boxSizing: "border-box" }}
        />

        <button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send Message"}
        </button>
      </form>

      <p role="status" aria-live="polite">{status}</p>
    </main>
  );
}
function PrivacyPage() {
  return (
    <main style={{
      maxWidth: "750px",
      margin: "50px auto",
      padding: "30px",
      background: "#fff",
      color: "#252525",
      fontFamily: "Arial, sans-serif",
      lineHeight: "1.8"
    }}>
      <a href="/">← Back to Home</a>
      <h1>Privacy Policy</h1>
      <p>Last updated: November 15, 2026</p>

      <p>
        The Daily Brief respects your privacy. This policy explains what
        information may be collected when you use our website and how it is used.
      </p>

      <h2>1. Information You Provide</h2>
      <p>
        If you contact us, we may collect your name, email address, subject
        and message. If you subscribe to our newsletter, we collect your email
        address so we can manage your subscription and, when newsletter delivery
        is activated, send the updates you requested.
      </p>

      <h2>2. How We Use Information</h2>
      <p>
        We use contact details to respond to enquiries and feedback. Newsletter
        email addresses are used only to manage subscriptions and deliver
        The Daily Brief updates. You can request to stop receiving newsletters
        using the unsubscribe link included in a delivered newsletter.
      </p>

      <h2>3. Storage and Service Providers</h2>
      <p>
        Contact messages and newsletter subscription records are stored using
        Supabase. If newsletter delivery is enabled, an email delivery provider
        may process recipient addresses to send those messages. These providers
        process information to provide the relevant website services.
      </p>

      <h2>4. Sharing and Sale of Information</h2>
      <p>
        We do not sell personal information. We do not publish newsletter
        subscriber email addresses. Information may be processed by service
        providers as needed to operate the website and its requested features.
      </p>

      <h2>5. Retention and Your Choices</h2>
      <p>
        We retain information for as long as reasonably necessary for the
        purpose for which it was collected, subject to applicable requirements.
        You may contact us to ask about your information or request help with
        a newsletter subscription.
      </p>

      <h2>6. Cookies and Google Analytics</h2>
      <p>
        This website currently uses Google Analytics to understand how visitors
        use the site. Google Analytics may collect information such as pages
        viewed, approximate location, browser and device details, and interaction
        data. Google may use cookies or similar technologies to provide this
        service. You can manage cookies through your browser settings. For more
        information about how Google handles data, please review Google's
        privacy information.
      </p>

      <h2>7. Policy Updates</h2>
      <p>
        We may update this policy when our website features or practices change.
        The date above shows when this page was most recently updated.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        For privacy-related questions or requests, use our
        <a href="/contact"> Contact Us page</a>.
      </p>
    </main>
  );
}

function App(){
 const [publishedArticles, setPublishedArticles] = useState([]);
 const [siteBranding, setSiteBranding] = useState({ headerLogo: "", footerLogo: "", favicon: "" });
 const [publishedArticlesError, setPublishedArticlesError] = useState('');
 const [readingProgress, setReadingProgress] = useState(0);
 const [shareCopied, setShareCopied] = useState(false);
 const [articleFontSize, setArticleFontSize] = useState(()=>{try{return Math.min(24,Math.max(16,Number(localStorage.getItem('tdb-article-font-size'))||19));}catch{return 19;}});
 const [focusReading, setFocusReading] = useState(false);
 const [active,setActive]=useState('All'), [query,setQuery]=useState(''), [selected,setSelected]=useState(null), [menu,setMenu]=useState(false), [email,setEmail]=useState(''), [newsletterStatus,setNewsletterStatus]=useState('idle'), [newsletterMessage,setNewsletterMessage]=useState('');
 const [darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem('tdb-theme')==='dark';}catch{return false;}});
 const [savedIds,setSavedIds]=useState(()=>{try{return JSON.parse(localStorage.getItem('tdb-saved-articles')||'[]');}catch{return [];}});
 const allStories = [
  ...publishedArticles.map((article, index) => ({
    ...article,
    tag: article.category,
    excerpt: (article.content || article.excerpt || article.description || "")
      .replace(/\s+/g, " ").slice(0, 180),
    image: article.image_url || article.image,
    featured: index === 0
  })),
 ];

const filtered = useMemo(
  () => allStories.filter(s =>
    (active === 'All' || s.category === active) &&
    (`${s.title} ${s.excerpt}`).toLowerCase().includes(query.toLowerCase())
  ),
  [active, query, publishedArticles]
);
 const featured=allStories[0] || null;
 const latestUpdates = allStories.slice(0, 4);
 const mostReadStories = [...allStories].filter(s=>Number(s.views_count)>0).sort((a,b)=>Number(b.views_count||0)-Number(a.views_count||0)).slice(0,4);
 const savedStories = allStories.filter(s=>savedIds.includes(String(s.id)));
 const toggleSaved = (story)=>setSavedIds(previous=>{const id=String(story.id);return previous.includes(id)?previous.filter(item=>item!==id):[...previous,id];});

 useEffect(()=>{document.body.classList.toggle('theme-dark',darkMode);try{localStorage.setItem('tdb-theme',darkMode?'dark':'light');}catch{}},[darkMode]);
 useEffect(()=>{try{localStorage.setItem('tdb-saved-articles',JSON.stringify(savedIds));}catch{}},[savedIds]);
 useEffect(()=>{try{localStorage.setItem('tdb-article-font-size',String(articleFontSize));}catch{}},[articleFontSize]);
 useEffect(()=>{if(!selected?.id)return;const viewKey='tdb-viewed-'+selected.id;try{if(sessionStorage.getItem(viewKey))return;sessionStorage.setItem(viewKey,'1');}catch{}let active=true;supabase.rpc('increment_article_view',{article_id:String(selected.id)}).then(({data,error})=>{if(!active||error){if(error)console.error('Article view count update failed:',error.message);return;}const count=Number(data||0);setPublishedArticles(previous=>previous.map(article=>String(article.id)===String(selected.id)?{...article,views_count:count}:article));setSelected(previous=>previous&&String(previous.id)===String(selected.id)?{...previous,views_count:count}:previous);});return()=>{active=false;};},[selected?.id]);
 const handleNewsletterSubmit = async (event) => {
  event.preventDefault();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    setNewsletterStatus('error');
    setNewsletterMessage('Please enter a valid email address.');
    return;
  }
  setNewsletterStatus('submitting');
  setNewsletterMessage('');
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email: normalizedEmail }]);
  if (error) {
    if (error.code === '23505') {
      setNewsletterStatus('success');
      setNewsletterMessage('This email is already subscribed.');
    } else if (error.code === '42P01' || error.code === 'PGRST205') {
      setNewsletterStatus('error');
      setNewsletterMessage('Newsletter setup is not finished yet. Please try again later.');
    } else {
      setNewsletterStatus('error');
      setNewsletterMessage('Subscription could not be saved. Please try again later.');
    }
    return;
  }
  setNewsletterStatus('success');
  setNewsletterMessage('Thank you! Your email has been saved. Newsletter emails will begin once delivery is activated.');
  setEmail('');
 };
 const openStory = (s) => {
  setSelected(s);
  const slug = s.title.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  window.history.pushState({}, "", `/article/${slug}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
useEffect(() => {
  let active = true;
  async function loadSiteBranding() {
    const { data, error } = await supabase.storage.from("article-images").list("site-branding", { limit: 100 });
    if (error || !active) return;
    const files = data || [];
    const findAsset = (name) => {
      const file = files.find((item) => item.name === name);
      return file ? supabase.storage.from("article-images").getPublicUrl(`site-branding/${name}`).data.publicUrl + `?v=${encodeURIComponent(file.updated_at || "")}` : "";
    };
    setSiteBranding({
      headerLogo: findAsset("header-logo"),
      footerLogo: findAsset("footer-logo"),
      favicon: findAsset("favicon"),
    });
  }
  loadSiteBranding();
  return () => { active = false; };
}, []);
useEffect(() => {
  if (!siteBranding.favicon) return;
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = siteBranding.favicon;
}, [siteBranding.favicon]);
useEffect(() => {
  async function loadPublishedArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .ilike('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Homepage article load failed:', error);
      setPublishedArticlesError(error.message || 'Unable to load published stories.');
      return;
    }
    setPublishedArticlesError('');
    setPublishedArticles(data || []);
  }

  loadPublishedArticles();
}, []);
 useEffect(() => {
  const openFromUrl = () => {
    const legacySlug = new URLSearchParams(window.location.search).get("article");
    const pathMatch = window.location.pathname.match(/^\/article\/([^/]+)\/?$/);
    const slug = pathMatch ? decodeURIComponent(pathMatch[1]) : legacySlug;

    if (!slug) {
      setSelected(null);
      return;
    }

    const allArticles = publishedArticles;

    const article = allArticles.find((s) =>
      slugify(s.slug || s.title) === slug
    );

    if (article) {
      setSelected(article);
      if (legacySlug) window.history.replaceState({}, "", `/article/${slug}`);
    }
  };

  openFromUrl();
  window.addEventListener("popstate", openFromUrl);

  return () => window.removeEventListener("popstate", openFromUrl);
}, [publishedArticles]);
 
useEffect(() => {
  if (!selected) {
    setReadingProgress(0);
    return;
  }
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
    setReadingProgress(Math.min(100, Math.max(0, progress)));
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  return () => {
    window.removeEventListener("scroll", updateProgress);
    window.removeEventListener("resize", updateProgress);
  };
}, [selected]);

useEffect(() => {
if (!selected) {
  document.title = "The Daily Brief | Global News, Clearly Told";

  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute(
      "content",
      "The Daily Brief — global news, clear perspectives, and stories that matter."
    );
  }

  let canonical = document.querySelector('link[rel="canonical"]');

if (!canonical) {
  canonical = document.createElement("link");
  canonical.rel = "canonical";
  document.head.appendChild(canonical);
}

canonical.href = window.location.origin + "/";
 const existingSchema = document.querySelector("#article-schema");
if (existingSchema) existingSchema.remove();
  return;
}
  document.title = `${selected.title} | The Daily Brief`;

  const description = (
    selected.content ||
    selected.excerpt ||
    selected.description ||
    "Read the latest stories on The Daily Brief."
  ).replace(/\s+/g, " ").slice(0, 160);

  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", description);

  let canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }

  canonical.href = window.location.origin + `/article/${slugify(selected.slug || selected.title)}`;
 
    let schema = document.querySelector("#article-schema");

    if (!schema) {
      schema = document.createElement("script");
      schema.id = "article-schema";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }

    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: selected.title,
      description: description,
      image: selected.image || selected.image_url || undefined,
      datePublished: selected.published_at || selected.created_at || undefined,
      dateModified: selected.updated_at || selected.created_at || undefined,
      author: {
        "@type": "Organization",
        name: "The Daily Brief",
url: window.location.origin
      },
      publisher: {
        "@type": "Organization",
        name: "The Daily Brief"
      },
      mainEntityOfPage: window.location.href
    });

}, [selected]);
 
if (selected) {
  const articleUrl = window.location.origin + `/article/${slugify(selected.slug || selected.title)}`;
  const isSaved = savedIds.includes(String(selected.id));
  const articleText = selected.content || selected.excerpt || selected.description || "";
  const wordCount = articleText.trim() ? articleText.trim().split(/\\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const relatedStories = publishedArticles
    .filter((story) => story.id !== selected.id && story.title !== selected.title)
    .filter((story) => (story.category || "").toLowerCase() === (selected.category || "").toLowerCase())
    .slice(0, 3);
  const shareTitle = encodeURIComponent(selected.title || "The Daily Brief");
  const shareUrl = encodeURIComponent(articleUrl);
  const copyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      setShareCopied(false);
      window.prompt("Copy this article link:", articleUrl);
    }
  };

  return (
    <>
      <div className="reading-progress-track" aria-hidden="true">
        <div className="reading-progress-fill" style={{ width: `${readingProgress}%` }} />
      </div>
      <article className={`article-page${focusReading?' focus-reading':''}`}>
        <div className="article-tools" role="toolbar" aria-label="Article reading tools">
          <div className="font-size-tools" aria-label="Article text size">
            <span>TEXT SIZE</span>
            <button type="button" onClick={()=>setArticleFontSize(size=>Math.max(16,size-1))} disabled={articleFontSize<=16} aria-label="Decrease text size"><Minus size={15}/></button>
            <strong>{articleFontSize}px</strong>
            <button type="button" onClick={()=>setArticleFontSize(size=>Math.min(24,size+1))} disabled={articleFontSize>=24} aria-label="Increase text size"><Plus size={15}/></button>
          </div>
          <div className="article-utility-tools">
            <button type="button" onClick={()=>window.print()}><Printer size={15}/> Print</button>
            <button type="button" onClick={()=>setFocusReading(value=>!value)}>{focusReading?<Minimize2 size={15}/>:<Maximize2 size={15}/>} {focusReading?'Exit focus':'Focus mode'}</button>
          </div>
        </div>
        <button className="back" onClick={() => {
          setSelected(null);
          window.history.pushState({}, "", "/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}>← Back to Home</button>

        <p className="article-kicker">{selected.category || selected.tag || "THE DAILY BRIEF"}</p>
        <h1>{selected.title}</h1>
        <div className="article-meta-row">
          <span><Clock3 size={15} /> {readingMinutes} min read</span>
          <span><Eye size={15} /> {Number(selected.views_count||0).toLocaleString()} views</span>
          <button type="button" className="save-story-button" onClick={()=>toggleSaved(selected)}><Bookmark size={15} fill={isSaved?'currentColor':'none'}/>{isSaved?'Saved':'Save for later'}</button>
          {selected.author && <span>By {selected.author}</span>}
          {(selected.published_at || selected.created_at) && <span>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(selected.published_at || selected.created_at))}</span>}
        </div>

        {(selected.image || selected.image_url) && (
          <img className="article-hero" src={selected.image || selected.image_url} alt={selected.title} />
        )}

        <div className="article-body" style={{'--article-font-size':`${articleFontSize}px`}}>{articleText}</div>

        <section className="article-share" aria-label="Share this article">
          <div>
            <span className="article-section-label">PASS THE STORY ON</span>
            <h2>Share this article</h2>
          </div>
          <div className="share-actions">
            <a href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer">X</a>
            <button type="button" onClick={copyArticleLink}>{shareCopied ? <Check size={15} /> : <Copy size={15} />}{shareCopied ? "Copied" : "Copy link"}</button>
          </div>
        </section>

        {relatedStories.length > 0 && (
          <section className="related-stories">
            <div className="article-section-label">CONTINUE READING</div>
            <h2>Related stories</h2>
            <div className="related-grid">
              {relatedStories.map((story) => (
                <button className="related-card" type="button" key={story.id} onClick={() => {
                  setSelected(story);
                  window.history.pushState({}, "", `/article/${slugify(story.slug || story.title)}`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>
                  {(story.image_url || story.image) && <img src={story.image_url || story.image} alt="" />}
                  <span>{story.category || "THE DAILY BRIEF"}</span>
                  <strong>{story.title}</strong>
                </button>
              ))}
            </div>
          </section>
        )}
      </article>
      {readingProgress>12 && <button type="button" className="back-to-top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Back to top" title="Back to top"><ArrowUp size={18}/></button>}
    </>
  );
}
if (window.location.pathname === "/about") {
  return (
    <main style={{
      maxWidth: "850px",
      margin: "50px auto",
      padding: "30px",
      color: "#252525",
      background: "#fff",
      fontFamily: "Georgia, serif",
      lineHeight: "1.8"
    }}>
      <a href="/" style={{color: "#9b654d"}}>← Back to Home</a>

      <p style={{color: "#9b654d", letterSpacing: "2px"}}>
        THE DAILY BRIEF
      </p>

      <h1>About Us</h1>

      <h2>Who We Are</h2>
      <p>
        The Daily Brief is an independent digital publication
        dedicated to explaining important stories from around
        the world with clarity, context and perspective.
      </p>

      <h2>Our Mission</h2>
      <p>
        Our mission is to make complex issues easier to understand
        through informative, accessible and meaningful journalism.
      </p>

      <h2>Our Editorial Values</h2>
      <p>
        Accuracy, fairness, transparency, independence and
        curiosity guide the way we present information.
      </p>

      <h2>Our Commitment</h2>
      <p>
        We aim to give readers more than headlines by exploring
        the context, people and ideas behind important events.
      </p>
    </main>
  );
}
          return <div className="site">
  <div className="topline"><span><Globe2 size={13}/> INDEPENDENT JOURNALISM · GLOBAL PERSPECTIVES</span><span>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</span></div>
  <header className="header">
   <button className="icon-btn mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Open menu">{menu?<X/>:<Menu/>}</button>
   <a className="brand" href="/" aria-label="The Daily Brief home" onClick={e=>{e.preventDefault();setSelected(null);window.history.pushState({}, "", "/");window.scrollTo({top:0,behavior:"smooth"});}}><img className="brand-logo" src={siteBranding.headerLogo || "/daily-brief-logo.svg"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/daily-brief-logo.svg"; }} alt="The Daily Brief — Kashmir, India, World, Explained" /></a>
   <nav className={menu?'nav open':'nav'}>{categories.slice(1).map(c=><button key={c} onClick={()=>{setActive(c);setSelected(null);setMenu(false)}}>{c}</button>)}</nav>
   <div className="header-actions"><button type="button" className="theme-toggle" onClick={()=>setDarkMode(value=>!value)} aria-label={darkMode?'Switch to light mode':'Switch to dark mode'} title={darkMode?'Light mode':'Dark mode'}>{darkMode?<Sun size={17}/>:<Moon size={17}/>}</button><button type="button" className="saved-header-button" onClick={()=>document.getElementById('saved-stories')?.scrollIntoView({behavior:'smooth'})}><Bookmark size={14}/> Saved ({savedIds.length})</button><label className="searchbox"><Search size={16}/><input placeholder="Search stories" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}}/></label><button className="subscribe-btn" onClick={()=>document.getElementById('newsletter').scrollIntoView({behavior:'smooth'})}>Subscribe <ArrowUpRight size={15}/></button></div>
  </header>

  {allStories.some((story) => story.is_breaking) && (
   <section className="breaking-news-bar" aria-label="Breaking news">
    <div className="breaking-news-label"><span className="breaking-pulse" />BREAKING NEWS</div>
    <div className="breaking-news-track">
     {allStories.filter((story) => story.is_breaking).slice(0, 3).map((story) => (
      <button type="button" className="breaking-news-item" key={story.id} onClick={() => openStory(story)}>
       <strong>{story.title}</strong><ArrowUpRight size={14} />
      </button>
     ))}
    </div>
   </section>
  )}

  {latestUpdates.length > 0 && (
   <section className="latest-updates" aria-label="Latest news updates">
    <div className="latest-updates-label"><span className="latest-updates-dot" />LATEST UPDATES</div>
    <div className="latest-updates-track">
     {latestUpdates.map((story) => (
      <button type="button" className="latest-update-item" key={story.id} onClick={() => openStory(story)}>
       <span>{story.category || "News"}</span>
       <strong>{story.title}</strong>
       <ArrowUpRight size={14} />
      </button>
     ))}
    </div>
   </section>
  )}

  <main>
   <section className="hero-intro"><div className="eyebrow"><span className="dot"></span> THE WORLD, IN CONTEXT</div><h1>Clarity in a world<br/><i>of headlines.</i></h1><p>Independent perspectives and essential stories from around the globe. Understand what matters — and why.</p></section>
   <section className="lead-grid">
    {featured ? <article className="lead-card" onClick={()=>openStory(featured)}><img src={featured.image} alt={featured.title}/><div className="lead-overlay"><span className="pill">TOP STORY · {featured.category.toUpperCase()}</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><span className="read-link">Read the briefing <ArrowUpRight size={16}/></span></div></article> : <div className="empty">{publishedArticlesError ? `Stories could not load: ${publishedArticlesError}` : 'No published stories yet. Please check back soon.'}</div>}
    <aside className="side-brief"><div className="section-label">THE EDITOR'S BRIEFING <span>01 — 03</span></div><h3>Beyond the noise.<br/>Towards understanding.</h3><p>We focus on the context behind the headlines: the people, policies and ideas shaping tomorrow.</p><div className="side-stat"><strong>01</strong><span>Context before commentary</span></div><div className="side-stat"><strong>02</strong><span>Curiosity across borders</span></div><div className="side-stat"><strong>03</strong><span>Clarity over noise</span></div></aside>
   </section>
   {savedStories.length>0&&<section className="latest saved-stories-section" id="saved-stories"><div className="section-heading"><div><div className="eyebrow">YOUR READING LIST</div><h2>Saved stories</h2></div></div><div className="story-grid">{savedStories.map(story=><article className="story-card" key={story.id} onClick={()=>openStory(story)}><div className="story-image"><img src={story.image} alt=""/><span>{story.category}</span></div><div className="story-meta">{story.category}</div><h3>{story.title}</h3><button type="button" className="save-card-button" onClick={event=>{event.stopPropagation();toggleSaved(story);}}><Bookmark size={14} fill="currentColor"/> Remove from saved</button></article>)}</div></section>}
   <section className="latest" id="latest"><div className="section-heading"><div><div className="eyebrow">STAY INFORMED</div><h2>{active==='All'?'Latest stories':active+' stories'}</h2></div><div className="filters">{categories.map(c=><button className={active===c?'active':''} key={c} onClick={()=>setActive(c)}>{c}</button>)}</div></div>
    {filtered.length?<div className="story-grid">{filtered.filter(s=>!s.featured || active!=='All' || query || filtered.length===1).map(s=><article className="story-card" key={s.id} onClick={()=>openStory(s)}><div className="story-image"><img src={s.image} alt=""/><span>{s.category}</span></div><div className="story-meta">{s.tag} <span>·</span> {s.read}</div><h3>{s.title}</h3><p>{s.excerpt}</p><div className="card-bottom"><span>{s.author} · <Eye size={12} style={{display:'inline',verticalAlign:'middle'}}/> {Number(s.views_count||0).toLocaleString()}</span><button type="button" className="save-card-button" aria-label={savedIds.includes(String(s.id))?'Remove saved story':'Save story'} onClick={event=>{event.stopPropagation();toggleSaved(s);}}><Bookmark size={15} fill={savedIds.includes(String(s.id))?'currentColor':'none'}/></button><ArrowUpRight size={16}/></div></article>)}</div>:<div className="empty">No stories match that search. Try another keyword or category.</div>}
   </section>
   {mostReadStories.length>0&&<section className="latest most-read-section"><div className="section-heading"><div><div className="eyebrow">READER FAVOURITES</div><h2>Most read stories</h2></div></div><div className="story-grid">{mostReadStories.map(story=><article className="story-card" key={story.id} onClick={()=>openStory(story)}><div className="story-image"><img src={story.image} alt=""/><span>{story.category}</span></div><div className="story-meta"><Eye size={12} style={{display:'inline',verticalAlign:'middle'}}/> {Number(story.views_count||0).toLocaleString()} VIEWS</div><h3>{story.title}</h3><p>{story.excerpt}</p></article>)}</div></section>}
   <section className="newsletter" id="newsletter"><div><div className="eyebrow">THE DAILY BRIEFING</div><h2>A sharper view<br/><i>of the day.</i></h2><p>A considered digest of the stories shaping our world.</p></div><form onSubmit={handleNewsletterSubmit}><label htmlFor="email">GET THE NEWSLETTER</label><div className="email-row"><input id="email" type="email" required maxLength="254" autoComplete="email" placeholder="Your email address" value={email} onChange={e=>{setEmail(e.target.value);if(newsletterStatus!=='idle'){setNewsletterStatus('idle');setNewsletterMessage('');}}} disabled={newsletterStatus==='submitting'}/><button type="submit" disabled={newsletterStatus==='submitting'}>{newsletterStatus==='submitting'?'Saving…':newsletterStatus==='success'?'Subscribed':'Sign me up'} <ArrowUpRight size={16}/></button></div><small role="status" aria-live="polite">{newsletterMessage || 'No noise. Just the stories worth your time.'}</small><small>By subscribing, you agree to receive email updates from The Daily Brief.</small></form></section>
  </main>
  <footer><a className="brand footer-brand" href="/" aria-label="The Daily Brief home"><img className="brand-logo" src={siteBranding.footerLogo || siteBranding.headerLogo || "/daily-brief-logo.svg"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/daily-brief-logo.svg"; }} alt="The Daily Brief" /></a><p>Independent journalism. Clear perspectives.</p><span>© 2026 The Daily Brief</span><a href="/about">About Us</a><a href="/contact">Contact Us</a><a href="/privacy-policy">Privacy Policy</a></footer>
 </div>
}

createRoot(document.getElementById('root')).render(
  
window.location.pathname === '/reset-password'
  ? <PasswordReset />
  : window.location.pathname === '/contact'
  ? <ContactPage />
  : window.location.pathname === '/privacy-policy'
  ? <PrivacyPage />
  : window.location.pathname === '/dashboard'
  ? <Admin />
  : window.location.pathname.startsWith('/admin')
  ? <AdminLogin />
  : <App />
 
);
