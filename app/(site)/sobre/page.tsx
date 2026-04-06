import { Sparkles, ImageIcon, Zap, Users } from 'lucide-react'

export const metadata = { title: 'Sobre Nós — Bella Imagem' }

export default function SobrePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-display font-bold tracking-tight text-bella-white mb-4">
          Transformando o jeito de fazer moda
        </h1>
        <p className="text-bella-gray text-lg max-w-2xl mx-auto leading-relaxed">
          A Bella Imagem nasceu para democratizar o acesso a fotos profissionais de moda — sem estúdio, sem modelo, sem espera.
        </p>
      </div>

      {/* Missão */}
      <div
        className="rounded-2xl p-8 mb-12 text-center"
        style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}
      >
        <p className="text-bella-gold text-xs font-semibold tracking-widest uppercase mb-3">Nossa missão</p>
        <p className="text-bella-white text-xl font-display font-medium leading-relaxed">
          "Dar a cada marca de moda — grande ou pequena — o poder de criar imagens profissionais com IA, de qualquer lugar, em segundos."
        </p>
      </div>

      {/* História */}
      <div className="mb-16">
        <h2 className="text-2xl font-display font-bold text-bella-white mb-6">Como tudo começou</h2>
        <div className="space-y-4 text-bella-gray leading-relaxed">
          <p>
            A Bella Imagem surgiu de uma percepção simples: pequenas e médias marcas de moda gastam tempo e dinheiro enormes em sessões fotográficas, muitas vezes resultando em imagens que não chegam ao padrão desejado ou que demoram semanas para ficarem prontas.
          </p>
          <p>
            Com a evolução dos modelos de inteligência artificial para geração de imagens, identificamos uma oportunidade de construir uma solução especializada para o setor de moda — que fosse ao mesmo tempo simples de usar, rápida e capaz de gerar resultados de nível profissional.
          </p>
          <p>
            Hoje, a Bella Imagem é desenvolvida pela <strong className="text-bella-white">Usina do Tempo</strong> (CNPJ 59.267.749/0001-42), com sede em Fortaleza, Ceará. Nossa equipe combina experiência em desenvolvimento de software, inteligência artificial e design para criar uma plataforma que realmente transforma o fluxo de trabalho de marcas de moda.
          </p>
        </div>
      </div>

      {/* Diferenciais */}
      <div className="mb-16">
        <h2 className="text-2xl font-display font-bold text-bella-white mb-8">Por que a Bella Imagem?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              icon: Zap,
              title: 'Resultados em segundos',
              desc: 'Envie a foto da peça, configure o modelo virtual e receba imagens profissionais em menos de 1 minuto.',
            },
            {
              icon: ImageIcon,
              title: 'Qualidade profissional',
              desc: 'Imagens em alta resolução com iluminação, composição e realismo que substituem sessões fotográficas tradicionais.',
            },
            {
              icon: Sparkles,
              title: 'IA especializada em moda',
              desc: 'Nosso sistema é calibrado para o universo fashion — entende tipos de peças, tamanhos, biotipos e estilos.',
            },
            {
              icon: Users,
              title: 'Feito para equipes',
              desc: 'Múltiplos usuários por empresa, cotas de imagem mensais, relatórios de uso e integração direta com o Instagram.',
            },
          ].map(item => (
            <div
              key={item.title}
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <item.icon className="w-5 h-5 mb-3" style={{ color: '#c9a96e' }} />
              <p className="font-semibold text-bella-white mb-2">{item.title}</p>
              <p className="text-bella-gray text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empresa */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-lg font-semibold text-bella-white mb-4">Informações da empresa</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Empresa', value: 'Usina do Tempo' },
            { label: 'CNPJ', value: '59.267.749/0001-42' },
            { label: 'Cidade', value: 'Fortaleza, Ceará — Brasil' },
            { label: 'E-mail', value: 'suporte@usinadotempo.com.br' },
            { label: 'Telefone', value: '+55 85 99739-5183' },
            { label: 'Plataforma', value: 'bellaimagem.ia.br' },
          ].map(item => (
            <div key={item.label}>
              <dt className="text-bella-gray text-[11px] uppercase tracking-wide">{item.label}</dt>
              <dd className="text-bella-white mt-0.5">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
