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
 const openStory=(s)=>{setSelected(s);window.scrollTo({top:0,behavior:'smooth'});};
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
          return <div className="site">
  <div className="topline"><span><Globe2 size={13}/> INDEPENDENT JOURNALISM · GLOBAL PERSPECTIVES</span><span>Saturday, November 7, 2026</span></div>
  <header className="header">
   <button className="icon-btn mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Open menu">{menu?<X/>:<Menu/>}</button>
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setSelected(null)}}><span className="brand-mark">DB</span><span>THE DAILY <b>BRIEF</b><small>GLOBAL NEWS, CLEARLY TOLD</small></span></a>
   <nav className={menu?'nav open':'nav'}>{categories.slice(1).map(c=><button key={c} onClick={()=>{setActive(c);setSelected(null);setMenu(false)}}>{c}</button>)}</nav>
   <div className="header-actions"><label className="searchbox"><Search size={16}/><input placeholder="Search stories" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}}/></label><button className="subscribe-btn" onClick={()=>document.getElementById('newsletter').scrollIntoView({behavior:'smooth'})}>Subscribe <ArrowUpRight size={15}/></button></div>
  </header>
  {selected ? <main className="article-page"><button className="back" onClick={()=>setSelected(null)}>← Back to front page</button><div className="article-kicker">{selected.category} / {selected.tag}</div><h1>{selected.title}</h1><p className="article-deck">{selected.excerpt}</p><div className="byline">{selected.author} <span>·</span> {selected.date} <span>·</span> {selected.read}</div><img className="article-hero" src={selected.image} alt="Editorial story illustration"/><p className="article-body">{selected.excerpt} This briefing brings together the context, key questions and wider implications behind the story. The facts and developments can evolve, so readers should consult primary documents and trusted reporting for the latest updates.</p><p className="article-body"><b>Why it matters</b><br/>Understanding the forces behind a headline helps put events into perspective. We will continue to follow the issue and update this page as verified information becomes available.</p><div className="editor-note">EDITOR'S NOTE: This is sample demonstration content for the first website build, not a live news report.</div></main> :
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
  </main>}
  <footer><a className="brand footer-brand" href="#" onClick={e=>{e.preventDefault();setSelected(null)}}><span className="brand-mark">DB</span><span>THE DAILY <b>BRIEF</b><small>GLOBAL NEWS, CLEARLY TOLD</small></span></a><p>Independent journalism. Clear perspectives.</p><span>© 2026 The Daily Brief</span></footer>
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
