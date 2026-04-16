# 03 — Estratégia de Campanha

> Consolidação da arquitetura da campanha. Este documento deve ser **aprovado** antes da produção de criativos.

---

## 1. Objetivo e KPI

- **Objetivo Meta (Campaign Objective)**: [Sales / Leads / Traffic / Engagement / Awareness / Messages]
- **Evento de otimização**: [Purchase / Lead / InitiateCheckout / CompleteRegistration…]
- **KPI principal**: [CPL / CPA / ROAS / CTR]
- **Meta do KPI**: [valor]
- **KPIs secundários**: [CTR, CPM, frequência, taxa de conversão do LP]

## 2. Funil e etapas

| Etapa  | % do budget | Objetivo                  | Público                   | Criativo dominante |
|--------|-------------|---------------------------|---------------------------|--------------------|
| Topo   | [%]         | Atrair/educar             | Fria + interesses         | Vídeo curto/reel   |
| Meio   | [%]         | Considerar                | Engajadores 30d / LAL 1%  | Carrossel/estático |
| Fundo  | [%]         | Converter                 | RMK site / checkout / IG  | Prova social / oferta |

## 3. Estrutura da conta

**Padrão de nomenclatura**:

```
Campanha:  BELLA_[OBJETIVO]_[FUNIL]_[MES]
Conjunto:  BELLA_[FUNIL]_[PUBLICO]_[POSICIONAMENTO]
Anúncio:   BELLA_[FORMATO]_[ANGULO]_[VERSAO]
```

**Exemplo**:
- `BELLA_CONV_TOPO_ABR26`
- `BELLA_TOPO_FRIA_INTERESSES_AUTO`
- `BELLA_REEL_DOR_V1`

## 4. Estratégia de públicos

### Topo (frio)

- **Interesses**: [listar 5-10 interesses agrupados tematicamente]
- **Idade**: [faixa]
- **Gênero**: [M/F/ambos]
- **Localização**: [cidades/raio]
- **Detalhes**: [comportamentos, renda estimada se aplicável]

### Meio (morno)

- Lookalike 1% — base: [Purchasers / Leads / Engajadores IG 365d]
- Lookalike 1–3% — base: [mesma]
- Engajadores IG/FB últimos 90 dias
- Visitantes do site últimos 30 dias (sem conversão)

### Fundo (quente — remarketing)

- Visitantes LP últimos 14d sem conversão
- InitiateCheckout 7d sem Purchase
- Adicionou ao carrinho 3d sem Purchase
- Engajadores DM/comentários 30d

### Exclusões (aplicar em todos os conjuntos do topo/meio)

- Compradores últimos [N] dias
- Leads já convertidos (integrar com CRM)
- Funcionários/administradores da página

## 5. Posicionamentos

- **Modo**: [Automático / Manual]
- **Se manual**: Feed IG, Feed FB, Stories IG, Reels IG, Explorar — [listar os ativos]
- **Excluir**: [Audience Network, Right Column se aplicável]

## 6. Budget

- **Estratégia**: [CBO (Campaign Budget Optimization) / ABO (Ad Set Budget Optimization)]
- **Budget total da campanha**: R$ [valor]
- **Budget diário por conjunto** (se ABO): R$ [valor]
- **Duração**: [DD/MM a DD/MM]
- **Fase de aprendizado esperada**: 3–7 dias, ~50 conversões por conjunto

### Distribuição

| Funil  | Budget diário | % total |
|--------|---------------|---------|
| Topo   | R$ [valor]    | [%]     |
| Meio   | R$ [valor]    | [%]     |
| Fundo  | R$ [valor]    | [%]     |
| **Total** | **R$ [valor]** | **100%** |

## 7. Criativos — quantidade planejada

| Funil  | Estático | Carrossel | Vídeo | Total |
|--------|----------|-----------|-------|-------|
| Topo   | [n]      | [n]       | [n]   | [n]   |
| Meio   | [n]      | [n]       | [n]   | [n]   |
| Fundo  | [n]      | [n]       | [n]   | [n]   |

**Ângulos a testar**: [listar — ex.: dor, transformação, prova social, urgência, autoridade]

## 8. Mensuração

- **Pixel**: ID [número] — **status**: [ativo/pendente]
- **CAPI (Conversions API)**: [ativa via servidor / via partner integration / pendente]
- **Eventos mapeados**: [ViewContent, Lead, InitiateCheckout, Purchase, …]
- **Janela de atribuição**: [7d click / 1d view — padrão atual]
- **UTMs**: padrão `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`

## 9. Regras de otimização

### Não mexer

- Não alterar conjuntos nos primeiros **3–5 dias** (fase de aprendizado)
- Não fazer mais de **1 alteração por semana** por conjunto

### Pausar

- Criativo com CPA > **2x meta** após **[N] impressões** ou **[R$]** gastos
- Conjunto sem nenhuma conversão após **R$ [3x CPA-meta]**
- CTR < [0,5%] com frequência > [2,5]

### Escalar

- Conjunto com CPA ≤ meta há 3 dias → duplicar com **+20% budget**
- Criativo vencedor → replicar em novo conjunto (evitar saturar)

## 10. Cronograma

| Data       | Entregável                         | Responsável |
|------------|------------------------------------|-------------|
| [DD/MM]    | Briefing validado                  | [nome]      |
| [DD/MM]    | Benchmark consolidado              | [nome]      |
| [DD/MM]    | Estratégia aprovada                | [nome]      |
| [DD/MM]    | Copies finalizadas                 | [nome]      |
| [DD/MM]    | Criativos entregues                | [nome]      |
| [DD/MM]    | Campanha publicada                 | [nome]      |
| [DD/MM]    | 1º relatório parcial               | [nome]      |
| [DD/MM]    | Fechamento/relatório final         | [nome]      |

---

**Status**: [ ] Rascunho  [ ] Em revisão  [ ] **Aprovado** (data: ____ / assinatura: ____)
