'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { compressImage } from '@/lib/utils'
import { BACKGROUND_PRESETS, ASPECT_RATIO_OPTIONS } from '@/lib/types'
import type { AspectRatio } from '@/lib/types'
import {
  Upload,
  X,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'form' | 'generating' | 'result'

interface GenerationResult {
  imageId: string
  outputUrls: string[]
  selectedUrl: string | null
}

export default function GerarImagemPage() {
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)

  // Inputs
  const [clothingFile, setClothingFile] = useState<File | null>(null)
  const [clothingPreview, setClothingPreview] = useState<string | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [modelPreview, setModelPreview] = useState<string | null>(null)
  const [backgroundPreset, setBackgroundPreset] = useState<string>('')
  const [backgroundCustom, setBackgroundCustom] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5')
  const [showBgOptions, setShowBgOptions] = useState(false)

  // Resultado
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<0 | 1>(0)
  const [captionText, setCaptionText] = useState<string | null>(null)
  const [generatingCaption, setGeneratingCaption] = useState(false)

  const clothingInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(
    file: File,
    setFile: (f: File) => void,
    setPreview: (p: string) => void
  ) {
    setFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  async function handleGenerate() {
    if (!clothingFile) {
      setError('Selecione uma imagem da peça ou acessório.')
      return
    }

    setStep('generating')
    setError(null)

    try {
      const clothing = await compressImage(clothingFile)
      let modelData: { base64: string; mimeType: string } | null = null
      if (modelFile) modelData = await compressImage(modelFile)

      const body = {
        clothingImageBase64: clothing.base64,
        clothingImageMimeType: clothing.mimeType,
        ...(modelData && {
          modelImageBase64: modelData.base64,
          modelImageMimeType: modelData.mimeType,
        }),
        backgroundPreset: backgroundPreset || undefined,
        backgroundCustom: backgroundCustom || undefined,
        aspectRatio,
      }

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar imagem.')
        setStep('form')
        return
      }

      setResult({
        imageId: data.imageId,
        outputUrls: data.outputUrls,
        selectedUrl: data.outputUrls[0],
      })
      setSelectedVariation(0)
      setStep('result')
    } catch (err) {
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

    const res = await fetch('/api/captions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId: result.imageId }),
    })

    const data = await res.json()
    setCaptionText(data.caption ?? null)
    setGeneratingCaption(false)
  }

  function handleNewGeneration() {
    setStep('form')
    setResult(null)
    setCaptionText(null)
    setError(null)
    setClothingFile(null)
    setClothingPreview(null)
    setModelFile(null)
    setModelPreview(null)
    setBackgroundPreset('')
    setBackgroundCustom('')
    setAspectRatio('4:5')
  }

  if (step === 'generating') return <GeneratingState />

  if (step === 'result' && result) {
    return (
      <ResultState
        result={result}
        selectedVariation={selectedVariation}
        onSelectVariation={handleSelectVariation}
        captionText={captionText}
        generatingCaption={generatingCaption}
        onGenerateCaption={handleGenerateCaption}
        onNewGeneration={handleNewGeneration}
      />
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal">Gerar Imagem</h1>
        <p className="text-gray-500 mt-1">
          Envie a peça ou acessório e gere uma foto profissional com modelo.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna esquerda — inputs de imagem */}
        <div className="space-y-5">
          {/* Imagem da peça (obrigatório) */}
          <div>
            <label className="block text-sm font-medium text-bella-charcoal mb-2">
              Foto da peça ou acessório
              <span className="text-bella-rose ml-1">*</span>
            </label>
            <input
              ref={clothingInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f, setClothingFile, setClothingPreview)
              }}
            />
            <ImageUploadBox
              preview={clothingPreview}
              placeholder="Clique para enviar a foto da peça"
              onClick={() => clothingInputRef.current?.click()}
              onRemove={() => { setClothingFile(null); setClothingPreview(null) }}
            />
          </div>

          {/* Foto do modelo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-bella-charcoal mb-1">
              Foto da pessoa modelo
              <span className="text-xs text-gray-400 ml-2 font-normal">opcional</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Sem foto, o modelo será escolhido pela IA conforme o perfil configurado.
            </p>
            <input
              ref={modelInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f, setModelFile, setModelPreview)
              }}
            />
            <ImageUploadBox
              preview={modelPreview}
              placeholder="Clique para enviar a foto do modelo"
              onClick={() => modelInputRef.current?.click()}
              onRemove={() => { setModelFile(null); setModelPreview(null) }}
              compact
            />
          </div>
        </div>

        {/* Coluna direita — opções de geração */}
        <div className="space-y-5">
          {/* Proporção */}
          <div>
            <label className="block text-sm font-medium text-bella-charcoal mb-2">
              Proporção da imagem
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAspectRatio(opt.value)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl border text-sm text-left transition',
                    aspectRatio === opt.value
                      ? 'border-bella-rose bg-bella-rose/5 text-bella-rose font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fundo / Paisagem */}
          <div>
            <label className="block text-sm font-medium text-bella-charcoal mb-1">
              Paisagem / Fundo
              <span className="text-xs text-gray-400 ml-2 font-normal">opcional</span>
            </label>

            {/* Opções pré-definidas */}
            <div className="relative mb-2">
              <button
                onClick={() => setShowBgOptions(!showBgOptions)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-left text-gray-600 flex items-center justify-between hover:border-gray-300 transition"
              >
                <span>
                  {backgroundPreset
                    ? BACKGROUND_PRESETS.find((b) => b.value === backgroundPreset)?.label ?? 'Selecionar fundo'
                    : 'Selecionar fundo pré-definido'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showBgOptions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setBackgroundPreset(''); setShowBgOptions(false) }}
                    className="w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 text-left"
                  >
                    Nenhum (deixar IA escolher)
                  </button>
                  {BACKGROUND_PRESETS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => { setBackgroundPreset(bg.value); setShowBgOptions(false) }}
                      className={cn(
                        'w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition',
                        backgroundPreset === bg.value ? 'text-bella-rose font-medium' : 'text-gray-700'
                      )}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição livre */}
            <textarea
              value={backgroundCustom}
              onChange={(e) => setBackgroundCustom(e.target.value)}
              placeholder="Ou descreva o fundo livremente... (ex: 'terraço com flores brancas e luz do pôr do sol')"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-bella-rose/30 focus:border-bella-rose transition"
            />
          </div>
        </div>
      </div>

      {/* Botão gerar */}
      <div className="mt-8">
        <button
          onClick={handleGenerate}
          disabled={!clothingFile}
          className="flex items-center gap-2 bg-bella-rose text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-bella-rose-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          Gerar 2 variações
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Cada geração usa 1 crédito da sua cota mensal.
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────

