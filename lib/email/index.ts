// ============================================================
// Bella Imagem — Envio de e-mails via Resend
// ============================================================

import { Resend } from 'resend'

const APP_URL = 'https://bellaimagem.ia.br'
const FROM = 'Bella Imagem <noreply@bellaimagem.ia.br>'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

// ── Template base ──

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bella Imagem</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;color:#fefefe;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${APP_URL}/logo.png" alt="Bella Imagem" height="44" style="display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;">
                Bella Imagem &copy; ${new Date().getFullYear()} &mdash;
                <a href="${APP_URL}" style="color:#c9a96e;text-decoration:none;">bellaimagem.ia.br</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── E-mail de boas-vindas pós-pagamento ──

export async function sendWelcomeEmail({
  to,
  name,
  plan,
  passwordLink,
}: {
  to: string
  name: string
  plan: string
  passwordLink: string
}) {
  const planLabels: Record<string, string> = {
    free: 'Gratuito',
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
  }
  const planLabel = planLabels[plan] ?? plan

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#fefefe;font-family:Georgia,serif;">
      Bem-vindo à Bella Imagem!
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#b0b0b0;line-height:1.6;">
      Olá, <strong style="color:#fefefe;">${name}</strong>. Seu pagamento foi confirmado e o
      <strong style="color:#c9a96e;">Plano ${planLabel}</strong> já está ativo na sua conta.
    </p>

    <p style="margin:0 0 8px;font-size:13px;color:#b0b0b0;">Para criar sua senha e acessar a plataforma, clique no botão abaixo:</p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td bgcolor="#c9a96e" style="border-radius:100px;padding:14px 32px;">
          <a href="${passwordLink}" style="color:#0a0a0a;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;display:inline-block;">
            Criar minha senha
          </a>
        </td>
      </tr>
    </table>

    <!-- Instruções -->
    <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <tr>
        <td>
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#c9a96e;letter-spacing:0.2em;text-transform:uppercase;">Próximos passos</p>
          <p style="margin:0 0 8px;font-size:13px;color:#b0b0b0;">1. Clique em <strong style="color:#fefefe;">Criar minha senha</strong> acima</p>
          <p style="margin:0 0 8px;font-size:13px;color:#b0b0b0;">2. Defina sua senha de acesso</p>
          <p style="margin:0;font-size:13px;color:#b0b0b0;">3. Acesse a plataforma em <a href="${APP_URL}/login" style="color:#c9a96e;text-decoration:none;">bellaimagem.ia.br</a></p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.6;">
      O link acima expira em <strong style="color:#b0b0b0;">24 horas</strong>. Se expirar, acesse
      <a href="${APP_URL}/login" style="color:#c9a96e;text-decoration:none;">bellaimagem.ia.br</a>
      e use a opção <em>Esqueci minha senha</em>.
    </p>
  `)

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Bem-vindo ao Plano ${planLabel} — crie sua senha de acesso`,
    html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

// ── E-mail de senha para plano gratuito ──

export async function sendFreeWelcomeEmail({
  to,
  name,
  passwordLink,
}: {
  to: string
  name: string
  passwordLink: string
}) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#fefefe;font-family:Georgia,serif;">
      Sua conta foi criada!
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#b0b0b0;line-height:1.6;">
      Olá, <strong style="color:#fefefe;">${name}</strong>. Sua conta gratuita na Bella Imagem está pronta.
      Crie sua senha para começar a gerar fotos profissionais para sua loja.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td bgcolor="#c9a96e" style="border-radius:100px;padding:14px 32px;">
          <a href="${passwordLink}" style="color:#0a0a0a;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;display:inline-block;">
            Criar minha senha
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.6;">
      O link expira em <strong style="color:#b0b0b0;">24 horas</strong>. Se expirar, use a opção
      <em>Esqueci minha senha</em> em
      <a href="${APP_URL}/login" style="color:#c9a96e;text-decoration:none;">bellaimagem.ia.br</a>.
    </p>
  `)

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Sua conta Bella Imagem está pronta — crie sua senha',
    html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

// ── E-mail de boas-vindas para novo afiliado ──

export async function sendAffiliateWelcomeEmail({
  to,
  name,
  code,
  passwordLink,
}: {
  to: string
  name: string
  code: string
  passwordLink: string
}) {
  const referralLink = `${APP_URL}/register?ref=${code}`

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#fefefe;font-family:Georgia,serif;">
      Bem-vindo ao programa de afiliados!
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#b0b0b0;line-height:1.6;">
      Olá, <strong style="color:#fefefe;">${name}</strong>! Seu cadastro como afiliado da Bella Imagem foi aprovado.
      Comece a compartilhar seu link e ganhe <strong style="color:#c9a96e;">20% de comissão</strong> em cada venda.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(201,169,110,0.06);border:1px solid rgba(201,169,110,0.2);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#c9a96e;letter-spacing:0.2em;text-transform:uppercase;">Seu link de afiliado</p>
        <p style="margin:0;font-size:13px;color:#fefefe;word-break:break-all;">${referralLink}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#b0b0b0;">Para acessar seu painel e começar, crie sua senha:</p>

    <table cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
      <tr>
        <td bgcolor="#c9a96e" style="border-radius:100px;padding:14px 32px;">
          <a href="${passwordLink}" style="color:#0a0a0a;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;display:inline-block;">
            Criar minha senha
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.6;">
      O link expira em <strong style="color:#b0b0b0;">24 horas</strong>. Se expirar, use
      <em>Esqueci minha senha</em> em
      <a href="${APP_URL}/login" style="color:#c9a96e;text-decoration:none;">bellaimagem.ia.br</a>.
    </p>
  `)

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Bem-vindo ao programa de afiliados Bella Imagem!',
    html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

