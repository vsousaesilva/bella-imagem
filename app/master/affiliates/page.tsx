export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, DollarSign, TrendingUp, CheckCircle } from 'lucide-react'
import type { PlanType, ReferralStatus } from '@/lib/types'
import { PLAN_LABELS } from '@/lib/types'
import { AffiliateRow } from '@/components/affiliate-row'
import { AffiliateProgramToggle } from '@/components/affiliate-program-toggle'
import { getAffiliateProgramActive } from '@/lib/settings'

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
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default async function MasterAffiliatesPage() {
  const admin = createAdminClient()

  const programActive = await getAffiliateProgramActive(admin)

  const { data: affiliates } = await admin
    .from('affiliates')
    .select('id, name, email, code, commission_pct, active, created_at')
    .order('created_at', { ascending: false })

  const { data: referrals } = await admin
    .from('affiliate_referrals')
    .select('id, affiliate_id, plan, value_brl, commission_brl, status, created_at')
    .order('created_at', { ascending: false })

  const safeAffiliates = affiliates ?? []
  const safeReferrals = referrals ?? []

  // Agregar stats por afiliado
  const statsMap = safeAffiliates.reduce<Record<string, { total: number; confirmed: number; commission: number; pending: number }>>((acc, a) => {
    const aRefs = safeReferrals.filter(r => r.affiliate_id === a.id)
    acc[a.id] = {
      total: aRefs.length,
      confirmed: aRefs.filter(r => r.status === 'confirmed' || r.status === 'paid').length,
      commission: aRefs.filter(r => r.status === 'confirmed' || r.status === 'paid').reduce((s, r) => s + (r.commission_brl ?? 0), 0),
      pending: aRefs.filter(r => r.status === 'pending').reduce((s, r) => s + (r.commission_brl ?? 0), 0),
    }
    return acc
  }, {})

  const totalCommission = safeReferrals
    .filter(r => r.status === 'confirmed' || r.status === 'paid')
    .reduce((s, r) => s + (r.commission_brl ?? 0), 0)

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/master" className="text-xs text-bella-gray hover:text-bella-gray-light transition-colors mb-3 inline-block">
          ← Voltar ao painel
        </Link>
        <h1 className="text-2xl font-display font-bold tracking-tight text-bella-white">Programa de Afiliados</h1>
        <p className="text-sm text-bella-gray mt-1">Gerencie afiliados, conversões e comissões</p>
      </div>

      {/* Toggle global do programa */}
      <AffiliateProgramToggle active={programActive} />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users,      label: 'Afiliados ativos', value: safeAffiliates.filter(a => a.active).length.toString() },
          { icon: TrendingUp, label: 'Total conversões',  value: safeReferrals.filter(r => r.status === 'confirmed' || r.status === 'paid').length.toString() },
          { icon: DollarSign, label: 'Comissão acumulada', value: fmtBrl(totalCommission) },
          { icon: CheckCircle, label: 'Conversões pendentes', value: safeReferrals.filter(r => r.status === 'pending').length.toString() },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
            <kpi.icon className="w-4 h-4 mb-2" style={{ color: '#c9a96e' }} />
            <p className="text-xl font-bold text-bella-white">{kpi.value}</p>
            <p className="text-[11px] text-bella-gray mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabela de afiliados */}
      <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid var(--main-border)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--main-border)' }}>
          <h2 className="text-sm font-semibold text-bella-white">Afiliados</h2>
          <span className="text-xs text-bella-gray">{safeAffiliates.length} cadastrados</span>
        </div>

        {safeAffiliates.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-bella-gray text-sm">Nenhum afiliado cadastrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Afiliado', 'Código', 'Comissão %', 'Conversões', 'Comissão acum.', 'Pendente', 'Status', 'Desde', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-bella-gray">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--main-border)' }}>
                {safeAffiliates.map(a => {
                  const s = statsMap[a.id]
                  return (
                    <AffiliateRow
                      key={a.id}
                      id={a.id}
                      name={a.name}
                      email={a.email}
                      code={a.code}
                      commissionPct={a.commission_pct}
                      active={a.active}
                      confirmedCount={s.confirmed}
                      totalCount={s.total}
                      commission={s.commission}
                      pending={s.pending}
                      createdAt={a.created_at}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabela de conversões recentes */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--main-border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--main-border)' }}>
          <h2 className="text-sm font-semibold text-bella-white">Conversões recentes</h2>
        </div>

        {safeReferrals.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-bella-gray text-sm">Nenhuma conversão registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Data', 'Afiliado', 'Plano', 'Venda', 'Comissão', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-bella-gray">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--main-border)' }}>
                {safeReferrals.slice(0, 50).map(r => {
                  const aff = safeAffiliates.find(a => a.id === r.affiliate_id)
                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-bella-gray">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-bella-white text-xs">{aff?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-bella-gray">{PLAN_LABELS[r.plan as PlanType] ?? r.plan ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-bella-white text-xs">{r.value_brl != null ? fmtBrl(r.value_brl) : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#c9a96e' }}>
                        {r.commission_brl != null ? fmtBrl(r.commission_brl) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status as ReferralStatus]}`}>
                          {STATUS_LABELS[r.status as ReferralStatus] ?? r.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
