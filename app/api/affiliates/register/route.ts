import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateTextField } from '@/lib/security/validation'
import { getAffiliateProgramActive } from '@/lib/settings'

const APP_URL = 'https://bellaimagem.ia.br'

function generateCode(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('-')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${slug}-${suffix}`
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { name, email, description } = body as {
    name?: string
    email?: string
    description?: string
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

  const descCheck = validateTextField(description, 'description', 500)

  const admin = createAdminClient()

  // Verificar se o programa está ativo
  const programActive = await getAffiliateProgramActive(admin)
  if (!programActive) {
    return NextResponse.json(
      { error: 'O programa de afiliados está temporariamente suspenso. Tente novamente em breve.' },
      { status: 503 }
    )
  }

  // Verificar se e-mail já é afiliado
  const { data: existing } = await admin
    .from('affiliates')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Este e-mail já está cadastrado como afiliado. Acesse seu painel pelo link de login.' },
      { status: 409 }
    )
  }

  // Criar auth user para o afiliado
  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: nameCheck.sanitized },
  })

  if (userError) {
    if (userError.message?.includes('already')) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Use a opção de login ou recuperação de senha.' },
        { status: 409 }
      )
    }
    console.error('[affiliates/register] Erro ao criar usuário:', userError)
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
  }

  const userId = newUser.user.id
  const code = generateCode(nameCheck.sanitized)

  // Criar registro de afiliado
  const { error: affiliateError } = await admin.from('affiliates').insert({
    user_id: userId,
    name: nameCheck.sanitized,
    email,
    code,
    commission_pct: 20,
    active: true,
  })

  if (affiliateError) {
    console.error('[affiliates/register] Erro ao criar afiliado:', affiliateError)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Erro ao cadastrar. Tente novamente.' }, { status: 500 })
  }

  // Enviar e-mail com link para definir senha
  try {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${APP_URL}/auth/confirm` },
    })

    if (!linkError && linkData?.properties?.action_link) {
      const { sendAffiliateWelcomeEmail } = await import('@/lib/email')
      await sendAffiliateWelcomeEmail({
        to: email,
        name: nameCheck.sanitized,
        code,
        passwordLink: linkData.properties.action_link,
      })
    }
  } catch (emailErr) {
    console.error('[affiliates/register] Erro ao enviar e-mail:', emailErr)
    // Não falha o cadastro por causa do e-mail
  }

  return NextResponse.json({ ok: true, code })
}
