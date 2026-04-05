-- ============================================================
-- Bella Imagem — Migration 008: Configurações globais da aplicação
-- ============================================================

create table app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Seed: programa de afiliados ativo por padrão
insert into app_settings (key, value) values ('affiliate_program_active', 'true');

-- RLS: apenas master pode ler/alterar via RLS; rotas usam service_role (admin client)
alter table app_settings enable row level security;

create policy "settings_master_all" on app_settings
  using (get_my_role() = 'master')
  with check (get_my_role() = 'master');
