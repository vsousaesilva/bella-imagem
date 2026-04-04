import { createAdminClient } from '@/lib/supabase/server'
import type { Profile, Tenant, UserRole } from '@/lib/types'

export interface WorkspaceSummary {
  tenantId: string
  tenantName: string
  role: UserRole
  plan: string
  quotaUsed: number
  quotaLimit: number
}

/** Retorna todos os tenants acessíveis pelo usuário */
export async function getUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from('tenant_memberships')
    .select('tenant_id, role, tenants(id, name, plan, quota_used, quota_limit)')
    .eq('user_id', userId)
    .eq('active', true)

  if (!memberships) return []

  return memberships.map((m) => {
    const t = m.tenants as unknown as Tenant
    return {
      tenantId: m.tenant_id,
      tenantName: t.name,
      role: m.role as UserRole,
      plan: t.plan,
      quotaUsed: t.quota_used,
      quotaLimit: t.quota_limit,
    }
  })
}

/** Troca o workspace ativo do usuário (atualiza profiles.tenant_id) */
export async function switchWorkspace(userId: string, tenantId: string): Promise<boolean> {
  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .single()

  if (!membership) return false

  const { error } = await admin
    .from('profiles')
    .update({ tenant_id: tenantId, role: membership.role })
    .eq('id', userId)

  return !error
}

/** Retorna perfil + tenant ativo do usuário autenticado */
export async function getActiveProfile(userId: string): Promise<(Profile & { tenant: Tenant | null }) | null> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('*, tenant:tenants(*)')
    .eq('id', userId)
    .single()

  return profile as (Profile & { tenant: Tenant | null }) | null
}

/** Cria novo tenant e vincula o usuário como administrador */
export async function createTenant(
  userId: string,
  input: { name: string; slug: string }
): Promise<{ success: boolean; tenantId?: string; error?: string }> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('tenants')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existing) return { success: false, error: 'Slug já em uso' }

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({ name: input.name, slug: input.slug })
    .select()
    .single()

  if (tenantError || !tenant) {
    return { success: false, error: tenantError?.message ?? 'Erro ao criar tenant' }
  }

  await admin.from('tenant_memberships').insert({
    user_id: userId,
    tenant_id: tenant.id,
    role: 'administrador',
  })

  await admin.from('profiles').update({
    tenant_id: tenant.id,
    role: 'administrador',
  }).eq('id', userId)

  return { success: true, tenantId: tenant.id }
}

// ──────────────────────────────────────────────────────────────
// QUOTA — Versão atômica usando RPC do banco
// ──────────────────────────────────────────────────────────────

export interface QuotaResult {
  allowed: boolean
  used: number
  limit: number
  resetAt: string
  error?: string
}

/**
 * Verifica E incrementa a cota atomicamente.
 * Usa SELECT ... FOR UPDATE no banco para evitar race conditions.
 * Se permitido, a cota já foi incrementada — não chamar incrementQuota depois.
 */
export async function checkAndIncrementQuota(tenantId: string): Promise<QuotaResult> {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('check_and_increment_quota', {
    p_tenant_id: tenantId,
  })

  if (error) {
    console.error('[bella-imagem] quota RPC error:', error.message)
    return { allowed: false, used: 0, limit: 0, resetAt: '', error: error.message }
  }

  const result = data as {
    allowed: boolean
    used?: number
    limit?: number
    reset_at?: string
    error?: string
  }

  return {
    allowed: result.allowed,
    used: result.used ?? 0,
    limit: result.limit ?? 0,
    resetAt: result.reset_at ?? '',
    error: result.error,
  }
}

/**
 * @deprecated Use checkAndIncrementQuota que é atômico.
 * Mantido temporariamente para compatibilidade.
 */
export async function checkQuota(tenantId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  resetAt: string
}> {
  const admin = createAdminClient()

  const { data: tenant } = await admin
    .from('tenants')
    .select('quota_used, quota_limit, quota_reset_at')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { allowed: false, used: 0, limit: 0, resetAt: '' }

  if (new Date(tenant.quota_reset_at) <= new Date()) {
    await admin
      .from('tenants')
      .update({
        quota_used: 0,
        quota_reset_at: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          1
        ).toISOString(),
      })
      .eq('id', tenantId)

    return { allowed: true, used: 0, limit: tenant.quota_limit, resetAt: '' }
  }

  return {
    allowed: tenant.quota_used < tenant.quota_limit,
    used: tenant.quota_used,
    limit: tenant.quota_limit,
    resetAt: tenant.quota_reset_at,
  }
}

/** Incrementa o contador de uso (uso com checkAndIncrementQuota é desnecessário) */
export async function incrementQuota(tenantId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('increment_quota_used', { p_tenant_id: tenantId })
}
