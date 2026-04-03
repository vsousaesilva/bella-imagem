'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/types'
import type { PlanType, UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Save, ArrowLeft, UserPlus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

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
  email?: string
}

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<PlanType>('free')
  const [active, setActive] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('tenants')
        .select('id, name, slug, plan, active, business_name, business_segment')
        .eq('id', id)
        .single()

      if (t) {
        setTenant(t as TenantData)
        setName(t.name)
        setPlan(t.plan as PlanType)
        setActive(t.active)
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, active')
        .eq('tenant_id', id)

      setUsers((profiles ?? []) as UserData[])
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
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, active: !currentActive } : u))
    }
  }

  async function handleChangeRole(userId: string, role: UserRole) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Carregando...</div>
  if (!tenant) return <div className="p-8 text-red-500">Empresa não encontrada.</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/master/tenants')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-bella-charcoal mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para empresas
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal mb-1">{tenant.name}</h1>
      <p className="text-xs text-gray-400 mb-8">slug: {tenant.slug}</p>

      {feedback && (
        <div className={cn(
          'flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-6',
          feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        )}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      {/* Dados da empresa */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-bella-charcoal mb-5">Dados da empresa</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plano</label>
            <div className="flex flex-wrap gap-2">
              {(['free', 'starter', 'pro', 'business'] as PlanType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm transition font-medium',
                    plan === p
                      ? `${PLAN_COLORS[p]} border-transparent`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActive(!active)}
              className={cn(
                'relative w-11 h-6 rounded-full transition',
                active ? 'bg-bella-rose' : 'bg-gray-200'
              )}
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                active ? 'left-6' : 'left-1'
              )} />
            </button>
            <span className="text-sm text-gray-700">
              Empresa {active ? 'ativa' : 'inativa'}
            </span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 flex items-center gap-2 bg-bella-rose text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-bella-rose-dark transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </section>

      {/* Usuários */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-bella-charcoal">Usuários</h2>
          <span className="text-xs text-gray-400">{users.length} usuário(s)</span>
        </div>

        {!users.length ? (
          <p className="text-sm text-gray-400">Nenhum usuário vinculado.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-bella-charcoal">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-bella-rose"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="operador">Operador</option>
                  </select>
                  <button
                    onClick={() => handleToggleUser(u.id, u.active)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg font-medium transition',
                      u.active
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                    )}
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