// ── E-mail de contato do site ──

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#fefefe;font-family:Georgia,serif;">
      Nova mensagem de contato
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#b0b0b0;line-height:1.6;">
      Uma nova mensagem foi enviada pelo formulário de contato da Bella Imagem.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0 2px;">Nome</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#fefefe;padding:0 0 16px;font-weight:600;">${name}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0 2px;">E-mail</td>
          </tr>
          <tr>
            <td style="font-size:14px;padding:0 0 16px;">
              <a href="mailto:${email}" style="color:#c9a96e;text-decoration:none;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0 2px;">Assunto</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#fefefe;padding:0 0 16px;">${subject}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0 2px;">Mensagem</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#b0b0b0;line-height:1.7;white-space:pre-wrap;">${message}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.6;">
      Responda diretamente para <a href="mailto:${email}" style="color:#c9a96e;text-decoration:none;">${email}</a>
    </p>
  `)

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to: 'suporte@usinadotempo.com.br',
    replyTo: email,
    subject: `[Contato] ${subject}`,
    html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

// ── E-mail de conversão para afiliado ──

export async function sendAffiliateConversionEmail({
  to,
  affiliateName,
  plan,
  valueBrl,
  commissionBrl,
}: {
  to: string
  affiliateName: string
  plan: string
  valueBrl: number
  commissionBrl: number
}) {
  const planLabels: Record<string, string> = { starter: 'Starter', pro: 'Pro', business: 'Business' }
  const planLabel = planLabels[plan] ?? plan
  const fmtBrl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#fefefe;font-family:Georgia,serif;">
      Nova conversão! 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#b0b0b0;line-height:1.6;">
      Olá, <strong style="color:#fefefe;">${affiliateName}</strong>! Uma nova venda foi realizada pelo seu link de afiliado.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(201,169,110,0.06);border:1px solid rgba(201,169,110,0.2);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <tr><td>
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#c9a96e;letter-spacing:0.2em;text-transform:uppercase;">Detalhes da conversão</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#b0b0b0;padding:4px 0;">Plano contratado</td>
            <td style="font-size:13px;color:#fefefe;text-align:right;font-weight:600;">Plano ${planLabel}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#b0b0b0;padding:4px 0;">Valor da venda</td>
            <td style="font-size:13px;color:#fefefe;text-align:right;">${fmtBrl(valueBrl)}/mês</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#c9a96e;padding:8px 0 0;font-weight:600;">Sua comissão</td>
            <td style="font-size:18px;color:#c9a96e;text-align:right;font-weight:700;padding:8px 0 0;">${fmtBrl(commissionBrl)}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td bgcolor="#c9a96e" style="border-radius:100px;padding:14px 32px;">
          <a href="${APP_URL}/afiliado/dashboard" style="color:#0a0a0a;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;display:inline-block;">
            Ver meu painel
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.6;">
      Sua comissão já foi registrada. Continue compartilhando seu link e acumule mais!
    </p>
  `)

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `💰 Nova conversão — você ganhou ${fmtBrl(commissionBrl)}!`,
    html,
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}

