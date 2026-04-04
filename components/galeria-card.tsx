'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, ImageIcon, Copy, Check, X, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { GeneratedImage } from '@/lib/types'

export function GaleriaCard({ img }: { img: GeneratedImage }) {
  const displayUrl = img.selected_url ?? img.output_urls?.[0] ?? null
  const variationsCount = img.output_urls?.length ?? 0

  const [downloading, setDownloading] = useState(false)
  const [captionOpen, setCaptionOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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

  return (
    <>
      <div
        className="group rounded-2xl overflow-hidden transition-all duration-300"
        style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
      >
        {/* Imagem */}
        <div className="aspect-[4/5] relative" style={{ background: 'var(--main-bg-subtle)' }}>
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Imagem gerada"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}

          {/* Overlay no hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            {/* Botão download */}
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

        {/* Rodapé do card */}
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

          {img.instagram_permalink && (
            <a
              href={img.instagram_permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-bella-gold mt-1 block hover:text-bella-gold-light transition-colors"
            >
              Ver no Instagram
            </a>
          )}
        </div>
      </div>

      {/* Modal de legenda */}
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
            {/* Header do modal */}
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

            {/* Texto da legenda */}
            <div className="flex-1 overflow-y-auto mb-4">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#b0b0b0' }}>
                {img.caption_generated}
              </p>
            </div>

            {/* Botão copiar */}
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
    </>
  )
}
