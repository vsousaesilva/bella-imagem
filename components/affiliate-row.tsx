'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'

interface AffiliateRowProps {
  id: string
  name: string
  email: string
  code: string
  commissionPct: number
  active: boolean
  confirmedCount: number
  totalCount: number
  commission: number
  pending: number
  createdAt: string
}

function fmtBrl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function AffiliateRow(props: AffiliateRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pct, setPct] = useState(props.commissionPct.toString())
  const [active, setActive] = useState(props.active)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/master/affiliates/${props.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_pct: Number(pct), active }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar.')
    } else {
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  function handleCancel() {
    setPct(props.commissionPct.toString())
    setActive(props.active)
    setEditing(false)
    setError(null)
  }

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <p className="text-bella-white font-medium text-sm">{props.name}</p>
        <p className="text-[11px] text-bella-gray">{props.email}</p>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs" style={{ color: '#c9a96e' }}>{props.code}</span>
      </td>

      {/* Comissão % — editável */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={pct}
              onChange={e => setPct(e.target.value)}
              className="w-16 text-sm text-center rounded-lg px-2 py-1 text-bella-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <span className="text-bella-gray text-sm">%</span>
          </div>
        ) : (
          <span className="text-bella-white text-sm">{props.commissionPct}%</span>
        )}
      </td>

      <td className="px-4 py-3 text-bella-white text-sm">{props.confirmedCount}/{props.totalCount}</td>
      <td className="px-4 py-3 font-semibold text-sm" style={{ color: '#c9a96e' }}>{fmtBrl(props.commission)}</td>
      <td className="px-4 py-3 text-bella-gray text-sm">{fmtBrl(props.pending)}</td>

      {/* Status — editável */}
      <td className="px-4 py-3">
        {editing ? (
          <button
            onClick={() => setActive(a => !a)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
          >
            {active ? 'Ativo' : 'Inativo'}
          </button>
        ) : (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${props.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {props.active ? 'Ativo' : 'Inativo'}
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-bella-gray text-xs">{fmtDate(props.createdAt)}</td>

      {/* Ações */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}
              title="Salvar"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#6b6b6b' }}
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
      </td>
    </tr>
  )
}
