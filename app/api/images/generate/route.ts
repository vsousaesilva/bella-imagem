import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateFashionImages } from '@/lib/ai/imagen'
import { checkAndIncrementQuota } from '@/lib/workspace'
import { rateLimitGeneration } from '@/lib/security/rate-limit'
import {
  validateBase64Size,
  validateMimeType,
  sanitizePromptInput,
  getClientIp,
} from '@/lib/security/validation'
import type { GenerateImageRequest, Tenant } from '@/lib/types'

/** Max body size: ~12MB (2 imagens de 5MB + overhead JSON) */
const MAX_BODY_SIZE = 12 * 1024 * 1024

export async function POST(request: Request) {
  // ── Validação de tamanho do body ──
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Payload muito grande. Máximo: 10MB por imagem.' },
      { status: 413 }
    )
  }

  // ── Autenticação ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  // ── Perfil + tenant ──
  const { data: profile } = await admin
    .from('profiles')
    .select('role, tenant_id, active')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não configurado' }, { status: 400 })
  }

  // Verifica se usuário está ativo (#26)
  if (!profile.active) {
    return NextResponse.json({ error: 'Conta desativada.' }, { status: 403 })
  }

  if (!['master', 'administrador', 'operador'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // ── Rate limiting (#1) ──
  const rl = rateLimitGeneration(profile.tenant_id)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // ── Quota atômica (#1 — race condition fix) ──
  const quota = await checkAndIncrementQuota(profile.tenant_id)
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

  // ── Parse do body ──
  let body: GenerateImageRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  // ── Validação de inputs (#2 — payload sem limite, #9 — MIME type) ──
  if (!body.clothingImageBase64 || !body.clothingImageMimeType) {
    return NextResponse.json({ error: 'Imagem da peça é obrigatória.' }, { status: 400 })
  }

  const clothingSizeCheck = validateBase64Size(body.clothingImageBase64, 'Imagem da peça')
  if (!clothingSizeCheck.valid) {
    return NextResponse.json({ error: clothingSizeCheck.error }, { status: 400 })
  }

  const clothingMimeCheck = validateMimeType(body.clothingImageMimeType, 'Imagem da peça')
  if (!clothingMimeCheck.valid) {
    return NextResponse.json({ error: clothingMimeCheck.error }, { status: 400 })
  }

  if (body.modelImageBase64) {
    const modelSizeCheck = validateBase64Size(body.modelImageBase64, 'Foto do modelo')
    if (!modelSizeCheck.valid) {
      return NextResponse.json({ error: modelSizeCheck.error }, { status: 400 })
    }

    if (body.modelImageMimeType) {
      const modelMimeCheck = validateMimeType(body.modelImageMimeType, 'Foto do modelo')
      if (!modelMimeCheck.valid) {
        return NextResponse.json({ error: modelMimeCheck.error }, { status: 400 })
      }
    }
  }

  // ── Sanitização de inputs de texto (#16 — prompt injection) ──
  if (body.modelDescricaoLivre) {
    const { sanitized, warnings } = sanitizePromptInput(body.modelDescricaoLivre, 'Descrição do modelo')
    body.modelDescricaoLivre = sanitized
    if (warnings.length > 0) {
      console.warn('[bella-imagem] input sanitizado:', warnings)
    }
  }

  if (body.backgroundCustom) {
    const { sanitized, warnings } = sanitizePromptInput(body.backgroundCustom, 'Fundo personalizado')
    body.backgroundCustom = sanitized
    if (warnings.length > 0) {
      console.warn('[bella-imagem] input sanitizado:', warnings)
    }
  }

  // ── Carrega tenant (apenas campos necessários, #21) ──
  const { data: tenant } = await admin
    .from('tenants')
    .select(`
      id, name, plan, active,
      business_name, business_segment, business_description, business_tone,
      model_tom_de_pele, model_biotipo, model_faixa_etaria, model_genero, model_descricao
    `)
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  // ── Cria registro pendente ──
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
    .select('id')
    .single()

  if (!imageRecord) {
    return NextResponse.json({ error: 'Erro ao criar registro' }, { status: 500 })
  }

  try {
    console.log('[bella-imagem] Gerando — tenant:', profile.tenant_id, 'image:', imageRecord.id)

    // ── Gera imagens com Gemini ──
    const result = await generateFashionImages(body, tenant as Tenant)
    console.log('[bella-imagem] Gemini OK — tempo:', result.generationTimeMs, 'ms')

    // ── Upload paralelo das variações + peça (#13) ──
    const uploadPromises: Promise<string>[] = []

    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i]
      uploadPromises.push(
        uploadToStorage(admin, profile.tenant_id, imageRecord.id, `v${i + 1}.jpg`, img.base64, 'image/jpeg')
      )
    }

    // Upload da peça para histórico (em paralelo)
    uploadPromises.push(
      uploadToStorage(
        admin,
        profile.tenant_id,
        imageRecord.id,
        'clothing.jpg',
        body.clothingImageBase64,
        body.clothingImageMimeType
      )
    )

    const uploadResults = await Promise.all(uploadPromises)
    const outputUrls = uploadResults.slice(0, result.images.length)
    const clothingUrl = uploadResults[uploadResults.length - 1]

    // ── Libera memória dos buffers base64 (#14) ──
    body.clothingImageBase64 = ''
    body.modelImageBase64 = undefined
    result.images.forEach((img) => { img.base64 = '' })

    // ── Atualiza registro ──
    await admin
      .from('generated_images')
      .update({
        clothing_image_url: clothingUrl,
        output_urls: outputUrls,
        selected_url: outputUrls[0],
        status: 'completed',
        ai_model: 'gemini-3.1-flash-image-preview',
        prompt_used: result.promptUsed,
        tokens_input: result.tokensInput,
        tokens_output: result.tokensOutput,
        cost_usd: result.costUsd,
        generation_time_ms: result.generationTimeMs,
      })
      .eq('id', imageRecord.id)

    // Nota: quota já foi incrementada atomicamente por checkAndIncrementQuota

    // ── Log de uso ──
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: imageRecord.id,
      action: 'generate_image',
      ai_model: 'gemini-3.1-flash-image-preview',
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

    console.error('[bella-imagem] generate-image ERRO:', {
      message,
      tenantId: profile.tenant_id,
      imageRecordId: imageRecord.id,
    })

    // Marca registro como falha
    await admin
      .from('generated_images')
      .update({ status: 'failed', error_message: message.slice(0, 500) })
      .eq('id', imageRecord.id)

    // Reverte a cota (a geração falhou)
    await admin.rpc('increment_quota_used', { p_tenant_id: profile.tenant_id })
      .then(() => {
        // Decrementa de volta (idealmente teria uma função dedicada)
        return admin
          .from('tenants')
          .update({ quota_used: quota.used - 1 })
          .eq('id', profile.tenant_id)
      })
      .catch((revertErr) => {
        console.error('[bella-imagem] falha ao reverter cota:', revertErr)
      })

    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: imageRecord.id,
      action: 'generate_image',
      success: false,
      error_message: message.slice(0, 500),
    })

    return NextResponse.json(
      { error: 'Falha na geração da imagem. Tente novamente.', detail: message },
      { status: 500 }
    )
  }
}

// ── Helper: upload para Supabase Storage ──
async function uploadToStorage(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  imageId: string,
  fileName: string,
  base64Data: string,
  contentType: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64')
  const path = `${tenantId}/${imageId}/${fileName}`

  const { error } = await admin.storage
    .from('bella-images')
    .upload(path, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Upload error (${fileName}): ${error.message}`)

  const { data: { publicUrl } } = admin.storage
    .from('bella-images')
    .getPublicUrl(path)

  return publicUrl
}
