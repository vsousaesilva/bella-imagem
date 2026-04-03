import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { imageId, selectedUrl } = await request.json()
  if (!imageId || !selectedUrl) {
    return NextResponse.json({ error: 'imageId e selectedUrl são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não configurado' }, { status: 400 })
  }

  const { error } = await admin
    .from('generated_images')
    .update({ selected_url: selectedUrl })
    .eq('id', imageId)
    .eq('tenant_id', profile.tenant_id)  // garante isolamento

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
