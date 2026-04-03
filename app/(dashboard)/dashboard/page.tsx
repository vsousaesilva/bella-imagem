export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatCostUsd, quotaPercent } from '@/lib/utils'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Tenant, GeneratedImage } from '@/lib/types'
import { ImageIcon, Sparkles, TrendingUp, Clock } from 'lucide-react'
import Image from 'next/image'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('*, tenant:tenants(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-bella-charcoal">Bem-vinda!</h1>
        <p className="text-gray-500 mt-2">Aguarde a configuração do seu acesso pelo administrador.</p>
      </div>
    )
  }

  const tenant = profile.tenant as Tenant

  // Últimas imagens geradas
  const { data: recentImages } = await admin
    .from('generated_images')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(6)

  // Estatísticas do mês
  const periodStart = new Date()
  periodStart.setDate(1)
  periodStart.setHours(0, 0, 0, 0)

  const { data: monthStats } = await admin
    .from('usage_logs')
    .select('action, cost_usd, duration_ms')
    .eq('tenant_id', tenant.id)
    .gte('created_at', periodStart.toISOString())
    .eq('success', true)

  const imagesThisMonth = monthStats?.filter((l) => l.action === 'generate_image').length ?? 0
  const captionsThisMonth = monthStats?.filter((l) => l.action === 'generate_caption').length ?? 0
  const totalCostUsd = monthStats?.reduce((sum, l) => sum + (l.cost_usd ?? 0), 0) ?? 0
  const avgTimeMs = monthStats?.length
    ? monthStats.reduce((sum, l) => sum + (l.duration_ms ?? 0), 0) / monthStats.length
    : 0

  const percent = quotaPercent(tenant.quota_used, tenant.quota_limit)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal">
          Olá, {profile.full_name?.split(' ')[0] ?? 'Bem-vinda'}!
        </h1>
        <p className="text-gray-500 mt-1">Aqui está um resumo do seu uso este mês.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<ImageIcon className="w-5 h-5 text-bella-rose" />}
          label="Imagens geradas"
          value={imagesThisMonth.toString()}
          sub="este mês"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5 text-purple-500" />}
          label="Legendas geradas"
          value={captionsThisMonth.toString()}
          sub="este mês"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="Custo total (USD)"
          value={formatCostUsd(totalCostUsd)}
          sub="este mês"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          label="Tempo médio"
          value={avgTimeMs > 0 ? `${(avgTimeMs / 1000).toFixed(1)}s` : '—'}
          sub="por geração"
        />
      </div>

      {/* Cota */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-bella-charcoal">Cota de imagens</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {tenant.quota_used} de {tenant.quota_limit} imagens utilizadas
            </p>
          </div>
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', PLAN_COLORS[tenant.plan])}>
            Plano {PLAN_LABELS[tenant.plan]}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              percent >= 90 ? 'bg-red-400' : percent >= 70 ? 'bg-amber-400' : 'bg-bella-rose'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Cota renova em {formatDate(tenant.quota_reset_at)}
        </p>
      </div>

      {/* Últimas imagens */}
      <div>
        <h2 className="font-semibold text-bella-charcoal mb-4">Últimas imagens geradas</h2>
        {!recentImages?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma imagem gerada ainda.</p>
            <a href="/gerar" className="inline-block mt-4 text-sm text-bella-rose hover:underline">
              Gerar primeira imagem
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(recentImages as GeneratedImage[]).map((img) => {
              const url = img.selected_url ?? img.output_urls[0]
              return (
                <a
                  key={img.id}
                  href={`/galeria?id=${img.id}`}
                  className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 block group relative"
                >
                  {url && (
                    <Image
                      src={url}
                      alt="Imagem gerada"
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-bella-charcoal">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
