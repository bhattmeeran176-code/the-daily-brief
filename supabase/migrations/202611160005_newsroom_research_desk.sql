-- Newsroom Research Desk
-- Stores editorial leads separately from published articles.
create table if not exists public.news_research (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  category text not null default 'Jammu & Kashmir',
  source_name text not null,
  source_url text not null,
  summary text not null default '',
  notes text not null default '',
  status text not null default 'New'
    check (status in ('New', 'Verifying', 'Verified', 'Rejected', 'Drafted')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_research enable row level security;

drop policy if exists "Admin can read newsroom research" on public.news_research;
create policy "Admin can read newsroom research"
  on public.news_research for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'thedailybrieffff@gmail.com');

drop policy if exists "Admin can add newsroom research" on public.news_research;
create policy "Admin can add newsroom research"
  on public.news_research for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'thedailybrieffff@gmail.com');

drop policy if exists "Admin can update newsroom research" on public.news_research;
create policy "Admin can update newsroom research"
  on public.news_research for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'thedailybrieffff@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'thedailybrieffff@gmail.com');

drop policy if exists "Admin can delete newsroom research" on public.news_research;
create policy "Admin can delete newsroom research"
  on public.news_research for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'thedailybrieffff@gmail.com');

create index if not exists news_research_created_at_idx
  on public.news_research (created_at desc);
create index if not exists news_research_status_idx
  on public.news_research (status);
