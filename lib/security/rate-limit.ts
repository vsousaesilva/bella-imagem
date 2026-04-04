// ============================================================
// Bella Imagem — Rate Limiting (in-memory, swap for Upstash Redis em produção)
// ============================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas a cada 60s para evitar memory leak
const CLEANUP_INTERVAL = 60_000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }, CLEANUP_INTERVAL)
  // Não bloquear o shutdown do processo
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

export interface RateLimitConfig {
  /** Identificador único (ex: `generate:${tenantId}`, `ip:${ip}`) */
  key: string
  /** Número máximo de requests no intervalo */
  limit: number
  /** Janela em milissegundos */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Verifica e incrementa rate limit.
 * Retorna se o request é permitido.
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  ensureCleanup()

  const now = Date.now()
  const entry = store.get(config.key)

  // Janela expirada ou primeira vez
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs
    store.set(config.key, { count: 1, resetAt })
    return { allowed: true, remaining: config.limit - 1, resetAt }
  }

  // Dentro da janela
  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

// ── Presets comuns ──

/** Rate limit por tenant para geração de imagens: 10 req/min */
export function rateLimitGeneration(tenantId: string): RateLimitResult {
  return checkRateLimit({
    key: `generate:${tenantId}`,
    limit: 10,
    windowMs: 60_000,
  })
}

/** Rate limit por IP para rotas de autenticação: 10 req/min */
export function rateLimitAuth(ip: string): RateLimitResult {
  return checkRateLimit({
    key: `auth:${ip}`,
    limit: 10,
    windowMs: 60_000,
  })
}

/** Rate limit por tenant para geração de legendas: 20 req/min */
export function rateLimitCaption(tenantId: string): RateLimitResult {
  return checkRateLimit({
    key: `caption:${tenantId}`,
    limit: 20,
    windowMs: 60_000,
  })
}

/** Rate limit global por IP: 100 req/min */
export function rateLimitGlobal(ip: string): RateLimitResult {
  return checkRateLimit({
    key: `global:${ip}`,
    limit: 100,
    windowMs: 60_000,
  })
}
