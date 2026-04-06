import { Mail } from 'lucide-react'

export const metadata = { title: 'Carreiras — Bella Imagem' }

export default function CarreirasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-4">Carreiras</h1>
      <p className="text-bella-gray mb-12 leading-relaxed">
        Fazemos parte da <strong className="text-bella-white">Usina do Tempo</strong>, uma empresa de tecnologia sediada em Fortaleza, Ceará. Acreditamos que as melhores soluções surgem de pessoas curiosas, autônomas e apaixonadas pelo que fazem.
      </p>

      {/* Cultura */}
      <div
        className="rounded-2xl p-6 mb-10"
        style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}
      >
        <p className="text-bella-gold text-xs font-semibold tracking-widest uppercase mb-3">Nossa cultura</p>
        <div className="space-y-2 text-bella-gray text-sm leading-relaxed">
          <p>— Trabalho remoto por padrão</p>
          <p>— Autonomia e responsabilidade como pilares</p>
          <p>— Foco em impacto real, não em horas trabalhadas</p>
          <p>— Aprendizado contínuo e espaço para experimentar</p>
          <p>— Time pequeno, missão grande</p>
        </div>
      </div>

      {/* Vagas */}
      <div className="mb-12">
        <h2 className="text-xl font-display font-semibold text-bella-white mb-6">Vagas abertas</h2>
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-bella-white font-medium mb-2">Nenhuma vaga no momento</p>
          <p className="text-bella-gray text-sm mb-6">
            Não temos vagas abertas agora, mas adoramos receber candidaturas espontâneas de pessoas talentosas.
          </p>
          <a
            href="mailto:suporte@usinadotempo.com.br?subject=Candidatura espontânea"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            style={{ background: '#c9a96e', color: '#0a0a0a' }}
          >
            <Mail className="w-4 h-4" />
            Enviar candidatura espontânea
          </a>
        </div>
      </div>

      {/* O que buscamos */}
      <div>
        <h2 className="text-xl font-display font-semibold text-bella-white mb-6">O que valorizamos em candidatos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Engenharia de Software', desc: 'Next.js, TypeScript, Supabase, APIs de IA, arquitetura de SaaS' },
            { title: 'Produto & Design', desc: 'UI/UX com foco em simplicidade, acessibilidade e conversão' },
            { title: 'IA & Machine Learning', desc: 'Prompting, fine-tuning, integração com APIs de geração de imagens' },
            { title: 'Crescimento & Marketing', desc: 'SEO, performance de anúncios, email marketing, afiliados' },
          ].map(item => (
            <div
              key={item.title}
              className="p-5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="font-semibold text-bella-white text-sm mb-1">{item.title}</p>
              <p className="text-bella-gray text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
