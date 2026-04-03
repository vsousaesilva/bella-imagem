import { createAdminClient } from '@/lib/supabase/server'
import { formatCostUsd } from '@/lib/utils'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Building2, ImageIcon, Sparkles, TrendingUp } from 'lucide-react'

export default async function MasterOverviewPage() {
  const admin = createAdminClient()

  // Totais
  const { count: totalTenants } = await admin
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  const { count: totalImages } = await admin
    .from('generated_images')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  // Custo total
  const { data: costData } = await admin
    .from('usage_logs')
    .select('cost_usd')
    .eq('success', true)

  const totalCostUsd = costData?.reduce((sum, l) => sum + (l.cost_usd ?? 0), 0) ?? 0

  // Tenants por plano
  const { data: tenantsByPlan } = await admin
    .from('tenants')
    .select('plan')
    .eq('active', true)

  const planCounts = tenantsByPlan?.reduce(
    (acc, t) => {
      acc[t.plan] = (acc[t.plan] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) ?? {}

  // Últimas atividades
  const { data: recentLogs } = await admin
    .from('usage_logs')
    .select('*, tenant:tenants(name)')
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Métricas consolidadas de todas as empresas.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard icon={<Building2 className="w-5 h-5 text-bella-rose" />} label="Empresas ativas" value={(totalTenants ?? 0).toString()} />
        <KpiCard icon={<ImageIcon className="w-5 h-5 text-purple-500" />} label="Imagens geradas" value={(totalImages ?? 0).toString()} />
        <KpiCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Custo total (USD)" value={formatCostUsd(totalCostUsd)} />
      </div>

      {/* Planos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-bella-charcoal mb-4">Distribuição por plano</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['free', 'starter', 'pro', 'business'] as const).map((plan) => (
            <div key={plan} className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-bella-charcoal">{planCounts[plan] ?? 0}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block', PLAN_COLORS[plan])}>
                {PLAN_LABELS[plan]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas atividades */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-bella-charcoal mb-4">Últimas atividades</h2>
        <div className="space-y-2">
          {recentLogs?.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                {log.action === 'generate_image'
                  ? <ImageIcon className="w-4 h-4 text-bella-rose" />
                  : <Sparkles className="w-4 h-4 text-purple-400" />
                }
                <div>
                  <p className="text-sm text-bella-charcoal">
                    {(log.tenant as { name: string })?.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {log.action === 'generate_image' ? 'Geração de imagem' : 'Geração de legenda'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{formatCostUsd(log.cost_usd ?? 0)}</p>
                <p className="text-xs text-gray-400">
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-sm text-gray-500">{label}</span></div>
      <p className="text-2xl font-bold text-bella-charcoal">{value}</p>
    </div>
  )
}
