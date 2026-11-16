-- News Discovery Batch 2: editorial selection flag
-- Existing rows remain unselected; the admin can mark published stories as Editor's Picks.
alter table public.articles
  add column if not exists is_editor_pick boolean not null default false;

create index if not exists articles_editor_picks_published_idx
  on public.articles (created_at desc)
  where is_editor_pick = true;
