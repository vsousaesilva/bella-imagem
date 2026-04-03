import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateFashionImages } from '@/lib/ai/imagen'
import { checkQuota } from '@/lib/workspace'
import type { GenerateImageRequest, Tenant } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  // Perfil + tenant
  const { data: profile } = await admin
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não configurado' }, { status: 400 })
  }

  // Operador e administrador podem gerar; master também
  if (!['master', 'administrador', 'operador'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Verifica cota
  const quota = await checkQuota(profile.tenant_id)
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Cota esgotada. Você usou ${quota.used}/${quota.limit} imagens este mês.`,
        quotaExceeded: true,
        resetAt: quota.resetAt,
      },
      { status: 429 }
    )
  }

  // Carrega tenant completo (precisa do perfil do modelo)
  const { data: tenant } = await admin
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  const body: GenerateImageRequest = await request.json()

  if (!body.clothingImageBase64 || !body.clothingImageMimeType) {
    return NextResponse.json({ error: 'Imagem da peça é obrigatória' }, { status: 400 })
  }

  // Cria registro pendente no banco
  const { data: imageRecord } = await admin
    .from('generated_images')
    .insert({
      tenant_id: profile.tenant_id,
      created_by: user.id,
      clothing_image_url: 'pending',
      model_image_url: body.modelImageBase64 ? 'provided' : null,
      background_preset: body.backgroundPreset ?? null,
      background_custom: body.backgroundCustom ?? null,
      aspect_ratio: body.aspectRatio ?? '4:5',
      status: 'processing',
    })
    .select()
    .single()

  if (!imageRecord) {
    return NextResponse.json({ error: 'Erro ao criar registro' }, { status: 500 })
  }

  try {
    // Gera imagens com Gemini
    const result = await generateFashionImages(body, tenant as Tenant)

    // Faz upload das 2 variações no Supabase Storage
    const outputUrls: string[] = []

    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i]
      const buffer = Buffer.from(img.base64, 'base64')
      const fileName = `${profile.tenant_id}/${imageRecord.id}/v${i + 1}.jpg`

      const { error: uploadError } = await admin.storage
        .from('bella-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)

      const { data: { publicUrl } } = admin.storage
        .from('bella-images')
        .getPublicUrl(fileName)

      outputUrls.push(publicUrl)
    }

    // Upload da imagem da peça para histórico
    const clothingBuffer = Buffer.from(body.clothingImageBase64, 'base64')
    await admin.storage
      .from('bella-images')
      .upload(`${profile.tenant_id}/${imageRecord.id}/clothing.jpg`, clothingBuffer, {
        contentType: body.clothingImageMimeType,
        upsert: true,
      })
    const { data: { publicUrl: clothingUrl } } = admin.storage
      .from('bella-images')
      .getPublicUrl(`${profile.tenant_id}/${imageRecord.id}/clothing.jpg`)

    // Atualiza registro com resultado
    await admin
      .from('generated_images')
      .update({
        clothing_image_url: clothingUrl,
        output_urls: outputUrls,
        selected_url: outputUrls[0],
        status: 'completed',
        ai_model: 'gemini-2.0-flash-exp-image-generation',
        prompt_used: result.promptUsed,
        tokens_input: result.tokensInput,
        tokens_output: result.tokensOutput,
        cost_usd: result.costUsd,
        generation_time_ms: result.generationTimeMs,
      })
      .eq('id', imageRecord.id)

    // Incrementa cota
    await admin
      .from('tenants')
      .update({ quota_used: quota.used + 1 })
      .eq('id', profile.tenant_id)

    // Log de uso
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: imageRecord.id,
      action: 'generate_image',
      ai_model: 'gemini-2.0-flash-exp-image-generation',
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
      cost_usd: result.costUsd,
      duration_ms: result.generationTimeMs,
      success: true,
    })

    return NextResponse.json({
      imageId: imageRecord.id,
      outputUrls,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      costUsd: result.costUsd,
      generationTimeMs: result.generationTimeMs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'

    // Atualiza registro como falha
    await admin
      .from('generated_images')
      .update({ status: 'failed', error_message: message })
      .eq('id', imageRecord.id)

    // Log de falha
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: imageRecord.id,
      action: 'generate_image',
      success: false,
      error_message: message,
    })

    return NextResponse.json({ error: 'Falha na geração da imagem. Tente novamente.' }, { status: 500 })
  }
}
