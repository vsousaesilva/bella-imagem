export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PenLine, Plus, Eye, EyeOff } from 'lucide-react'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default async function MasterBlogPage() {
  const admin = createAdminClient()
  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, slug, title, excerpt, published, published_at, created_at')
    .order('created_at', { ascending: false })

  const safePosts = posts ?? []

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/master" className="text-xs text-bella-gray hover:text-bella-gray-light transition-colors mb-3 inline-block">
            ← Voltar ao painel
          </Link>
          <h1 className="text-2xl font-display font-bold tracking-tight text-bella-white">Blog</h1>
          <p className="text-sm text-bella-gray mt-1">{safePosts.length} artigos cadastrados</p>
        </div>
        <Link
          href="/master/blog/novo"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          style={{ background: '#c9a96e', color: '#0a0a0a' }}
        >
          <Plus className="w-4 h-4" />
          Novo artigo
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {safePosts.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-bella-gray text-sm mb-4">Nenhum artigo publicado ainda.</p>
            <Link href="/master/blog/novo" className="text-sm text-bella-gold hover:underline">
              Criar primeiro artigo →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Título', 'Status', 'Publicado em', 'Slug', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-bella-gray">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
              {safePosts.map(post => (
                <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-bella-white font-medium">{post.title}</p>
                    {post.excerpt && <p className="text-[11px] text-bella-gray mt-0.5 line-clamp-1">{post.excerpt}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                        <Eye className="w-3 h-3" /> Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-bella-gray">
                        <EyeOff className="w-3 h-3" /> Rascunho
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-bella-gray text-xs">
                    {post.published_at ? fmtDate(post.published_at) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-bella-gray">{post.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/master/blog/${post.id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-bella-gray hover:text-bella-white transition-colors"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
