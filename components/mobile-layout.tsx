'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import type { Profile, Tenant } from '@/lib/types'

export function MobileLayout({
  children,
  profile,
  tenant,
}: {
  children: React.ReactNode
  profile: Profile
  tenant: Tenant | null
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--main-bg)', '--main-text': '#fefefe', '--main-text-sub': '#6b6b6b', '--main-text-muted': '#b0b0b0' } as React.CSSProperties}>
      <Sidebar
        profile={profile}
        tenant={tenant}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar — hidden on md+ */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0 sidebar-dark"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-bella-gray hover:text-bella-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image
            src="/logo.png"
            alt="Bella Imagem"
            width={100}
            height={30}
            className="object-contain"
            style={{ maxHeight: 30 }}
            priority
          />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
