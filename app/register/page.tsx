'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NextImage from 'next/image'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { PlanType } from '@/lib/types'

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

const PLAN_PRICES: Record<PlanType, string> = {
  free: 'R$ 0/mês',
  starter: 'R$ 149/mês',
  pro: 'R$ 499/mês',
  business: 'R$ 1.999/mês',
}

const VALID_PLANS = new Set<string>(['free', 'starter', 'pro', 'business'])

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawPlan = searchParams.get('plan') ?? 'free'
  const plan: PlanType = VALID_PLANS.has(rawPlan) ? (rawPlan as PlanType) : 'free'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function formatCpfCnpj(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, name, email, cpfCnpj, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao processar. Tente novamente.')
        return
      }

      // Redireciona para checkout Asaas (planos pagos) ou página de sucesso (free)
      window.location.href = data.checkoutUrl
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isPaid = plan !== 'free'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Mesh gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(201,169,110,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 80% 20%, rgba(232,180,184,0.05) 0%, transparent 60%)
          `,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <NextImage
              src="/logo.png"
              alt="Bella Imagem"
              width={160}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-bella-gray">Geração de imagens para moda com IA</p>
        </div>

        {/* Plano selecionado */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-6"
          style={{
            background: 'rgba(201,169,110,0.06)',
            border: '1px solid rgba(201,169,110,0.2)',
          }}
        >
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-bella-gold font-body">
              Plano selecionado
            </p>
            <p className="font-display font-medium mt-0.5" style={{ color: '#fefefe' }}>
              {PLAN_LABELS[plan]}
            </p>
          </div>
          <span className="text-bella-gold text-sm font-body font-medium">
            {PLAN_PRICES[plan]}
          </span>
        </div>

        {/* Card do formulário */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h1 className="text-lg font-display font-medium text-bella-white mb-6">
            {isPaid ? 'Criar conta e pagar' : 'Criar conta gratuita'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                CPF ou CNPJ {isPaid && '*'}
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                required={isPaid}
                className="input-field"
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="input-field"
                placeholder="(85) 99999-9999"
                inputMode="tel"
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 text-sm text-red-400 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? 'Processando...'
                  : isPaid
                  ? 'Ir para o pagamento'
                  : 'Criar conta grátis'}
              </span>
            </button>
          </form>

          {isPaid && (
            <p className="text-[11px] text-bella-gray text-center mt-4 leading-relaxed">
              Você será redirecionado para o ambiente seguro do Asaas para escolher
              sua forma de pagamento (PIX, boleto ou cartão).
            </p>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-[11px] text-bella-gray">
            Já tem conta?{' '}
            <a href="/login" className="text-bella-gold hover:underline">
              Entrar
            </a>
          </p>
          <p className="text-[11px] text-bella-gray">
            <a href="https://lp.bellaimagem.ia.br/#planos" className="hover:text-bella-gray-light transition-colors">
              Ver todos os planos
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
