import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellaimagem.ia.br'
const FB_APP_ID = process.env.INSTAGRAM_APP_ID
const SCOPES = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return NextResponse.redirect(`${APP_URL}/dashboard`)

  const { data: tenant } = await admin
    .from('tenants')
    .select('plan')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant || !['pro', 'business'].includes(tenant.plan)) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=plan`)
  }

  if (!FB_APP_ID) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=config`)
  }

  // State CSRF: tenantId + random hex
  const state = `${profile.tenant_id}:${crypto.randomBytes(16).toString('hex')}`
  const cookieStore = await cookies()
  cookieStore.set('ig_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })

  const redirectUri = `${APP_URL}/api/instagram/callback`
  const authUrl =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${SCOPES}` +
    `&state=${encodeURIComponent(state)}` +
    `&response_type=code`

  return NextResponse.redirect(authUrl)
}
