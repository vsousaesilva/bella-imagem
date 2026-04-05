// ============================================================
// Bella Imagem — Integração Asaas (pagamentos e assinaturas)
// ============================================================

import type { PlanType } from '@/lib/types'
import { timingSafeCompare } from '@/lib/security/validation'

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

// ── Planos ──

export const PLAN_PRICES_BRL: Record<PlanType, number> = {
  free: 0,
  starter: 149.00,
  pro: 499.00,
  business: 1999.00,
}

// ── Customer ──

export interface AsaasCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  externalReference?: string
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

// ── Assinatura ──

export interface AsaasSubscriptionInput {
  customer: string
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY'
  description: string
  externalReference?: string
  callback?: {
    successUrl: string
    autoRedirect?: boolean
  }
}

export async function getSubscriptionFirstPaymentUrl(subscriptionId: string): Promise<string | null> {
  try {
    const data = await asaasFetch(`/subscriptions/${subscriptionId}/payments?limit=1`)
    const payment = data.data?.[0]
    return payment?.invoiceUrl ?? null
  } catch {
    return null
  }
}

export async function createSubscription(input: AsaasSubscriptionInput) {
  return asaasFetch('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

export async function getSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`)
}

// ── Validação de webhook (#4 — timing-safe) ──

export function validateWebhookToken(token: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expected || !token) return false
  return timingSafeCompare(token, expected)
}

// ── Tipos de evento ──

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
    externalReference?: string
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

export function extractTenantId(payload: AsaasWebhookPayload): string | null {
  return (
    payload.payment?.externalReference ??
    payload.subscription?.externalReference ??
    null
  )
}

export function planFromValue(valueBrl: number): PlanType | null {
  for (const [plan, price] of Object.entries(PLAN_PRICES_BRL)) {
    if (Math.abs(price - valueBrl) < 0.01) return plan as PlanType
  }
  return null
}
