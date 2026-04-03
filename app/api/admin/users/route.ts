import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'

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

  const { userId, role, active, fullName } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

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

    // Administrador não pode promover para master
    if (role === 'master') {
      return NextResponse.json({ error: 'Apenas master pode atribuir role master' }, { status: 403 })
    }
  }

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role as UserRole
  if (active !== undefined) updates.active = active
  if (fullName !== undefined) updates.full_name = fullName

  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Atualiza também na tabela de memberships se role mudou
  if (role && profile?.role === 'master') {
    await admin
      .from('tenant_memberships')
      .update({ role })
      .eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}
