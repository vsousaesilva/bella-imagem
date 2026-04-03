export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import type { Profile, Tenant } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*, tenant:tenants(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const tenant = (profile.tenant as Tenant) ?? null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--main-bg)' }}>
      <Sidebar profile={profile as Profile} tenant={tenant} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
