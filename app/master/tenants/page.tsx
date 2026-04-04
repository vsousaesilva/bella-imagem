export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatCostBrl } from '@/lib/utils'
import Link from 'next/link'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'

const PAGE_SIZE = 50

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  const admin = createAdminClient()

  // #10 — Usa view otimizada em vez de N+1 queries separadas
  const { data: tenants, count } = await admin
    .from('tenants')
    .select('id, name, slug, plan, active, quota_used, quota_limit, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  // Busca stats agregados apenas para os tenants desta página
  const tenantIds = tenants?.map((t) => t.id) ?? []

  type TenantRow = { id: string; name: string; slug: string; plan: string; active: boolean; quota_used: number; quota_limit: number; created_at: string; imagesTotal: number; costTotal: number }
  let tenantStats: TenantRow[] = []

  if (tenantIds.length > 0) {
    const { data: stats } = await admin
      .from('usage_logs')
      .select('tenant_id, action, cost_usd')
      .in('tenant_id', tenantIds)
      .eq('success', true)

    tenantStats = (tenants ?? []).map((t) => {
      const logs = stats?.filter((l) => l.tenant_id === t.id) ?? []
      const images = logs.filter((l) => l.action === 'generate_image').length
      const cost = logs.reduce((s, l) => s + (l.cost_usd ?? 0), 0)
      return { ...t, imagesTotal: images, costTotal: cost }
    })
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">Empresas</h1>
        <p className="text-bella-gray text-sm mt-1">{count ?? 0} empresas cadastradas.</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-bella-gray tracking-widest uppercase" style={{ borderBottom: '1px solid var(--main-border)' }}>
              <th className="text-left px-5 py-3">Empresa</th>
              <th className="text-left px-4 py-3">Plano</th>
              <th className="text-center px-4 py-3">Cota</th>
              <th className="text-right px-4 py-3">Imagens</th>
              <th className="text-right px-4 py-3">Custo</th>
              <th className="text-right px-4 py-3">Status</th>
              <th className="text-right px-5 py-3">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {tenantStats.map((t) => (
              <tr key={t.id} className="transition-colors" style={{ borderBottom: '1px solid var(--main-border)' }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,169,110,0.1)' }}>
                      <Building2 className="w-3.5 h-3.5 text-bella-gold" />
                    </div>
                    <div>
                      <Link href={`/master/tenants/${t.id}`} className="font-medium text-bella-white hover:text-bella-gold transition-colors">
                        {t.name}
                      </Link>
                      <p className="text-[10px] text-bella-gray">{t.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide', PLAN_COLORS[t.plan])}>
                    {PLAN_LABELS[t.plan]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-bella-gray">{t.quota_used}/{t.quota_limit}</span>
                </td>
                <td className="px-4 py-3 text-right text-bella-white font-medium">{t.imagesTotal}</td>
                <td className="px-4 py-3 text-right text-bella-gray text-xs">{formatCostBrl(t.costTotal)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={t.active
                      ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'var(--main-text-sub)' }
                    }
                  >
                    {t.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-[11px] text-bella-gray">{formatDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!tenants?.length && (
          <div className="py-16 text-center text-bella-gray">
            <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            Nenhuma empresa cadastrada ainda.
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={`/master/tenants?page=${page - 1}`} className="text-sm text-bella-gold hover:text-bella-gold-light transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}>
              Anterior
            </Link>
          )}
          <span className="text-sm text-bella-gray">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/master/tenants?page=${page + 1}`} className="text-sm text-bella-gold hover:text-bella-gold-light transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}>
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
