export const metadata = { title: 'Termos de Uso — Bella Imagem' }

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-display font-bold tracking-tight text-bella-white mb-2">Termos de Uso</h1>
      <p className="text-sm text-bella-gray mb-10">Última atualização: abril de 2026</p>

      <div className="prose-bella space-y-8 text-bella-gray leading-relaxed text-sm">

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">1. Aceitação dos Termos</h2>
          <p>Ao acessar ou utilizar a plataforma Bella Imagem, operada pela <strong className="text-bella-white">Usina do Tempo</strong> (CNPJ 59.267.749/0001-42), você declara ter lido, compreendido e concordado com estes Termos de Uso em sua integralidade. Caso não concorde, por favor, interrompa imediatamente o uso da plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">2. Descrição do Serviço</h2>
          <p>A Bella Imagem é uma plataforma de geração de imagens de moda com inteligência artificial (IA). O serviço permite que empresas do setor de moda criem fotos profissionais de produtos com modelos virtuais, sem a necessidade de sessões fotográficas físicas. As imagens são geradas por modelos de IA de terceiros (Google Gemini) conforme configurações definidas pelo usuário.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">3. Elegibilidade</h2>
          <p>O uso da plataforma é destinado exclusivamente a pessoas jurídicas ou profissionais maiores de 18 anos. Ao se cadastrar, você garante que possui capacidade legal para contratar e que as informações fornecidas são verdadeiras, completas e atualizadas.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">4. Cadastro e Conta</h2>
          <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente caso suspeite de uso não autorizado da sua conta pelo e-mail <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">5. Planos e Pagamentos</h2>
          <p>A plataforma oferece planos pagos com diferentes cotas de geração de imagens mensais. Os pagamentos são processados via Asaas e podem ser realizados por PIX, boleto bancário ou cartão de crédito. Os valores são cobrados no início de cada ciclo mensal de assinatura. Não há reembolso parcial por imagens não utilizadas dentro do ciclo vigente.</p>
          <p className="mt-3">O cancelamento pode ser solicitado a qualquer momento pelo próprio painel ou via contato com o suporte, com efeito ao final do período pago em curso.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">6. Uso Permitido</h2>
          <p>Você pode utilizar as imagens geradas para fins comerciais legítimos relacionados ao seu negócio, incluindo publicações em redes sociais, e-commerce, materiais de marketing e afins. É vedado:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Gerar imagens que violem direitos de terceiros, incluindo direitos autorais e de imagem;</li>
            <li>Criar conteúdo ilegal, ofensivo, discriminatório, pornográfico ou que promova violência;</li>
            <li>Tentar burlar os limites de cota ou manipular o sistema de cobrança;</li>
            <li>Revender ou sublicenciar o acesso à plataforma a terceiros sem autorização expressa;</li>
            <li>Realizar engenharia reversa ou tentativas de acesso não autorizado à infraestrutura.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">7. Propriedade Intelectual das Imagens</h2>
          <p>As imagens geradas pela plataforma a partir dos insumos fornecidos pelo usuário (fotos de produtos, configurações) são cedidas ao usuário para uso não exclusivo dentro dos limites legais aplicáveis à geração por IA. A Usina do Tempo não reivindica direitos de propriedade sobre as imagens geradas em sua conta, exceto para fins de melhoria do serviço, conforme a Política de Privacidade.</p>
          <p className="mt-3">O usuário é o único responsável por garantir que o conteúdo fornecido como insumo (fotos de produtos, etc.) não viola direitos de terceiros.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">8. Limitação de Responsabilidade</h2>
          <p>A plataforma é fornecida "no estado em que se encontra". A Usina do Tempo não garante que o serviço será ininterrupto, isento de erros ou que os resultados gerados por IA atenderão integralmente às expectativas do usuário. Em nenhuma hipótese a responsabilidade total da empresa excederá o valor pago pelo usuário nos últimos 3 (três) meses de assinatura.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">9. Modificações dos Termos</h2>
          <p>Reservamo-nos o direito de alterar estes Termos a qualquer momento. As alterações serão comunicadas por e-mail e/ou notificação na plataforma com antecedência mínima de 30 dias para mudanças materiais. O uso continuado da plataforma após a vigência das alterações implica aceitação dos novos termos.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">10. Lei Aplicável e Foro</h2>
          <p>Estes Termos são regidos pelas leis brasileiras, especialmente o Código de Defesa do Consumidor (Lei 8.078/1990), o Marco Civil da Internet (Lei 12.965/2014) e a LGPD (Lei 13.709/2018). Fica eleito o foro da comarca de Fortaleza/CE para dirimir quaisquer controvérsias.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-bella-white mb-3">11. Contato</h2>
          <p>Para dúvidas sobre estes Termos, entre em contato:<br />
            <a href="mailto:suporte@usinadotempo.com.br" className="text-bella-gold hover:underline">suporte@usinadotempo.com.br</a><br />
            +55 85 99739-5183
          </p>
        </section>

      </div>
    </div>
  )
}
