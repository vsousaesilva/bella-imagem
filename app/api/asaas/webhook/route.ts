import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  validateWebhookToken,
  extractTenantId,
  planFromValue,
  type AsaasWebhookPayload,
} from '@/lib/asaas'
import type { PlanType } from '@/lib/types'

const QUOTA_MAP: Record<PlanType, number> = {
  free: 15,
  starter: 100,
  pro: 400,
  business: 1500,
}

export async function POST(request: Request) {
  // Valida token de segurança no header
  const token = request.headers.get('asaas-access-token')
  if (!validateWebhookToken(token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const payload: AsaasWebhookPayload = await request.json()
  const admin = createAdminClient()

  const tenantId = extractTenantId(payload)

  // Registra o evento para auditoria
  await admin.from('payment_events').insert({
    tenant_id: tenantId,
    asaas_event: payload.event,
    asaas_payload: payload as unknown as Record<string, unknown>,
    processed: false,
  })

  try {
    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        if (!tenantId || !payload.payment) break

        const valueBrl = payload.payment.value
        const plan = planFromValue(valueBrl)
        if (!plan || plan === 'free') break

        // Atualiza plano do tenant
        await admin
          .from('tenants')
          .update({ plan, quota_limit: QUOTA_MAP[plan] })
          .eq('id', tenantId)

        // Atualiza assinatura
        await admin
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            asaas_payment_id: payload.payment.id,
            next_due_date: payload.payment.dueDate,
          })
          .eq('tenant_id', tenantId)

        break
      }

      case 'PAYMENT_OVERDUE': {
        if (!tenantId) break

        await admin
          .from('subscriptions')
          .update({ status: 'overdue' })
          .eq('tenant_id', tenantId)

        break
      }

      case 'SUBSCRIPTION_CANCELLED': {
        if (!tenantId) break

        // Downgrade para free
        await admin
          .from('tenants')
          .update({ plan: 'free', quota_limit: 15 })
          .eq('id', tenantId)

        await admin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('tenant_id', tenantId)

        break
      }

      case 'SUBSCRIPTION_CREATED': {
        if (!tenantId || !payload.subscription) break

        const plan = planFromValue(payload.subscription.value)
        if (!plan) break

        await admin
          .from('subscriptions')
          .update({
            asaas_subscription_id: payload.subscription.id,
            plan,
            status: 'active',
            billing_cycle: 'MONTHLY',
            next_due_date: payload.subscription.nextDueDate,
          })
          .eq('tenant_id', tenantId)

        break
      }
    }

    // Marca evento como processado
    await admin
      .from('payment_events')
      .update({ processed: true })
      .eq('asaas_event', payload.event)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Asaas webhook error:', err)
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }
}
