export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { BarChart3, ImageIcon, FileText, Instagram } from 'lucide-react'

interface MonthRow {
  month: string
  images: number
  captions: number
  instagram: number
  cost_usd: number
}

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/dashboard')

  const { data: tenant } = await admin
    .from('tenants')
    .select('plan, quota_used, quota_limit, quota_reset_at, business_name')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant || tenant.plan !== 'business') {
    redirect('/dashboard')
  }

  // Last 6 months of usage logs
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: logs } = await admin
    .from('usage_logs')
    .select('action, cost_usd, created_at')
    .eq('tenant_id', profile.tenant_id)
    .eq('success', true)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: false })

  // Group by month
  const monthMap = new Map<string, MonthRow>()
  for (const log of logs ?? []) {
    const d = new Date(log.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!monthMap.has(key)) {
      monthMap.set(key, { month: monthLabel, images: 0, captions: 0, instagram: 0, cost_usd: 0 })
    }
    const row = monthMap.get(key)!
    if (log.action === 'generate_image') row.images++
    if (log.action === 'generate_caption') row.captions++
    if (log.action === 'post_instagram') row.instagram++
    row.cost_usd += log.cost_usd ?? 0
  }

  const months = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, v]) => v)

  // Current month totals
  const now = new Date()
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentMonth = monthMap.get(currentKey) ?? { month: '', images: 0, captions: 0, instagram: 0, cost_usd: 0 }

  const quotaPercent = Math.min(100, Math.round((tenant.quota_used / tenant.quota_limit) * 100))
  const resetDate = new Date(tenant.quota_reset_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold tracking-tight text-bella-white">Relatório de uso</h1>
        <p className="text-bella-gray text-sm mt-1">
          {tenant.business_name ?? 'Sua conta'} — Plano Business
        </p>
      </div>

      {/* Current month summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<ImageIcon className="w-4 h-4" />}
          label="Imagens este mês"
          value={currentMonth.images}
        />
        <StatCard
          icon={<FileText className="w-4 h-4" />}
          label="Legendas este mês"
          value={currentMonth.captions}
        />
        <StatCard
          icon={<Instagram className="w-4 h-4" />}
          label="Posts Instagram"
          value={currentMonth.instagram}
        />
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Custo IA (USD)"
          value={`$${(currentMonth.cost_usd).toFixed(4)}`}
          small
        />
      </div>

      {/* Quota */}
      <section
        className="rounded-2xl p-6 mb-8"
        style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
      >
        <h2 className="text-sm font-medium text-bella-white mb-4">Cota de imagens</h2>
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-semibold text-bella-white">
            {tenant.quota_used}
            <span className="text-base text-bella-gray font-normal"> / {tenant.quota_limit}</span>
          </span>
          <span className="text-xs text-bella-gray">Renova em {resetDate}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${quotaPercent}%`,
              background: quotaPercent >= 90
                ? '#f87171'
                : quotaPercent >= 70
                  ? '#fbbf24'
                  : 'linear-gradient(90deg, #c9a96e, #dfc9a0)',
            }}
          />
        </div>
        <p className="text-xs text-bella-gray mt-2">{quotaPercent}% utilizado</p>
      </section>

      {/* Monthly history table */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--main-border)' }}>
          <h2 className="text-sm font-medium text-bella-white">Histórico — últimos 6 meses</h2>
        </div>

        {months.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-bella-gray text-sm">Nenhum uso registrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--main-border)' }}>
                  {['Mês', 'Imagens', 'Legendas', 'Posts IG', 'Custo IA'].map(h => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-[11px] font-medium tracking-wide uppercase"
                      style={{ color: 'var(--main-text-sub)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < months.length - 1 ? '1px solid var(--main-border)' : 'none',
                    }}
                  >
                    <td className="px-6 py-3 capitalize" style={{ color: 'var(--main-text)' }}>
                      {row.month}
                    </td>
                    <td className="px-6 py-3" style={{ color: 'var(--main-text)' }}>{row.images}</td>
                    <td className="px-6 py-3" style={{ color: 'var(--main-text)' }}>{row.captions}</td>
                    <td className="px-6 py-3" style={{ color: 'var(--main-text)' }}>{row.instagram}</td>
                    <td className="px-6 py-3" style={{ color: '#c9a96e' }}>
                      ${row.cost_usd.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  small?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: '#c9a96e' }}>
        {icon}
        <span className="text-[11px] text-bella-gray">{label}</span>
      </div>
      <p className={`font-semibold text-bella-white ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}
