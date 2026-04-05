export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const admin = createAdminClient()
  const { data } = await admin.from('blog_posts').select('title, excerpt').eq('slug', slug).single()
  if (!data) return { title: 'Artigo não encontrado' }
  return { title: `${data.title} — Bella Imagem Blog`, description: data.excerpt ?? undefined }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-bella-gray hover:text-bella-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao blog
      </Link>

      {post.cover_url && (
        <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-4 leading-tight">
        {post.title}
      </h1>

      {post.published_at && (
        <div className="flex items-center gap-1.5 text-sm text-bella-gray mb-8">
          <Calendar className="w-4 h-4" />
          {fmtDate(post.published_at)}
        </div>
      )}

      {post.excerpt && (
        <p className="text-bella-gray text-lg leading-relaxed mb-8 pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {post.excerpt}
        </p>
      )}

      {/* Conteúdo — renderizado como HTML */}
      <div
        className="text-bella-gray leading-relaxed text-sm space-y-4 blog-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-bella-gray hover:text-bella-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Ver todos os artigos
        </Link>
      </div>
    </div>
  )
}
