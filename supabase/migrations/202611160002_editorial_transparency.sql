-- Editorial transparency: original source links and correction/update notes
alter table public.articles
  add column if not exists source_url text,
  add column if not exists correction_note text;
