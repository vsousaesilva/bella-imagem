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

  return (
    <div className="flex min-h-screen bg-bella-cream">
      {/* Sidebar master */}
      <aside className="w-56 bg-bella-charcoal text-white flex-shrink-0 flex flex-col min-h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-bella-rose-light" />
            <span className="font-bold text-sm tracking-tight">Painel Master</span>
          </div>
          <p className="text-xs text-white/40 mt-0.5 ml-7">Bella Imagem</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { href: '/master', label: 'Visão geral', icon: Home },
            { href: '/master/tenants', label: 'Empresas', icon: Building2 },
            { href: '/master/relatorios', label: 'Relatórios', icon: BarChart2 },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white transition">
            Voltar ao dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
