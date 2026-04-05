export const dynamic = 'force-dynamic'
export const metadata = { title: 'Blog — Bella Imagem' }

import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function BlogPage() {
  const admin = createAdminClient()
  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_url, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  const safePosts = posts ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-3">Blog</h1>
        <p className="text-bella-gray">Dicas, novidades e tendências sobre moda e inteligência artificial.</p>
      </div>

      {safePosts.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-bella-white font-medium mb-2">Em breve</p>
          <p className="text-bella-gray text-sm">Estamos preparando nossos primeiros artigos. Volte em breve!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {safePosts.map(post => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {post.cover_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.cover_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="font-display font-semibold text-bella-white text-lg mb-2 group-hover:text-bella-gold transition-colors leading-snug">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-bella-gray text-sm mb-4 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                )}
                {post.published_at && (
                  <div className="flex items-center gap-1.5 text-[11px] text-bella-gray">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(post.published_at)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
