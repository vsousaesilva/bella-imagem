# Handover — Meta Ads Bella Imagem

> Documento de apresentação para o openclaw assumir a produção de criativos e campanhas Meta do projeto **Bella Imagem**.
> Status: **setup metodológico concluído — execução ainda não iniciada**.

---

## Etapa 0 — Contexto do produto

**Bella Imagem** é um SaaS que gera **fotos de moda com IA** (tagline oficial).

- **Stack do produto**: Next.js 15, Supabase, Google Generative AI (Imagen), billing via Asaas
- **Modelo**: multi-tenant com painel master, dashboard por tenant, programa de afiliados e planos pagos
- **Identidade visual já existente**:
  - Paleta: preto `#0a0a0a`, dourado `#c9a96e`, rosa `#e8b4b8`, creme `#faf6f0`
  - Tipografia: Playfair Display (display) + DM Sans (corpo)
  - Logos disponíveis: `logo.png` e `logo_preta.png` na raiz do projeto
- **Landing page separada**: pasta `lp-bella-imagem/` (HTML estático com Tailwind)
- **Meta Pixel já instalado** na LP — ID **`933630359537212`**
- **Integrações de pagamento**: Asaas (principal) + AbacatePay (documentação em PDF na LP)

> Posicionamento percebido pelo design atual: luxuoso, feminino, premium — não popular/barato.

## Etapa 1 — Definição da metodologia

Foi acordada uma sequência de **7 etapas** para qualquer campanha Meta do projeto, desde o entendimento do negócio até a otimização pós-publicação:

1. **Briefing** — entendimento de negócio, persona, ativos, KPIs
2. **Benchmark** — análise estruturada de concorrentes na Meta Ads Library
3. **Estratégia** — funil, públicos, budget, regras de otimização
4. **Copywriting** — 3 ângulos × múltiplas variações por formato
5. **Criativos** — produção com nomenclatura e specs padronizadas
6. **Publicação** — checklist antes de subir a campanha
7. **Monitoramento** — relatórios recorrentes e regras de corte/escala

**Princípios de trabalho**:
- Uma etapa por vez (sem avançar sem validação)
- Versionar tudo (`_v1`, `_v2`) — nunca sobrescrever
- Nomenclatura obrigatória: `BELLA_[FORMATO]_[ANGULO]_[VERSAO]`
- Critérios de aceite explícitos antes de começar cada peça
- Relatório fora do prazo de aprendizado (3–5 dias sem mexer)

## Etapa 2 — Estrutura de trabalho criada

Criada a pasta [meta-ads/](./) dentro do projeto `bella-imagem`, com **templates prontos** para cada etapa:

```
meta-ads/
├── README.md                      ← fluxo de trabalho e regras
├── HANDOVER-OPENCLAW.md           ← este documento
├── 01-briefing.md                 ← template do briefing (12 seções)
├── 02-benchmark.md                ← template de análise de concorrentes
├── 03-estrategia.md               ← template de plano de mídia
├── 04-copies.csv                  ← 15 linhas pré-formatadas por ângulo/formato
├── 05-criativos/
│   └── README.md                  ← nomenclatura e specs técnicas Meta 2026
├── 06-checklist-publicacao.md     ← 50+ itens de conferência pré-publicação
└── 07-relatorio-template.md       ← modelo de relatório diário/semanal
```

Cada template tem **campos em `[colchetes]`** que devem ser substituídos conforme a execução avança. Status marcadores (`[ ] Rascunho / [ ] Aprovado`) no rodapé de cada arquivo.

## Etapa 3 — Decisões já tomadas

Já **fechadas** e não precisam ser rediscutidas (salvo justificativa forte):

- **Fonte de verdade**: pasta `meta-ads/` — decisões verbais precisam virar commit
- **Idioma**: pt-BR em todas as copies
- **Nomenclatura**: padrão `BELLA_[FORMATO]_[ANGULO]_[VERSAO]` fixo
- **Formatos técnicos**: especificações Meta 2026 documentadas em `05-criativos/README.md`
- **Pixel**: já instalado na LP (`933630359537212`) — validar CAPI antes de subir campanha
- **Estrutura de funil**: topo/meio/fundo com nomenclatura padronizada (ver `03-estrategia.md`)
- **Regras de otimização**: definidas no template de estratégia (não mexer nos 3–5 primeiros dias, pausar criativo com CPA 2x meta, escalar vencedores com +20%)

## Etapa 4 — Onde paramos

**Nada foi executado ainda.** Temos só a metodologia e os templates. Especificamente:

| Etapa | Status |
|-------|--------|
| 1. Briefing | ❌ vazio — precisa reunião com o cliente/gestor |
| 2. Benchmark | ❌ vazio — aguarda briefing |
| 3. Estratégia | ❌ vazia — aguarda briefing + benchmark |
| 4. Copies | ❌ planilha com IDs, sem conteúdo |
| 5. Criativos | ❌ pasta vazia |
| 6. Publicação | ❌ checklist não aplicado — não há campanha |
| 7. Relatórios | ❌ não aplicável — sem campanha rodando |

**Pendências externas** (fora do controle do openclaw, mas bloqueantes):

- Confirmar se **CAPI (Conversions API)** está ativa ou se só tem Pixel client-side
- Confirmar eventos de conversão mapeados no Event Manager (Lead / Purchase / etc.)
- Verificar domínio da LP está **verificado** no Business Manager
- Obter acesso do openclaw à conta de anúncios (role: Anunciante)

## Etapa 5 — Próximos passos (ordem recomendada para o openclaw)

1. **Ler**: `README.md`, `01-briefing.md` e este handover
2. **Agendar reunião de briefing** com o gestor/cliente — preencher `01-briefing.md` ao vivo
3. **Validar** briefing com o gestor antes de avançar
4. **Executar benchmark** (`02-benchmark.md`) — 5 a 10 concorrentes na Meta Ads Library filtrando Brasil
5. **Apresentar estratégia** (`03-estrategia.md`) para aprovação — sem aprovação, não produzir nada
6. **Produzir copies e criativos em paralelo** respeitando a nomenclatura
7. **Aplicar checklist** (`06-checklist-publicacao.md`) antes de publicar
8. **Publicar** e iniciar ciclo de relatórios (`07-relatorio-template.md`)

## Etapa 6 — O que o openclaw precisa receber do gestor

Para não ficar bloqueado logo no início:

- [ ] Acesso ao Business Manager + conta de anúncios
- [ ] Acesso ao Google Drive / pasta com fotos e vídeos brutos
- [ ] Acesso ao Instagram da Bella Imagem (para análise e posicionamento orgânico)
- [ ] Dados históricos de campanhas anteriores (se houver)
- [ ] Lista de concorrentes que o cliente considera referência
- [ ] Budget aprovado e período da primeira campanha
- [ ] Contato direto para tirar dúvidas durante a execução

---

## Resumo em uma frase

> Metodologia e templates prontos em `meta-ads/`; execução ainda não começou; primeira ação do openclaw é agendar o briefing e preencher `01-briefing.md`.
