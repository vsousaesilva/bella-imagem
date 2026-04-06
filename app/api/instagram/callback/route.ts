import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellaimagem.ia.br'
const FB_APP_ID = process.env.INSTAGRAM_APP_ID
const FB_APP_SECRET = process.env.INSTAGRAM_APP_SECRET

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=missing_params`)
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('ig_oauth_state')?.value
  cookieStore.delete('ig_oauth_state')

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=invalid_state`)
  }

  const [tenantId] = state.split(':')
  if (!tenantId) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=invalid_state`)
  }

  if (!FB_APP_ID || !FB_APP_SECRET) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=config`)
  }

  const redirectUri = `${APP_URL}/api/instagram/callback`

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`
    )
    if (!tokenRes.ok) {
      console.error('[ig/callback] token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=token_exchange`)
    }
    const tokenData = await tokenRes.json()
    const shortLivedToken: string = tokenData.access_token
    if (!shortLivedToken) {
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=token_exchange`)
    }

    // Step 2: Exchange for long-lived token (60 days)
    const llRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&fb_exchange_token=${shortLivedToken}`
    )
    if (!llRes.ok) {
      console.error('[ig/callback] long-lived token exchange failed:', await llRes.text())
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=token_exchange`)
    }
    const llData = await llRes.json()
    const longLivedToken: string = llData.access_token ?? shortLivedToken

    // Step 3: Fetch Facebook Pages to find the linked Instagram Business Account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
    )
    if (!pagesRes.ok) {
      console.error('[ig/callback] pages fetch failed:', await pagesRes.text())
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=pages_fetch`)
    }
    const pagesData = await pagesRes.json()
    const pages: Array<{ id: string; access_token: string }> = pagesData.data ?? []

    if (!pages.length) {
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=no_pages`)
    }

    // Step 4: Find the first page with a linked Instagram Business Account
    let igAccountId: string | null = null
    let pageToken: string = longLivedToken

    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}` +
        `?fields=instagram_business_account` +
        `&access_token=${page.access_token}`
      )
      if (!igRes.ok) continue
      const igData = await igRes.json()
      if (igData.instagram_business_account?.id) {
        igAccountId = igData.instagram_business_account.id
        pageToken = page.access_token
        break
      }
    }

    if (!igAccountId) {
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=no_ig_account`)
    }

    // Step 5: Save to tenant
    const admin = createAdminClient()
    const { error: dbError } = await admin
      .from('tenants')
      .update({
        instagram_access_token: pageToken,
        instagram_account_id: igAccountId,
      })
      .eq('id', tenantId)

    if (dbError) {
      console.error('[ig/callback] db update failed:', dbError.message)
      return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=db_update`)
    }

    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_success=1`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[ig/callback] unexpected error:', msg)
    return NextResponse.redirect(`${APP_URL}/configuracoes?ig_error=unexpected`)
  }
}