function ImageUploadBox({
  preview,
  placeholder,
  onClick,
  onRemove,
  compact = false,
}: {
  preview: string | null
  placeholder: string
  onClick: () => void
  onRemove: () => void
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden group transition hover:border-bella-rose/50',
        compact ? 'h-32' : 'h-56'
      )}
    >
      {preview ? (
        <>
          <Image src={preview} alt="Preview" fill className="object-contain p-2" />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-red-50 transition z-10"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </>
      ) : (
        <button
          onClick={onClick}
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-bella-rose transition"
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs text-center px-4">{placeholder}</span>
        </button>
      )}
    </div>
  )
}

function GeneratingState() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-bella-rose/10 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-bella-rose" />
        </div>
        <h2 className="text-xl font-semibold text-bella-charcoal mb-2">Gerando suas imagens...</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          A IA está criando 2 variações com a sua peça. Isso pode levar até 30 segundos.
        </p>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-bella-rose animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ResultState({
  result,
  selectedVariation,
  onSelectVariation,
  captionText,
  generatingCaption,
  onGenerateCaption,
  onNewGeneration,
}: {
  result: GenerationResult
  selectedVariation: 0 | 1
  onSelectVariation: (i: 0 | 1) => void
  captionText: string | null
  generatingCaption: boolean
  onGenerateCaption: () => void
  onNewGeneration: () => void
}) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h1 className="text-xl font-bold text-bella-charcoal">Imagens geradas!</h1>
          </div>
          <p className="text-gray-500 text-sm">Selecione a variação que preferir.</p>
        </div>
        <button
          onClick={onNewGeneration}
          className="text-sm text-bella-rose hover:underline"
        >
          Nova geração
        </button>
      </div>

      {/* 2 variações */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {result.outputUrls.map((url, i) => (
          <div
            key={i}
            onClick={() => onSelectVariation(i as 0 | 1)}
            className={cn(
              'relative rounded-2xl overflow-hidden cursor-pointer border-2 transition',
              selectedVariation === i
                ? 'border-bella-rose shadow-lg shadow-bella-rose/20'
                : 'border-transparent hover:border-gray-300'
            )}
          >
            <div className="aspect-[4/5] relative bg-gray-100">
              <Image src={url} alt={`Variação ${i + 1}`} fill className="object-cover" />
            </div>
            <div className="absolute top-3 left-3">
              <span
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  selectedVariation === i
                    ? 'bg-bella-rose text-white'
                    : 'bg-white/80 text-gray-700'
                )}
              >
                Variação {i + 1}
              </span>
            </div>
            {selectedVariation === i && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5 text-bella-rose drop-shadow" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href={result.outputUrls[selectedVariation]}
          download={`bella-imagem-variacao-${selectedVariation + 1}.jpg`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-bella-charcoal text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          <Download className="w-4 h-4" />
          Baixar variação {selectedVariation + 1}
        </a>

        {!captionText && (
          <button
            onClick={onGenerateCaption}
            disabled={generatingCaption}
            className="flex items-center gap-2 border border-bella-rose text-bella-rose px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-bella-rose/5 transition disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {generatingCaption ? 'Gerando legenda...' : 'Gerar legenda'}
          </button>
        )}
      </div>

      {/* Legenda gerada */}
      {captionText && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-bella-charcoal mb-3">Legenda gerada</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{captionText}</p>
          <button
            onClick={() => navigator.clipboard.writeText(captionText)}
            className="mt-4 text-xs text-bella-rose hover:underline"
          >
            Copiar legenda
          </button>
        </div>
      )}
    </div>
  )
}
