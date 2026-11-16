-- Newsroom Experience Batch 4: article topic tags
alter table public.articles
  add column if not exists tags jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
