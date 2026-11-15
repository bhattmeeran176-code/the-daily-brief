-- The Daily Brief newsletter subscriber storage
create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null,
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email),
  constraint newsletter_subscribers_email_format check (
    char_length(email) between 6 and 254
    and email = lower(btrim(email))
    and email ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'
  )
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Public can subscribe to newsletter"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (
  char_length(email) between 6 and 254
  and email = lower(btrim(email))
);

-- Public visitors can submit an email, but cannot read, update or delete subscribers.
grant insert on public.newsletter_subscribers to anon, authenticated;
