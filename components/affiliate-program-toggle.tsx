'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, AlertTriangle } from 'lucide-react'

interface AffiliateProgramToggleProps {
  active: boolean
}

export function AffiliateProgramToggle({ active: initialActive }: AffiliateProgramToggleProps) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/master/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'affiliate_program_active', value: active ? 'false' : 'true' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao atualizar.')
    } else {
      setActive(a => !a)
      setConfirming(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div
      className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      style={
        active
          ? { background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)' }
          : { background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={active
            ? { background: 'rgba(74,222,128,0.1)' }
            : { background: 'rgba(248,113,113,0.1)' }
          }
        >
          <Power className="w-4 h-4" style={{ color: active ? '#4ade80' : '#f87171' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: active ? '#4ade80' : '#f87171' }}>
            Programa de afiliados {active ? 'ativo' : 'suspenso'}
          </p>
          <p className="text-xs text-bella-gray mt-0.5">
            {active
              ? 'Novos cadastros e rastreamento de conversões habilitados.'
              : 'Novos cadastros bloqueados. Dados e comissões anteriores preservados.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {confirming ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-bella-gray flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400" />
              {active ? 'Suspender o programa?' : 'Reativar o programa?'}
            </p>
            <button
              onClick={toggle}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: active ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)', color: active ? '#f87171' : '#4ade80' }}
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-bella-gray hover:text-white transition-colors px-2 py-1.5"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
            style={active
              ? { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
              : { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
            }
          >
            {active ? 'Suspender programa' : 'Reativar programa'}
          </button>
        )}
        {error && <p className="text-[10px] text-red-400">{error}</p>}
      </div>
    </div>
  )
}
