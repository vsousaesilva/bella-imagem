// ============================================================
// Bella Imagem — Integração Asaas (pagamentos e assinaturas)
// Docs: https://docs.asaas.com
// ============================================================

import type { PlanType } from '@/lib/types'

const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'sandbox'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/api/v3'

function asaasHeaders() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!,
  }
}

async function asaasFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: { ...asaasHeaders(), ...(options?.headers ?? {}) },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Asaas ${res.status}: ${err}`)
  }
  return res.json()
}

// ──────────────────────────────────────────────────────────────
// Planos (valores em centavos)
// ──────────────────────────────────────────────────────────────

export const PLAN_PRICES_BRL: Record<PlanType, number> = {
  free: 0,
  starter: 149.00,
  pro: 499.00,
  business: 1999.00,
}

// ──────────────────────────────────────────────────────────────
// Customer (cliente Asaas)
// ──────────────────────────────────────────────────────────────

export interface AsaasCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  externalReference?: string  // tenant_id
}

export async function createCustomer(input: AsaasCustomerInput) {
  return asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getCustomer(customerId: string) {
  return asaasFetch(`/customers/${customerId}`)
}

// ──────────────────────────────────────────────────────────────
// Assinatura (subscription)
// ──────────────────────────────────────────────────────────────

export interface AsaasSubscriptionInput {
  customer: string            // customerId
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX'
  value: number               // valor em BRL
  nextDueDate: string         // 'YYYY-MM-DD'
  cycle: 'MONTHLY'
  description: string
  externalReference?: string  // tenant_id
}

export async function createSubscription(input: AsaasSubscriptionInput) {
  return asaasFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  })
}

export async function getSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`)
}

// ──────────────────────────────────────────────────────────────
// Validação de webhook
// ──────────────────────────────────────────────────────────────

export function validateWebhookToken(token: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expected) return false
  return token === expected
}

// ──────────────────────────────────────────────────────────────
// Mapeamento de evento Asaas → ação no sistema
// ──────────────────────────────────────────────────────────────

export type AsaasEvent =
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_CANCELLED'

export interface AsaasWebhookPayload {
  event: AsaasEvent
  payment?: {
    id: string
    customer: string
    subscription: string
    value: number
    netValue: number
    status: string
    externalReference?: string  // tenant_id
    dueDate: string
  }
  subscription?: {
    id: string
    customer: string
    value: number
    status: string
    externalReference?: string
    nextDueDate: string
    cycle: string
    description: string
  }
}

/** Extrai tenant_id do payload do webhook */
export function extractTenantId(payload: AsaasWebhookPayload): string | null {
  return (
    payload.payment?.externalReference ??
    payload.subscription?.externalReference ??
    null
  )
}

/** Determina o plano com base no valor cobrado */
export function planFromValue(valueBrl: number): PlanType | null {
  for (const [plan, price] of Object.entries(PLAN_PRICES_BRL)) {
    if (Math.abs(price - valueBrl) < 0.01) return plan as PlanType
  }
  return null
}
