export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BarChart2, Building2, Home, ShieldCheck } from 'lucide-react'

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'master') redirect('/dashboard')

  const NAV = [
    { href: '/master',            label: 'Visão geral', icon: Home },
    { href: '/master/tenants',    label: 'Empresas',    icon: Building2 },
    { href: '/master/relatorios', label: 'Relatórios',  icon: BarChart2 },
  ]

  return (
    <div className="flex min-h-screen bg-bella-black">
      <aside
        className="w-56 flex-shrink-0 flex flex-col min-h-screen"
        style={{ background: '#1a1a1a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
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
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-bella-gray hover:text-bella-white transition-colors duration-200"
              style={{ border: '1px solid transparent' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" className="text-[11px] text-bella-gray hover:text-bella-gold transition-colors">
            Voltar ao dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
