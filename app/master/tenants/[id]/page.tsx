'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import type { PlanType, UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Save, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TenantData {
  id: string
  name: string
  slug: string
  plan: PlanType
  active: boolean
  business_name: string | null
  business_segment: string | null
}

interface UserData {
  id: string
  full_name: string | null
  role: UserRole
  active: boolean
}

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [name, setName] = useState('')
  const [plan, setPlan] = useState<PlanType>('free')
  const [active, setActive] = useState(true)

  useEffect(() => {
    async function load() {
      // Usa o endpoint admin para bypassar RLS (master tem tenant_id = null)
      const res = await fetch(`/api/admin/tenants/${id}`)
      const data = await res.json()

      if (data.tenant) {
        setTenant(data.tenant)
        setName(data.tenant.name)
        setPlan(data.tenant.plan as PlanType)
        setActive(data.tenant.active)
      }

      setUsers(data.users ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    setSaving(true)
    setFeedback(null)

    const res = await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: id, plan, active, name }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setFeedback({ type: 'error', msg: data.error ?? 'Erro ao salvar.' })
    } else {
      setFeedback({ type: 'success', msg: 'Empresa atualizada com sucesso!' })
      setTenant((t) => t ? { ...t, name, plan, active } : t)
    }
  }

  async function handleToggleUser(userId: string, currentActive: boolean) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active: !currentActive }),
    })
    if (res.ok) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, active: !currentActive } : u))
  }

  async function handleChangeRole(userId: string, role: UserRole) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    if (res.ok) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="h-6 w-32 rounded-xl shimmer mb-8" />
        <div className="h-10 w-64 rounded-xl shimmer mb-4" />
        <div className="rounded-2xl p-6 h-48 shimmer" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="p-8 text-sm" style={{ color: '#f87171' }}>
        Empresa não encontrada.
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/master/tenants')}
        className="flex items-center gap-2 text-sm text-bella-gray hover:text-bella-gold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para empresas
      </button>

      <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight mb-0.5">{tenant.name}</h1>
      <p className="text-[11px] text-bella-gray mb-8">slug: {tenant.slug}</p>

      {feedback && (
        <div
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-6"
          style={feedback.type === 'success'
            ? { background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }
            : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
          }
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      {/* Dados da empresa */}
      <section className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="font-medium text-bella-white mb-5">Dados da empresa</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-3">Plano</label>
            <div className="flex flex-wrap gap-2">
              {(['free', 'starter', 'pro', 'business'] as PlanType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={plan === p
                    ? { background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.4)', color: '#c9a96e' }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b6b6b' }
                  }
                >
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-bella-gray mt-2">
              Plano atual: <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', PLAN_COLORS[plan])}>{PLAN_LABELS[plan]}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActive(!active)}
              className="relative w-11 h-6 rounded-full transition-all duration-200"
              style={{ background: active ? 'linear-gradient(135deg, #c9a96e, #dfc9a0)' : 'rgba(255,255,255,0.1)' }}
            >
              <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                style={{ left: active ? '1.5rem' : '0.25rem' }}
              />
            </button>
            <span className="text-sm text-bella-gray">
              Empresa <span className={active ? 'text-green-400' : 'text-bella-gray'}>{active ? 'ativa' : 'inativa'}</span>
            </span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
          <Save className="w-4 h-4" />
          <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
        </button>
      </section>

      {/* Usuários */}
      <section className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-medium text-bella-white">Usuários</h2>
          <span className="text-[11px] text-bella-gray">{users.length} usuário(s)</span>
        </div>

        {!users.length ? (
          <p className="text-sm text-bella-gray">Nenhum usuário vinculado.</p>
        ) : (
          <div className="space-y-1">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <p className="text-sm font-medium text-bella-white">{u.full_name ?? '—'}</p>
                  <p className="text-[11px] text-bella-gray capitalize">{u.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                    className="text-xs px-2 py-1.5 rounded-lg focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#b0b0b0' }}
                  >
                    <option value="administrador">Administrador</option>
                    <option value="operador">Operador</option>
                  </select>
                  <button
                    onClick={() => handleToggleUser(u.id, u.active)}
                    className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-200"
                    style={u.active
                      ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#6b6b6b', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {u.active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
