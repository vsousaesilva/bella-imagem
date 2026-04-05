import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const APP_URL = 'https://bellaimagem.ia.br'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, name, email, code, commission_pct, active, created_at')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return NextResponse.json({ error: 'Afiliado não encontrado.' }, { status: 404 })
  }

  const { data: referrals } = await admin
    .from('affiliate_referrals')
    .select('id, plan, value_brl, commission_brl, status, created_at')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  const safeReferrals = referrals ?? []

  const totalCommission = safeReferrals
    .filter(r => r.status === 'confirmed' || r.status === 'paid')
    .reduce((sum, r) => sum + (r.commission_brl ?? 0), 0)

  const paidCommission = safeReferrals
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + (r.commission_brl ?? 0), 0)

  const pendingCommission = safeReferrals
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.commission_brl ?? 0), 0)

  return NextResponse.json({
    affiliate,
    referralLink: `${APP_URL}/register?ref=${affiliate.code}`,
    stats: {
      totalReferrals: safeReferrals.length,
      confirmedReferrals: safeReferrals.filter(r => r.status === 'confirmed' || r.status === 'paid').length,
      totalCommission,
      paidCommission,
      pendingCommission,
    },
    referrals: safeReferrals,
  })
}
