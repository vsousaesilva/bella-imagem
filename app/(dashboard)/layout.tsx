export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { MobileLayout } from '@/components/mobile-layout'
import type { Profile, Tenant } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*, tenant:tenants(id, name, slug, plan, active, quota_used, quota_limit, quota_reset_at)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // #26 — Verifica se o usuário está ativo
  if (!profile.active) {
    // Faz logout e redireciona
    await supabase.auth.signOut()
    redirect('/login')
  }

  const tenant = (profile.tenant as Tenant) ?? null

  // Verifica se o tenant está ativo
  if (tenant && !tenant.active) {
    return (
      <MobileLayout profile={profile as Profile} tenant={tenant}>
        <div className="p-8">
          <h1 className="text-2xl font-display font-medium text-bella-white">Conta suspensa</h1>
          <p className="text-bella-gray mt-2">Sua empresa está temporariamente inativa. Entre em contato com o suporte.</p>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout profile={profile as Profile} tenant={tenant}>
      {children}
    </MobileLayout>
  )
}
