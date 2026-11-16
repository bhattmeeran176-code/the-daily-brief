-- Optional image caption and photo credit for article hero images.
alter table public.articles
  add column if not exists image_caption text,
  add column if not exists image_credit text;
