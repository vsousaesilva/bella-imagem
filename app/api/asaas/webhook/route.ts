import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  extractTenantId,
  planFromValue,
  type AsaasWebhookPayload,
} from '@/lib/asaas'
import { timingSafeCompare } from '@/lib/security/validation'
import type { PlanType } from '@/lib/types'

const QUOTA_MAP: Record<PlanType, number> = {
  free: 15,
  starter: 100,
  pro: 400,
  business: 1500,
}

export async function POST(request: Request) {
  // #4 — Validação timing-safe do token
  const token = request.headers.get('asaas-access-token')
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

  if (!expectedToken) {
    console.error('[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado')
    return NextResponse.json({ error: 'Configuração interna inválida' }, { status: 500 })
  }

  if (!timingSafeCompare(token ?? '', expectedToken)) {
    console.warn('[asaas-webhook] Token inválido recebido')
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  let payload: AsaasWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

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

        await admin
          .from('tenants')
          .update({ plan, quota_limit: QUOTA_MAP[plan] })
          .eq('id', tenantId)

        await admin
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            asaas_payment_id: payload.payment.id,
            next_due_date: payload.payment.dueDate,
          })
          .eq('tenant_id', tenantId)

        // Envia e-mail de boas-vindas com link de criação de senha
        await sendWelcomeEmailToTenant(admin, tenantId, plan)

        // Registra conversão de afiliado (se houver)
        await registrarConversaoAfiliado(admin, tenantId, plan, valueBrl, payload.payment?.id)

        console.log(`[asaas-webhook] Pagamento confirmado — tenant:${tenantId} plan:${plan}`)
        break
      }

      case 'PAYMENT_OVERDUE': {
        if (!tenantId) break

        await admin
          .from('subscriptions')
          .update({ status: 'overdue' })
          .eq('tenant_id', tenantId)

        console.warn(`[asaas-webhook] Pagamento atrasado — tenant:${tenantId}`)
        break
      }

      case 'SUBSCRIPTION_CANCELLED': {
        if (!tenantId) break

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

        console.log(`[asaas-webhook] Assinatura cancelada — tenant:${tenantId}`)
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

        console.log(`[asaas-webhook] Assinatura criada — tenant:${tenantId} plan:${plan}`)
        break
      }
    }

    // Marca evento como processado
    if (tenantId) {
      await admin
        .from('payment_events')
        .update({ processed: true })
        .eq('asaas_event', payload.event)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[asaas-webhook] Erro ao processar:', err)
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }
}

// ── helpers ──

async function sendWelcomeEmailToTenant(
  admin: ReturnType<typeof import('@/lib/supabase/server')['createAdminClient']>,
  tenantId: string,
  plan: PlanType
) {
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('tenant_id', tenantId)
      .eq('role', 'administrador')
      .single()

    if (!profile) return

    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) return

    // Gera link de criação de senha via Supabase Admin (sem enviar e-mail pelo Supabase)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: 'https://bellaimagem.ia.br/auth/confirm' },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[asaas-webhook] Erro ao gerar link de senha:', linkError)
      return
    }

    const { sendWelcomeEmail } = await import('@/lib/email')
    await sendWelcomeEmail({
      to: email,
      name: profile.full_name ?? email,
      plan,
      passwordLink: linkData.properties.action_link,
    })

    console.log(`[asaas-webhook] E-mail de boas-vindas enviado — tenant:${tenantId}`)
  } catch (err) {
    console.error('[asaas-webhook] Erro ao enviar e-mail de boas-vindas:', err)
  }
}

// ── Registra conversão de afiliado quando pagamento é confirmado ──

async function registrarConversaoAfiliado(
  admin: ReturnType<typeof import('@/lib/supabase/server')['createAdminClient']>,
  tenantId: string,
  plan: PlanType,
  valueBrl: number,
  asaasPaymentId?: string
) {
  try {
    const { data: tenant } = await admin
      .from('tenants')
      .select('affiliate_code')
      .eq('id', tenantId)
      .single()

    if (!tenant?.affiliate_code) return

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, commission_pct, email, name')
      .eq('code', tenant.affiliate_code)
      .eq('active', true)
      .single()

    if (!affiliate) return

    const commissionBrl = Math.round(valueBrl * (affiliate.commission_pct / 100) * 100) / 100

    await admin.from('affiliate_referrals').insert({
      affiliate_id: affiliate.id,
      tenant_id: tenantId,
      plan,
      value_brl: valueBrl,
      commission_brl: commissionBrl,
      status: 'confirmed',
      asaas_payment_id: asaasPaymentId ?? null,
    })

    // Notifica o afiliado por e-mail
    const { sendAffiliateConversionEmail } = await import('@/lib/email')
    await sendAffiliateConversionEmail({
      to: affiliate.email,
      affiliateName: affiliate.name,
      plan,
      valueBrl,
      commissionBrl,
    })

    console.log(`[asaas-webhook] Conversão afiliado registrada — affiliate:${affiliate.id} tenant:${tenantId} comissão:R$${commissionBrl}`)
  } catch (err) {
    console.error('[asaas-webhook] Erro ao registrar conversão de afiliado:', err)
  }
}
