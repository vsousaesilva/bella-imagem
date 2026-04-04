-- ============================================================
-- Bella Imagem — Migration 006: Segurança e Performance
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- ÍNDICES COMPOSTOS para queries frequentes
-- ──────────────────────────────────────────────────────────────

-- Dashboard: logs do mês por tenant com sucesso
create index if not exists idx_usage_logs_tenant_period
  on usage_logs (tenant_id, created_at desc, success)
  where success = true;

-- Galeria: imagens completadas por tenant
create index if not exists idx_generated_images_tenant_completed
  on generated_images (tenant_id, created_at desc)
  where status = 'completed';

-- Webhook: eventos por tenant
create index if not exists idx_payment_events_tenant
  on payment_events (tenant_id, created_at desc);

-- Memberships: lookup por user
create index if not exists idx_memberships_user_active
  on tenant_memberships (user_id, active)
  where active = true;

-- Profiles: lookup por tenant
create index if not exists idx_profiles_tenant
  on profiles (tenant_id)
  where tenant_id is not null;

-- ──────────────────────────────────────────────────────────────
-- FUNÇÃO ATÔMICA: check + increment quota (previne race condition)
-- ──────────────────────────────────────────────────────────────

create or replace function check_and_increment_quota(p_tenant_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_used int;
  v_limit int;
  v_reset_at timestamptz;
  v_now timestamptz := now();
begin
  -- Lock na linha do tenant para serializar acessos concorrentes
  select quota_used, quota_limit, quota_reset_at
  into v_used, v_limit, v_reset_at
  from tenants
  where id = p_tenant_id
  for update;

  if not found then
    return jsonb_build_object('allowed', false, 'error', 'Tenant não encontrado');
  end if;

  -- Reset automático se período expirou
  if v_reset_at <= v_now then
    v_used := 0;
    v_reset_at := date_trunc('month', v_now) + interval '1 month';

    update tenants
    set quota_used = 0, quota_reset_at = v_reset_at
    where id = p_tenant_id;
  end if;

  -- Verifica se tem cota disponível
  if v_used >= v_limit then
    return jsonb_build_object(
      'allowed', false,
      'used', v_used,
      'limit', v_limit,
      'reset_at', v_reset_at
    );
  end if;

  -- Incrementa atomicamente
  update tenants
  set quota_used = v_used + 1
  where id = p_tenant_id;

  return jsonb_build_object(
    'allowed', true,
    'used', v_used + 1,
    'limit', v_limit,
    'reset_at', v_reset_at
  );
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- VIEW MATERIALIZADA para relatórios do master (evita N+1)
-- ──────────────────────────────────────────────────────────────

-- Drop da view simples anterior se existir
drop view if exists tenant_usage_report;

-- Cria como view normal (materialized seria melhor mas requer cron)
create or replace view tenant_usage_summary as
select
  t.id                as tenant_id,
  t.name              as tenant_name,
  t.slug,
  t.plan,
  t.active,
  t.quota_used,
  t.quota_limit,
  t.created_at,
  coalesce(img.total_images, 0)   as total_images,
  coalesce(logs.total_cost, 0)    as total_cost_usd,
  coalesce(logs.total_captions, 0) as total_captions
from tenants t
left join lateral (
  select count(*) as total_images
  from generated_images gi
  where gi.tenant_id = t.id and gi.status = 'completed'
) img on true
left join lateral (
  select
    coalesce(sum(ul.cost_usd), 0) as total_cost,
    count(*) filter (where ul.action = 'generate_caption') as total_captions
  from usage_logs ul
  where ul.tenant_id = t.id and ul.success = true
) logs on true;

-- ──────────────────────────────────────────────────────────────
-- VIEW para relatório mensal (usado em /master/relatorios)
-- ──────────────────────────────────────────────────────────────

create or replace view tenant_monthly_report as
select
  t.id                as tenant_id,
  t.name              as tenant_name,
  t.plan,
  date_trunc('month', ul.created_at) as period,
  count(*) filter (where ul.action = 'generate_image')   as images_generated,
  count(*) filter (where ul.action = 'generate_caption') as captions_generated,
  count(*) filter (where ul.action = 'post_instagram')   as instagram_posts,
  coalesce(sum(ul.tokens_input), 0)                       as total_tokens_input,
  coalesce(sum(ul.tokens_output), 0)                      as total_tokens_output,
  coalesce(sum(ul.cost_usd), 0)                           as total_cost_usd,
  coalesce(avg(ul.duration_ms) filter (where ul.action = 'generate_image'), 0)
                                                           as avg_generation_time_ms
from tenants t
inner join usage_logs ul on ul.tenant_id = t.id and ul.success = true
where t.active = true
group by t.id, t.name, t.plan, date_trunc('month', ul.created_at);

-- ──────────────────────────────────────────────────────────────
-- POLÍTICA de limpeza: imagens failed com mais de 7 dias
-- (executar via cron job ou Supabase Edge Function)
-- ──────────────────────────────────────────────────────────────

create or replace function cleanup_failed_images()
returns int
language plpgsql
security definer
as $$
declare
  v_deleted int;
begin
  with deleted as (
    delete from generated_images
    where status = 'failed'
      and created_at < now() - interval '7 days'
    returning id
  )
  select count(*) into v_deleted from deleted;

  return v_deleted;
end;
$$;
