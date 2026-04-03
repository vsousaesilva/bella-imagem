import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/** GET — retorna tenant + usuários para o painel master (bypassa RLS via admin client) */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name, slug, plan, active, business_name, business_segment')
    .eq('id', params.id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const { data: users } = await admin
    .from('profiles')
    .select('id, full_name, role, active')
    .eq('tenant_id', params.id)

  return NextResponse.json({ tenant, users: users ?? [] })
}
