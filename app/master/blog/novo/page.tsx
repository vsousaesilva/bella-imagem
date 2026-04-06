'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Sparkles } from 'lucide-react'

export default function MasterBlogNovoPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    const res = await fetch('/api/master/blog/generate', { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao gerar artigo.')
      setGenerating(false)
      return
    }

    setTitle(data.title ?? '')
    setExcerpt(data.excerpt ?? '')
    setContent(data.content ?? '')
    setGenerating(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/master/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, excerpt, content, cover_url: coverUrl, published }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar.')
      setSaving(false)
      return
    }

    router.push('/master/blog')
    router.refresh()
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/master/blog" className="text-xs text-bella-gray hover:text-bella-gray-light transition-colors mb-3 inline-block">
            ← Voltar ao blog
          </Link>
          <h1 className="text-2xl font-display font-bold tracking-tight text-bella-white">Novo artigo</h1>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || saving}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0 mt-6 disabled:opacity-60"
          style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Gerando...' : 'Gerar com IA'}
        </button>
      </div>

      {generating && (
        <div
          className="mb-6 flex items-center gap-3 px-4 py-4 rounded-xl text-sm"
          style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}
        >
          <Sparkles className="w-4 h-4 text-bella-gold animate-pulse flex-shrink-0" />
          <span className="text-bella-gray">A IA está escolhendo um tema de moda e escrevendo o artigo completo...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="input-field"
            placeholder="Título do artigo"
          />
        </div>

        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Resumo</label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            className="input-field resize-none"
            placeholder="Breve descrição exibida na listagem do blog"
          />
        </div>

        <div>
          <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">URL da imagem de capa</label>
          <input
            type="url"
            value={coverUrl}
            onChange={e => setCoverUrl(e.target.value)}
            className="input-field"
            placeholder="https://..."
          />
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
            placeholder={'<h2>Introdução</h2>\n<p>Conteúdo do artigo aqui...</p>\n\n<h2>Próxima seção</h2>\n<p>...</p>'}
          />
          <p className="text-[11px] text-bella-gray mt-1">Use tags HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;, &lt;img&gt;, etc.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            className={`w-10 h-5 rounded-full transition-colors flex items-center ${published ? 'justify-end' : 'justify-start'}`}
            style={{ background: published ? '#c9a96e' : 'rgba(255,255,255,0.1)', padding: '2px' }}
          >
            <span className="w-4 h-4 rounded-full bg-white block" />
          </button>
          <span className="text-sm text-bella-white">{published ? 'Publicar imediatamente' : 'Salvar como rascunho'}</span>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 text-sm text-red-400 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving || generating} className="btn-primary px-8">
            {saving ? 'Salvando...' : published ? 'Publicar artigo' : 'Salvar rascunho'}
          </button>
          <Link href="/master/blog" className="btn-secondary px-6">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
