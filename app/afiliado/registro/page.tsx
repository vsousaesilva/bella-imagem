'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { AlertCircle, CheckCircle, Users } from 'lucide-react'

export default function AfiliadoRegistroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao cadastrar. Tente novamente.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(201,169,110,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 80% 20%, rgba(232,180,184,0.05) 0%, transparent 60%)
          `,
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <NextImage src="/logo.png" alt="Bella Imagem" width={180} height={54} className="object-contain" priority />
          </div>
          <p className="text-sm text-bella-gray">Programa de Afiliados</p>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#4ade80' }} />
              <h2 className="text-lg font-display font-medium text-bella-white mb-2">Cadastro realizado!</h2>
              <p className="text-sm text-bella-gray leading-relaxed">
                Verifique seu e-mail para criar sua senha e acessar o painel de afiliado.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)' }}
                >
                  <Users className="w-5 h-5" style={{ color: '#c9a96e' }} />
                </div>
                <div>
                  <h1 className="text-base font-display font-medium text-bella-white">Seja um afiliado</h1>
                  <p className="text-xs text-bella-gray">Ganhe 20% de comissão em cada venda</p>
                </div>
              </div>

              {/* Benefícios */}
              <div
                className="rounded-xl p-4 mb-6 grid grid-cols-3 gap-3 text-center"
                style={{ background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.1)' }}
              >
                {[
                  { label: 'Comissão', value: '20%' },
                  { label: 'Starter', value: 'R$29,80' },
                  { label: 'Business', value: 'R$399,80' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-lg font-bold" style={{ color: '#c9a96e' }}>{item.value}</p>
                    <p className="text-[11px] text-bella-gray">{item.label}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="input-field"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                    Como pretende divulgar? <span className="text-bella-gray normal-case">(opcional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Ex: Instagram, YouTube, grupo de WhatsApp, blog..."
                  />
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  <span>{loading ? 'Cadastrando...' : 'Quero ser afiliado'}</span>
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-bella-gray mt-6">
          Bella Imagem &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
