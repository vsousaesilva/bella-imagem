import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export const metadata = { title: 'Contato — Bella Imagem' }

export default function ContatoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-4">Contato</h1>
      <p className="text-bella-gray mb-12">
        Estamos aqui para ajudar. Escolha o canal mais conveniente para você.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {[
          {
            icon: Mail,
            title: 'E-mail',
            value: 'contato@bellaimagem.com.br',
            href: 'mailto:contato@bellaimagem.com.br',
            desc: 'Respondemos em até 1 dia útil',
          },
          {
            icon: Phone,
            title: 'WhatsApp / Telefone',
            value: '+55 85 99739-5183',
            href: 'https://wa.me/5585997395183',
            desc: 'Atendimento via WhatsApp',
          },
          {
            icon: MapPin,
            title: 'Empresa',
            value: 'Usina do Tempo · CNPJ 59.267.749/0001-42',
            href: undefined,
            desc: 'Fortaleza, Ceará — Brasil',
          },
          {
            icon: Clock,
            title: 'Horário de atendimento',
            value: 'Segunda a sexta, 9h às 18h',
            href: undefined,
            desc: 'Horário de Brasília (UTC-3)',
          },
        ].map(item => (
          <div
            key={item.title}
            className="p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <item.icon className="w-5 h-5 mb-3" style={{ color: '#c9a96e' }} />
            <p className="text-[11px] uppercase tracking-widest text-bella-gray mb-1">{item.title}</p>
            {item.href ? (
              <a href={item.href} className="font-medium text-bella-white hover:text-bella-gold transition-colors text-sm">
                {item.value}
              </a>
            ) : (
              <p className="font-medium text-bella-white text-sm">{item.value}</p>
            )}
            <p className="text-xs text-bella-gray mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Formulário de contato */}
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-lg font-display font-semibold text-bella-white mb-6">Enviar mensagem</h2>
        <form
          action={`mailto:contato@bellaimagem.com.br`}
          method="get"
          encType="text/plain"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Nome</label>
              <input name="name" type="text" required className="input-field" placeholder="Seu nome" />
            </div>
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">E-mail</label>
              <input name="email" type="email" required className="input-field" placeholder="seu@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Assunto</label>
            <input name="subject" type="text" required className="input-field" placeholder="Como podemos ajudar?" />
          </div>
          <div>
            <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Mensagem</label>
            <textarea name="body" rows={5} required className="input-field resize-none" placeholder="Descreva sua dúvida ou solicitação..." />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto px-8">
            Enviar mensagem
          </button>
        </form>
        <p className="text-[11px] text-bella-gray mt-4">
          Ou envie diretamente para <a href="mailto:contato@bellaimagem.com.br" className="text-bella-gold hover:underline">contato@bellaimagem.com.br</a>
        </p>
      </div>
    </div>
  )
}
