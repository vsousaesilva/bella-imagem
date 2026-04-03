// ============================================================
// Bella Imagem — Tipos centrais
// ============================================================

export type UserRole = 'master' | 'administrador' | 'operador'

export type PlanType = 'free' | 'starter' | 'pro' | 'business'

export type TomDePele = 'clara' | 'media' | 'escura'
export type Biotipo = 'magra' | 'media' | 'plus_size'
export type FaixaEtaria = '18_25' | '26_35' | '36_45'
export type GeneroModelo = 'feminino' | 'masculino' | 'neutro'

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '3:4'

export type ImageStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ──────────────────────────────────────────────────────────────
// Tenant
// ──────────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: PlanType
  active: boolean

  quota_limit: number
  quota_used: number
  quota_reset_at: string

  business_name: string | null
  business_segment: string | null
  business_description: string | null
  business_tone: string | null

  model_tom_de_pele: TomDePele
  model_biotipo: Biotipo
  model_faixa_etaria: FaixaEtaria
  model_genero: GeneroModelo
  model_descricao: string | null

  instagram_access_token: string | null
  instagram_account_id: string | null

  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────────
// Perfil do usuário
// ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  tenant_id: string | null
  full_name: string | null
  role: UserRole
  active: boolean
  created_at: string
}

export interface TenantMembership {
  id: string
  user_id: string
  tenant_id: string
  role: UserRole
  active: boolean
  created_at: string
}

// ──────────────────────────────────────────────────────────────
// Imagens geradas
// ──────────────────────────────────────────────────────────────

export interface GeneratedImage {
  id: string
  tenant_id: string
  created_by: string

  clothing_image_url: string
  model_image_url: string | null
  background_preset: string | null
  background_custom: string | null
  aspect_ratio: AspectRatio

  prompt_used: string | null
  output_urls: string[]
  selected_url: string | null
  caption_generated: string | null

  ai_model: string
  status: ImageStatus
  tokens_input: number | null
  tokens_output: number | null
  cost_usd: number | null
  generation_time_ms: number | null
  error_message: string | null

  instagram_media_id: string | null
  instagram_permalink: string | null
  posted_at: string | null

  created_at: string
}

// ──────────────────────────────────────────────────────────────
// Logs de uso
// ──────────────────────────────────────────────────────────────

export type ActionType = 'generate_image' | 'generate_caption' | 'post_instagram'

export interface UsageLog {
  id: string
  tenant_id: string
  user_id: string
  image_id: string | null
  action: ActionType
  ai_model: string | null
  tokens_input: number
  tokens_output: number
  cost_usd: number
  duration_ms: number | null
  success: boolean
  error_message: string | null
  created_at: string
}

// ──────────────────────────────────────────────────────────────
// Planos
// ──────────────────────────────────────────────────────────────

export interface PlanConfig {
  plan: PlanType
  label: string
  quota_images: number
  price_brl: number
  features: string[]
  active: boolean
}

export interface Subscription {
  id: string
  tenant_id: string
  plan: PlanType
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  asaas_payment_id: string | null
  status: string
  billing_cycle: string | null
  next_due_date: string | null
  cancelled_at: string | null
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────────
// Requisição de geração de imagem
// ──────────────────────────────────────────────────────────────

export interface GenerateImageRequest {
  clothingImageBase64: string
  clothingImageMimeType: string
  modelImageBase64?: string
  modelImageMimeType?: string
  backgroundPreset?: string
  backgroundCustom?: string
  aspectRatio?: AspectRatio
}

export interface GenerateImageResult {
  images: Array<{ base64: string; mimeType: string }>
  tokensInput: number
  tokensOutput: number
  costUsd: number
  generationTimeMs: number
  promptUsed: string
}

// ──────────────────────────────────────────────────────────────
// Relatório de uso (painel master)
// ──────────────────────────────────────────────────────────────

export interface TenantUsageReport {
  tenant_id: string
  tenant_name: string
  plan: PlanType
  images_generated: number
  captions_generated: number
  instagram_posts: number
  total_tokens_input: number
  total_tokens_output: number
  total_cost_usd: number
  avg_generation_time_ms: number
  period_start: string
  period_end: string
}

// ──────────────────────────────────────────────────────────────
// Presets de fundo
// ──────────────────────────────────────────────────────────────

export const BACKGROUND_PRESETS = [
  { value: 'studio_branco', label: 'Estúdio branco' },
  { value: 'studio_cinza', label: 'Estúdio cinza' },
  { value: 'estilo_lifestyle', label: 'Estilo lifestyle (ambiente natural)' },
  { value: 'urbano', label: 'Cenário urbano' },
  { value: 'natureza', label: 'Natureza / jardim' },
  { value: 'praia', label: 'Praia / litoral' },
  { value: 'interior_luxo', label: 'Interior luxuoso' },
  { value: 'cafe_bistrô', label: 'Café / bistrô' },
] as const

export const ASPECT_RATIO_OPTIONS: Array<{ value: AspectRatio; label: string }> = [
  { value: '4:5', label: '4:5 — Retrato (Instagram feed)' },
  { value: '1:1', label: '1:1 — Quadrado' },
  { value: '9:16', label: '9:16 — Stories / Reels' },
  { value: '16:9', label: '16:9 — Paisagem' },
  { value: '3:4', label: '3:4 — Retrato clássico' },
]

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

export const PLAN_COLORS: Record<PlanType, string> = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  business: 'bg-amber-100 text-amber-700',
}
