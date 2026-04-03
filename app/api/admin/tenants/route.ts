import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { toSlug } from '@/lib/utils'
import type { PlanType } from '@/lib/types'

/** GET — lista todos os tenants (apenas master) */
export async function GET() {
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

  const { data: tenants } = await admin
    .from('tenants')
    .select('*, subscriptions(plan, status, next_due_date)')
    .order('created_at', { ascending: false })

  return NextResponse.json(tenants)
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

  const { name, adminEmail, adminName, plan = 'free' } = await request.json()

  if (!name || !adminEmail) {
    return NextResponse.json({ error: 'name e adminEmail são obrigatórios' }, { status: 400 })
  }

  const slug = toSlug(name)

  // Verifica slug único
  const { data: existing } = await admin.from('tenants').select('id').eq('slug', slug).single()
  if (existing) {
    return NextResponse.json({ error: `Slug '${slug}' já em uso` }, { status: 409 })
  }

  // Cria tenant
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({ name, slug, plan })
    .select()
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: tenantError?.message ?? 'Erro ao criar tenant' }, { status: 500 })
  }

  // Cria usuário admin no Supabase Auth
  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    email_confirm: true,
    user_metadata: { full_name: adminName ?? adminEmail },
  })

  if (userError || !newUser?.user) {
    // Rollback: remove tenant
    await admin.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: userError?.message ?? 'Erro ao criar usuário' }, { status: 500 })
  }

  // Cria profile do administrador
  await admin.from('profiles').upsert({
    id: newUser.user.id,
    tenant_id: tenant.id,
    full_name: adminName ?? adminEmail,
    role: 'administrador',
    active: true,
  })

  // Vincula ao tenant
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

  const { tenantId, plan, active, name } = await request.json()
  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = {}

  if (name) updates.name = name

  if (plan) {
    const quotaMap: Record<PlanType, number> = {
      free: 15, starter: 100, pro: 400, business: 1500,
    }
    updates.plan = plan
    updates.quota_limit = quotaMap[plan as PlanType]
  }

  if (typeof active === 'boolean') {
    updates.active = active
  }

  const { error } = await admin.from('tenants').update(updates).eq('id', tenantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
