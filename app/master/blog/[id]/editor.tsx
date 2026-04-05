'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Trash2, ExternalLink } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_url: string | null
  published: boolean
  published_at: string | null
}

export function BlogPostEditor({ post }: { post: BlogPost }) {
  const router = useRouter()
  const [title, setTitle] = useState(post.title)
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '')
  const [content, setContent] = useState(post.content)
  const [coverUrl, setCoverUrl] = useState(post.cover_url ?? '')
  const [published, setPublished] = useState(post.published)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const wasPublished = post.published
    const res = await fetch(`/api/master/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, excerpt, content,
        cover_url: coverUrl,
        published,
        keep_published_at: wasPublished && published,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar.')
    } else {
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/master/blog/${post.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/master/blog')
      router.refresh()
    } else {
      setError('Erro ao excluir.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/master/blog" className="text-xs text-bella-gray hover:text-bella-gray-light transition-colors mb-3 inline-block">
            ← Voltar ao blog
          </Link>
          <h1 className="text-2xl font-display font-bold tracking-tight text-bella-white">Editar artigo</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-bella-gray">/blog/{post.slug}</span>
            {post.published && (
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-bella-gold hover:underline">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Excluir permanentemente?</span>
            <button onClick={handleDelete} disabled={deleting} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              {deleting ? 'Excluindo...' : 'Confirmar'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-bella-gray hover:text-white px-2 py-1.5">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-bella-gray hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Título *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="input-field" />
        </div>

        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Resumo</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="input-field resize-none" />
        </div>

        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">URL da imagem de capa</label>
          <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="input-field" placeholder="https://..." />
        </div>

        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
            Conteúdo * <span className="normal-case text-bella-gray">(suporta HTML)</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={18}
            className="input-field resize-y font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            className="w-10 h-5 rounded-full transition-colors flex items-center"
            style={{ background: published ? '#c9a96e' : 'rgba(255,255,255,0.1)', padding: '2px', justifyContent: published ? 'flex-end' : 'flex-start' }}
          >
            <span className="w-4 h-4 rounded-full bg-white block" />
          </button>
          <span className="text-sm text-bella-white">{published ? 'Publicado' : 'Rascunho'}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 px-4 py-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <Link href="/master/blog" className="btn-secondary px-6">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
