import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] || char);

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const adminSecret = Deno.env.get("NEWSLETTER_ADMIN_SECRET");
  if (!adminSecret || req.headers.get("x-newsletter-admin-secret") !== adminSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NEWSLETTER_FROM_EMAIL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://the-daily-brief.onrender.com";
  if (!resendKey || !from || !supabaseUrl || !serviceKey) {
    return json({ error: "Email delivery is not configured. Set the required function secrets." }, 503);
  }

  let body: { subject?: string; html?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const htmlContent = typeof body.html === "string" ? body.html : "";
  const textContent = typeof body.text === "string" ? body.text : "";
  if (!subject || subject.length > 180 || (!htmlContent && !textContent)) {
    return json({ error: "Provide a subject (max 180 characters) and HTML or plain-text content." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: subscribers, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true });

  if (error) return json({ error: "Could not load active subscribers." }, 500);
  if (!subscribers?.length) return json({ sent: 0, failed: 0, message: "No active subscribers." });

  let sent = 0;
  let failed = 0;
  const failures: string[] = [];
  // Keep delivery sequential to respect provider rate limits and make results predictable.
  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/newsletter-unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`;
    const footerHtml = `<hr><p style="font-size:12px;color:#666">You received this email because you subscribed to The Daily Brief. <a href="${unsubscribeUrl}">Unsubscribe</a>.</p>`;
    const footerText = `\n\nYou received this email because you subscribed to The Daily Brief. Unsubscribe: ${unsubscribeUrl}`;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "authorization": `Bearer ${resendKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to: [subscriber.email],
          subject,
          html: htmlContent ? `${htmlContent}${footerHtml}` : undefined,
          text: `${textContent}${footerText}`.trim(),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      if (!response.ok) {
        failed++;
        failures.push(`A message was rejected by the email provider (HTTP ${response.status}).`);
      } else {
        sent++;
      }
    } catch {
      failed++;
      failures.push("A delivery request failed before confirmation.");
    }
  }

  return json({ sent, failed, total: subscribers.length, failures: failures.slice(0, 10) });
});
