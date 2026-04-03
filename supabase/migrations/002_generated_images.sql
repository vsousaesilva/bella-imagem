-- ============================================================
-- Bella Imagem — Migration 002: Imagens geradas e logs de uso
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────

create type image_status as enum ('pending', 'processing', 'completed', 'failed');

create type aspect_ratio as enum ('1:1', '4:5', '9:16', '16:9', '3:4');

create type action_type as enum ('generate_image', 'generate_caption', 'post_instagram');

-- ──────────────────────────────────────────────────────────────
-- TABELA: generated_images
-- ──────────────────────────────────────────────────────────────

create table generated_images (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references tenants on delete cascade,
  created_by   uuid not null references profiles,

  -- Inputs enviados pelo usuário
  clothing_image_url  text not null,          -- URL Supabase Storage da peça
  model_image_url     text,                   -- URL da foto do modelo (opcional)
  background_preset   text,                   -- opção pré-definida de fundo
  background_custom   text,                   -- descrição livre do fundo
  aspect_ratio        aspect_ratio not null default '4:5',

  -- Prompt construído e enviado à IA
  prompt_used         text,

  -- Outputs
  output_urls         text[] not null default '{}',  -- 2 variações
  selected_url        text,                   -- URL da imagem escolhida pelo usuário
  caption_generated   text,                   -- legenda gerada (se solicitada)

  -- Métricas de geração
  ai_model            text not null default 'gemini-2.0-flash-exp-image-generation',
  status              image_status not null default 'pending',
  tokens_input        int,
  tokens_output       int,
  cost_usd            numeric(10, 6),
  generation_time_ms  int,
  error_message       text,

  -- Instagram
  instagram_media_id  text,
  instagram_permalink text,
  posted_at           timestamptz,

  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- TABELA: usage_logs (log granular por requisição)
-- ──────────────────────────────────────────────────────────────

create table usage_logs (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references tenants on delete cascade,
  user_id      uuid not null references profiles,
  image_id     uuid references generated_images,

  action       action_type not null,
  ai_model     text,
  tokens_input  int not null default 0,
  tokens_output int not null default 0,
  cost_usd      numeric(10, 6) not null default 0,
  duration_ms   int,
  success       boolean not null default true,
  error_message text,

  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────────────────────

create index generated_images_tenant_id_idx on generated_images (tenant_id);
create index generated_images_created_at_idx on generated_images (created_at desc);
create index usage_logs_tenant_id_idx on usage_logs (tenant_id);
create index usage_logs_created_at_idx on usage_logs (created_at desc);

-- ──────────────────────────────────────────────────────────────
-- RLS: generated_images
-- ──────────────────────────────────────────────────────────────

alter table generated_images enable row level security;

create policy "images_select" on generated_images for select
  using (is_my_tenant(tenant_id));

create policy "images_insert" on generated_images for insert
  with check (is_my_tenant(tenant_id));

create policy "images_update" on generated_images for update
  using (is_my_tenant(tenant_id));

create policy "images_delete" on generated_images for delete
  using (is_my_tenant(tenant_id) and get_my_role() in ('master', 'administrador'));

-- ──────────────────────────────────────────────────────────────
-- RLS: usage_logs (somente leitura para admin/master)
-- ──────────────────────────────────────────────────────────────

alter table usage_logs enable row level security;

create policy "logs_select" on usage_logs for select
  using (
    get_my_role() = 'master'
    or (is_my_tenant(tenant_id) and get_my_role() = 'administrador')
  );

create policy "logs_insert" on usage_logs for insert
  with check (is_my_tenant(tenant_id));

-- ──────────────────────────────────────────────────────────────
-- STORAGE BUCKET: bella-images
-- ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('bella-images', 'bella-images', true)
on conflict (id) do nothing;

-- Policy de upload: usuário autenticado, somente no próprio tenant
create policy "bella_images_insert" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bella-images'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );

create policy "bella_images_select" on storage.objects for select
  to public
  using (bucket_id = 'bella-images');

create policy "bella_images_delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bella-images'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );
