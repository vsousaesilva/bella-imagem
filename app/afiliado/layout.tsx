export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export default async function AfiliadoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) redirect('/afiliado/registro')

  return <>{children}</>
}
