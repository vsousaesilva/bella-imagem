import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { name, email, subject, message } = body as {
    name?: string
    email?: string
    subject?: string
    message?: string
  }

  if (!name?.trim())    return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
  if (!email?.trim())   return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 })
  if (!subject?.trim()) return NextResponse.json({ error: 'Assunto obrigatório.' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Mensagem obrigatória.' }, { status: 400 })

  // Validações básicas de tamanho
  if (name.length > 100)    return NextResponse.json({ error: 'Nome muito longo.' }, { status: 400 })
  if (subject.length > 200) return NextResponse.json({ error: 'Assunto muito longo.' }, { status: 400 })
  if (message.length > 5000) return NextResponse.json({ error: 'Mensagem muito longa.' }, { status: 400 })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  try {
    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[contato] Erro ao enviar email:', msg)
    return NextResponse.json({ error: 'Falha ao enviar mensagem. Tente novamente.' }, { status: 500 })
  }
}
