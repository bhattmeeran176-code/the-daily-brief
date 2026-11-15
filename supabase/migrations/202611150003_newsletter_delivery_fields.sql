-- Add the fields required for newsletter delivery and safe unsubscribe links.
alter table public.newsletter_subscribers
  add column if not exists unsubscribe_token uuid default gen_random_uuid(),
  add column if not exists unsubscribed_at timestamptz;

update public.newsletter_subscribers
set unsubscribe_token = gen_random_uuid()
where unsubscribe_token is null;

alter table public.newsletter_subscribers
  alter column unsubscribe_token set not null;

create unique index if not exists newsletter_subscribers_unsubscribe_token_uidx
  on public.newsletter_subscribers (unsubscribe_token);
