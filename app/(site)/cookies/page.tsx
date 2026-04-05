export const metadata = { title: 'Política de Cookies — Bella Imagem' }

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-2">Política de Cookies</h1>
      <p className="text-sm text-bella-gray mb-10">Última atualização: abril de 2026</p>

      <div className="space-y-8 text-bella-gray leading-relaxed text-sm">

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">1. O que são Cookies?</h2>
          <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um site. Eles permitem que a plataforma lembre suas preferências, mantenha sua sessão ativa e colete informações sobre como você utiliza o serviço.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">2. Cookies que Utilizamos</h2>

          <div className="mt-3 space-y-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-semibold text-bella-white mb-1">Cookies Essenciais</p>
              <p>Necessários para o funcionamento básico da plataforma. Incluem os tokens de autenticação do Supabase que mantêm sua sessão ativa. Não podem ser desativados.</p>
              <p className="mt-1 text-[11px]">Exemplos: <code className="text-bella-gold">sb-access-token</code>, <code className="text-bella-gold">sb-refresh-token</code></p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-semibold text-bella-white mb-1">Cookies de Preferência</p>
              <p>Armazenam suas preferências de uso, como o tema (claro/escuro) selecionado na plataforma.</p>
              <p className="mt-1 text-[11px]">Exemplos: <code className="text-bella-gold">theme</code></p>
            </div>

            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-semibold text-bella-white mb-1">Cookies de Desempenho</p>
              <p>Coletam informações anônimas sobre como os usuários interagem com a plataforma para ajudar a identificar erros e melhorar o desempenho. Não identificam usuários individualmente.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">3. Cookies de Terceiros</h2>
          <p>Alguns serviços integrados à plataforma podem definir seus próprios cookies:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-bella-white">Asaas:</strong> para rastreamento de pagamentos no ambiente de checkout;</li>
            <li><strong className="text-bella-white">Supabase:</strong> para gerenciamento de sessão e autenticação.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">4. Prazo de Validade</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-bella-white">Sessão:</strong> expiram ao fechar o navegador;</li>
            <li><strong className="text-bella-white">Persistentes:</strong> permanecem por até 1 ano ou até serem excluídos manualmente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">5. Gerenciar Cookies</h2>
          <p>Você pode controlar e excluir cookies nas configurações do seu navegador. Note que desativar cookies essenciais impedirá o funcionamento correto da plataforma (ex: manutenção da sessão logada).</p>
          <p className="mt-2">Guias por navegador: <a href="https://support.google.com/chrome/answer/95647" className="text-bella-gold hover:underline" target="_blank" rel="noopener noreferrer">Chrome</a> · <a href="https://support.mozilla.org/pt-BR/kb/cookies-informacoes-sites-guardam" className="text-bella-gold hover:underline" target="_blank" rel="noopener noreferrer">Firefox</a> · <a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" className="text-bella-gold hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">6. Contato</h2>
          <p>Dúvidas sobre esta política: <a href="mailto:contato@bellaimagem.com.br" className="text-bella-gold hover:underline">contato@bellaimagem.com.br</a></p>
        </section>

      </div>
    </div>
  )
}
