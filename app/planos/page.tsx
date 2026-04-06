export const dynamic = 'force-dynamic'

import { ThemeLogoStatic } from '@/components/theme-logo'
import { Check, Zap } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'

const PLANS = [
  {
    key: 'starter',
    label: 'Starter',
    price: 'R$ 149',
    period: '/mês',
    popular: true,
    features: [
      '100 imagens/mês',
      '2 variações por geração',
      'Geração de legendas',
      'Download em alta resolução',
    ],
    cta: 'Começar agora',
    highlight: true,
  },
  {
    key: 'pro',
    label: 'Pro',
    price: 'R$ 499',
    period: '/mês',
    popular: false,
    features: [
      '400 imagens/mês',
      '2 variações por geração',
      'Geração de legendas',
      'Publicar no Instagram',
      'Suporte prioritário',
    ],
    cta: 'Começar agora',
    highlight: false,
  },
  {
    key: 'business',
    label: 'Business',
    price: 'R$ 1.999',
    period: '/mês',
    popular: false,
    features: [
      '1.500 imagens/mês',
      '2 variações por geração',
      'Geração de legendas',
      'Publicar no Instagram',
      'Relatório completo de uso',
      'Suporte dedicado',
    ],
    cta: 'Falar com equipe',
    highlight: false,
  },
]

function buildUrl(plan: string, ref: string) {
  const params = new URLSearchParams({ plan })
  if (ref) params.set('ref', ref)
  return `/register?${params.toString()}`
}

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref = '' } = await searchParams

  let affiliateName: string | null = null
  if (ref) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('affiliates')
      .select('name')
      .eq('code', ref.trim().toLowerCase())
      .eq('active', true)
      .single()
    affiliateName = data?.name ?? null
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'var(--main-bg)' }}
    >
      {/* Gradiente de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 15% 30%, rgba(201,169,110,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 85% 20%, rgba(232,180,184,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50% 90%, rgba(201,169,110,0.04) 0%, transparent 60%)
          `,
        }}
      />

      <div className="w-full max-w-5xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <ThemeLogoStatic width={160} height={48} priority />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight" style={{ color: '#ffffff' }}>
            Escolha seu plano
          </h1>
          <p className="text-bella-gray mt-2 text-sm">
            Gere imagens profissionais de moda com IA em segundos
          </p>
          {affiliateName && (
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)', color: '#c9a96e' }}
            >
              <Zap className="w-3 h-3" />
              Indicação d{affiliateName.trim().match(/^[AEIOUaeiou]/) ? 'o(a)' : 'o(a)'} afiliado(a) {affiliateName.split(' ')[0]}
            </div>
          )}
        </div>

        {/* Cards dos planos pagos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className="relative rounded-2xl p-6 flex flex-col"
              style={
                plan.highlight
                  ? { background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.35)' }
                  : { background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }
              }
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                    style={{ background: '#c9a96e', color: '#0a0a0a' }}
                  >
                    Mais popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: plan.highlight ? '#c9a96e' : '#6b6b6b' }}>
                  {plan.label}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-display font-bold" style={{ color: '#ffffff' }}>
                    {plan.price}
                  </span>
                  <span className="text-bella-gray text-sm mb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-bella-gray">
                    <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: plan.highlight ? '#c9a96e' : '#4ade80' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={buildUrl(plan.key, ref)}
                className="block text-center text-sm font-semibold py-2.5 rounded-xl transition-all"
                style={
                  plan.highlight
                    ? { background: '#c9a96e', color: '#0a0a0a' }
                    : { background: 'var(--main-bg-subtle)', color: 'var(--main-text)', border: '1px solid var(--main-border)' }
                }
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Plano gratuito — menos destaque */}
        <div
          className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-bella-gray mb-0.5">Gratuito</p>
            <p className="text-sm text-bella-gray">
              15 imagens/mês · sem cartão · para conhecer a plataforma
            </p>
          </div>
          <a
            href={buildUrl('free', ref)}
            className="text-xs font-medium text-bella-gray hover:text-white transition-colors whitespace-nowrap underline underline-offset-2"
          >
            Criar conta gratuita →
          </a>
        </div>

        <p className="text-center text-[11px] text-bella-gray mt-8">
          Pagamento via PIX, boleto ou cartão · Cancele quando quiser
        </p>
      </div>
    </div>
  )
}
