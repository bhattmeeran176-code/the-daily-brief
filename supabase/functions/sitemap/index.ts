import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://the-daily-brief.onrender.com";
const xmlEscape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char] || char);
const slugify = (value: string) => value.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return new Response("Sitemap temporarily unavailable", { status: 503 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("articles")
    .select("slug, title, created_at, updated_at")
    .eq("status", "Published")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return new Response("Sitemap temporarily unavailable", { status: 503 });
  }

  const staticPaths = [
    { path: "/", priority: "1.0", frequency: "daily" },
    { path: "/about", priority: "0.5", frequency: "monthly" },
    { path: "/contact", priority: "0.3", frequency: "yearly" },
    { path: "/privacy-policy", priority: "0.3", frequency: "yearly" },
  ];
  const staticEntries = staticPaths.map(({ path, priority, frequency }) =>
    `<url><loc>${SITE}${path}</loc><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`
  );
  const articleEntries = (data || [])
    .filter((article) => typeof article.title === "string" && article.title.trim())
    .map((article) => {
      // Match the frontend route resolver: prefer the stored slug, then fall back to the title.
      const slug = slugify(article.slug || article.title);
      if (!slug) return "";
      const modified = article.updated_at || article.created_at;
      const lastmod = modified ? `<lastmod>${xmlEscape(new Date(modified).toISOString())}</lastmod>` : "";
      return `<url><loc>${SITE}/article/${encodeURIComponent(slug)}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    }).filter(Boolean);

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...articleEntries].join("\n")}\n</urlset>`;
  return new Response(req.method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
});
