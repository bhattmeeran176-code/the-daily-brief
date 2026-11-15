-- Add private unsubscribe tokens and opt-out state for newsletter delivery.
alter table public.newsletter_subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid(),
  add column if not exists unsubscribed_at timestamptz;

create unique index if not exists newsletter_subscribers_unsubscribe_token_key
  on public.newsletter_subscribers (unsubscribe_token);

-- Subscribers remain private. Only the service role (Edge Functions) can read/update them.
-- Existing anon/authenticated permissions remain insert-only.
