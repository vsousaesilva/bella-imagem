import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateTextField } from '@/lib/security/validation'
import type { UserRole } from '@/lib/types'

const VALID_ROLES = new Set(['administrador', 'operador'])
const MASTER_ROLES = new Set(['master', 'administrador', 'operador'])

/** PATCH — atualiza role ou active de um usuário */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!['master', 'administrador'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { userId, role, active, fullName } = body as {
    userId?: string; role?: string; active?: boolean; fullName?: string
  }

  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  // Valida UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    return NextResponse.json({ error: 'userId inválido.' }, { status: 400 })
  }

  // Valida role
  if (role !== undefined) {
    if (profile?.role === 'administrador' && !VALID_ROLES.has(role)) {
      return NextResponse.json({ error: 'Role inválido.' }, { status: 400 })
    }
    if (profile?.role === 'master' && !MASTER_ROLES.has(role)) {
      return NextResponse.json({ error: 'Role inválido.' }, { status: 400 })
    }
  }

  // Administrador só pode editar usuários do próprio tenant
  if (profile?.role === 'administrador') {
    const { data: targetProfile } = await admin
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single()

    if (targetProfile?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Sem permissão para este usuário' }, { status: 403 })
    }

    if (role === 'master') {
      return NextResponse.json({ error: 'Apenas master pode atribuir role master' }, { status: 403 })
    }
  }

  // Impede que alguém edite a si mesmo para se auto-promover
  if (userId === user.id && role && role !== profile?.role) {
    return NextResponse.json({ error: 'Não é possível alterar seu próprio role.' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role as UserRole
  if (active !== undefined) updates.active = active

  if (fullName !== undefined) {
    const nameCheck = validateTextField(fullName, 'fullName', 80)
    if (!nameCheck.valid) return NextResponse.json({ error: nameCheck.error }, { status: 400 })
    updates.full_name = nameCheck.sanitized || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (role && profile?.role === 'master') {
    await admin
      .from('tenant_memberships')
      .update({ role })
      .eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}
