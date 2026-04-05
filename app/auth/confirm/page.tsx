'use client'

/**
 * /auth/confirm — processa tokens de recovery/magic-link que chegam como hash fragments.
 *
 * O Supabase admin generateLink usa implicit flow: os tokens ficam no hash da URL
 * (#access_token=...&type=recovery). O hash não é enviado ao servidor, por isso
 * precisamos de uma página client-side que leia window.location.hash e defina a sessão.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const hash = window.location.hash.substring(1) // remove o '#'
    const params = new URLSearchParams(hash)

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')
    const errorDescription = params.get('error_description')

    if (errorDescription) {
      console.error('[auth/confirm] Erro do Supabase:', errorDescription)
      setStatus('error')
      return
    }

    if (!accessToken || !refreshToken) {
      setStatus('error')
      return
    }

    const supabase = createClient()

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) {
        console.error('[auth/confirm] Erro ao definir sessão:', error)
        setStatus('error')
        return
      }

      if (type === 'recovery') {
        // Usuário clicou no link de criação/redefinição de senha
        router.replace('/auth/update-password')
      } else {
        router.replace('/dashboard')
      }
    })
  }, [router])

  if (status === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#0a0a0a' }}
      >
        <div className="text-center max-w-sm">
          <p className="text-bella-white text-lg font-medium mb-2">Link inválido ou expirado</p>
          <p className="text-bella-gray text-sm mb-6">
            O link de acesso expirou. Use a opção{' '}
            <em>Esqueci minha senha</em> para gerar um novo.
          </p>
          <a
            href="/login"
            className="btn-primary inline-block"
          >
            Ir para o login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0a0a' }}
    >
      <p className="text-bella-gray text-sm animate-pulse">Verificando acesso...</p>
    </div>
  )
}
