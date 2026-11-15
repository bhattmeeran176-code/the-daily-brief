-- Reader engagement: public article view totals with an atomic RPC.
alter table public.articles add column if not exists views_count bigint not null default 0;
create index if not exists articles_published_views_idx on public.articles (views_count desc, created_at desc) where lower(status) = 'published';
create or replace function public.increment_article_view(article_id text) returns bigint language plpgsql security definer set search_path = public as $$
declare updated_views bigint;
begin
 update public.articles set views_count = coalesce(views_count, 0) + 1 where id::text = increment_article_view.article_id and lower(status) = 'published' returning views_count into updated_views;
 return coalesce(updated_views, 0);
end;
$$;
revoke all on function public.increment_article_view(text) from public;
grant execute on function public.increment_article_view(text) to anon, authenticated;
