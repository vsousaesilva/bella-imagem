// ============================================================
// Bella Imagem — Validação e sanitização de segurança
// ============================================================

import { timingSafeEqual } from 'crypto'

// ──────────────────────────────────────────────────────────────
// Validação de tamanho de payload base64
// ──────────────────────────────────────────────────────────────

/** Tamanho máximo de imagem base64 aceito (5MB decodificado ≈ 6.67MB em base64) */
const MAX_BASE64_SIZE = 7 * 1024 * 1024 // 7MB em base64
const MAX_DECODED_SIZE = 5 * 1024 * 1024 // 5MB decodificado

export function validateBase64Size(base64: string, fieldName: string): { valid: boolean; error?: string } {
  if (!base64) {
    return { valid: false, error: `${fieldName} é obrigatório.` }
  }

  if (base64.length > MAX_BASE64_SIZE) {
    return { valid: false, error: `${fieldName} excede o tamanho máximo de 5MB.` }
  }

  // Estimativa rápida do tamanho decodificado
  const decodedSize = Math.ceil(base64.length * 3 / 4)
  if (decodedSize > MAX_DECODED_SIZE) {
    return { valid: false, error: `${fieldName} excede o tamanho máximo de 5MB.` }
  }

  return { valid: true }
}

// ──────────────────────────────────────────────────────────────
// Validação de MIME type
// ──────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export function validateMimeType(mimeType: string, fieldName: string): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIMES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `${fieldName} deve ser JPEG, PNG ou WebP. Recebido: ${mimeType}`,
    }
  }
  return { valid: true }
}

// ──────────────────────────────────────────────────────────────
// Validação de URL (anti-SSRF)
// ──────────────────────────────────────────────────────────────

export function validateStorageUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)

    // Deve ser HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL deve usar HTTPS.' }
    }

    // Deve pertencer ao Supabase Storage do projeto
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return { valid: false, error: 'Configuração do Supabase ausente.' }
    }

    const supabaseHost = new URL(supabaseUrl).hostname
    if (parsed.hostname !== supabaseHost) {
      return { valid: false, error: 'URL não pertence ao storage autorizado.' }
    }

    // Deve estar no path de storage público
    if (!parsed.pathname.startsWith('/storage/v1/object/public/bella-images/')) {
      return { valid: false, error: 'URL não pertence ao bucket autorizado.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'URL inválida.' }
  }
}

// ──────────────────────────────────────────────────────────────
// Sanitização de inputs para prompts (anti-prompt-injection)
// ──────────────────────────────────────────────────────────────

/** Caracteres e padrões perigosos para prompt injection */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+the\s+above/i,
  /disregard\s+(all\s+)?prior/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /act\s+as\s+if/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /override\s+(the\s+)?instructions/i,
  /forget\s+(everything|all|the\s+above)/i,
  /\bDAN\b/,
  /do\s+anything\s+now/i,
  /jailbreak/i,
]

const MAX_USER_INPUT_LENGTH = 500

export function sanitizePromptInput(input: string, fieldName: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = []

  // Truncar se muito longo
  let sanitized = input.slice(0, MAX_USER_INPUT_LENGTH)
  if (input.length > MAX_USER_INPUT_LENGTH) {
    warnings.push(`${fieldName} truncado para ${MAX_USER_INPUT_LENGTH} caracteres.`)
  }

  // Remover caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Verificar padrões de prompt injection
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Remove o trecho perigoso em vez de bloquear totalmente
      sanitized = sanitized.replace(pattern, '[removido]')
      warnings.push(`${fieldName} continha padrão suspeito que foi removido.`)
    }
  }

  // Escapar aspas que poderiam quebrar delimitadores do prompt
  sanitized = sanitized.replace(/"/g, "'")

  return { sanitized, warnings }
}

// ──────────────────────────────────────────────────────────────
// Comparação timing-safe de tokens
// ──────────────────────────────────────────────────────────────

export function timingSafeCompare(a: string, b: string): boolean {
  if (!a || !b) return false

  // timingSafeEqual requer buffers do mesmo tamanho
  const bufA = Buffer.from(a, 'utf-8')
  const bufB = Buffer.from(b, 'utf-8')

  if (bufA.length !== bufB.length) {
    // Ainda comparar para manter tempo constante
    const padded = Buffer.alloc(bufA.length, 0)
    bufB.copy(padded, 0, 0, Math.min(bufB.length, bufA.length))
    timingSafeEqual(bufA, padded)
    return false
  }

  return timingSafeEqual(bufA, bufB)
}

// ──────────────────────────────────────────────────────────────
// Extração segura de IP do request
// ──────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? '0.0.0.0'
}

// ──────────────────────────────────────────────────────────────
// Validação de campos de texto genéricos
// ──────────────────────────────────────────────────────────────

export function validateTextField(
  value: unknown,
  fieldName: string,
  maxLength: number
): { valid: boolean; sanitized: string; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { valid: true, sanitized: '' }
  }

  if (typeof value !== 'string') {
    return { valid: false, sanitized: '', error: `${fieldName} deve ser texto.` }
  }

  const sanitized = value
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()

  return { valid: true, sanitized }
}
