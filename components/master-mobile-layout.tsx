'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, BookOpen, Building2, Home, Menu, ShieldCheck, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/master',            label: 'Visão geral', icon: Home },
  { href: '/master/tenants',    label: 'Empresas',    icon: Building2 },
  { href: '/master/relatorios', label: 'Relatórios',  icon: BarChart2 },
  { href: '/master/affiliates',  label: 'Afiliados',   icon: Users },
  { href: '/master/blog',        label: 'Blog',         icon: BookOpen },
]

export function MasterMobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--main-bg)' } as React.CSSProperties}>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col h-screen overflow-y-auto',
          'fixed inset-y-0 left-0 z-50 w-72',
          'transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:inset-auto md:z-auto md:w-56 md:translate-x-0 md:min-h-screen md:h-auto md:overflow-visible'
        )}
        style={{ background: '#1a1a1a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Close button — mobile only */}
        <button
          className="md:hidden absolute top-4 right-4 text-bella-gray hover:text-bella-white transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-bella-gold flex-shrink-0" />
            <span className="font-display font-semibold text-sm text-bella-white tracking-tight">
              Painel Master
            </span>
          </div>
          <p className="text-[10px] text-bella-gray mt-0.5 ml-[26px]">Bella Imagem</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/master' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                  active ? 'font-medium' : 'hover:bg-white/5'
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
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" className="text-[11px] text-bella-gray hover:text-bella-gold transition-colors">
            Voltar ao dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--main-bg)' }}>
        {/* Mobile header */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-bella-gray hover:text-bella-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-bella-gold" />
            <span className="text-sm font-medium" style={{ color: '#fefefe' }}>Painel Master</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto" style={{ background: 'var(--main-bg)' }}>{children}</main>
      </div>
    </div>
  )
}
