-- ============================================================
-- Bella Imagem — Migration 004: Funções auxiliares
-- ============================================================

-- Incrementa quota_used de forma atômica
create or replace function increment_quota_used(p_tenant_id uuid)
returns void language plpgsql security definer as $$
begin
  update tenants
  set quota_used = quota_used + 1
  where id = p_tenant_id;
end;
$$;

-- View consolidada para relatórios do master
create or replace view tenant_usage_report as
select
  t.id              as tenant_id,
  t.name            as tenant_name,
  t.plan,
  count(gi.id) filter (where gi.status = 'completed')                          as images_generated,
  count(ul.id) filter (where ul.action = 'generate_caption' and ul.success)    as captions_generated,
  count(ul.id) filter (where ul.action = 'post_instagram' and ul.success)      as instagram_posts,
  coalesce(sum(ul.tokens_input), 0)                                             as total_tokens_input,
  coalesce(sum(ul.tokens_output), 0)                                            as total_tokens_output,
  coalesce(sum(ul.cost_usd), 0)                                                 as total_cost_usd,
  coalesce(avg(ul.duration_ms) filter (where ul.action = 'generate_image'), 0) as avg_generation_time_ms
from tenants t
left join generated_images gi on gi.tenant_id = t.id
left join usage_logs ul on ul.tenant_id = t.id
where t.active = true
group by t.id, t.name, t.plan;

-- RLS na view (herda da tabela)
-- A view não tem RLS próprio — é acessada apenas via service_role no server
