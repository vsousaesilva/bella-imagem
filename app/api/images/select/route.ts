import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateStorageUrl } from '@/lib/security/validation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { imageId, selectedUrl } = await request.json()
  if (!imageId || !selectedUrl) {
    return NextResponse.json({ error: 'imageId e selectedUrl são obrigatórios' }, { status: 400 })
  }

  // Valida formato do imageId (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(imageId)) {
    return NextResponse.json({ error: 'imageId inválido.' }, { status: 400 })
  }

  // #5 — Validação anti-SSRF: URL deve pertencer ao Supabase Storage
  const urlCheck = validateStorageUrl(selectedUrl)
  if (!urlCheck.valid) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id, active')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não configurado' }, { status: 400 })
  }

  if (!profile.active) {
    return NextResponse.json({ error: 'Conta desativada.' }, { status: 403 })
  }

  // Validação adicional: a URL selecionada deve estar nas output_urls da imagem
  const { data: image } = await admin
    .from('generated_images')
    .select('output_urls')
    .eq('id', imageId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!image) {
    return NextResponse.json({ error: 'Imagem não encontrada.' }, { status: 404 })
  }

  if (!image.output_urls?.includes(selectedUrl)) {
    return NextResponse.json({ error: 'URL selecionada não pertence a esta imagem.' }, { status: 400 })
  }

  const { error } = await admin
    .from('generated_images')
    .update({ selected_url: selectedUrl })
    .eq('id', imageId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
