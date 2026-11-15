import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://the-daily-brief.onrender.com";

const xmlEscape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char] || char);

const slugify = (value: string) => value.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const staticPaths = [
  { path: "/", priority: "1.0", frequency: "daily" },
  { path: "/about", priority: "0.5", frequency: "monthly" },
  { path: "/contact", priority: "0.3", frequency: "yearly" },
  { path: "/privacy-policy", priority: "0.3", frequency: "yearly" },
];

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const staticEntries = staticPaths.map(({ path, priority, frequency }) =>
    `<url><loc>${SITE}${path}</loc><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`
  );

  let articles: Array<{ title: string; created_at: string | null }> = [];
  let articleQueryStatus = "not-configured";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    console.error("Sitemap: Supabase URL or anon key is missing; returning static URLs only.");
  } else {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // The articles table has no slug or updated_at column. The site itself
    // builds article URLs from the title, so mirror that behavior here.
    const result = await supabase
      .from("articles")
      .select("title, created_at")
      .ilike("status", "published")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (result.error) {
      articleQueryStatus = "error";
      console.error("Sitemap article query failed:", result.error.message);
    } else {
      articleQueryStatus = "success";
      articles = result.data || [];
    }
  }

  const articleEntries = articles
    .filter((article) => typeof article.title === "string" && article.title.trim())
    .map((article) => {
      const slug = slugify(article.title);
      if (!slug) return "";
      const lastmod = article.created_at && !Number.isNaN(Date.parse(article.created_at))
        ? `<lastmod>${xmlEscape(new Date(article.created_at).toISOString())}</lastmod>`
        : "";
      return `<url><loc>${SITE}/article/${encodeURIComponent(slug)}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    })
    .filter(Boolean);

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...staticEntries,
    ...articleEntries,
  ].join("\n")}\n</urlset>`;

  return new Response(req.method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
      "x-sitemap-article-count": String(articleEntries.length),
      "x-sitemap-article-query": articleQueryStatus,
    },
  });
});
