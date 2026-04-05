// ============================================================
// Bella Imagem — Geração de imagens via Gemini (Fase 1)
// ============================================================

import type {
  GenerateImageRequest,
  GenerateImageResult,
  Tenant,
  AspectRatio,
} from '@/lib/types'
import { sanitizePromptInput } from '@/lib/security/validation'

const GEMINI_MODEL = 'gemini-3.1-flash-image-preview'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const COST_INPUT_PER_1K = 0.000075
const COST_OUTPUT_PER_1K = 0.0003

// ── Mapeamento de perfil do modelo → texto ──

function buildModelProfileText(tenant: Tenant): string {
  const labels = {
    tom_de_pele: {
      clara: 'pele clara',
      media: 'pele morena',
      escura: 'pele negra',
    },
    biotipo: {
      magra: 'corpo esbelto',
      media: 'corpo mediano',
      plus_size: 'corpo plus size',
    },
    faixa_etaria: {
      '0_18': 'de 0 a 18 anos',
      '18_25': 'entre 18 e 25 anos',
      '26_35': 'entre 26 e 35 anos',
      '36_45': 'entre 36 e 45 anos',
      '45_mais': 'acima de 45 anos',
    },
    genero: {
      feminino: 'mulher',
      masculino: 'homem',
      neutro: 'pessoa',
    },
  }

  const parts: string[] = [
    labels.genero[tenant.model_genero],
    labels.faixa_etaria[tenant.model_faixa_etaria],
    labels.tom_de_pele[tenant.model_tom_de_pele],
    labels.biotipo[tenant.model_biotipo],
  ]

  if (tenant.model_descricao) {
    // Sanitiza campo que vem do banco (foi salvo pelo admin, mas previne contra stored XSS)
    const { sanitized } = sanitizePromptInput(tenant.model_descricao, 'model_descricao')
    parts.push(sanitized)
  }

  return parts.join(', ')
}

// ── Mapeamento de fundo ──

const BACKGROUND_DESCRIPTIONS: Record<string, string> = {
  studio_branco: 'fundo branco clean de estúdio fotográfico profissional',
  studio_cinza: 'fundo cinza neutro de estúdio fotográfico profissional',
  estilo_lifestyle: 'ambiente natural com luz natural, estilo lifestyle',
  urbano: 'cenário urbano moderno, rua movimentada da cidade',
  natureza: 'jardim com vegetação natural e luz solar suave',
  praia: 'praia ensolarada com areia clara e mar azul ao fundo',
  interior_luxo: 'interior elegante e luxuoso, decoração sofisticada',
  cafe_bistro: 'café ou bistrô aconchegante com decoração moderna',
}

function buildBackgroundText(preset?: string, custom?: string): string {
  // Custom já foi sanitizado na rota antes de chegar aqui
  if (custom && custom.trim()) return custom.trim()
  if (preset && BACKGROUND_DESCRIPTIONS[preset]) return BACKGROUND_DESCRIPTIONS[preset]
  return 'fundo neutro e elegante que valorize a peça'
}

// ── Aspect ratio ──

const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  '1:1':  'perfectly square composition (1:1), centered framing, equal width and height',
  '4:5':  'vertical portrait composition (4:5), taller than wide, standard Instagram feed format',
  '9:16': 'tall vertical composition (9:16), full-body shot from head to feet, Stories/Reels format',
  '16:9': 'wide horizontal landscape composition (16:9), wider than tall',
  '3:4':  'vertical portrait composition (3:4), classic portrait format, taller than wide',
}

// ── Tamanho ──

function buildSizeText(tamanhoPeca?: string, tamanhoInfantil?: number): string {
  if (!tamanhoPeca) return ''
  if (tamanhoPeca === 'infanto_juvenil') {
    const idade = Math.min(16, Math.max(0, tamanhoInfantil ?? 8))
    return `The clothing is sized for a child aged ${idade} years old.`
  }
  const sizeMap: Record<string, string> = {
    P: 'small (size S)',
    M: 'medium (size M)',
    G: 'large (size L)',
    GG: 'extra large (size XL)',
    plus_size: 'plus size',
  }
  return `The clothing size is ${sizeMap[tamanhoPeca] ?? tamanhoPeca}.`
}

