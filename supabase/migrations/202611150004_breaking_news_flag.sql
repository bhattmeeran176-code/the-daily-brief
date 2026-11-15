-- Add an editor-controlled Breaking News flag to articles.
-- Existing stories remain unmarked; new stories default to false.
alter table public.articles
  add column if not exists is_breaking boolean not null default false;

create index if not exists articles_published_breaking_idx
  on public.articles (is_breaking, created_at desc)
  where lower(status) = 'published';
