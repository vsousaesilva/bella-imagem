export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatCostBrl, quotaPercent } from '@/lib/utils'
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
        <h1 className="text-2xl font-display font-medium text-bella-white">Bem-vindo(a)!</h1>
        <p className="text-bella-gray mt-2">Aguarde a configuração do seu acesso pelo administrador.</p>
      </div>
    )
  }

  const tenant = profile.tenant as Tenant
  const isMaster = profile.role === 'master'

  const { data: recentImages } = await admin
    .from('generated_images')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(6)

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
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">
          Olá, {profile.full_name?.split(' ')[0] ?? 'Bem-vindo(a)'}!
        </h1>
        <p className="text-bella-gray mt-1 text-sm">Aqui está um resumo do seu uso este mês.</p>
      </div>

      {/* Stats */}
      <div className={cn(
        'grid gap-4 mb-8',
        isMaster ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
      )}>
        <StatCard icon={<ImageIcon className="w-4 h-4 text-bella-gold" />}  label="Imagens geradas"  value={imagesThisMonth.toString()}  sub="este mês" />
        <StatCard icon={<Sparkles   className="w-4 h-4 text-bella-rose" />} label="Legendas geradas" value={captionsThisMonth.toString()} sub="este mês" />
        <StatCard icon={<Clock      className="w-4 h-4 text-amber-400" />}  label="Tempo médio"      value={avgTimeMs > 0 ? `${(avgTimeMs / 1000).toFixed(1)}s` : '—'} sub="por geração" />
        {isMaster && (
          <StatCard icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Custo total" value={formatCostBrl(totalCostUsd)} sub="este mês" />
        )}
      </div>

      {/* Cota */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-medium text-bella-white">Cota de imagens</h2>
            <p className="text-sm text-bella-gray mt-0.5">
              {tenant.quota_used} de {tenant.quota_limit} imagens utilizadas
            </p>
          </div>
          <span className={cn('text-[10px] px-2.5 py-1 rounded-full font-medium tracking-wide', PLAN_COLORS[tenant.plan])}>
            Plano {PLAN_LABELS[tenant.plan]}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percent}%`,
              background: percent >= 90 ? '#f87171' : percent >= 70 ? '#fbbf24' : 'linear-gradient(90deg, #c9a96e, #dfc9a0)',
            }}
          />
        </div>
        <p className="text-[11px] text-bella-gray mt-2">
          Cota renova em {formatDate(tenant.quota_reset_at)}
        </p>
      </div>

      {/* Últimas imagens */}
      <div>
        <h2 className="font-medium text-bella-white mb-4">Últimas imagens geradas</h2>
        {!recentImages?.length ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <ImageIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-bella-gray text-sm">Nenhuma imagem gerada ainda.</p>
            <a href="/gerar" className="inline-block mt-4 text-sm text-bella-gold hover:text-bella-gold-light transition-colors">
              Gerar primeira imagem
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(recentImages as GeneratedImage[]).map((img) => {
              const url = img.selected_url ?? img.output_urls?.[0] ?? null
              return (
                <a
                  key={img.id}
                  href="/galeria"
                  className="aspect-[4/5] rounded-xl overflow-hidden block group relative"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {url && (
                    <Image
                      src={url}
                      alt="Imagem gerada"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
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

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm text-bella-gray">{label}</span>
      </div>
      <p className="text-2xl font-display font-medium text-bella-white">{value}</p>
      <p className="text-[11px] text-bella-gray mt-0.5">{sub}</p>
    </div>
  )
}
