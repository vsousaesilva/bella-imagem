'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile, Tenant } from '@/lib/types'
import { PLAN_COLORS, PLAN_LABELS } from '@/lib/types'
import {
  ImageIcon,
  LayoutGrid,
  Settings,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

interface SidebarProps {
  profile: Profile
  tenant: Tenant | null
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Painel', icon: LayoutGrid },
  { href: '/gerar', label: 'Gerar Imagem', icon: Sparkles },
  { href: '/galeria', label: 'Galeria', icon: ImageIcon },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar({ profile, tenant }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const quotaPercent = tenant
    ? Math.min(100, Math.round((tenant.quota_used / tenant.quota_limit) * 100))
    : 0

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-bella-rose flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-bella-charcoal tracking-tight">Bella Imagem</span>
        </div>
        {tenant && (
          <p className="text-xs text-gray-400 mt-1 truncate pl-9">{tenant.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition',
                active
                  ? 'bg-bella-rose/10 text-bella-rose font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-bella-charcoal'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Link master apenas para role master */}
        {profile.role === 'master' && (
          <Link
            href="/master"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition',
              pathname.startsWith('/master')
                ? 'bg-bella-rose/10 text-bella-rose font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-bella-charcoal'
            )}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Painel Master
          </Link>
        )}
      </nav>

      {/* Cota */}
      {tenant && (
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Imagens este mês</span>
            <span className="font-medium text-bella-charcoal">
              {tenant.quota_used}/{tenant.quota_limit}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                quotaPercent >= 90 ? 'bg-red-400' : quotaPercent >= 70 ? 'bg-amber-400' : 'bg-bella-rose'
              )}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <div className="mt-2">
            <span
              className={cn(
                'inline-block text-xs px-2 py-0.5 rounded-full font-medium',
                PLAN_COLORS[tenant.plan]
              )}
            >
              {PLAN_LABELS[tenant.plan]}
            </span>
          </div>
        </div>
      )}

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bella-nude-dark flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-bella-charcoal">
              {(profile.full_name ?? 'U')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-bella-charcoal truncate">
              {profile.full_name ?? 'Usuário'}
            </p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
