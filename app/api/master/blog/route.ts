import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'master') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }

  const { title, excerpt, content, cover_url, published } = body as {
    title?: string; excerpt?: string; content?: string; cover_url?: string; published?: boolean
  }

  if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório.' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'Conteúdo obrigatório.' }, { status: 400 })

  const baseSlug = toSlug(title)
  const slug = `${baseSlug}-${Date.now().toString(36)}`

  const { data, error } = await admin.from('blog_posts').insert({
    slug,
    title: title.trim(),
    excerpt: excerpt?.trim() || null,
    content: content.trim(),
    cover_url: cover_url?.trim() || null,
    published: published ?? false,
    published_at: published ? new Date().toISOString() : null,
  }).select('id, slug').single()

  if (error) {
    console.error('[master/blog] Erro ao criar post:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug })
}
