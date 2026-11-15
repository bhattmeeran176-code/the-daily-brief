import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const page = (message: string, token?: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Daily Brief · Newsletter preferences</title>
<style>body{font-family:Arial,sans-serif;background:#f5f5f1;color:#202a26;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{background:white;max-width:520px;padding:36px;border-radius:12px;text-align:center;box-shadow:0 8px 32px #0001}h1{font-family:Georgia,serif}button{background:#202a26;color:white;border:0;border-radius:6px;padding:12px 20px;font-size:16px;cursor:pointer}a{color:#9b654d}</style></head>
<body><main class="card"><h1>The Daily Brief</h1><p>${message}</p>${token ? `<form method="post"><input type="hidden" name="token" value="${token}"><button type="submit">Confirm unsubscribe</button></form>` : ""}<p><a href="https://the-daily-brief.onrender.com/">Return to the website</a></p></main></body></html>`;

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  let token = url.searchParams.get("token");
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = new URLSearchParams(await req.text());
      token = form.get("token") || token;
    } else {
      // RFC 8058 one-click requests carry the opaque token in the URL.
      await req.text();
    }
  }

  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return new Response(page("This unsubscribe link is invalid or incomplete."), {
      status: 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  // Email security scanners often prefetch links. A GET must show a confirmation
  // page rather than unsubscribing the reader without their action.
  if (req.method === "GET") {
    return new Response(page("Would you like to stop receiving The Daily Brief newsletter?", token), {
      status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(page("Unsubscribe is temporarily unavailable. Please try again later."), {
      status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
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
    return new Response(page("We could not process your request right now. Please try again later."), {
      status: 500, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const message = data
    ? "You have been successfully unsubscribed from The Daily Brief newsletter."
    : "This link has already been used, or the subscription could not be found. You will not receive further newsletter emails.";
  return new Response(page(message), {
    status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
});
