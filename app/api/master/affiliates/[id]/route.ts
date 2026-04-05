import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
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

  let body: { commission_pct?: number; active?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.commission_pct !== undefined) {
    const pct = Number(body.commission_pct)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ error: 'Percentual deve ser entre 0 e 100.' }, { status: 400 })
    }
    updates.commission_pct = pct
  }

  if (body.active !== undefined) {
    updates.active = Boolean(body.active)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { error } = await admin
    .from('affiliates')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('[master/affiliates] Erro ao atualizar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
