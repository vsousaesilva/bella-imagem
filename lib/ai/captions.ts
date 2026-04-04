// ============================================================
// Bella Imagem — Geração de legendas via Gemini Flash (texto)
// ============================================================

import type { Tenant } from '@/lib/types'

const GEMINI_TEXT_MODEL = 'gemini-2.5-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const COST_INPUT_PER_1K = 0.000075
const COST_OUTPUT_PER_1K = 0.0003

// ──────────────────────────────────────────────────────────────
// Contexto do negócio → texto para o prompt
// ──────────────────────────────────────────────────────────────

function buildBusinessContext(tenant: Tenant): string {
  const parts: string[] = []

  if (tenant.business_name) parts.push(`Marca: ${tenant.business_name}`)
  if (tenant.business_segment) parts.push(`Segmento: ${tenant.business_segment}`)
  if (tenant.business_description) parts.push(`Descrição: ${tenant.business_description}`)
  if (tenant.business_tone) parts.push(`Tom de comunicação: ${tenant.business_tone}`)

  return parts.length > 0 ? parts.join('. ') : 'Loja de moda'
}

// ──────────────────────────────────────────────────────────────
// Geração da legenda
// ──────────────────────────────────────────────────────────────

export interface CaptionRequest {
  imageDescription?: string   // breve descrição da peça/look (opcional)
  platform?: string           // instagram, tiktok, etc.
}

export interface CaptionResult {
  caption: string
  tokensInput: number
  tokensOutput: number
  costUsd: number
}

export async function generateCaption(
  req: CaptionRequest,
  tenant: Tenant
): Promise<CaptionResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const businessContext = buildBusinessContext(tenant)
  const platform = req.platform ?? 'Instagram'

  const systemPrompt = `Você é especialista em marketing digital para moda e varejo.
Crie legendas envolventes, autênticas e que convertem para posts de ${platform}.
REGRAS:
- Máximo 2200 caracteres
- Use emojis com moderação
- Inclua CTA sutil (ex: "Link na bio", "Arraste para ver")
- Inclua de 5 a 10 hashtags relevantes ao final
- Tom alinhado ao perfil da marca
- Sem markdown, sem asteriscos
- Texto em português do Brasil`

  const userPrompt = `Contexto da marca: ${businessContext}
${req.imageDescription ? `Descrição do look/peça: ${req.imageDescription}` : ''}

Crie uma legenda de ${platform} para esse post de moda.`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1024,
    },
  }

  const res = await fetch(`${API_BASE}/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini caption error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const caption = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const tokensInput = data.usageMetadata?.promptTokenCount ?? 0
  const tokensOutput = data.usageMetadata?.candidatesTokenCount ?? 0
  const costUsd =
    (tokensInput / 1000) * COST_INPUT_PER_1K +
    (tokensOutput / 1000) * COST_OUTPUT_PER_1K

  return { caption, tokensInput, tokensOutput, costUsd }
}
