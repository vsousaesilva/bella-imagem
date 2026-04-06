import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })
  }

  const { error } = await admin
    .from('tenants')
    .update({
      instagram_access_token: null,
      instagram_account_id: null,
    })
    .eq('id', profile.tenant_id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
