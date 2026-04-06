export const metadata = { title: 'LGPD — Bella Imagem' }

export default function LgpdPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-2">LGPD</h1>
      <p className="text-sm text-bella-gray mb-2">Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018</p>
      <p className="text-sm text-bella-gray mb-10">Última atualização: abril de 2026</p>

      <div className="space-y-8 text-bella-gray leading-relaxed text-sm">

        <section className="p-5 rounded-2xl" style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.2)' }}>
          <p className="text-bella-white font-medium mb-2">Nosso compromisso com a LGPD</p>
          <p>A Usina do Tempo (CNPJ 59.267.749/0001-42), operadora da Bella Imagem, está comprometida com o cumprimento integral da Lei Geral de Proteção de Dados Pessoais (LGPD). Esta página resume como aplicamos a lei em nossa plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Papel da Usina do Tempo</h2>
          <p>A Usina do Tempo atua como <strong className="text-bella-white">Controladora</strong> dos dados pessoais coletados na plataforma Bella Imagem, sendo responsável pelas decisões sobre o tratamento de dados. Alguns parceiros (Asaas, Supabase, Google) atuam como <strong className="text-bella-white">Operadores</strong>, processando dados em nosso nome e sob nossas instruções.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Encarregado de Dados (DPO)</h2>
          <p>O Encarregado pelo Tratamento de Dados Pessoais pode ser contactado pelo e-mail:</p>
          <p className="mt-2"><a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Seus Direitos como Titular</h2>
          <p>Conforme o art. 18 da LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { right: 'Confirmação', desc: 'Confirmar se tratamos seus dados' },
              { right: 'Acesso', desc: 'Acessar os dados que temos sobre você' },
              { right: 'Correção', desc: 'Corrigir dados incompletos ou incorretos' },
              { right: 'Anonimização', desc: 'Solicitar anonimização de dados desnecessários' },
              { right: 'Portabilidade', desc: 'Receber seus dados em formato estruturado' },
              { right: 'Eliminação', desc: 'Solicitar exclusão de dados pessoais' },
              { right: 'Informação', desc: 'Saber com quem compartilhamos seus dados' },
              { right: 'Revogação', desc: 'Revogar consentimentos concedidos' },
            ].map(item => (
              <div key={item.right} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-bella-white font-semibold text-sm">{item.right}</p>
                <p className="text-[12px] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Como Exercer seus Direitos</h2>
          <p>Envie sua solicitação para <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a> informando:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Nome completo e e-mail cadastrado na plataforma;</li>
            <li>Direito que deseja exercer;</li>
            <li>Descrição do pedido.</li>
          </ul>
          <p className="mt-3">Responderemos em até <strong className="text-bella-white">15 dias úteis</strong>, conforme prazo legal.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Bases Legais Utilizadas</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-bella-white">Art. 7º, II — Obrigação legal:</strong> para cumprimento de obrigações tributárias e regulatórias;</li>
            <li><strong className="text-bella-white">Art. 7º, V — Execução de contrato:</strong> para prestação dos serviços contratados;</li>
            <li><strong className="text-bella-white">Art. 7º, IX — Legítimo interesse:</strong> para segurança, prevenção a fraudes e melhoria do serviço, respeitando os direitos e expectativas dos titulares.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Transferência Internacional de Dados</h2>
          <p>Alguns de nossos parceiros (Google, Supabase) podem processar dados fora do Brasil. Garantimos que essas transferências ocorrem apenas para países com nível de proteção adequado ou mediante cláusulas contratuais aprovadas pela ANPD, conforme art. 33 da LGPD.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Incidentes de Segurança</h2>
          <p>Em caso de incidente de segurança com potencial risco ou dano aos titulares, comunicaremos a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados no prazo de 72 horas após a ciência do incidente, conforme art. 48 da LGPD.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">Autoridade Nacional de Proteção de Dados</h2>
          <p>Caso suas solicitações não sejam atendidas satisfatoriamente, você pode apresentar reclamação à ANPD pelo portal: <a href="https://www.gov.br/anpd" className="text-bella-gold hover:underline" target="_blank" rel="noopener noreferrer">gov.br/anpd</a></p>
        </section>

      </div>
    </div>
  )
}
