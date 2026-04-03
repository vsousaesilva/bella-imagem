'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant, TomDePele, Biotipo, FaixaEtaria, GeneroModelo } from '@/lib/types'
import { AlertCircle, CheckCircle2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOM_OPTIONS: Array<{ value: TomDePele; label: string }> = [
  { value: 'clara', label: 'Clara' },
  { value: 'media', label: 'Morena' },
  { value: 'escura', label: 'Negra' },
]
const BIOTIPO_OPTIONS: Array<{ value: Biotipo; label: string }> = [
  { value: 'magra', label: 'Esbelto(a)' },
  { value: 'media', label: 'Médio(a)' },
  { value: 'plus_size', label: 'Plus size' },
]
const FAIXA_OPTIONS: Array<{ value: FaixaEtaria; label: string }> = [
  { value: '18_25', label: '18–25 anos' },
  { value: '26_35', label: '26–35 anos' },
  { value: '36_45', label: '36–45 anos' },
]
const GENERO_OPTIONS: Array<{ value: GeneroModelo; label: string }> = [
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'neutro', label: 'Neutro' },
]
const TONE_OPTIONS = [
  { value: 'moderno', label: 'Moderno e sofisticado' },
  { value: 'jovem', label: 'Jovem e descontraído' },
  { value: 'luxo', label: 'Luxo e exclusividade' },
  { value: 'casual', label: 'Casual e acessível' },
]

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [businessSegment, setBusinessSegment] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [businessTone, setBusinessTone] = useState('moderno')
  const [tomDePele, setTomDePele] = useState<TomDePele>('media')
  const [biotipo, setBiotipo] = useState<Biotipo>('media')
  const [faixaEtaria, setFaixaEtaria] = useState<FaixaEtaria>('26_35')
  const [genero, setGenero] = useState<GeneroModelo>('feminino')
  const [modelDescricao, setModelDescricao] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) { setLoading(false); return }

      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

      if (t) {
        setTenant(t as Tenant)
        setBusinessName(t.business_name ?? '')
        setBusinessSegment(t.business_segment ?? '')
        setBusinessDescription(t.business_description ?? '')
        setBusinessTone(t.business_tone ?? 'moderno')
        setTomDePele(t.model_tom_de_pele ?? 'media')
        setBiotipo(t.model_biotipo ?? 'media')
        setFaixaEtaria(t.model_faixa_etaria ?? '26_35')
        setGenero(t.model_genero ?? 'feminino')
        setModelDescricao(t.model_descricao ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!tenant) return
    setSaving(true)
    setFeedback(null)

    const { error } = await supabase
      .from('tenants')
      .update({
        business_name: businessName || null,
        business_segment: businessSegment || null,
        business_description: businessDescription.slice(0, 300) || null,
        business_tone: businessTone,
        model_tom_de_pele: tomDePele,
        model_biotipo: biotipo,
        model_faixa_etaria: faixaEtaria,
        model_genero: genero,
        model_descricao: modelDescricao || null,
      })
      .eq('id', tenant.id)

    setSaving(false)
    if (error) {
      setFeedback({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' })
    } else {
      setFeedback({ type: 'success', msg: 'Configurações salvas com sucesso!' })
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-100 rounded-xl shimmer mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded-xl shimmer" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal">Configurações</h1>
        <p className="text-gray-500 mt-1">
          Configure o contexto da sua marca e o perfil padrão do modelo.
        </p>
      </div>

      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-6',
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          )}
        >
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {feedback.msg}
        </div>
      )}

      {/* Contexto do negócio */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-bella-charcoal mb-1">Contexto da marca</h2>
        <p className="text-xs text-gray-400 mb-5">
          Usado para gerar legendas personalizadas. Seja conciso e objetivo.
        </p>

        <div className="space-y-4">
          <Field label="Nome da marca">
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              maxLength={80}
              placeholder="Ex: Studio Iris Moda"
              className="input-field"
            />
          </Field>

          <Field label="Segmento">
            <input
              type="text"
              value={businessSegment}
              onChange={(e) => setBusinessSegment(e.target.value)}
              maxLength={80}
              placeholder="Ex: moda feminina casual, acessórios de luxo..."
              className="input-field"
            />
          </Field>

          <Field label={`Descrição (${businessDescription.length}/300 chars)`}>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={3}
              placeholder="Fale brevemente sobre sua marca, diferenciais e público-alvo..."
              className="input-field resize-none"
            />
          </Field>

          <Field label="Tom de comunicação">
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBusinessTone(opt.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl border text-sm text-left transition',
                    businessTone === opt.value
                      ? 'border-bella-rose bg-bella-rose/5 text-bella-rose font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* Perfil do modelo */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-bella-charcoal mb-1">Perfil padrão do modelo</h2>
        <p className="text-xs text-gray-400 mb-5">
          Usado quando nenhuma foto de modelo é enviada na geração.
        </p>

        <div className="space-y-5">
          <Field label="Gênero">
            <OptionGroup options={GENERO_OPTIONS} value={genero} onChange={(v) => setGenero(v as GeneroModelo)} />
          </Field>

          <Field label="Tom de pele">
            <OptionGroup options={TOM_OPTIONS} value={tomDePele} onChange={(v) => setTomDePele(v as TomDePele)} />
          </Field>

          <Field label="Biotipo">
            <OptionGroup options={BIOTIPO_OPTIONS} value={biotipo} onChange={(v) => setBiotipo(v as Biotipo)} />
          </Field>

          <Field label="Faixa etária">
            <OptionGroup options={FAIXA_OPTIONS} value={faixaEtaria} onChange={(v) => setFaixaEtaria(v as FaixaEtaria)} />
          </Field>

          <Field label="Descrição livre (opcional)">
            <textarea
              value={modelDescricao}
              onChange={(e) => setModelDescricao(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Ex: cabelo cacheado volumoso, expressão natural e confiante..."
              className="input-field resize-none"
            />
          </Field>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-bella-rose text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-bella-rose-dark transition disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  )
}

function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-xl border text-sm transition',
            value === opt.value
              ? 'border-bella-rose bg-bella-rose/5 text-bella-rose font-medium'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
