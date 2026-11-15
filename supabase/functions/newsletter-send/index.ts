import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const ADMIN_EMAIL = "thedailybrieffff@gmail.com";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NEWSLETTER_FROM_EMAIL");

  if (!supabaseUrl || !anonKey || !serviceKey || !resendKey || !from) {
    return json({ error: "Newsletter delivery is not configured. Check the Supabase function secrets." }, 503);
  }

  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return json({ error: "Unauthorized" }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || authData.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    return json({ error: "Only the authorized site administrator can send newsletters." }, 403);
  }

  let body: { subject?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const textContent = typeof body.text === "string" ? body.text.trim() : "";
  if (!subject || subject.length > 180 || !textContent || textContent.length > 20000) {
    return json({ error: "Provide a subject (max 180 characters) and message (max 20,000 characters)." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: subscribers, error } = await adminClient
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Newsletter subscriber query failed:", error.message);
    return json({ error: "Could not load active subscribers. Apply the newsletter database migration first." }, 500);
  }
  if (!subscribers?.length) return json({ sent: 0, failed: 0, total: 0, message: "No active subscribers." });

  let sent = 0;
  let failed = 0;
  const failures: string[] = [];
  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`;
    const emailText = [textContent, "---", "You received this email because you subscribed to The Daily Brief.", `Unsubscribe: ${unsubscribeUrl}`].join(String.fromCharCode(10));
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [subscriber.email],
          subject,
          text: emailText,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      if (response.ok) {
        sent++;
      } else {
        failed++;
        failures.push(`Email provider rejected a message (HTTP ${response.status}).`);
      }
    } catch {
      failed++;
      failures.push("A delivery request failed before confirmation.");
    }
  }

  return json({ sent, failed, total: subscribers.length, failures: failures.slice(0, 10) });
});
