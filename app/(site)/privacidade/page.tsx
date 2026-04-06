export const metadata = { title: 'Política de Privacidade — Bella Imagem' }

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-2">Política de Privacidade</h1>
      <p className="text-sm text-bella-gray mb-10">Última atualização: abril de 2026</p>

      <div className="space-y-8 text-bella-gray leading-relaxed text-sm">

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">1. Controlador dos Dados</h2>
          <p>A <strong className="text-bella-white">Usina do Tempo</strong> (CNPJ 59.267.749/0001-42), operadora da plataforma Bella Imagem (bellaimagem.ia.br), é a controladora dos dados pessoais coletados neste serviço, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).</p>
          <p className="mt-2">Encarregado de Dados (DPO): <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">2. Dados Coletados</h2>
          <p>Coletamos os seguintes dados:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-bella-white">Dados de cadastro:</strong> nome completo, e-mail, CPF/CNPJ, telefone;</li>
            <li><strong className="text-bella-white">Dados de pagamento:</strong> processados pela Asaas; não armazenamos dados de cartão;</li>
            <li><strong className="text-bella-white">Imagens de produtos:</strong> enviadas pelo usuário para geração das fotos;</li>
            <li><strong className="text-bella-white">Imagens geradas:</strong> resultados produzidos pela IA e selecionados pelo usuário;</li>
            <li><strong className="text-bella-white">Dados de uso:</strong> logs de acesso, tempo de geração, ações realizadas na plataforma;</li>
            <li><strong className="text-bella-white">Dados de dispositivo:</strong> tipo de navegador, sistema operacional, endereço IP.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">3. Finalidade do Tratamento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Prestação dos serviços contratados (geração de imagens, legendas, integração com Instagram);</li>
            <li>Gestão de conta, autenticação e segurança;</li>
            <li>Processamento de pagamentos e emissão de cobranças;</li>
            <li>Comunicações transacionais (confirmações, alertas de cota, suporte);</li>
            <li>Melhoria contínua dos modelos e da plataforma (dados anonimizados);</li>
            <li>Cumprimento de obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">4. Base Legal</h2>
          <p>O tratamento dos dados é fundamentado nas seguintes bases legais da LGPD:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-bella-white">Execução de contrato</strong> (art. 7º, V): para prestar os serviços contratados;</li>
            <li><strong className="text-bella-white">Legítimo interesse</strong> (art. 7º, IX): para segurança, prevenção a fraudes e melhoria do serviço;</li>
            <li><strong className="text-bella-white">Obrigação legal</strong> (art. 7º, II): para cumprimento de normas tributárias e regulatórias.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">5. Compartilhamento de Dados</h2>
          <p>Seus dados podem ser compartilhados com:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-bella-white">Asaas:</strong> processamento de pagamentos;</li>
            <li><strong className="text-bella-white">Google (Gemini API):</strong> geração de imagens (as imagens são enviadas para processamento e não são retidas pelo Google para treinamento sem consentimento);</li>
            <li><strong className="text-bella-white">Supabase:</strong> armazenamento de dados e autenticação;</li>
            <li><strong className="text-bella-white">Resend:</strong> envio de e-mails transacionais;</li>
            <li><strong className="text-bella-white">Autoridades:</strong> quando exigido por lei ou ordem judicial.</li>
          </ul>
          <p className="mt-3">Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins de marketing sem seu consentimento expresso.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">6. Retenção de Dados</h2>
          <p>Os dados são retidos pelo período necessário para cumprir as finalidades descritas ou pelo prazo exigido pela legislação aplicável (mínimo de 5 anos para dados fiscais). Após o cancelamento da conta, os dados são anonimizados ou excluídos em até 90 dias, salvo obrigação legal de retenção.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">7. Seus Direitos</h2>
          <p>Nos termos da LGPD, você tem direito a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Confirmar a existência de tratamento e acessar seus dados;</li>
            <li>Solicitar correção de dados incompletos ou desatualizados;</li>
            <li>Solicitar a exclusão de dados desnecessários;</li>
            <li>Obter portabilidade dos dados;</li>
            <li>Revogar consentimentos previamente concedidos.</li>
          </ul>
          <p className="mt-3">Para exercer seus direitos, envie solicitação para <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a>. Responderemos em até 15 dias úteis.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">8. Segurança</h2>
          <p>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo criptografia em trânsito (TLS), controle de acesso baseado em funções (RLS), autenticação segura e monitoramento contínuo. Em caso de incidente de segurança que afete seus dados, notificaremos a ANPD e os titulares nos prazos legais.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">9. Contato</h2>
          <p>Dúvidas sobre privacidade:<br />
            <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a><br />
            +55 85 99739-5183
          </p>
        </section>

      </div>
    </div>
  )
}
