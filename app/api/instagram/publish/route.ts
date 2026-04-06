import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

async function pollContainerStatus(mediaId: string, accessToken: string): Promise<boolean> {
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000)) // wait 5s between polls
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}?fields=status_code&access_token=${accessToken}`
    )
    if (!res.ok) continue
    const data = await res.json()
    if (data.status_code === 'FINISHED') return true
    if (data.status_code === 'ERROR') return false
  }
  return false
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const imageId: string | undefined = body.imageId
  const caption: string | undefined = body.caption

  if (!imageId) {
    return NextResponse.json({ error: 'imageId é obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get user profile + tenant
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })
  }

  const { data: tenant } = await admin
    .from('tenants')
    .select('plan, instagram_access_token, instagram_account_id')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant || !['pro', 'business'].includes(tenant.plan)) {
    return NextResponse.json({ error: 'Plano não permite publicação no Instagram' }, { status: 403 })
  }

  if (!tenant.instagram_access_token || !tenant.instagram_account_id) {
    return NextResponse.json({ error: 'Instagram não conectado' }, { status: 403 })
  }

  // Get the image record
  const { data: image } = await admin
    .from('generated_images')
    .select('id, selected_url, output_urls, caption_generated, tenant_id')
    .eq('id', imageId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!image) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }

  const imageUrl = image.selected_url ?? image.output_urls?.[0]
  if (!imageUrl) {
    return NextResponse.json({ error: 'URL da imagem não disponível' }, { status: 400 })
  }

  const postCaption = caption ?? image.caption_generated ?? ''
  const { instagram_access_token: accessToken, instagram_account_id: igAccountId } = tenant

  try {
    const startTime = Date.now()

    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: postCaption,
          access_token: accessToken,
        }),
      }
    )

    if (!containerRes.ok) {
      const err = await containerRes.text()
      console.error('[ig/publish] container creation failed:', err)
      return NextResponse.json({ error: 'Falha ao criar contêiner de mídia no Instagram' }, { status: 502 })
    }

    const containerData = await containerRes.json()
    const containerId: string = containerData.id
    if (!containerId) {
      return NextResponse.json({ error: 'ID do contêiner não retornado' }, { status: 502 })
    }

    // Step 2: Poll container status
    const ready = await pollContainerStatus(containerId, accessToken)
    if (!ready) {
      return NextResponse.json({ error: 'Tempo esgotado aguardando processamento da mídia' }, { status: 504 })
    }

    // Step 3: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    )

    if (!publishRes.ok) {
      const err = await publishRes.text()
      console.error('[ig/publish] publish failed:', err)
      return NextResponse.json({ error: 'Falha ao publicar no Instagram' }, { status: 502 })
    }

    const publishData = await publishRes.json()
    const mediaId: string = publishData.id
    if (!mediaId) {
      return NextResponse.json({ error: 'ID da mídia publicada não retornado' }, { status: 502 })
    }

    // Step 4: Fetch permalink
    let permalink: string | null = null
    try {
      const permRes = await fetch(
        `https://graph.facebook.com/v21.0/${mediaId}?fields=permalink&access_token=${accessToken}`
      )
      if (permRes.ok) {
        const permData = await permRes.json()
        permalink = permData.permalink ?? null
      }
    } catch {
      // permalink is optional
    }

    const durationMs = Date.now() - startTime

    // Step 5: Update image record
    await admin
      .from('generated_images')
      .update({
        instagram_media_id: mediaId,
        instagram_permalink: permalink,
        posted_at: new Date().toISOString(),
      })
      .eq('id', imageId)

    // Step 6: Log usage
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: imageId,
      action: 'post_instagram',
      ai_model: null,
      tokens_input: 0,
      tokens_output: 0,
      cost_usd: 0,
      duration_ms: durationMs,
      success: true,
      error_message: null,
    })

    return NextResponse.json({ success: true, mediaId, permalink })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[ig/publish] unexpected error:', msg)
    return NextResponse.json({ error: 'Erro interno ao publicar' }, { status: 500 })
  }
}
