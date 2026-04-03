-- ============================================================
-- Bella Imagem — Migration 001: Schema inicial multi-tenant
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────

create type user_role as enum ('master', 'administrador', 'operador');

create type plan_type as enum ('free', 'starter', 'pro', 'business');

create type tom_de_pele as enum ('clara', 'media', 'escura');

create type biotipo as enum ('magra', 'media', 'plus_size');

create type faixa_etaria as enum ('18_25', '26_35', '36_45');

create type genero_modelo as enum ('feminino', 'masculino', 'neutro');

-- ──────────────────────────────────────────────────────────────
-- TABELA: tenants
-- ──────────────────────────────────────────────────────────────

create table tenants (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  plan          plan_type not null default 'free',
  active        boolean not null default true,

  -- Cota de imagens
  quota_limit   int not null default 15,     -- imagens permitidas no período
  quota_used    int not null default 0,       -- imagens geradas no período atual
  quota_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),

  -- Contexto do negócio (para geração de legendas)
  business_name        text,                  -- nome da loja/marca
  business_segment     text,                  -- ex: "moda feminina casual"
  business_description text,                  -- até 300 chars, alimenta prompt de legenda
  business_tone        text default 'moderno', -- tom da comunicação: moderno, luxo, jovem, casual

  -- Perfil padrão do(a) modelo para geração
  model_tom_de_pele  tom_de_pele default 'media',
  model_biotipo      biotipo     default 'media',
  model_faixa_etaria faixa_etaria default '26_35',
  model_genero       genero_modelo default 'feminino',
  model_descricao    text,                    -- campo livre opcional

  -- Instagram (planos Pro+)
  instagram_access_token text,
  instagram_account_id   text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- TABELA: profiles (usuários)
-- ──────────────────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  tenant_id   uuid references tenants,          -- null apenas para master global
  full_name   text,
  role        user_role not null default 'operador',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- TABELA: tenant_memberships (N:N usuários ↔ tenants)
-- ──────────────────────────────────────────────────────────────

create table tenant_memberships (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users on delete cascade,
  tenant_id  uuid not null references tenants on delete cascade,
  role       user_role not null default 'operador',
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);

-- ──────────────────────────────────────────────────────────────
-- FUNÇÕES AUXILIARES (RLS)
-- ──────────────────────────────────────────────────────────────

create or replace function get_my_role()
returns user_role
language sql stable security definer
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function get_my_tenant_id()
returns uuid
language sql stable security definer
as $$
  select tenant_id from profiles where id = auth.uid();
$$;

-- Verifica se o tenant_id pertence ao usuário autenticado (ou se é master)
create or replace function is_my_tenant(t_id uuid)
returns boolean
language sql stable security definer
as $$
  select (
    get_my_role() = 'master'
    or get_my_tenant_id() = t_id
  );
$$;

-- ──────────────────────────────────────────────────────────────
-- RLS: tenants
-- ──────────────────────────────────────────────────────────────

alter table tenants enable row level security;

create policy "tenants_select" on tenants for select
  using (is_my_tenant(id));

create policy "tenants_update" on tenants for update
  using (is_my_tenant(id) and get_my_role() in ('master', 'administrador'));

-- Apenas master pode inserir/deletar tenants
create policy "tenants_insert" on tenants for insert
  with check (get_my_role() = 'master');

create policy "tenants_delete" on tenants for delete
  using (get_my_role() = 'master');

-- ──────────────────────────────────────────────────────────────
-- RLS: profiles
-- ──────────────────────────────────────────────────────────────

alter table profiles enable row level security;

create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

create policy "profiles_insert" on profiles for insert
  with check (
    -- Master pode criar qualquer perfil; admin pode criar apenas na própria tenant
    get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

create policy "profiles_update" on profiles for update
  using (
    id = auth.uid()
    or get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

-- ──────────────────────────────────────────────────────────────
-- RLS: tenant_memberships
-- ──────────────────────────────────────────────────────────────

alter table tenant_memberships enable row level security;

create policy "memberships_select" on tenant_memberships for select
  using (
    user_id = auth.uid()
    or get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

create policy "memberships_insert" on tenant_memberships for insert
  with check (
    get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

create policy "memberships_update" on tenant_memberships for update
  using (
    get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

create policy "memberships_delete" on tenant_memberships for delete
  using (
    get_my_role() = 'master'
    or (get_my_role() = 'administrador' and tenant_id = get_my_tenant_id())
  );

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: updated_at em tenants
-- ──────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: cria profile automático no signup
-- ──────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'operador'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
