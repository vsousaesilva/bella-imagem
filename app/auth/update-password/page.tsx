'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Não foi possível definir a senha. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.replace('/dashboard'), 2000)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--main-bg)' } as React.CSSProperties}
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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <NextImage src="/logo.png" alt="Bella Imagem" width={180} height={54} className="object-contain" priority />
          </div>
          <p className="text-sm text-bella-gray">Crie sua senha de acesso</p>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
        >
          <h1 className="text-lg font-display font-medium text-bella-white mb-2">
            Defina sua senha
          </h1>
          <p className="text-sm text-bella-gray mb-6">
            Escolha uma senha segura para acessar a plataforma.
          </p>

          {success ? (
            <div className="flex items-center gap-3 text-sm text-green-400 px-4 py-4 rounded-xl"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Senha criada! Redirecionando para o dashboard...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Repita a senha"
                />
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

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                <span>{loading ? 'Salvando...' : 'Criar senha e acessar'}</span>
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-bella-gray mt-6">
          Bella Imagem &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
