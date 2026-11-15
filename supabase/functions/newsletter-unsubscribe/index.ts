import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const html = (message: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Daily Brief · Newsletter preferences</title>
<style>body{font-family:Arial,sans-serif;background:#f5f5f1;color:#202a26;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{background:white;max-width:520px;padding:36px;border-radius:12px;text-align:center;box-shadow:0 8px 32px #0001}h1{font-family:Georgia,serif}a{color:#9b654d}</style></head>
<body><main class="card"><h1>The Daily Brief</h1><p>${message}</p><a href="https://the-daily-brief.onrender.com/">Return to the website</a></main></body></html>`;

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const url = new URL(req.url);
  let token = url.searchParams.get("token");
  if (req.method === "POST") {
    // Mail providers use the RFC 8058 one-click POST body. The opaque token
    // remains in the URL query string, so no subscriber email is exposed.
    await req.text();
  }
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return new Response(html("This unsubscribe link is invalid or incomplete."), {
      status: 400, headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(html("Unsubscribe is temporarily unavailable. Please try again later."), {
      status: 503, headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .is("unsubscribed_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return new Response(html("We could not process your request right now. Please try again later."), {
      status: 500, headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const message = data
    ? "You have been successfully unsubscribed from The Daily Brief newsletter."
    : "This link has already been used, or the subscription could not be found. You will not receive further newsletter emails.";
  return new Response(html(message), {
    status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
});
