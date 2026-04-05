export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import NextImage from 'next/image'
import { TrendingUp, DollarSign, Users, Clock } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { LogoutButton } from '@/components/logout-button'
import type { PlanType, ReferralStatus } from '@/lib/types'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'

const APP_URL = 'https://bellaimagem.ia.br'

const STATUS_LABELS: Record<ReferralStatus, string> = {
  pending:   'Pendente',
  confirmed: 'Confirmado',
  paid:      'Pago',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<ReferralStatus, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-green-500/10 text-green-400',
  paid:      'bg-bella-gold/10 text-bella-gold',
  cancelled: 'bg-red-500/10 text-red-400',
}

function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AfiliadoDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, name, code, commission_pct, active, created_at')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) redirect('/afiliado/registro')

  const { data: referrals } = await admin
    .from('affiliate_referrals')
    .select('id, plan, value_brl, commission_brl, status, created_at')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  const safeReferrals = referrals ?? []

  const confirmedReferrals = safeReferrals.filter(r => r.status === 'confirmed' || r.status === 'paid')
  const totalCommission = confirmedReferrals.reduce((s, r) => s + (r.commission_brl ?? 0), 0)
  const paidCommission = safeReferrals.filter(r => r.status === 'paid').reduce((s, r) => s + (r.commission_brl ?? 0), 0)
  const pendingCommission = safeReferrals.filter(r => r.status === 'pending').reduce((s, r) => s + (r.commission_brl ?? 0), 0)

  const referralLink = `${APP_URL}/planos?ref=${affiliate.code}`

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', '--main-text': '#fefefe', '--main-text-sub': '#6b6b6b', '--main-text-muted': '#b0b0b0', '--main-input-bg': 'rgba(255,255,255,0.04)', '--main-input-border': 'rgba(255,255,255,0.1)' } as React.CSSProperties}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <NextImage src="/logo.png" alt="Bella Imagem" width={140} height={42} className="object-contain" />
          <div className="flex items-center gap-4">
            <span className="text-xs text-bella-gray">Painel de Afiliado</span>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Saudação */}
        <div>
          <h1 className="text-2xl font-display font-medium" style={{ color: '#ffffff' }}>
            Olá, {affiliate.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-bella-gray mt-1">
            Comissão de <strong style={{ color: '#c9a96e' }}>{affiliate.commission_pct}%</strong> por cada venda via seu link.
          </p>
        </div>

        {/* Link de afiliado */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#c9a96e' }}>
            Seu link de afiliado
          </p>
          <div className="flex items-center gap-3">
            <p className="flex-1 text-sm font-mono truncate" style={{ color: '#ffffff' }}>{referralLink}</p>
            <CopyButton text={referralLink} />
          </div>
          <p className="text-xs text-bella-gray mt-2">Código: <strong style={{ color: '#fefefe' }}>{affiliate.code}</strong></p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users,      label: 'Total de indicações',   value: safeReferrals.length.toString(),    sub: 'links clicados e cadastros' },
            { icon: TrendingUp, label: 'Conversões confirmadas', value: confirmedReferrals.length.toString(), sub: 'pagamentos confirmados' },
            { icon: DollarSign, label: 'Comissão acumulada',    value: fmtBrl(totalCommission),            sub: 'confirmadas + pagas' },
            { icon: Clock,      label: 'Aguardando pagamento',  value: fmtBrl(pendingCommission),          sub: 'em análise' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <kpi.icon className="w-4 h-4 mb-2" style={{ color: '#c9a96e' }} />
              <p className="text-xl font-bold" style={{ color: '#ffffff' }}>{kpi.value}</p>
              <p className="text-[11px] text-bella-gray mt-0.5 leading-tight">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Histórico de conversões */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-bella-white">Histórico de conversões</h2>
          </div>

          {safeReferrals.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-bella-gray text-sm">Nenhuma conversão ainda.</p>
              <p className="text-bella-gray text-xs mt-1">Compartilhe seu link para começar a ganhar!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {safeReferrals.map(r => (
                <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[r.plan as PlanType] ?? ''}`}
                      >
                        {PLAN_LABELS[r.plan as PlanType] ?? r.plan}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status as ReferralStatus]}`}
                      >
                        {STATUS_LABELS[r.status as ReferralStatus] ?? r.status}
                      </span>
                    </div>
                    <p className="text-xs text-bella-gray">{fmtDate(r.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#c9a96e' }}>
                      {r.commission_brl != null ? fmtBrl(r.commission_brl) : '—'}
                    </p>
                    {r.value_brl != null && (
                      <p className="text-[11px] text-bella-gray">venda {fmtBrl(r.value_brl)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {paidCommission > 0 && (
            <div
              className="px-5 py-3 flex justify-between text-sm"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(201,169,110,0.04)' }}
            >
              <span className="text-bella-gray">Total já pago</span>
              <span className="font-semibold" style={{ color: '#c9a96e' }}>{fmtBrl(paidCommission)}</span>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-bella-gray">
          Dúvidas? Entre em contato em{' '}
          <a href="mailto:suporte@bellaimagem.ia.br" style={{ color: '#c9a96e' }}>
            suporte@bellaimagem.ia.br
          </a>
        </p>
      </div>
    </div>
  )
}
