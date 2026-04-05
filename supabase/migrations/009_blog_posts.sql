-- ============================================================
-- Bella Imagem — Migration 009: Blog
-- ============================================================

create table blog_posts (
  id           uuid primary key default uuid_generate_v4(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  content      text not null default '',
  cover_url    text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_blog_posts_slug      on blog_posts(slug);
create index idx_blog_posts_published on blog_posts(published, published_at desc);

-- RLS: posts publicados são públicos; master gerencia tudo
alter table blog_posts enable row level security;

create policy "blog_select_published" on blog_posts for select
  using (published = true or get_my_role() = 'master');

create policy "blog_master_insert" on blog_posts for insert
  with check (get_my_role() = 'master');

create policy "blog_master_update" on blog_posts for update
  using (get_my_role() = 'master');

create policy "blog_master_delete" on blog_posts for delete
  using (get_my_role() = 'master');
