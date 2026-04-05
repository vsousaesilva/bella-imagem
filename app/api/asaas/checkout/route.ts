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
      return NextResponse.json(
        { error: 'Conta encontrada mas sem tenant associado. Entre em contato com o suporte.' },
        { status: 409 }
      )
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
      await sendPasswordSetupEmail(email)
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

  const userId = newUser.user.id

  // Criar tenant (slug único com sufixo do userId)
  const baseSlug = toSlug(nameCheck.sanitized) || 'loja'
  const slug = `${baseSlug}-${userId.slice(0, 6)}`

  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name: nameCheck.sanitized,
      slug,
      plan: typedPlan,
      quota_limit: QUOTA_MAP[typedPlan],
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    await admin.auth.admin.deleteUser(userId)
    console.error('[checkout] Erro ao criar tenant:', tenantError)
    return NextResponse.json(
      { error: 'Erro ao criar conta.', detail: isSandbox ? tenantError?.message : undefined },
      { status: 500 }
    )
  }

  const tenantId = tenant.id

  // Criar perfil e membership
  const [profileResult, membershipResult] = await Promise.all([
    admin.from('profiles').upsert({
      id: userId,
      tenant_id: tenantId,
      full_name: nameCheck.sanitized,
      role: 'administrador',
      active: true,
    }),
    admin.from('tenant_memberships').insert({
      user_id: userId,
      tenant_id: tenantId,
      role: 'administrador',
    }),
  ])
  if (profileResult.error) console.error('[checkout] Erro ao criar profile:', profileResult.error)
  if (membershipResult.error) console.error('[checkout] Erro ao criar membership:', membershipResult.error)

  // Plano gratuito: não precisa de pagamento — envia e-mail de definição de senha
  if (typedPlan === 'free') {
    await sendPasswordSetupEmail(email)
    return NextResponse.json({ checkoutUrl: `${APP_URL}/bem-vindo?plan=free` })
  }

  return await gerarLinkPagamento({
    admin,
    tenantId,
    typedPlan,
    name: nameCheck.sanitized,
    email,
    cpfCnpj,
    phone,
    isSandbox,
  })
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

async function sendPasswordSetupEmail(email: string) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await anon.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/callback?next=/dashboard`,
    })
  } catch (err) {
    // Não bloqueia o fluxo se o e-mail falhar
    console.error('[checkout] Erro ao enviar e-mail de senha:', err)
  }
}
