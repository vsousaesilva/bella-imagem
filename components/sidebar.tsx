'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile, Tenant } from '@/lib/types'
import { PLAN_COLORS, PLAN_LABELS } from '@/lib/types'
import { ThemeLogo } from '@/components/theme-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ImageIcon,
  LayoutGrid,
  Settings,
  LogOut,
  ShieldCheck,
  Sparkles,
  X,
  BarChart3,
} from 'lucide-react'

interface SidebarProps {
  profile: Profile
  tenant: Tenant | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'Painel',          icon: LayoutGrid },
  { href: '/gerar',          label: 'Gerar Imagem',    icon: Sparkles },
  { href: '/galeria',        label: 'Galeria',          icon: ImageIcon },
  { href: '/configuracoes',  label: 'Configurações',    icon: Settings },
]

export function Sidebar({ profile, tenant, mobileOpen = false, onMobileClose }: SidebarProps) {
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
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={onMobileClose}
        />
      )}

      <aside className={cn(
        'sidebar-dark flex-shrink-0 flex flex-col h-screen overflow-y-auto relative',
        'fixed inset-y-0 left-0 z-50 w-72',
        'transform transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:inset-auto md:z-auto md:w-60 md:translate-x-0 md:min-h-screen md:h-auto md:overflow-visible'
      )}>

        {/* Header: logo + theme toggle + close */}
        <div
          className="flex items-start justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex-1 min-w-0">
            <ThemeLogo width={120} height={36} priority />
            {tenant && (
              <p className="text-[11px] text-[#6b6b6b] mt-1.5 truncate">{tenant.name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2 mt-0.5">
            <ThemeToggle />
            <button
              className="md:hidden text-[#6b6b6b] hover:text-[#fefefe] transition-colors"
              onClick={onMobileClose}
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                  active
                    ? 'font-medium'
                    : 'hover:bg-white/5'
                )}
                style={active
                  ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)', color: '#c9a96e' }
                  : { border: '1px solid transparent', color: '#8a8a8a' }
                }
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#fefefe' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#8a8a8a' }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}

          {tenant?.plan === 'business' && (
            <Link
              href="/relatorios"
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                pathname === '/relatorios' ? 'font-medium' : 'hover:bg-white/5'
              )}
              style={pathname === '/relatorios'
                ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)', color: '#c9a96e' }
                : { border: '1px solid transparent', color: '#8a8a8a' }
              }
              onMouseEnter={(e) => { if (pathname !== '/relatorios') e.currentTarget.style.color = '#fefefe' }}
              onMouseLeave={(e) => { if (pathname !== '/relatorios') e.currentTarget.style.color = '#8a8a8a' }}
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              Relatórios
            </Link>
          )}

          {profile.role === 'master' && (
            <Link
              href="/master"
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                pathname.startsWith('/master') ? 'font-medium' : 'hover:bg-white/5'
              )}
              style={pathname.startsWith('/master')
                ? { background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.15)', color: '#c9a96e' }
                : { border: '1px solid transparent', color: '#8a8a8a' }
              }
              onMouseEnter={(e) => { if (!pathname.startsWith('/master')) e.currentTarget.style.color = '#fefefe' }}
              onMouseLeave={(e) => { if (!pathname.startsWith('/master')) e.currentTarget.style.color = '#8a8a8a' }}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Painel Master
            </Link>
          )}
        </nav>

        {/* Cota */}
        {tenant && (
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#6b6b6b' }}>
              <span>Imagens este mês</span>
              <span className="font-medium" style={{ color: '#fefefe' }}>
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
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
              style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}
            >
              {(profile.full_name ?? 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#fefefe' }}>
                {profile.full_name ?? 'Usuário'}
              </p>
              <p className="text-[10px] capitalize" style={{ color: '#6b6b6b' }}>{profile.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="transition-colors"
              style={{ color: '#6b6b6b' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6b6b')}
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
