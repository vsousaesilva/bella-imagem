import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  createCustomer,
  createSubscription,
  getSubscriptionFirstPaymentUrl,
  PLAN_PRICES_BRL,
} from '@/lib/asaas'
import { validateTextField } from '@/lib/security/validation'
import { toSlug } from '@/lib/utils'
import type { PlanType } from '@/lib/types'

const VALID_PLANS = new Set<PlanType>(['free', 'starter', 'pro', 'business'])

const QUOTA_MAP: Record<PlanType, number> = {
  free: 15,
  starter: 100,
  pro: 400,
  business: 1500,
}

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

const APP_URL = 'https://bellaimagem.ia.br'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { plan, name, email, cpfCnpj, phone } = body as {
    plan?: string
    name?: string
    email?: string
    cpfCnpj?: string
    phone?: string
  }

  // Validações
  if (!plan || !VALID_PLANS.has(plan as PlanType)) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
  }
  if (!name || !email) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  const nameCheck = validateTextField(name, 'name', 100)
  if (!nameCheck.valid) return NextResponse.json({ error: nameCheck.error }, { status: 400 })

  const typedPlan = plan as PlanType
  const isSandbox = process.env.ASAAS_ENV === 'sandbox'
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch (err) {
    console.error('[checkout] Falha ao inicializar Supabase admin:', err)
    return NextResponse.json(
      { error: 'Erro de configuração do servidor.', detail: isSandbox ? String(err) : undefined },
      { status: 500 }
    )
  }

  // Criar usuário Supabase sem senha — receberá e-mail para definir senha após pagamento
  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: nameCheck.sanitized },
  })

  // ── Usuário já existe: tentar retomar pagamento pendente ──
  if (userError) {
    if (!userError.message?.includes('already')) {
      console.error('[checkout] Erro ao criar usuário:', userError)
      return NextResponse.json(
        { error: 'Erro ao criar conta. Tente novamente.', detail: isSandbox ? userError.message : undefined },
        { status: 500 }
      )
    }

    // Busca o usuário existente pelo e-mail
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email)
    if (!existingUser) {
      return NextResponse.json({ error: 'Erro ao localizar conta. Tente novamente.' }, { status: 500 })
    }

    // Busca a subscription do tenant deste usuário
    const { data: profile } = await admin
      .from('profiles')
      .select('tenant_id')
      .eq('id', existingUser.id)
      .single()

    if (!profile?.tenant_id) {
      // Usuário órfão (tenant foi excluído mas auth não) — remove e recria como novo cadastro
      await admin.auth.admin.deleteUser(existingUser.id)
      return await createNewAccount({ admin, plan: typedPlan, name: nameCheck.sanitized, email, cpfCnpj, phone, isSandbox })
    }

    const { data: sub } = await admin
      .from('subscriptions')
      .select('status, asaas_customer_id, asaas_subscription_id')
      .eq('tenant_id', profile.tenant_id)
      .single()

    // Assinatura já ativa — direcionar para login
    if (sub?.status === 'active') {
      return NextResponse.json(
        { error: 'Este e-mail já possui uma assinatura ativa. Acesse a plataforma pelo link de login.' },
        { status: 409 }
      )
    }

    // Plano gratuito: re-enviar e-mail de senha e redirecionar
    if (typedPlan === 'free') {
      await sendPasswordSetupEmail(email, existingUser.user_metadata?.full_name ?? name, admin)
      return NextResponse.json({ checkoutUrl: `${APP_URL}/bem-vindo?plan=free` })
    }

    // Assinatura pendente — gerar novo link de pagamento para o mesmo tenant
    console.log(`[checkout] Retomando pagamento para tenant:${profile.tenant_id}`)
    return await gerarLinkPagamento({
      admin,
      tenantId: profile.tenant_id,
      typedPlan,
      name: nameCheck.sanitized,
      email,
      cpfCnpj,
      phone,
      isSandbox,
    })
  }

  return await createNewAccount({ admin, plan: typedPlan, name: nameCheck.sanitized, email, cpfCnpj, phone, isSandbox, existingUserId: newUser.user.id })
}

// ── Cria tenant + usuário + assinatura do zero ──

