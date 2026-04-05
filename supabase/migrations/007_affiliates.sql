-- ============================================================
-- Bella Imagem — Migration 007: Programa de Afiliados
-- ============================================================

-- ── Tabela principal de afiliados ──

create table affiliates (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users on delete set null,  -- login via Supabase auth
  name           text not null,
  email          text not null unique,
  code           text not null unique,                           -- código único ex: "joao-silva-x7k2"
  commission_pct numeric(5,2) not null default 20,              -- % de comissão sobre o valor do plano
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ── Conversões rastreadas ──

create table affiliate_referrals (
  id             uuid primary key default uuid_generate_v4(),
  affiliate_id   uuid not null references affiliates on delete cascade,
  tenant_id      uuid references tenants on delete set null,     -- quem assinou via link do afiliado
  plan           plan_type,
  value_brl      numeric(10,2),                                  -- valor pago no momento da conversão
  commission_brl numeric(10,2),                                  -- comissão calculada
  status         text not null default 'pending'                 -- pending | confirmed | paid | cancelled
                 check (status in ('pending','confirmed','paid','cancelled')),
  asaas_payment_id text,                                         -- referência do pagamento Asaas
  created_at     timestamptz not null default now()
);

-- ── Vincular tenant ao afiliado que gerou a conversão ──

alter table tenants
  add column if not exists affiliate_code text references affiliates(code) on delete set null;

-- ── Índices ──

create index idx_affiliates_code    on affiliates(code);
create index idx_affiliates_user_id on affiliates(user_id);
create index idx_referrals_affiliate on affiliate_referrals(affiliate_id);
create index idx_referrals_tenant    on affiliate_referrals(tenant_id);

-- ── RLS: affiliates ──

alter table affiliates enable row level security;

-- Afiliado vê apenas seu próprio registro
create policy "affiliates_select_own" on affiliates for select
  using (user_id = auth.uid() or get_my_role() = 'master');

create policy "affiliates_update_own" on affiliates for update
  using (user_id = auth.uid() or get_my_role() = 'master');

-- Inserção via service_role (API admin) apenas
create policy "affiliates_insert_admin" on affiliates for insert
  with check (get_my_role() = 'master');

-- ── RLS: affiliate_referrals ──

alter table affiliate_referrals enable row level security;

create policy "referrals_select" on affiliate_referrals for select
  using (
    affiliate_id in (select id from affiliates where user_id = auth.uid())
    or get_my_role() = 'master'
  );

create policy "referrals_insert_admin" on affiliate_referrals for insert
  with check (get_my_role() = 'master');

create policy "referrals_update_admin" on affiliate_referrals for update
  using (get_my_role() = 'master');