// ── Construção do prompt (#16 — inputs já sanitizados antes de chegar aqui) ──

export function buildFashionPrompt(
  tenant: Tenant,
  hasModelPhoto: boolean,
  backgroundText: string,
  tamanhoPeca?: string,
  tamanhoInfantil?: number,
  modelDescricaoLivre?: string
): string {
  const sizeText = buildSizeText(tamanhoPeca, tamanhoInfantil)

  if (hasModelPhoto) {
    return [
      'Professional fashion photography for e-commerce.',
      'Using the provided person photo as the model, show them wearing the exact clothing/accessory from the product image.',
      "Keep the model's face, body proportions and skin tone from the reference photo.",
      'The clothing must match exactly the product provided.',
      sizeText,
      `Background: ${backgroundText}.`,
      'High resolution, sharp details, studio lighting, commercial quality.',
      'No text, no watermarks.',
    ].filter(Boolean).join(' ')
  }

  let modelIntro: string
  if (modelDescricaoLivre && modelDescricaoLivre.trim()) {
    // Input já sanitizado pela rota — aqui apenas encapsulamos de forma segura
    const safeDesc = modelDescricaoLivre.trim().slice(0, 300)
    modelIntro = `Create a model with these physical characteristics: ${safeDesc}. The model should wear the exact clothing/accessory shown in the product image.`
  } else if (tamanhoPeca === 'infanto_juvenil') {
    const idade = Math.min(16, Math.max(0, tamanhoInfantil ?? 8))
    modelIntro = `Show the exact clothing on an appropriate child model aged around ${idade} years old.`
  } else {
    const modelDesc = buildModelProfileText(tenant)
    modelIntro = `Create a ${modelDesc} wearing the exact clothing/accessory shown in the product image.`
  }

  return [
    'Professional fashion photography for e-commerce.',
    modelIntro,
    'Show the full outfit clearly. The clothing must match exactly the product provided.',
    tamanhoPeca !== 'infanto_juvenil' ? sizeText : '',
    `Background: ${backgroundText}.`,
    'High resolution, sharp details, studio lighting, commercial quality.',
    'No text, no watermarks.',
  ].filter(Boolean).join(' ')
}

// ── Chamada à API Gemini ──

interface GeminiPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

