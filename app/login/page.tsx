'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sparkles, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Mesh gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(201,169,110,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 80% 20%, rgba(232,180,184,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 50% 80%, rgba(201,169,110,0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Floating decorative circles */}
      <div
        className="absolute rounded-full pointer-events-none animate-float"
        style={{ width: 300, height: 300, top: '8%', right: '-4%', border: '1px solid rgba(201,169,110,0.08)' }}
      />
      <div
        className="absolute rounded-full pointer-events-none animate-float"
        style={{ width: 160, height: 160, bottom: '15%', left: '-2%', border: '1px solid rgba(201,169,110,0.06)', animationDelay: '2s' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #dfc9a0)' }}
            >
              <Sparkles className="w-4 h-4 text-bella-black" />
            </div>
            <span className="font-display text-2xl font-medium text-bella-white tracking-tight">
              Bella Imagem
            </span>
          </div>
          <p className="text-sm text-bella-gray">Geração de imagens para moda com IA</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h1 className="text-lg font-display font-medium text-bella-white mb-6">
            Entrar na plataforma
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              <span>{loading ? 'Entrando...' : 'Entrar'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-bella-gray mt-6">
          Bella Imagem &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
