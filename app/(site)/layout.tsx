import NextImage from 'next/image'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/planos', label: 'Planos' },
  { href: '/blog',   label: 'Blog' },
  { href: '/sobre',  label: 'Sobre' },
  { href: '/contato',label: 'Contato' },
]

const FOOTER_LINKS = {
  Produto: [
    { href: '/planos',          label: 'Planos e preços' },
    { href: '/register',        label: 'Criar conta' },
    { href: '/login',           label: 'Entrar' },
    { href: '/afiliado/registro', label: 'Programa de afiliados' },
  ],
  Empresa: [
    { href: '/sobre',     label: 'Sobre nós' },
    { href: '/blog',      label: 'Blog' },
    { href: '/carreiras', label: 'Carreiras' },
    { href: '/contato',   label: 'Contato' },
  ],
  Legal: [
    { href: '/termos',     label: 'Termos de Uso' },
    { href: '/privacidade',label: 'Política de Privacidade' },
    { href: '/cookies',    label: 'Política de Cookies' },
    { href: '/lgpd',       label: 'LGPD' },
  ],
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#0a0a0a',
        '--main-text': '#fefefe',
        '--main-text-sub': '#6b6b6b',
        '--main-text-muted': '#b0b0b0',
      } as React.CSSProperties}
    >
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <NextImage src="/logo.png" alt="Bella Imagem" width={130} height={40} className="object-contain" />
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-bella-gray hover:text-bella-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/register"
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ background: '#c9a96e', color: '#0a0a0a' }}
          >
            Começar grátis
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <NextImage src="/logo.png" alt="Bella Imagem" width={120} height={36} className="object-contain mb-3" />
              <p className="text-xs text-bella-gray leading-relaxed">
                Geração de imagens profissionais de moda com inteligência artificial.
              </p>
            </div>
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div key={group}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-bella-gray mb-3">{group}</p>
                <ul className="space-y-2">
                  {links.map(l => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-xs text-bella-gray hover:text-bella-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <p className="text-[11px] text-bella-gray">
              © {new Date().getFullYear()} Bella Imagem · Usina do Tempo · CNPJ 59.267.749/0001-42
            </p>
            <p className="text-[11px] text-bella-gray">
              <a href="mailto:contato@bellaimagem.com.br" className="hover:text-bella-white transition-colors">
                contato@bellaimagem.com.br
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
