'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tenant, TomDePele, Biotipo, FaixaEtaria, GeneroModelo } from '@/lib/types'
import { AlertCircle, CheckCircle2, Save, User, Instagram, Link2, Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOM_OPTIONS: Array<{ value: TomDePele; label: string }> = [
  { value: 'clara',  label: 'Clara' },
  { value: 'media',  label: 'Morena' },
  { value: 'escura', label: 'Negra' },
]
const BIOTIPO_OPTIONS: Array<{ value: Biotipo; label: string }> = [
  { value: 'magra',     label: 'Esbelto(a)' },
  { value: 'media',     label: 'Médio(a)' },
  { value: 'plus_size', label: 'Plus size' },
]
const FAIXA_OPTIONS: Array<{ value: FaixaEtaria; label: string }> = [
  { value: '0_18',    label: '0–18 anos' },
  { value: '18_25',   label: '18–25 anos' },
  { value: '26_35',   label: '26–35 anos' },
  { value: '36_45',   label: '36–45 anos' },
  { value: '45_mais', label: 'Mais de 45 anos' },
]
const GENERO_OPTIONS: Array<{ value: GeneroModelo; label: string }> = [
  { value: 'feminino',  label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'neutro',    label: 'Neutro' },
]
const TONE_OPTIONS = [
  { value: 'moderno', label: 'Moderno e sofisticado' },
  { value: 'jovem',   label: 'Jovem e descontraído' },
  { value: 'luxo',    label: 'Luxo e exclusividade' },
  { value: 'casual',  label: 'Casual e acessível' },
]

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [igFeedback, setIgFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const [fullName, setFullName] = useState('')
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
    // Handle Instagram OAuth feedback from URL params
    const igSuccess = searchParams.get('ig_success')
    const igError = searchParams.get('ig_error')
    if (igSuccess) {
      setIgFeedback({ type: 'success', msg: 'Instagram conectado com sucesso!' })
    } else if (igError) {
      const errorMessages: Record<string, string> = {
        plan: 'Seu plano não permite integração com Instagram.',
        config: 'Configuração de app ausente. Contate o suporte.',
        denied: 'Permissão negada pelo usuário.',
        missing_params: 'Parâmetros de retorno inválidos.',
        invalid_state: 'Estado de segurança inválido. Tente novamente.',
        token_exchange: 'Falha ao obter token de acesso.',
        pages_fetch: 'Não foi possível buscar suas páginas do Facebook.',
        no_pages: 'Nenhuma página do Facebook encontrada na conta.',
        no_ig_account: 'Nenhuma conta do Instagram Business vinculada à sua página do Facebook.',
        db_update: 'Erro ao salvar credenciais. Tente novamente.',
        unexpected: 'Erro inesperado. Tente novamente.',
      }
      setIgFeedback({ type: 'error', msg: errorMessages[igError] ?? 'Erro desconhecido.' })
    }
  }, [searchParams])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, full_name')
        .eq('id', user.id)
        .single()

      setProfileId(user.id)
      setFullName(profile?.full_name ?? '')

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

  async function handleSaveProfile() {
    if (!profileId) return
    setSavingProfile(true)
    setProfileFeedback(null)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null })
      .eq('id', profileId)

    setSavingProfile(false)
    if (error) {
      setProfileFeedback({ type: 'error', msg: 'Erro ao salvar nome.' })
    } else {
      setProfileFeedback({ type: 'success', msg: 'Nome atualizado com sucesso!' })
    }
  }

  async function handleSave() {
    if (!tenant) return
    setSaving(true)
    setFeedback(null)

    const { error } = await supabase
      .from('tenants')
      .update({
        business_name:        businessName || null,
        business_segment:     businessSegment || null,
        business_description: businessDescription.slice(0, 300) || null,
        business_tone:        businessTone,
        model_tom_de_pele:    tomDePele,
        model_biotipo:        biotipo,
        model_faixa_etaria:   faixaEtaria,
        model_genero:         genero,
        model_descricao:      modelDescricao || null,
      })
      .eq('id', tenant.id)

    setSaving(false)
    if (error) {
      setFeedback({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' })
    } else {
      setFeedback({ type: 'success', msg: 'Configurações salvas com sucesso!' })
    }
  }

  async function handleDisconnectInstagram() {
    setDisconnecting(true)
    setIgFeedback(null)
    const res = await fetch('/api/instagram/disconnect', { method: 'POST' })
    const data = await res.json()
    setDisconnecting(false)
    if (!res.ok) {
      setIgFeedback({ type: 'error', msg: data.error ?? 'Erro ao desconectar.' })
    } else {
      setTenant(prev => prev ? { ...prev, instagram_access_token: null, instagram_account_id: null } : prev)
      setIgFeedback({ type: 'success', msg: 'Instagram desconectado.' })
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="h-8 w-48 rounded-xl shimmer mb-2" />
        <div className="h-4 w-72 rounded-xl shimmer" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">Configurações</h1>
        <p className="text-bella-gray text-sm mt-1">Configure o contexto da sua marca e o perfil padrão do modelo.</p>
      </div>

      {/* Perfil do usuário */}
      <section className="rounded-2xl p-6 mb-6" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-bella-gold" />
          <h2 className="font-medium text-bella-white">Meu perfil</h2>
        </div>
        <p className="text-[11px] text-bella-gray mb-5">Seu nome aparece no menu lateral e no painel.</p>

        {profileFeedback && (
          <div
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4"
            style={profileFeedback.type === 'success'
              ? { background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }
              : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
            }
          >
            {profileFeedback.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {profileFeedback.msg}
          </div>
        )}

        <Field label="Seu nome">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={80}
            placeholder="Ex: Maria Souza"
            className="input-field"
          />
        </Field>

        <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary mt-5">
          <Save className="w-4 h-4" />
          <span>{savingProfile ? 'Salvando...' : 'Salvar nome'}</span>
        </button>
      </section>

      {/* Instagram integration — Pro / Business only */}
      {tenant && ['pro', 'business'].includes(tenant.plan) && (
        <section className="rounded-2xl p-6 mb-6" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Instagram className="w-4 h-4 text-bella-gold" />
            <h2 className="font-medium text-bella-white">Instagram</h2>
          </div>
          <p className="text-[11px] text-bella-gray mb-5">
            Conecte sua conta do Instagram Business para publicar imagens diretamente da galeria.
          </p>

          {igFeedback && (
            <div
              className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4"
              style={igFeedback.type === 'success'
                ? { background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }
                : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
              }
            >
              {igFeedback.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              {igFeedback.msg}
            </div>
          )}

          {tenant.instagram_account_id ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}
                >
                  <Link2 className="w-3 h-3" />
                  Conectado
                </span>
                <span className="text-xs text-bella-gray">ID: {tenant.instagram_account_id}</span>
              </div>
              <button
                onClick={handleDisconnectInstagram}
                disabled={disconnecting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
              >
                <Link2Off className="w-3 h-3" />
                {disconnecting ? 'Desconectando...' : 'Desconectar'}
              </button>
            </div>
          ) : (
            <a
              href="/api/instagram/connect"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }}
            >
              <Instagram className="w-4 h-4" />
              Conectar Instagram
            </a>
          )}
        </section>
      )}

      {feedback && (
        <div
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-6"
          style={feedback.type === 'success'
            ? { background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }
            : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
          }
        >
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {feedback.msg}
        </div>
      )}

      {/* Contexto do negócio */}
      <section className="rounded-2xl p-6 mb-6" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
        <h2 className="font-medium text-bella-white mb-1">Contexto da marca</h2>
        <p className="text-[11px] text-bella-gray mb-5">Usado para gerar legendas personalizadas. Seja conciso e objetivo.</p>

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
                <OptionButton
                  key={opt.value}
                  active={businessTone === opt.value}
                  onClick={() => setBusinessTone(opt.value)}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* Perfil do modelo */}
      <section className="rounded-2xl p-6 mb-8" style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}>
        <h2 className="font-medium text-bella-white mb-1">Perfil padrão do modelo</h2>
        <p className="text-[11px] text-bella-gray mb-5">
          Usado quando nenhuma foto de modelo é enviada na geração ou quando não definidos os critérios na página de geração.
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

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        <Save className="w-4 h-4" />
        <span>{saving ? 'Salvando...' : 'Salvar configurações'}</span>
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">{label}</label>
      {children}
    </div>
  )
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-xl text-sm text-left transition-all duration-200"
      style={active
        ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e' }
        : { background: 'var(--main-bg-subtle)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--main-text-sub)' }
      }
    >
      {children}
    </button>
  )
}

function OptionGroup<T extends string>({ options, value, onChange }: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <OptionButton key={opt.value} active={value === opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </OptionButton>
      ))}
    </div>
  )
}
