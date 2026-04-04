import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { toSlug } from '@/lib/utils'
import { validateTextField } from '@/lib/security/validation'
import type { PlanType } from '@/lib/types'

const VALID_PLANS = new Set(['free', 'starter', 'pro', 'business'])

/** GET — lista todos os tenants (apenas master) com paginação */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'master') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Paginação (#11)
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50')))
  const offset = (page - 1) * limit

  // Usa a view otimizada para evitar N+1 (#10)
  const { data: tenants, count } = await admin
    .from('tenants')
    .select('id, name, slug, plan, active, quota_used, quota_limit, created_at, subscriptions(plan, status, next_due_date)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({
    data: tenants,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}

/** POST — cria novo tenant (apenas master) */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'master') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { name, adminEmail, adminName, plan = 'free' } = body as {
    name?: string; adminEmail?: string; adminName?: string; plan?: string
  }

  if (!name || !adminEmail) {
    return NextResponse.json({ error: 'name e adminEmail são obrigatórios' }, { status: 400 })
  }

  // Validação de inputs
  const nameCheck = validateTextField(name, 'name', 100)
  if (!nameCheck.valid) return NextResponse.json({ error: nameCheck.error }, { status: 400 })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(adminEmail)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  if (plan && !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
  }

  const slug = toSlug(nameCheck.sanitized)

  const { data: existing } = await admin.from('tenants').select('id').eq('slug', slug).single()
  if (existing) {
    return NextResponse.json({ error: `Slug '${slug}' já em uso` }, { status: 409 })
  }

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({ name: nameCheck.sanitized, slug, plan })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? 'Erro ao criar tenant' }, { status: 500 })
  }

  const adminNameCheck = validateTextField(adminName, 'adminName', 80)

  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    email_confirm: true,
    user_metadata: { full_name: adminNameCheck.sanitized || adminEmail },
  })

  if (userError || !newUser?.user) {
    await admin.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: userError?.message ?? 'Erro ao criar usuário' }, { status: 500 })
  }

  await admin.from('profiles').upsert({
    id: newUser.user.id,
    tenant_id: tenant.id,
    full_name: adminNameCheck.sanitized || adminEmail,
    role: 'administrador',
    active: true,
  })

  await admin.from('tenant_memberships').insert({
    user_id: newUser.user.id,
    tenant_id: tenant.id,
    role: 'administrador',
  })

  return NextResponse.json({ tenantId: tenant.id, slug, adminUserId: newUser.user.id }, { status: 201 })
}

/** PATCH — atualiza plano de um tenant (apenas master) */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'master') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { tenantId, plan, active, name } = body as {
    tenantId?: string; plan?: string; active?: boolean; name?: string
  }

  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 })

  // Valida UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(tenantId)) {
    return NextResponse.json({ error: 'tenantId inválido.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (name) {
    const nameCheck = validateTextField(name, 'name', 100)
    if (!nameCheck.valid) return NextResponse.json({ error: nameCheck.error }, { status: 400 })
    updates.name = nameCheck.sanitized
  }

  if (plan) {
    if (!VALID_PLANS.has(plan)) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
    }
    const quotaMap: Record<PlanType, number> = {
      free: 15, starter: 100, pro: 400, business: 1500,
    }
    updates.plan = plan
    updates.quota_limit = quotaMap[plan as PlanType]
  }

  if (typeof active === 'boolean') {
    updates.active = active
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { error } = await admin.from('tenants').update(updates).eq('id', tenantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
