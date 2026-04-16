# 06 — Checklist de Publicação

> Conferir **todos** os itens antes de clicar em "Publicar" no Gerenciador de Anúncios.
> Responsável: _______________________ Data: ___________

---

## 1. Conta e permissões

- [ ] Acesso ao **Business Manager** correto (não a conta pessoal)
- [ ] Conta de anúncios com **forma de pagamento válida** e saldo/limite suficiente
- [ ] Página do Facebook e Instagram conectados corretamente
- [ ] Permissões do usuário openclaw: pelo menos **Anunciante** na conta

## 2. Pixel e CAPI

- [ ] Pixel ID [__________] instalado em **todas** as páginas relevantes (home, LP, checkout, obrigado)
- [ ] Eventos disparando no **Event Manager** nos últimos 7 dias:
  - [ ] PageView
  - [ ] ViewContent
  - [ ] Lead / InitiateCheckout / Purchase (conforme objetivo)
- [ ] **CAPI (Conversions API)** ativa — Event Match Quality ≥ 6/10
- [ ] Deduplicação configurada (mesmo `event_id` pixel + CAPI)
- [ ] Evento de otimização marcado como **prioritário** no AEM (iOS)

## 3. Domínio e configurações

- [ ] Domínio da LP **verificado** no Business Manager
- [ ] Até 8 eventos de conversão configurados (ordem de prioridade correta)
- [ ] Opt-in para expansão detalhada: [sim/não conforme estratégia]

## 4. Estrutura da campanha

- [ ] Nomenclatura seguida: `BELLA_[OBJETIVO]_[FUNIL]_[MES]`
- [ ] **Objetivo de campanha** correto (Sales / Leads / Traffic…)
- [ ] **Special Ad Category** marcada se aplicável (crédito, habitação, emprego, política) — normalmente **Não** para Bella Imagem
- [ ] CBO ou ABO conforme estratégia aprovada em `03-estrategia.md`
- [ ] Budget diário/total bate com o planejado
- [ ] Data de início e fim corretas

## 5. Conjuntos de anúncios

Para **cada conjunto**:

- [ ] Nomenclatura correta
- [ ] **Evento de conversão** selecionado corresponde ao objetivo
- [ ] **Público** configurado (interesses, LAL, RMK) — bate com estratégia
- [ ] **Exclusões** aplicadas (compradores, leads já convertidos)
- [ ] **Localização**: tipo correto (morar / visitar / recentes)
- [ ] **Idade e gênero** alinhados ao briefing
- [ ] **Idiomas**: português
- [ ] **Posicionamentos**: automático ou manual (conforme estratégia)
- [ ] **Otimização de entrega** correta (conversões / valor / alcance)
- [ ] **Janela de atribuição** (7d click / 1d view — padrão)
- [ ] **Limite de lances** [se estratégia manual — valor: R$ __]
- [ ] **Horário de veiculação**: contínuo ou programado

## 6. Anúncios

Para **cada anúncio**:

- [ ] Nomenclatura: `BELLA_[FORMATO]_[ANGULO]_[VERSAO]`
- [ ] **Identidade**: página FB + conta IG corretas
- [ ] **Criativo** final, sem marca d'água, nas specs técnicas
- [ ] **Copy** copiada do `04-copies.csv` (headline + primary text + description)
- [ ] **CTA** coerente com a copy
- [ ] **URL de destino** correta e testada (abre em mobile)
- [ ] **UTMs** no padrão: `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
- [ ] **Link preview** renderiza corretamente (título, descrição, imagem)
- [ ] Revisão ortográfica final

## 7. Política de anúncios Meta

- [ ] Nenhuma promessa de resultado garantido
- [ ] Sem "antes/depois" explícito em saúde/estética (se aplicável ao nicho)
- [ ] Sem atributos pessoais ("você está acima do peso?") — usar linguagem inclusiva
- [ ] Sem termos proibidos (cura, emagrecimento milagroso, etc.)
- [ ] Imagens sem close-up em partes do corpo
- [ ] Landing page coerente com o anúncio (sem bait-and-switch)
- [ ] LGPD: política de privacidade visível na LP

## 8. Rastreamento externo (opcional mas recomendado)

- [ ] UTMs chegando ao Google Analytics 4 / Looker
- [ ] Integração com CRM funcionando (lead entra automaticamente)
- [ ] Dashboard de acompanhamento preparado (planilha ou Looker Studio)

## 9. Revisão final

- [ ] **Pré-visualização** de cada anúncio em: Feed, Stories, Reels
- [ ] Gestor sênior revisou e aprovou (double check)
- [ ] Screenshot da estrutura final salva em `anexos-publicacao/`
- [ ] Comunicação ao cliente: campanha será publicada em [data/hora]

---

## Pós-publicação (primeiras 24h)

- [ ] Campanha saiu da revisão da Meta (status "Ativo")
- [ ] Impressões começaram a entregar
- [ ] Pixel recebendo eventos da campanha (filtrar por `utm_source=meta`)
- [ ] Nenhum anúncio rejeitado (se sim, corrigir imediatamente)
- [ ] Primeira conversão registrada (ou alerta para checar LP se 0 conversões após R$ X)

---

**Aprovação para publicar**:

- Gestor de tráfego: ______________________ Data/hora: __________
- Cliente (quando exigido): _______________ Data/hora: __________
