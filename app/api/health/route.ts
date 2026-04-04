import { NextResponse } from 'next/server'

/**
 * Health check endpoint (#24)
 * GET /api/health
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    gemini_api: !!process.env.GEMINI_API_KEY,
    asaas_api: !!process.env.ASAAS_API_KEY,
    asaas_webhook: !!process.env.ASAAS_WEBHOOK_TOKEN,
  }

  const healthy = Object.values(checks).every(Boolean)

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    }
  )
}
