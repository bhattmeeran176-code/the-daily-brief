import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search, Menu, ArrowUpRight, Clock3, Globe2, X, ChevronRight, Mail} from 'lucide-react';
import './styles.css';
import AdminLogin from './AdminLogin.jsx';
import PasswordReset from './PasswordReset.jsx';
import Admin from './admin.jsx';
import { supabase } from './supabase';
const stories = [
 {id:1, category:'World', tag:'GEOPOLITICS', title:'A changing world order: the questions shaping global diplomacy', excerpt:'From shifting alliances to new economic priorities, leaders are navigating a more complex international landscape.', author:'Editorial Desk', date:'November 7, 2026', read:'6 min read', image:'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=85', featured:true},
 {id:2, category:'Technology', tag:'INNOVATION', title:'The next chapter of artificial intelligence is being written now', excerpt:'Researchers and businesses are working through the opportunities, risks and rules surrounding rapidly advancing AI.', author:'Maya Chen', date:'November 6, 2026', read:'5 min read', image:'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=85'},
 {id:3, category:'Business', tag:'ECONOMY', title:'Why the global economy is watching energy markets closely', excerpt:'Energy prices remain a key signal for inflation, industry and household budgets around the world.', author:'Daniel Brooks', date:'November 6, 2026', read:'4 min read', image:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1000&q=85'},
 {id:4, category:'Science', tag:'CLIMATE', title:'Cities rethink how to prepare for a hotter future', excerpt:'Urban planners are exploring greener streets, better public spaces and more resilient infrastructure.', author:'Leila Hassan', date:'November 5, 2026', read:'7 min read', image:'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=85'},
 {id:5, category:'India', tag:'SOCIETY', title:'The public services conversation: access, trust and accountability', excerpt:'Across India, debates about public services increasingly focus on delivery, transparency and local needs.', author:'Newsroom', date:'November 5, 2026', read:'5 min read', image:'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1000&q=85'},
 {id:6, category:'Culture', tag:'CULTURE', title:'How independent voices are changing the media landscape', excerpt:'Digital publishing is opening new ways for readers to discover perspectives and follow important stories.', author:'Aisha Rahman', date:'November 4, 2026', read:'4 min read', image:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=85'}
];
const categories=['All','World','India','Business','Technology','Science','Culture'];

function App(){
 const [publishedArticles, setPublishedArticles] = useState([]);
 const [active,setActive]=useState('All'), [query,setQuery]=useState(''), [selected,setSelected]=useState(null), [menu,setMenu]=useState(false), [email,setEmail]=useState(''), [subscribed,setSubscribed]=useState(false);
 const allStories = [
  ...publishedArticles.map(article => ({
    ...article,
    tag: article.category,
    excerpt: article.content,
   image: article.image_url,
    featured: false
  })),
  ...stories
];

const filtered = useMemo(
  () => allStories.filter(s =>
    (active === 'All' || s.category === active) &&
    (`${s.title} ${s.excerpt}`).toLowerCase().includes(query.toLowerCase())
  ),
  [active, query, publishedArticles]
);
 const featured=stories[0];
 const openStory = (s) => {
  setSelected(s);
  const slug = s.title.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  window.history.pushState({}, "", `/?article=${slug}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
useEffect(() => {
  async function loadPublishedArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (!error) setPublishedArticles(data || []);
  }

  loadPublishedArticles();
}, []);
 useEffect(() => {
  const openFromUrl = () => {
    const slug = new URLSearchParams(window.location.search).get("article");

    if (!slug) {
      setSelected(null);
      return;
    }

    const allArticles = [...publishedArticles, ...stories];

    const article = allArticles.find((s) =>
      s.title.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") === slug
    );

    if (article) setSelected(article);
  };

  openFromUrl();
  window.addEventListener("popstate", openFromUrl);

  return () => window.removeEventListener("popstate", openFromUrl);
}, [publishedArticles]);
 
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

  canonical.href = window.location.href;
 
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
      datePublished: selected.created_at || undefined,
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
  return (
    <article style={{
      maxWidth: "850px",
      margin: "40px auto",
      padding: "24px",
      color: "#252525",
      background: "#fff",
      fontFamily: "Georgia, serif"
    }}>
      <button
        onClick={() => {
  setSelected(null);
  window.history.pushState({}, "", "/");
}}
        style={{
          padding: "10px 16px",
          border: "1px solid #ddd",
          background: "#f7f7f4",
          cursor: "pointer",
          marginBottom: "28px"
        }}
      >
        ← Back to Home
      </button>

      <p style={{
        color: "#9b654d",
        textTransform: "uppercase",
        letterSpacing: "2px",
        fontSize: "12px"
      }}>
        {selected.category || selected.tag}
      </p>

      <h1 style={{
        fontSize: "clamp(30px, 5vw, 48px)",
        lineHeight: "1.15",
        margin: "16px 0 24px"
      }}>
        {selected.title}
      </h1>

      {(selected.image || selected.image_url) && (
        <img
          src={selected.image || selected.image_url}
          alt={selected.title}
          style={{
            width: "100%",
            maxHeight: "480px",
            objectFit: "cover",
            marginBottom: "28px"
          }}
        />
      )}

      <div style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        lineHeight: "1.9",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere"
      }}>
        {selected.content || selected.excerpt || selected.description}
      </div>
    </article>
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
  <div className="topline"><span><Globe2 size={13}/> INDEPENDENT JOURNALISM · GLOBAL PERSPECTIVES</span><span>Saturday, November 7, 2026</span></div>
  <header className="header">
   <button className="icon-btn mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Open menu">{menu?<X/>:<Menu/>}</button>
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setSelected(null)}}><span className="brand-mark">DB</span><span>THE DAILY <b>BRIEF</b><small>GLOBAL NEWS, CLEARLY TOLD</small></span></a>
   <nav className={menu?'nav open':'nav'}>{categories.slice(1).map(c=><button key={c} onClick={()=>{setActive(c);setSelected(null);setMenu(false)}}>{c}</button>)}</nav>
   <div className="header-actions"><label className="searchbox"><Search size={16}/><input placeholder="Search stories" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}}/></label><button className="subscribe-btn" onClick={()=>document.getElementById('newsletter').scrollIntoView({behavior:'smooth'})}>Subscribe <ArrowUpRight size={15}/></button></div>
  </header>

  <main>
   <section className="hero-intro"><div className="eyebrow"><span className="dot"></span> THE WORLD, IN CONTEXT</div><h1>Clarity in a world<br/><i>of headlines.</i></h1><p>Independent perspectives and essential stories from around the globe. Understand what matters — and why.</p></section>
   <section className="lead-grid">
    <article className="lead-card" onClick={()=>openStory(featured)}><img src={featured.image} alt="World diplomacy editorial image"/><div className="lead-overlay"><span className="pill">TOP STORY · {featured.category.toUpperCase()}</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><span className="read-link">Read the briefing <ArrowUpRight size={16}/></span></div></article>
    <aside className="side-brief"><div className="section-label">THE EDITOR'S BRIEFING <span>01 — 03</span></div><h3>Beyond the noise.<br/>Towards understanding.</h3><p>We focus on the context behind the headlines: the people, policies and ideas shaping tomorrow.</p><div className="side-stat"><strong>01</strong><span>Context before commentary</span></div><div className="side-stat"><strong>02</strong><span>Curiosity across borders</span></div><div className="side-stat"><strong>03</strong><span>Clarity over noise</span></div></aside>
   </section>
   <section className="latest" id="latest"><div className="section-heading"><div><div className="eyebrow">STAY INFORMED</div><h2>{active==='All'?'Latest stories':active+' stories'}</h2></div><div className="filters">{categories.map(c=><button className={active===c?'active':''} key={c} onClick={()=>setActive(c)}>{c}</button>)}</div></div>
    {filtered.length?<div className="story-grid">{filtered.filter(s=>!s.featured || active!=='All' || query).map(s=><article className="story-card" key={s.id} onClick={()=>openStory(s)}><div className="story-image"><img src={s.image} alt=""/><span>{s.category}</span></div><div className="story-meta">{s.tag} <span>·</span> {s.read}</div><h3>{s.title}</h3><p>{s.excerpt}</p><div className="card-bottom">{s.author}<ArrowUpRight size={16}/></div></article>)}</div>:<div className="empty">No stories match that search. Try another keyword or category.</div>}
   </section>
   <section className="newsletter" id="newsletter"><div><div className="eyebrow">THE DAILY BRIEFING</div><h2>A sharper view<br/><i>of the day.</i></h2><p>A considered digest of the stories shaping our world.</p></div><form onSubmit={e=>{e.preventDefault();if(email.includes('@'))setSubscribed(true)}}><label htmlFor="email">GET THE NEWSLETTER</label><div className="email-row"><input id="email" type="email" required placeholder="Your email address" value={email} onChange={e=>setEmail(e.target.value)}/><button>{subscribed?'Subscribed':'Sign me up'} <ArrowUpRight size={16}/></button></div><small>{subscribed?'Thanks — newsletter signup is a demo in this first version.':'No noise. Just the stories worth your time.'}</small></form></section>
  </main>
  <footer><a className="brand footer-brand" href="#" onClick={e=>{e.preventDefault();setSelected(null)}}><span className="brand-mark">DB</span><span>THE DAILY <b>BRIEF</b><small>GLOBAL NEWS, CLEARLY TOLD</small></span></a><p>Independent journalism. Clear perspectives.</p><span>© 2026 The Daily Brief</span><a href="/about">About Us</a></footer>
 </div>
}

createRoot(document.getElementById('root')).render(
  window.location.pathname === '/reset-password'
  ? <PasswordReset />
  : window.location.pathname === '/dashboard'
? <Admin />
: window.location.pathname.startsWith('/admin')
  ? <AdminLogin />
  : <App />
);
