import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateCaption } from '@/lib/ai/captions'
import { rateLimitCaption } from '@/lib/security/rate-limit'
import { validateTextField } from '@/lib/security/validation'
import type { Tenant } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, tenant_id, active')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não configurado' }, { status: 400 })
  }

  // #26 — Verifica se usuário está ativo
  if (!profile.active) {
    return NextResponse.json({ error: 'Conta desativada.' }, { status: 403 })
  }

  // Rate limiting
  const rl = rateLimitCaption(profile.tenant_id)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento.' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString() } }
    )
  }

  // Carrega apenas campos necessários do tenant (#21)
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, plan, business_name, business_segment, business_description, business_tone')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  if (tenant.plan === 'free') {
    return NextResponse.json(
      { error: 'Geração de legendas disponível a partir do plano Starter.' },
      { status: 403 }
    )
  }

  let body: { imageId?: string; imageDescription?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  // Validação de inputs
  const descCheck = validateTextField(body.imageDescription, 'imageDescription', 500)
  if (!descCheck.valid) {
    return NextResponse.json({ error: descCheck.error }, { status: 400 })
  }

  if (body.imageId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(body.imageId)) {
      return NextResponse.json({ error: 'imageId inválido.' }, { status: 400 })
    }
  }

  // Busca a imagem gerada para passar ao modelo de visão.
  // O prompt_used não descreve o tipo de peça ("the clothing from the product image"),
  // por isso a única forma de gerar uma legenda precisa é enviar a imagem real.
  let imageBase64: string | undefined
  let imageContext: string | undefined
  if (body.imageId) {
    const { data: imageRecord } = await admin
      .from('generated_images')
      .select('selected_url, background_preset, background_custom, aspect_ratio')
      .eq('id', body.imageId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (imageRecord?.selected_url) {
      try {
        const imgRes = await fetch(imageRecord.selected_url)
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer()
          imageBase64 = Buffer.from(buffer).toString('base64')
        }
      } catch (fetchErr) {
        console.warn('[captions] Falha ao buscar imagem gerada:', fetchErr)
      }
    }

    // Metadados de contexto (cenário, formato) como complemento textual
    const metaParts: string[] = []
    if (imageRecord?.background_preset) metaParts.push(`Cenário: ${imageRecord.background_preset}`)
    if (imageRecord?.background_custom) metaParts.push(`Fundo: ${imageRecord.background_custom}`)
    if (imageRecord?.aspect_ratio) metaParts.push(`Formato: ${imageRecord.aspect_ratio}`)
    if (metaParts.length) imageContext = metaParts.join(' | ')
  }

  const startTime = Date.now()

  try {
    const result = await generateCaption(
      { imageDescription: descCheck.sanitized, imageContext, imageBase64 },
      tenant as Tenant
    )

    const durationMs = Date.now() - startTime

    if (body.imageId) {
      await admin
        .from('generated_images')
        .update({ caption_generated: result.caption })
        .eq('id', body.imageId)
        .eq('tenant_id', profile.tenant_id)
    }

    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: body.imageId ?? null,
      action: 'generate_caption',
      ai_model: 'gemini-2.5-flash',
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
      cost_usd: result.costUsd,
      duration_ms: durationMs,
      success: true,
    })

    return NextResponse.json({ caption: result.caption })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[bella-imagem] generate-caption ERRO:', message)
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'generate_caption',
      success: false,
      error_message: message.slice(0, 500),
    })
    return NextResponse.json({ error: 'Falha ao gerar legenda.', detail: message }, { status: 500 })
  }
}
