'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const INFO = [
  {
    icon: Mail,
    title: 'E-mail',
    value: 'suporte@usinadotempo.com.br',
    href: 'mailto:suporte@usinadotempo.com.br',
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
]

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fefefe',
  borderRadius: '0.75rem',
  padding: '0.625rem 0.875rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function ContatoPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)

    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erro ao enviar. Tente novamente.')
      setSending(false)
      return
    }

    setSuccess(true)
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
    setSending(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-4">Contato</h1>
      <p className="text-bella-gray mb-12">
        Estamos aqui para ajudar. Escolha o canal mais conveniente para você.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {INFO.map(item => (
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

        {success ? (
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-xl"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
          >
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium text-sm">Mensagem enviada!</p>
              <p className="text-green-400/70 text-xs mt-1">Recebemos sua mensagem e responderemos em breve pelo e-mail informado.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Assunto</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                placeholder="Como podemos ajudar?"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="block text-xs text-bella-gray-light tracking-wide uppercase mb-2">Mensagem</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Descreva sua dúvida ou solicitação..."
                style={{ ...INPUT_STYLE, resize: 'none' }}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-sm text-red-400 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto px-8">
              {sending ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </form>
        )}

        <p className="text-[11px] text-bella-gray mt-4">
          Ou envie diretamente para{' '}
          <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">
            suporte@usinadotempo.com.br
          </a>
        </p>
      </div>
    </div>
  )
}
