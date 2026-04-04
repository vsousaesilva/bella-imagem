'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/utils'
import { BACKGROUND_PRESETS, ASPECT_RATIO_OPTIONS, TAMANHO_OPTIONS, TAMANHO_INFANTIL_ANOS } from '@/lib/types'
import type { AspectRatio, TamanhoPeca } from '@/lib/types'
import { Upload, X, Sparkles, Download, CheckCircle2, AlertCircle, ChevronDown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'form' | 'generating' | 'result'

interface GenerationResult {
  imageId: string
  outputUrls: string[]
  selectedUrl: string | null
}

export default function GerarImagemPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)

  const [clothingFile, setClothingFile] = useState<File | null>(null)
  const [clothingPreview, setClothingPreview] = useState<string | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [modelPreview, setModelPreview] = useState<string | null>(null)
  const [modelDescricaoLivre, setModelDescricaoLivre] = useState('')
  const [backgroundPreset, setBackgroundPreset] = useState<string>('')
  const [backgroundCustom, setBackgroundCustom] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5')
  const [showBgOptions, setShowBgOptions] = useState(false)
  const [tamanhoPeca, setTamanhoPeca] = useState<TamanhoPeca | ''>('')
  const [tamanhoInfantil, setTamanhoInfantil] = useState<number>(8)

  const [result, setResult] = useState<GenerationResult | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<0 | 1>(0)
  const [captionText, setCaptionText] = useState<string | null>(null)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [generatingCaption, setGeneratingCaption] = useState(false)

  const clothingInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File, setFile: (f: File) => void, setPreview: (p: string) => void) {
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleGenerate() {
    if (!clothingFile) { setError('Selecione uma imagem da peça ou acessório.'); return }
    setStep('generating')
    setError(null)

    try {
      const clothing = await compressImage(clothingFile)
      let modelData: { base64: string; mimeType: string } | null = null
      if (modelFile) modelData = await compressImage(modelFile)

      const body = {
        clothingImageBase64:  clothing.base64,
        clothingImageMimeType: clothing.mimeType,
        ...(modelData && { modelImageBase64: modelData.base64, modelImageMimeType: modelData.mimeType }),
        backgroundPreset:      backgroundPreset || undefined,
        backgroundCustom:      backgroundCustom || undefined,
        aspectRatio,
        tamanhoPeca:           tamanhoPeca || undefined,
        tamanhoInfantil:       tamanhoPeca === 'infanto_juvenil' ? tamanhoInfantil : undefined,
        modelDescricaoLivre:   !modelFile && modelDescricaoLivre.trim() ? modelDescricaoLivre.trim() : undefined,
      }

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao gerar imagem.'); setStep('form'); return }

      setResult({ imageId: data.imageId, outputUrls: data.outputUrls, selectedUrl: data.outputUrls[0] })
      setSelectedVariation(0)
      setStep('result')
      router.refresh()
    } catch {
      setError('Erro inesperado. Tente novamente.')
      setStep('form')
    }
  }

  async function handleSelectVariation(index: 0 | 1) {
    if (!result) return
    setSelectedVariation(index)
    await fetch('/api/images/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId: result.imageId, selectedUrl: result.outputUrls[index] }),
    })
    setResult((r) => r ? { ...r, selectedUrl: r.outputUrls[index] } : r)
  }

  async function handleGenerateCaption() {
    if (!result) return
    setGeneratingCaption(true)
    setCaptionError(null)
    const res = await fetch('/api/captions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId: result.imageId }),
    })
    const data = await res.json()
    if (!res.ok) setCaptionError(data.detail ?? data.error ?? 'Erro ao gerar legenda.')
    else setCaptionText(data.caption ?? null)
    setGeneratingCaption(false)
  }

  function handleNewGeneration() {
    setStep('form'); setResult(null); setCaptionText(null); setError(null)
    setClothingFile(null); setClothingPreview(null)
    setModelFile(null); setModelPreview(null); setModelDescricaoLivre('')
    setBackgroundPreset(''); setBackgroundCustom('')
    setAspectRatio('4:5'); setTamanhoPeca(''); setTamanhoInfantil(8)
  }

  if (step === 'generating') return <GeneratingState />

  if (step === 'result' && result) {
    return (
      <ResultState
        result={result}
        selectedVariation={selectedVariation}
        onSelectVariation={handleSelectVariation}
        captionText={captionText}
        captionError={captionError}
        generatingCaption={generatingCaption}
        onGenerateCaption={handleGenerateCaption}
        onNewGeneration={handleNewGeneration}
      />
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">Gerar Imagem</h1>
        <p className="text-bella-gray text-sm mt-1">Envie a peça ou acessório e gere uma foto profissional com modelo.</p>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-6"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna esquerda */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
              Foto da peça ou acessório <span className="text-bella-gold">*</span>
            </label>
            <input ref={clothingInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, setClothingFile, setClothingPreview) }} />
            <ImageUploadBox preview={clothingPreview} placeholder="Clique para enviar a foto da peça"
              onClick={() => clothingInputRef.current?.click()}
              onRemove={() => { setClothingFile(null); setClothingPreview(null) }} />
          </div>

          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-1">
              Foto da pessoa modelo <span className="text-bella-gray ml-1 normal-case">opcional</span>
            </label>
            <p className="text-[11px] text-bella-gray mb-2">
              Sem foto, o modelo será escolhido pela IA conforme as orientações abaixo.
            </p>
            <input ref={modelInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, setModelFile, setModelPreview) }} />
            <ImageUploadBox preview={modelPreview} placeholder="Clique para enviar a foto do modelo"
              onClick={() => modelInputRef.current?.click()}
              onRemove={() => { setModelFile(null); setModelPreview(null) }}
              compact />
          </div>

          {!modelFile && (
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-1">
                Orientação do modelo <span className="text-bella-gray ml-1 normal-case">opcional</span>
              </label>
              <p className="text-[11px] text-bella-gray mb-2">
                Se em branco, usa o perfil padrão configurado nas configurações.
              </p>
              <textarea
                value={modelDescricaoLivre}
                onChange={(e) => setModelDescricaoLivre(e.target.value)}
                placeholder="Ex: mulher jovem, pele clara, cabelos longos, estilo esportivo..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="space-y-5">
          {/* Proporção */}
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Proporção da imagem</label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setAspectRatio(opt.value)}
                  className="px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200"
                  style={aspectRatio === opt.value
                    ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }
                    : { background: 'var(--main-bg-subtle)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--main-text-sub)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tamanho */}
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
              Tamanho da peça <span className="text-bella-gray ml-1 normal-case">opcional</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {TAMANHO_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setTamanhoPeca(tamanhoPeca === opt.value ? '' : opt.value)}
                  className="px-3 py-1.5 rounded-xl text-sm transition-all duration-200"
                  style={tamanhoPeca === opt.value
                    ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }
                    : { background: 'var(--main-bg-subtle)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--main-text-sub)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {tamanhoPeca === 'infanto_juvenil' && (
              <div className="mt-2">
                <label className="block text-[11px] text-bella-gray mb-1.5">Idade (anos)</label>
                <select value={tamanhoInfantil} onChange={(e) => setTamanhoInfantil(Number(e.target.value))}
                  className="input-field w-auto"
                >
                  {TAMANHO_INFANTIL_ANOS.map((ano) => (
                    <option key={ano} value={ano}>{ano === 0 ? 'RN (Recém-nascido)' : `${ano} anos`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Fundo */}
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-1">
              Paisagem / Fundo <span className="text-bella-gray ml-1 normal-case">opcional</span>
            </label>
            <div className="relative mb-2">
              <button
                onClick={() => setShowBgOptions(!showBgOptions)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-left flex items-center justify-between transition-all duration-200"
                style={{ background: 'var(--main-bg-subtle)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--main-text-sub)' }}
              >
                <span>
                  {backgroundPreset
                    ? BACKGROUND_PRESETS.find((b) => b.value === backgroundPreset)?.label ?? 'Selecionar fundo'
                    : 'Selecionar fundo pré-definido'}
                </span>
                <ChevronDown className="w-4 h-4 text-bella-gray flex-shrink-0" />
              </button>
              {showBgOptions && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-xl"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <button onClick={() => { setBackgroundPreset(''); setShowBgOptions(false) }}
                    className="w-full px-4 py-2.5 text-sm text-bella-gray text-left transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Nenhum (deixar IA escolher)
                  </button>
                  {BACKGROUND_PRESETS.map((bg) => (
                    <button key={bg.value}
                      onClick={() => { setBackgroundPreset(bg.value); setShowBgOptions(false) }}
                      className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                      style={{ color: backgroundPreset === bg.value ? '#c9a96e' : '#6b6b6b' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              value={backgroundCustom}
              onChange={(e) => setBackgroundCustom(e.target.value)}
              placeholder="Ou descreva o fundo livremente... (ex: 'terraço com flores brancas e luz do pôr do sol')"
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleGenerate} disabled={!clothingFile} className="btn-primary">
          <Sparkles className="w-4 h-4" />
          <span>Gerar 2 variações</span>
        </button>
        <p className="text-[11px] text-bella-gray mt-2">Cada geração usa 1 crédito da sua cota mensal.</p>
      </div>
    </div>
  )
}

function ImageUploadBox({ preview, placeholder, onClick, onRemove, compact = false }: {
  preview: string | null; placeholder: string; onClick: () => void; onRemove: () => void; compact?: boolean
}) {
  return (
    <div
      className={cn('relative rounded-xl overflow-hidden group transition-all duration-200 cursor-pointer', compact ? 'h-32' : 'h-56')}
      style={{ background: 'var(--main-bg-subtle)', border: '2px dashed rgba(255,255,255,0.1)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = preview ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.1)')}
    >
      {preview ? (
        <>
          <Image src={preview} alt="Preview" fill className="object-contain p-2" />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute top-2 right-2 p-1 rounded-full z-10 transition-colors"
            style={{ background: 'rgba(10,10,10,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X className="w-4 h-4 text-bella-gray-light" />
          </button>
        </>
      ) : (
        <button onClick={onClick} className="w-full h-full flex flex-col items-center justify-center gap-2 text-bella-gray hover:text-bella-gold transition-colors">
          <Upload className="w-6 h-6" />
          <span className="text-xs text-center px-4">{placeholder}</span>
        </button>
      )}
    </div>
  )
}

function GeneratingState() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 animate-pulse"
          style={{ background: 'rgba(201,169,110,0.1)' }}
        >
          <Sparkles className="w-8 h-8 text-bella-gold" />
        </div>
        <h2 className="text-xl font-display font-medium text-bella-white mb-2">Gerando suas imagens...</h2>
        <p className="text-bella-gray text-sm max-w-sm">
          A IA está criando 2 variações com a sua peça. Isso pode levar até 30 segundos.
        </p>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-bella-gold animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ResultState({ result, selectedVariation, onSelectVariation, captionText, captionError, generatingCaption, onGenerateCaption, onNewGeneration }: {
  result: GenerationResult; selectedVariation: 0 | 1; onSelectVariation: (i: 0 | 1) => void
  captionText: string | null; captionError: string | null; generatingCaption: boolean
  onGenerateCaption: () => void; onNewGeneration: () => void
}) {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h1 className="text-xl font-display font-medium text-bella-white">Imagens geradas!</h1>
          </div>
          <p className="text-bella-gray text-sm">Selecione a variação que preferir.</p>
        </div>
        <button onClick={onNewGeneration} className="text-sm text-bella-gold hover:text-bella-gold-light transition-colors">
          Nova geração
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {result.outputUrls.map((url, i) => (
          <div key={i} onClick={() => onSelectVariation(i as 0 | 1)}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
            style={selectedVariation === i
              ? { border: '2px solid #c9a96e', boxShadow: '0 8px 32px rgba(201,169,110,0.2)' }
              : { border: '2px solid rgba(255,255,255,0.06)' }
            }
          >
            <div className="aspect-[4/5] relative" style={{ background: 'var(--main-bg-subtle)' }}>
              <Image src={url} alt={`Variação ${i + 1}`} fill className="object-cover" />
            </div>
            <div className="absolute top-3 left-3">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-medium tracking-wide"
                style={selectedVariation === i
                  ? { background: 'linear-gradient(135deg, #c9a96e, #dfc9a0)', color: '#0a0a0a' }
                  : { background: 'rgba(0,0,0,0.6)', color: 'var(--main-text-muted)' }
                }
              >
                Variação {i + 1}
              </span>
            </div>
            {selectedVariation === i && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5 text-bella-gold drop-shadow" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <a href={result.outputUrls[selectedVariation]} download={`bella-imagem-v${selectedVariation + 1}.jpg`}
          target="_blank" rel="noopener noreferrer" className="btn-primary"
        >
          <Download className="w-4 h-4" />
          <span>Baixar variação {selectedVariation + 1}</span>
        </a>

        {!captionText && !captionError && (
          <button onClick={onGenerateCaption} disabled={generatingCaption} className="btn-outline">
            <Sparkles className="w-4 h-4" />
            {generatingCaption ? 'Gerando legenda...' : 'Gerar legenda'}
          </button>
        )}

        {captionError && (
          <div className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
          >
            <Lock className="w-4 h-4 flex-shrink-0" />
            {captionError}
          </div>
        )}
      </div>

      {captionText && (
        <div className="rounded-2xl p-6" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
          <h3 className="font-medium text-bella-white mb-3">Legenda gerada</h3>
          <p className="text-sm text-bella-gray-light whitespace-pre-line leading-relaxed">{captionText}</p>
          <button onClick={() => navigator.clipboard.writeText(captionText)}
            className="mt-4 text-xs text-bella-gold hover:text-bella-gold-light transition-colors"
          >
            Copiar legenda
          </button>
        </div>
      )}
    </div>
  )
}
