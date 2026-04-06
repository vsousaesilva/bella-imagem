import NextImage from 'next/image'
import { CheckCircle, Mail, ArrowRight, Lock } from 'lucide-react'
import type { PlanType } from '@/lib/types'

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

interface PageProps {
  searchParams: Promise<{ plan?: string }>
}

export default async function BemVindoPage({ searchParams }: PageProps) {
  const { plan: rawPlan } = await searchParams
  const plan = (rawPlan && rawPlan in PLAN_LABELS ? rawPlan : 'free') as PlanType
  const planLabel = PLAN_LABELS[plan]
  const isPaid = plan !== 'free'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'var(--main-bg)' } as React.CSSProperties}
    >
      {/* Mesh gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 30% 40%, rgba(201,169,110,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 75% 25%, rgba(232,180,184,0.05) 0%, transparent 60%)
          `,
        }}
      />

      <div className="w-full max-w-lg relative z-10 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="px-6 py-3 rounded-2xl" style={{ background: '#1a1a1a' }}>
            <NextImage
              src="/logo.png"
              alt="Bella Imagem"
              width={160}
              height={48}
              className="object-contain"
              priority
            />
          </div>

        {/* Ícone de sucesso */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <CheckCircle className="w-8 h-8 text-bella-gold" />
          </div>
        </div>

        {/* Título */}
        <h1 className="font-display text-3xl sm:text-4xl font-medium text-bella-white mb-3 leading-tight">
          {isPaid ? 'Pagamento recebido!' : 'Conta criada!'}
        </h1>
        <p className="text-bella-gray-light font-body mb-10">
          {isPaid
            ? `Bem-vindo ao Plano ${planLabel}. Sua assinatura já está ativa.`
            : `Bem-vindo ao Plano ${planLabel}. Sua conta está pronta.`}
        </p>

        {/* Passos */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-left space-y-6 mb-8"
          style={{
            background: 'var(--main-bg-subtle)',
            border: '1px solid var(--main-border)',
          }}
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-bella-gold font-body">
            Próximos passos
          </p>

          {/* Passo 1 */}
          <div className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
            >
              <Mail className="w-4 h-4 text-bella-gold" />
            </div>
            <div>
              <p className="text-bella-white font-body font-medium text-sm">
                Verifique seu e-mail
              </p>
              <p className="text-bella-gray text-sm font-body mt-1 leading-relaxed">
                Enviamos um link para você criar sua senha de acesso.
                Verifique também a caixa de spam caso não encontre.
              </p>
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: 'var(--main-border)' }} />

          {/* Passo 2 */}
          <div className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
            >
              <Lock className="w-4 h-4 text-bella-gold" />
            </div>
            <div>
              <p className="text-bella-white font-body font-medium text-sm">
                Crie sua senha
              </p>
              <p className="text-bella-gray text-sm font-body mt-1 leading-relaxed">
                Clique no link do e-mail para definir sua senha e acessar a plataforma.
                O link expira em 24 horas.
              </p>
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: 'var(--main-border)' }} />

          {/* Passo 3 */}
          <div className="flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
            >
              <ArrowRight className="w-4 h-4 text-bella-gold" />
            </div>
            <div>
              <p className="text-bella-white font-body font-medium text-sm">
                Acesse a plataforma
              </p>
              <p className="text-bella-gray text-sm font-body mt-1 leading-relaxed">
                Após criar sua senha, acesse{' '}
                <a
                  href="https://bellaimagem.ia.br/login"
                  className="text-bella-gold hover:underline"
                >
                  bellaimagem.ia.br
                </a>{' '}
                e comece a gerar fotos profissionais para sua loja.
              </p>
            </div>
          </div>
        </div>

        {/* CTA login */}
        <a
          href="https://bellaimagem.ia.br/login"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm tracking-widest uppercase"
        >
          <span>Ir para o login</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <p className="text-[11px] text-bella-gray mt-8">
          Dúvidas? Fale conosco em{' '}
          <a href="mailto:suporte@bellaimagem.ia.br" className="text-bella-gold hover:underline">
            suporte@bellaimagem.ia.br
          </a>
        </p>
      </div>
    </div>
  )
}
