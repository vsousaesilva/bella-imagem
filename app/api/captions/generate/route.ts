import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateCaption } from '@/lib/ai/captions'
import type { Tenant } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant não configurado' }, { status: 400 })
  }

  // Verifica se o plano suporta geração de legendas (starter+)
  const { data: tenant } = await admin
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

  if (tenant.plan === 'free') {
    return NextResponse.json(
      { error: 'Geração de legendas disponível a partir do plano Starter.' },
      { status: 403 }
    )
  }

  const { imageId, imageDescription } = await request.json()

  const startTime = Date.now()

  try {
    const result = await generateCaption(
      { imageDescription },
      tenant as Tenant
    )

    const durationMs = Date.now() - startTime

    // Salva legenda na imagem se imageId fornecido
    if (imageId) {
      await admin
        .from('generated_images')
        .update({ caption_generated: result.caption })
        .eq('id', imageId)
        .eq('tenant_id', profile.tenant_id)
    }

    // Log de uso
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      image_id: imageId ?? null,
      action: 'generate_caption',
      ai_model: 'gemini-2.0-flash',
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
      cost_usd: result.costUsd,
      duration_ms: durationMs,
      success: true,
    })

    return NextResponse.json({ caption: result.caption })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    await admin.from('usage_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'generate_caption',
      success: false,
      error_message: message,
    })
    return NextResponse.json({ error: 'Falha ao gerar legenda.' }, { status: 500 })
  }
}
