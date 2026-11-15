# Newsletter delivery setup

The public signup form stores addresses in `newsletter_subscribers`. This setup adds a private unsubscribe token and two Supabase Edge Functions:

- `newsletter-send`: sends a one-off newsletter to active subscribers through Resend.
- `newsletter-unsubscribe`: processes the private unsubscribe link and marks the address as unsubscribed.

## Before deployment

1. Verify a sending domain with Resend and choose a sender address on that verified domain. Do not use the Render hostname as a sender.
2. Apply migration `202611150002_newsletter_delivery_unsubscribe.sql` in the Supabase SQL Editor.
3. Install the Supabase CLI and link the project.
4. Set these Edge Function secrets (never put them in frontend code or GitHub):
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key
   - `RESEND_API_KEY` — Resend API key
   - `NEWSLETTER_ADMIN_SECRET` — a long, randomly generated secret used only by the site owner to authorize sends
   - `NEWSLETTER_FROM_EMAIL` — sender such as `The Daily Brief <newsletter@your-verified-domain>`
   - `PUBLIC_SITE_URL` — `https://the-daily-brief.onrender.com`

## Deploy

```sh
supabase functions deploy sitemap --no-verify-jwt
supabase functions deploy newsletter-unsubscribe --no-verify-jwt
supabase functions deploy newsletter-send --no-verify-jwt
```

### Activate the dynamic sitemap

After deploying `sitemap`, open `https://mcovvpoitrzyfafbicfu.supabase.co/functions/v1/sitemap` and confirm it returns valid XML containing the static pages and your published article URLs. Only after that check succeeds, update `public/robots.txt` so its `Sitemap:` line points to `https://mcovvpoitrzyfafbicfu.supabase.co/functions/v1/sitemap`, then merge and deploy that small website change. Until then, keep the existing Render sitemap URL in `robots.txt`.

Both functions perform their own checks. The send function requires the `x-newsletter-admin-secret` header. The unsubscribe function accepts only a random per-subscriber UUID token and never exposes the subscriber list.

## Send a newsletter

POST to `https://mcovvpoitrzyfafbicfu.supabase.co/functions/v1/newsletter-send` with header `x-newsletter-admin-secret: YOUR_SECRET` and JSON body:

```json
{
  "subject": "The Daily Brief — Weekly Edition",
  "html": "<h1>This week's briefing</h1><p>Your newsletter content...</p>",
  "text": "This week's briefing\n\nYour newsletter content..."
}
```

The function sends only to subscribers whose `unsubscribed_at` is null. It reports sent and failed counts; it does not return subscriber addresses.

## Important

- Sending is not active until the domain is verified, secrets are configured, migration is applied, and both functions are deployed.
- Send only editorial updates subscribers agreed to receive. Respect unsubscribe requests promptly.
- This initial version sends one email per active subscriber sequentially; use a proper campaign queue/provider audience management before the list grows significantly.
