export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatCostBrl } from '@/lib/utils'
import Link from 'next/link'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Tenant } from '@/lib/types'
import { Building2 } from 'lucide-react'

export default async function TenantsPage() {
  const admin = createAdminClient()

  const { data: tenants } = await admin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  // Busca stats por tenant (imagens + custo)
  const { data: stats } = await admin
    .from('usage_logs')
    .select('tenant_id, action, cost_usd')
    .eq('success', true)

  const tenantStats = (tenants as Tenant[] ?? []).map((t) => {
    const logs = stats?.filter((l) => l.tenant_id === t.id) ?? []
    const images = logs.filter((l) => l.action === 'generate_image').length
    const cost = logs.reduce((s, l) => s + (l.cost_usd ?? 0), 0)
    return { ...t, imagesTotal: images, costTotal: cost }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal">Empresas</h1>
        <p className="text-gray-500 mt-1">{tenants?.length ?? 0} empresas cadastradas.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Empresa</th>
              <th className="text-left px-4 py-3">Plano</th>
              <th className="text-center px-4 py-3">Cota</th>
              <th className="text-right px-4 py-3">Imagens</th>
              <th className="text-right px-4 py-3">Custo (USD)</th>
              <th className="text-right px-4 py-3">Status</th>
              <th className="text-right px-5 py-3">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {tenantStats.map((t) => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-bella-nude flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-bella-rose" />
                    </div>
                    <div>
                      <Link href={`/master/tenants/${t.id}`} className="font-medium text-bella-charcoal hover:text-bella-rose transition">
                        {t.name}
                      </Link>
                      <p className="text-xs text-gray-400">{t.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PLAN_COLORS[t.plan])}>
                    {PLAN_LABELS[t.plan]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-gray-600">
                    {t.quota_used}/{t.quota_limit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-bella-charcoal font-medium">
                  {t.imagesTotal}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatCostBrl(t.costTotal)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {t.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs text-gray-400">
                  {formatDate(t.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!tenants?.length && (
          <div className="py-16 text-center text-gray-400">
            <Building2 className="w-8 h-8 mx-auto mb-3 text-gray-200" />
            Nenhuma empresa cadastrada ainda.
          </div>
        )}
      </div>
    </div>
  )
}
