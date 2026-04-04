export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { formatCostBrl } from '@/lib/utils'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Tenant } from '@/lib/types'

export default async function RelatoriosPage() {
  const admin = createAdminClient()

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const { data: tenants } = await admin
    .from('tenants')
    .select('id, name, plan')
    .eq('active', true)

  const { data: logs } = await admin
    .from('usage_logs')
    .select('tenant_id, action, tokens_input, tokens_output, cost_usd, duration_ms, success')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)

  const report = (tenants as Pick<Tenant, 'id' | 'name' | 'plan'>[] ?? []).map((t) => {
    const tLogs = logs?.filter((l) => l.tenant_id === t.id) ?? []
    const successLogs = tLogs.filter((l) => l.success)
    return {
      tenant_id:            t.id,
      tenant_name:          t.name,
      plan:                 t.plan,
      images_generated:     successLogs.filter((l) => l.action === 'generate_image').length,
      captions_generated:   successLogs.filter((l) => l.action === 'generate_caption').length,
      instagram_posts:      successLogs.filter((l) => l.action === 'post_instagram').length,
      total_tokens_input:   successLogs.reduce((s, l) => s + (l.tokens_input ?? 0), 0),
      total_tokens_output:  successLogs.reduce((s, l) => s + (l.tokens_output ?? 0), 0),
      total_cost_usd:       successLogs.reduce((s, l) => s + (l.cost_usd ?? 0), 0),
      avg_generation_time_ms: successLogs.length
        ? successLogs.reduce((s, l) => s + (l.duration_ms ?? 0), 0) / successLogs.length
        : 0,
    }
  }).sort((a, b) => b.total_cost_usd - a.total_cost_usd)

  const grandTotal = {
    images:    report.reduce((s, r) => s + r.images_generated, 0),
    captions:  report.reduce((s, r) => s + r.captions_generated, 0),
    tokensIn:  report.reduce((s, r) => s + r.total_tokens_input, 0),
    tokensOut: report.reduce((s, r) => s + r.total_tokens_output, 0),
    cost:      report.reduce((s, r) => s + r.total_cost_usd, 0),
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">Relatórios de Uso</h1>
        <p className="text-bella-gray text-sm mt-1">
          Período: {new Date(periodStart).toLocaleDateString('pt-BR')} até{' '}
          {new Date(periodEnd).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Totais globais */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Imagens',        value: grandTotal.images.toString() },
          { label: 'Legendas',       value: grandTotal.captions.toString() },
          { label: 'Tokens entrada', value: grandTotal.tokensIn.toLocaleString() },
          { label: 'Tokens saída',   value: grandTotal.tokensOut.toLocaleString() },
          { label: 'Custo total',    value: formatCostBrl(grandTotal.cost) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl p-4" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
            <p className="text-[10px] text-bella-gray tracking-wide uppercase mb-1">{item.label}</p>
            <p className="text-lg font-display font-medium text-bella-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-[10px] text-bella-gray tracking-widest uppercase" style={{ borderBottom: '1px solid var(--main-border)' }}>
              <th className="text-left px-5 py-3">Empresa</th>
              <th className="text-left px-3 py-3">Plano</th>
              <th className="text-right px-3 py-3">Imagens</th>
              <th className="text-right px-3 py-3">Legendas</th>
              <th className="text-right px-3 py-3">Instagram</th>
              <th className="text-right px-3 py-3">Tokens entrada</th>
              <th className="text-right px-3 py-3">Tokens saída</th>
              <th className="text-right px-3 py-3">Custo</th>
              <th className="text-right px-5 py-3">Tempo médio</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row) => (
              <tr key={row.tenant_id} className="transition-colors" style={{ borderBottom: '1px solid var(--main-border)' }}>
                <td className="px-5 py-3 font-medium text-bella-white">{row.tenant_name}</td>
                <td className="px-3 py-3">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide', PLAN_COLORS[row.plan])}>
                    {PLAN_LABELS[row.plan]}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-bella-gray">{row.images_generated}</td>
                <td className="px-3 py-3 text-right text-bella-gray">{row.captions_generated}</td>
                <td className="px-3 py-3 text-right text-bella-gray">{row.instagram_posts}</td>
                <td className="px-3 py-3 text-right text-[11px] text-bella-gray">{row.total_tokens_input.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-[11px] text-bella-gray">{row.total_tokens_output.toLocaleString()}</td>
                <td className="px-3 py-3 text-right font-medium text-bella-white">{formatCostBrl(row.total_cost_usd)}</td>
                <td className="px-5 py-3 text-right text-[11px] text-bella-gray">
                  {row.avg_generation_time_ms > 0 ? `${(row.avg_generation_time_ms / 1000).toFixed(1)}s` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-bella-white" style={{ borderTop: '2px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.04)' }}>
              <td className="px-5 py-3">Total</td>
              <td className="px-3 py-3" />
              <td className="px-3 py-3 text-right">{grandTotal.images}</td>
              <td className="px-3 py-3 text-right">{grandTotal.captions}</td>
              <td className="px-3 py-3 text-right text-bella-gray">—</td>
              <td className="px-3 py-3 text-right text-xs">{grandTotal.tokensIn.toLocaleString()}</td>
              <td className="px-3 py-3 text-right text-xs">{grandTotal.tokensOut.toLocaleString()}</td>
              <td className="px-5 py-3 text-right text-bella-gold">{formatCostBrl(grandTotal.cost)}</td>
              <td className="px-5 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