async function createNewAccount({
  admin,
  plan,
  name,
  email,
  cpfCnpj,
  phone,
  isSandbox,
  existingUserId,
}: {
  admin: ReturnType<typeof createAdminClient>
  plan: PlanType
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  isSandbox: boolean
  existingUserId?: string
}): Promise<NextResponse> {
  // Se não veio um userId existente, cria o usuário agora
  let userId = existingUserId
  if (!userId) {
    const { data: newUser, error: userError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (userError || !newUser?.user) {
      console.error('[checkout] Erro ao criar usuário:', userError)
      return NextResponse.json(
        { error: 'Erro ao criar conta. Tente novamente.', detail: isSandbox ? userError?.message : undefined },
        { status: 500 }
      )
    }
    userId = newUser.user.id
  }

  // Criar tenant
  const slug = toSlug(name)
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name,
      slug,
      plan,
      active: true,
      quota_limit: QUOTA_MAP[plan],
      quota_used: 0,
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    console.error('[checkout] Erro ao criar tenant:', tenantError)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.', detail: isSandbox ? tenantError?.message : undefined },
      { status: 500 }
    )
  }

  const tenantId = tenant.id

  // O trigger handle_new_user já cria o profile com role='operador' ao criar o auth user.
  // Precisamos atualizar (não inserir) para definir tenant_id, role e full_name corretos.
  await admin
    .from('profiles')
    .update({ tenant_id: tenantId, full_name: name, role: 'administrador', active: true })
    .eq('id', userId)

  // Registrar membership N:N
  await admin.from('tenant_memberships').insert({
    user_id: userId,
    tenant_id: tenantId,
    role: 'administrador',
  })

  await admin.from('subscriptions').insert({
    tenant_id: tenantId,
    plan,
    status: 'pending',
    billing_cycle: 'MONTHLY',
  })

  // Plano gratuito: enviar e-mail de senha e redirecionar
  if (plan === 'free') {
    await sendPasswordSetupEmail(email, name, admin)
    return NextResponse.json({ checkoutUrl: `${APP_URL}/bem-vindo?plan=free` })
  }

  // Planos pagos: gerar link de pagamento no Asaas
  return await gerarLinkPagamento({ admin, tenantId, typedPlan: plan, name, email, cpfCnpj, phone, isSandbox })
}

// ── Gera customer + subscription no Asaas e retorna invoiceUrl ──

async function gerarLinkPagamento({
  admin,
  tenantId,
  typedPlan,
  name,
  email,
  cpfCnpj,
  phone,
  isSandbox,
}: {
  admin: ReturnType<typeof createAdminClient>
  tenantId: string
  typedPlan: PlanType
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  isSandbox: boolean
}): Promise<NextResponse> {
  // Criar customer no Asaas
  let asaasCustomerId: string
  try {
    const customer = await createCustomer({
      name,
      email,
      cpfCnpj: cpfCnpj?.replace(/\D/g, '') || undefined,
      phone: phone?.replace(/\D/g, '') || undefined,
      externalReference: tenantId,
    })
    asaasCustomerId = customer.id
  } catch (err) {
    console.error('[checkout] Erro ao criar customer Asaas:', err)
    return NextResponse.json(
      { error: 'Erro ao iniciar pagamento. Tente novamente.', detail: isSandbox ? String(err) : undefined },
      { status: 500 }
    )
  }

  // Data de vencimento: amanhã
  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + 1)
  const dueDateStr = nextDueDate.toISOString().split('T')[0]

  // Criar subscription no Asaas
  let asaasSubscriptionId: string
  try {
    const subscription = await createSubscription({
      customer: asaasCustomerId,
      billingType: 'UNDEFINED',
      value: PLAN_PRICES_BRL[typedPlan],
      nextDueDate: dueDateStr,
      cycle: 'MONTHLY',
      description: `Bella Imagem — Plano ${PLAN_LABELS[typedPlan]}`,
      externalReference: tenantId,
    })
    asaasSubscriptionId = subscription.id
  } catch (err) {
    console.error('[checkout] Erro ao criar subscription Asaas:', err)
    return NextResponse.json(
      { error: 'Erro ao iniciar pagamento. Tente novamente.', detail: isSandbox ? String(err) : undefined },
      { status: 500 }
    )
  }

  // Buscar URL da primeira cobrança
  const invoiceUrl = await getSubscriptionFirstPaymentUrl(asaasSubscriptionId)
  if (!invoiceUrl) {
    console.error('[checkout] Sem invoiceUrl para subscription:', asaasSubscriptionId)
    return NextResponse.json({ error: 'Erro ao obter link de pagamento.' }, { status: 500 })
  }

  // Salvar IDs Asaas na tabela de subscriptions
  await admin
    .from('subscriptions')
    .update({
      asaas_customer_id: asaasCustomerId,
      asaas_subscription_id: asaasSubscriptionId,
      plan: typedPlan,
    })
    .eq('tenant_id', tenantId)

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}

// ── helpers ──

async function sendPasswordSetupEmail(email: string, name: string, adminClient: ReturnType<typeof createAdminClient>) {
  try {
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${APP_URL}/auth/callback?next=/dashboard` },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[checkout] Erro ao gerar link de senha:', linkError)
      return
    }

    const { sendFreeWelcomeEmail } = await import('@/lib/email')
    await sendFreeWelcomeEmail({
      to: email,
      name,
      passwordLink: linkData.properties.action_link,
    })
  } catch (err) {
    console.error('[checkout] Erro ao enviar e-mail de senha:', err)
  }
}
