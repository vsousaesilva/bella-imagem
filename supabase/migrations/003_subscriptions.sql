-- ============================================================
-- Bella Imagem — Migration 003: Planos, assinaturas e Asaas
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- TABELA: plan_config (configuração dos planos)
-- ──────────────────────────────────────────────────────────────

create table plan_config (
  plan             plan_type primary key,
  label            text not null,
  quota_images     int not null,         -- imagens/mês
  price_brl        numeric(10, 2) not null default 0,
  features         jsonb not null default '[]',
  active           boolean not null default true
);

insert into plan_config (plan, label, quota_images, price_brl, features) values
  ('free',     'Gratuito',  15,   0.00,   '["15 imagens/mês", "2 variações por geração", "Download em alta resolução"]'),
  ('starter',  'Starter',   100,  149.00, '["100 imagens/mês", "2 variações por geração", "Geração de legendas", "Download em alta resolução"]'),
  ('pro',      'Pro',       400,  499.00, '["400 imagens/mês", "2 variações por geração", "Geração de legendas", "Publicar no Instagram", "Suporte prioritário"]'),
  ('business', 'Business',  1500, 1999.00,'["1.500 imagens/mês", "2 variações por geração", "Geração de legendas", "Publicar no Instagram", "Relatório completo de uso", "Suporte dedicado"]');

-- ──────────────────────────────────────────────────────────────
-- TABELA: subscriptions (assinaturas Asaas)
-- ──────────────────────────────────────────────────────────────

create table subscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  tenant_id             uuid not null unique references tenants on delete cascade,
  plan                  plan_type not null default 'free',

  -- Asaas
  asaas_customer_id     text,
  asaas_subscription_id text,
  asaas_payment_id      text,            -- último pagamento

  status                text not null default 'active',  -- active | overdue | cancelled | trial
  billing_cycle         text default 'MONTHLY',
  next_due_date         date,
  cancelled_at          timestamptz,

  -- Controle de cota sincronizado com tenants.quota_*
  current_period_start  timestamptz not null default date_trunc('month', now()),
  current_period_end    timestamptz not null default (date_trunc('month', now()) + interval '1 month'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ──────────────────────────────────────────────────────────────
-- TABELA: payment_events (webhook Asaas)
-- ──────────────────────────────────────────────────────────────

create table payment_events (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid references tenants,
  asaas_event    text not null,          -- PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc.
  asaas_payload  jsonb not null,
  processed      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- RLS: plan_config (leitura pública)
-- ──────────────────────────────────────────────────────────────

alter table plan_config enable row level security;

create policy "plan_config_select" on plan_config for select
  using (true);

-- ──────────────────────────────────────────────────────────────
-- RLS: subscriptions
-- ──────────────────────────────────────────────────────────────

alter table subscriptions enable row level security;

create policy "subscriptions_select" on subscriptions for select
  using (
    get_my_role() = 'master'
    or (is_my_tenant(tenant_id) and get_my_role() = 'administrador')
  );

-- ──────────────────────────────────────────────────────────────
-- FUNÇÃO: resetar cota mensal
-- ──────────────────────────────────────────────────────────────

create or replace function reset_monthly_quotas()
returns void language plpgsql security definer as $$
begin
  update tenants
  set
    quota_used     = 0,
    quota_reset_at = date_trunc('month', now()) + interval '1 month'
  where quota_reset_at <= now();
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- FUNÇÃO: atualizar plano do tenant (chamada pelo webhook Asaas)
-- ──────────────────────────────────────────────────────────────

create or replace function upgrade_tenant_plan(
  p_tenant_id uuid,
  p_plan      plan_type
)
returns void language plpgsql security definer as $$
declare
  v_quota int;
begin
  select quota_images into v_quota from plan_config where plan = p_plan;

  update tenants
  set
    plan        = p_plan,
    quota_limit = v_quota,
    updated_at  = now()
  where id = p_tenant_id;

  update subscriptions
  set plan = p_plan, updated_at = now()
  where tenant_id = p_tenant_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- Criar subscription free para todo tenant novo
-- ──────────────────────────────────────────────────────────────

create or replace function create_free_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into subscriptions (tenant_id, plan)
  values (new.id, 'free')
  on conflict (tenant_id) do nothing;
  return new;
end;
$$;

create trigger tenant_free_subscription
  after insert on tenants
  for each row execute function create_free_subscription();
