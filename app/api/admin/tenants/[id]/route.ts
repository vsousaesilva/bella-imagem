import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/** GET — retorna tenant + usuários para o painel master */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Valida UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

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

  // #21 — Select apenas campos necessários (sem instagram_access_token etc.)
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name, slug, plan, active, business_name, business_segment, quota_used, quota_limit')
    .eq('id', id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const { data: users } = await admin
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('tenant_id', id)

  return NextResponse.json({ tenant, users: users ?? [] })
}

/** DELETE — exclui tenant e todos os dados associados (apenas master) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

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

  // Busca os usuários do tenant para excluir do auth depois
  const { data: members } = await admin
    .from('profiles')
    .select('id')
    .eq('tenant_id', id)

  // Desvincula perfis do tenant antes de excluir (FK sem CASCADE)
  await admin
    .from('profiles')
    .update({ tenant_id: null })
    .eq('tenant_id', id)

  // Exclui o tenant — cascade remove subscriptions, memberships, imagens etc.
  const { error: deleteError } = await admin
    .from('tenants')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[admin/tenants] Erro ao excluir tenant:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Exclui os usuários do auth (remove também os profiles via cascade em auth.users)
  if (members?.length) {
    await Promise.all(
      members.map(m => admin.auth.admin.deleteUser(m.id))
    )
  }

  return NextResponse.json({ ok: true })
}
