import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ALLOWED_KEYS = new Set(['affiliate_program_active'])

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

  let body: { key?: string; value?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { key, value } = body
  if (!key || !ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: 'Chave inválida.' }, { status: 400 })
  }
  if (value !== 'true' && value !== 'false') {
    return NextResponse.json({ error: 'Valor deve ser "true" ou "false".' }, { status: 400 })
  }

  const { error } = await admin
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) {
    console.error('[master/settings] Erro ao atualizar:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
