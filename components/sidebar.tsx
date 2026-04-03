'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile, Tenant } from '@/lib/types'
import { PLAN_COLORS, PLAN_LABELS } from '@/lib/types'
import Image from 'next/image'
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
  { href: '/dashboard', label: 'Painel',         icon: LayoutGrid },
  { href: '/gerar',     label: 'Gerar Imagem',   icon: Sparkles },
  { href: '/galeria',   label: 'Galeria',         icon: ImageIcon },
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
    <aside
      className="w-60 flex-shrink-0 flex flex-col min-h-screen"
      style={{ background: '#1a1a1a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Image
          src="/logo.png"
          alt="Bella Imagem"
          width={130}
          height={40}
          className="object-contain"
          style={{ maxHeight: 40 }}
          priority
        />
        {tenant && (
          <p className="text-[11px] text-bella-gray mt-1.5 truncate">{tenant.name}</p>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'text-bella-gold font-medium'
                  : 'text-bella-gray hover:text-bella-white'
              )}
              style={active
                ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)' }
                : { border: '1px solid transparent' }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {profile.role === 'master' && (
          <Link
            href="/master"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
              pathname.startsWith('/master')
                ? 'text-bella-gold font-medium'
                : 'text-bella-gray hover:text-bella-white'
            )}
            style={pathname.startsWith('/master')
              ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)' }
              : { border: '1px solid transparent' }
            }
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Painel Master
          </Link>
        )}
      </nav>

      {/* Cota */}
      {tenant && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between text-xs text-bella-gray mb-2">
            <span>Imagens este mês</span>
            <span className="font-medium text-bella-white">
              {tenant.quota_used}/{tenant.quota_limit}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${quotaPercent}%`,
                background: quotaPercent >= 90
                  ? '#f87171'
                  : quotaPercent >= 70
                    ? '#fbbf24'
                    : 'linear-gradient(90deg, #c9a96e, #dfc9a0)',
              }}
            />
          </div>
          <div className="mt-2">
            <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide', PLAN_COLORS[tenant.plan])}>
              {PLAN_LABELS[tenant.plan]}
            </span>
          </div>
        </div>
      )}

      {/* User + Logout */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-bella-gold"
            style={{ background: 'rgba(201,169,110,0.12)' }}
          >
            {(profile.full_name ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-bella-white truncate">
              {profile.full_name ?? 'Usuário'}
            </p>
            <p className="text-[10px] text-bella-gray capitalize">{profile.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-bella-gray hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