async function callGemini(
  prompt: string,
  imageParts: GeminiPart[],
  aspectRatio: AspectRatio
): Promise<{ base64: string; mimeType: string; tokensInput: number; tokensOutput: number }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const promptWithRatio = `${prompt} IMPORTANT: The image MUST use a ${ASPECT_RATIO_LABELS[aspectRatio]}. Crop and frame accordingly.`

  const body = {
    contents: [
      {
        parts: [
          ...imageParts,
          { text: promptWithRatio },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  }

  const res = await fetch(`${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const responseText = await res.text()

  if (!res.ok) {
    // Verifica se o erro HTTP é relacionado a política de uso
    const lowerText = responseText.toLowerCase()
    const isPolicyError =
      lowerText.includes('safety') ||
      lowerText.includes('prohibited') ||
      lowerText.includes('policy') ||
      lowerText.includes('harm') ||
      lowerText.includes('blocked')
    console.error('[imagen] Gemini HTTP error', res.status, responseText.slice(0, 500))
    if (isPolicyError) {
      const err = new Error('Conteúdo bloqueado pelas políticas de uso da IA.')
      ;(err as Error & { policyViolation: boolean }).policyViolation = true
      throw err
    }
    throw new Error(`Gemini API error ${res.status}: ${responseText}`)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error(`Gemini resposta inválida: ${responseText.slice(0, 200)}`)
  }

  // Bloqueio no nível do prompt (antes de gerar)
  const blockReason = (data.promptFeedback as Record<string, unknown> | undefined)?.blockReason as string | undefined
  if (blockReason) {
    console.warn('[imagen] Gemini promptFeedback.blockReason:', blockReason)
    const err = new Error('Conteúdo bloqueado pelas políticas de uso da IA.')
    ;(err as Error & { policyViolation: boolean }).policyViolation = true
    throw err
  }

  const candidate = (data.candidates as unknown[])?.[0] as Record<string, unknown> | undefined

  // Sem candidatos — log completo para diagnóstico
  if (!candidate) {
    console.warn('[imagen] Gemini sem candidatos. Resposta completa:', JSON.stringify(data).slice(0, 1000))
    throw new Error('Gemini não retornou candidatos')
  }

  const POLICY_REASONS = ['SAFETY', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY', 'RECITATION', 'BLOCKLIST', 'OTHER']
  const finishReason = candidate.finishReason as string | undefined
  console.log('[imagen] finishReason:', finishReason)
  if (finishReason && POLICY_REASONS.includes(finishReason) && finishReason !== 'STOP') {
    const err = new Error('Conteúdo bloqueado pelas políticas de uso da IA.')
    ;(err as Error & { policyViolation: boolean }).policyViolation = true
    throw err
  }

  const parts = ((candidate.content as Record<string, unknown> | undefined)?.parts ?? []) as GeminiPart[]
  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imagePart?.inlineData) {
    console.warn('[imagen] Gemini sem imagem. finishReason:', finishReason, 'parts:', JSON.stringify(parts).slice(0, 500))
    // Se não há imagem e finishReason não é STOP, provavelmente é bloqueio
    if (finishReason && finishReason !== 'STOP') {
      const err = new Error('Conteúdo bloqueado pelas políticas de uso da IA.')
      ;(err as Error & { policyViolation: boolean }).policyViolation = true
      throw err
    }
    throw new Error('Gemini não retornou imagem')
  }

  const tokensInput = data.usageMetadata?.promptTokenCount ?? 0
  const tokensOutput = data.usageMetadata?.candidatesTokenCount ?? 0

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
    tokensInput,
    tokensOutput,
  }
}

// ── Função principal — gera 2 variações ──

export async function generateFashionImages(
  req: GenerateImageRequest,
  tenant: Tenant
): Promise<GenerateImageResult> {
  const startTime = Date.now()

  const backgroundText = buildBackgroundText(req.backgroundPreset, req.backgroundCustom)
  const hasModelPhoto = !!(req.modelImageBase64 && req.modelImageMimeType)
  const prompt = buildFashionPrompt(
    tenant, hasModelPhoto, backgroundText,
    req.tamanhoPeca, req.tamanhoInfantil, req.modelDescricaoLivre
  )
  const aspectRatio = req.aspectRatio ?? '4:5'

  const imageParts: GeminiPart[] = [
    {
      inlineData: {
        mimeType: req.clothingImageMimeType,
        data: req.clothingImageBase64,
      },
    },
  ]

  if (hasModelPhoto) {
    imageParts.push({
      inlineData: {
        mimeType: req.modelImageMimeType!,
        data: req.modelImageBase64!,
      },
    })
  }

  // Gera 2 variações em paralelo
  const [v1, v2] = await Promise.all([
    callGemini(prompt, imageParts, aspectRatio),
    callGemini(prompt, imageParts, aspectRatio),
  ])

  const generationTimeMs = Date.now() - startTime
  const tokensInput = v1.tokensInput + v2.tokensInput
  const tokensOutput = v1.tokensOutput + v2.tokensOutput
  const costUsd =
    (tokensInput / 1000) * COST_INPUT_PER_1K +
    (tokensOutput / 1000) * COST_OUTPUT_PER_1K

  return {
    images: [
      { base64: v1.base64, mimeType: v1.mimeType },
      { base64: v2.base64, mimeType: v2.mimeType },
    ],
    tokensInput,
    tokensOutput,
    costUsd,
    generationTimeMs,
    promptUsed: prompt,
  }
}
