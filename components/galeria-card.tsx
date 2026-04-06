'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, ImageIcon, Copy, Check, X, FileText, Instagram, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { GeneratedImage } from '@/lib/types'

interface GaleriaCardProps {
  img: GeneratedImage
  canPublishInstagram?: boolean
}

export function GaleriaCard({ img, canPublishInstagram = false }: GaleriaCardProps) {
  const displayUrl = img.selected_url ?? img.output_urls?.[0] ?? null

  const [downloading, setDownloading] = useState(false)
  const [captionOpen, setCaptionOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Instagram publish state
  const [igOpen, setIgOpen] = useState(false)
  const [igCaption, setIgCaption] = useState(img.caption_generated ?? '')
  const [igPublishing, setIgPublishing] = useState(false)
  const [igError, setIgError] = useState<string | null>(null)
  const [igPermalink, setIgPermalink] = useState<string | null>(img.instagram_permalink ?? null)

  async function handleDownload() {
    if (!displayUrl || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(displayUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bella-imagem-${img.id.slice(0, 8)}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  async function handleCopy() {
    if (!img.caption_generated) return
    await navigator.clipboard.writeText(img.caption_generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePublishInstagram() {
    setIgPublishing(true)
    setIgError(null)
    try {
      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: img.id, caption: igCaption }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIgError(data.error ?? 'Erro ao publicar.')
        return
      }
      setIgPermalink(data.permalink ?? null)
      setIgOpen(false)
    } finally {
      setIgPublishing(false)
    }
  }

  const alreadyPosted = !!igPermalink

  return (
    <>
      <div
        className="group rounded-2xl overflow-hidden transition-all duration-300"
        style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
      >
        {/* Image */}
        <div className="aspect-[4/5] relative" style={{ background: 'var(--main-bg-subtle)' }}>
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Imagem gerada"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            {displayUrl && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                title="Baixar imagem"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white text-[11px] font-medium transition-colors"
                style={{ background: 'rgba(201,169,110,0.85)', border: '1px solid rgba(201,169,110,0.5)' }}
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? 'Baixando...' : 'Baixar'}
              </button>
            )}
          </div>
        </div>

        {/* Card footer */}
        <div className="p-3">
          <p className="text-[11px] text-bella-gray">{formatDate(img.created_at)}</p>

          {img.caption_generated && (
            <button
              onClick={() => setCaptionOpen(true)}
              className="mt-1.5 flex items-center gap-1 text-[11px] transition-colors"
              style={{ color: '#c9a96e' }}
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1 text-left">Ver legenda</span>
            </button>
          )}

          {alreadyPosted ? (
            <a
              href={igPermalink!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1 text-[11px] transition-colors"
              style={{ color: '#4ade80' }}
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              <span>Ver no Instagram</span>
            </a>
          ) : canPublishInstagram && displayUrl ? (
            <button
              onClick={() => { setIgCaption(img.caption_generated ?? ''); setIgError(null); setIgOpen(true) }}
              className="mt-1.5 flex items-center gap-1 text-[11px] transition-colors"
              style={{ color: '#c9a96e' }}
            >
              <Instagram className="w-3 h-3 flex-shrink-0" />
              <span>Publicar no Instagram</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Caption modal */}
      {captionOpen && img.caption_generated && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setCaptionOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl p-6 max-h-[80vh] flex flex-col"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: '#fefefe' }}>Legenda gerada</h3>
              <button
                onClick={() => setCaptionOpen(false)}
                style={{ color: '#6b6b6b' }}
                className="transition-colors hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#b0b0b0' }}>
                {img.caption_generated}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={copied
                ? { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }
                : { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }
              }
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar legenda'}
            </button>
          </div>
        </div>
      )}

      {/* Instagram publish modal */}
      {igOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => !igPublishing && setIgOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4" style={{ color: '#c9a96e' }} />
                <h3 className="font-medium text-sm" style={{ color: '#fefefe' }}>Publicar no Instagram</h3>
              </div>
              {!igPublishing && (
                <button
                  onClick={() => setIgOpen(false)}
                  style={{ color: '#6b6b6b' }}
                  className="transition-colors hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wide mb-2" style={{ color: '#6b6b6b' }}>
                Legenda (editável)
              </label>
              <textarea
                value={igCaption}
                onChange={(e) => setIgCaption(e.target.value)}
                rows={8}
                disabled={igPublishing}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fefefe',
                }}
              />
              <p className="text-[11px] mt-1" style={{ color: '#6b6b6b' }}>
                {igCaption.length}/2200 caracteres
              </p>
            </div>

            {igError && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
              >
                {igError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handlePublishInstagram}
                disabled={igPublishing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.35)', color: '#c9a96e' }}
              >
                <Instagram className="w-4 h-4" />
                {igPublishing ? 'Publicando...' : 'Publicar agora'}
              </button>
              {!igPublishing && (
                <button
                  onClick={() => setIgOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8a8a8a' }}
                >
                  Cancelar
                </button>
              )}
            </div>

            {igPublishing && (
              <p className="text-[11px] text-center" style={{ color: '#6b6b6b' }}>
                Isso pode levar até 60 segundos. Aguarde...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
