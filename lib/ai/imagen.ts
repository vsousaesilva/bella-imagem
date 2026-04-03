// ============================================================
// Bella Imagem — Geração de imagens via Gemini (Fase 1)
// Migração futura: trocar o provider por fal.ai CatVTON/IDM-VTON
// ============================================================

import type {
  GenerateImageRequest,
  GenerateImageResult,
  Tenant,
  AspectRatio,
} from '@/lib/types'

const GEMINI_MODEL = 'gemini-2.0-flash-preview-image-generation'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Custo aproximado Gemini 2.0 Flash (USD por 1k tokens)
const COST_INPUT_PER_1K = 0.000075
const COST_OUTPUT_PER_1K = 0.0003

// ──────────────────────────────────────────────────────────────
// Mapeamento de perfil do modelo → texto para o prompt
// ──────────────────────────────────────────────────────────────

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
      '18_25': 'entre 18 e 25 anos',
      '26_35': 'entre 26 e 35 anos',
      '36_45': 'entre 36 e 45 anos',
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
    parts.push(tenant.model_descricao)
  }

  return parts.join(', ')
}

// ──────────────────────────────────────────────────────────────
// Mapeamento de fundo para texto descritivo
// ──────────────────────────────────────────────────────────────

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
  if (custom && custom.trim()) return custom.trim()
  if (preset && BACKGROUND_DESCRIPTIONS[preset]) return BACKGROUND_DESCRIPTIONS[preset]
  return 'fundo neutro e elegante que valorize a peça'
}

// ──────────────────────────────────────────────────────────────
// Mapeamento de aspect ratio para Gemini
// ──────────────────────────────────────────────────────────────

const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  '1:1': '1:1',
  '4:5': '4:5',
  '9:16': '9:16',
  '16:9': '16:9',
  '3:4': '3:4',
}

// ──────────────────────────────────────────────────────────────
// Construção do prompt de try-on fashion
// ──────────────────────────────────────────────────────────────

export function buildFashionPrompt(
  tenant: Tenant,
  hasModelPhoto: boolean,
  backgroundText: string
): string {
  const modelDesc = buildModelProfileText(tenant)

  if (hasModelPhoto) {
    return [
      'Professional fashion photography for e-commerce.',
      'Using the provided person photo as the model, show them wearing the exact clothing/accessory from the product image.',
      'Keep the model\'s face, body proportions and skin tone from the reference photo.',
      'The clothing must match exactly the product provided.',
      `Background: ${backgroundText}.`,
      'High resolution, sharp details, studio lighting, commercial quality.',
      'No text, no watermarks.',
    ].join(' ')
  }

  return [
    'Professional fashion photography for e-commerce.',
    `Create a ${modelDesc} wearing the exact clothing/accessory shown in the product image.`,
    'Show the full outfit clearly. The clothing must match exactly the product provided.',
    `Background: ${backgroundText}.`,
    'High resolution, sharp details, studio lighting, commercial quality.',
    'No text, no watermarks.',
  ].join(' ')
}

// ──────────────────────────────────────────────────────────────
// Chamada à API Gemini
// ──────────────────────────────────────────────────────────────

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

  const body = {
    contents: [
      {
        parts: [
          ...imageParts,
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      candidateCount: 1,
      imageGenerationConfig: {
        numberOfImages: 1,
        aspectRatio: ASPECT_RATIO_MAP[aspectRatio],
      },
    },
  }

  const res = await fetch(`${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]

  if (!candidate) throw new Error('Gemini não retornou candidatos')

  // Extrai imagem do response
  const imagePart = candidate.content?.parts?.find(
    (p: GeminiPart) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData) throw new Error('Gemini não retornou imagem')

  const tokensInput = data.usageMetadata?.promptTokenCount ?? 0
  const tokensOutput = data.usageMetadata?.candidatesTokenCount ?? 0

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
    tokensInput,
    tokensOutput,
  }
}

// ──────────────────────────────────────────────────────────────
// Função principal — gera 2 variações
// ──────────────────────────────────────────────────────────────

export async function generateFashionImages(
  req: GenerateImageRequest,
  tenant: Tenant
): Promise<GenerateImageResult> {
  const startTime = Date.now()

  const backgroundText = buildBackgroundText(req.backgroundPreset, req.backgroundCustom)
  const hasModelPhoto = !!(req.modelImageBase64 && req.modelImageMimeType)
  const prompt = buildFashionPrompt(tenant, hasModelPhoto, backgroundText)
  const aspectRatio = req.aspectRatio ?? '4:5'

  // Monta partes de imagem para o Gemini
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
