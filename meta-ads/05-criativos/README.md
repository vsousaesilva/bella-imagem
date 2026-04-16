# 05 — Criativos

Organização, nomenclatura e especificações técnicas para produção das peças.

---

## Estrutura de pastas

```
05-criativos/
├── README.md                  ← este arquivo
├── referencias/               ← prints e inspirações
├── brutos/                    ← fotos/vídeos sem tratamento
├── estaticos/
│   ├── 1x1/                   ← feed
│   ├── 4x5/                   ← feed (recomendado — ocupa mais tela)
│   └── 9x16/                  ← stories/reels
├── carrosseis/
│   └── [nome_carrossel]/      ← cada carrossel em sua pasta (cards 1.png, 2.png, …)
├── videos/
│   ├── 1x1/
│   ├── 4x5/
│   └── 9x16/                  ← reels/stories
└── entregas/                  ← versão final pronta pra subir (arquivo único por criativo)
```

## Nomenclatura obrigatória

```
BELLA_[FORMATO]_[ANGULO]_[VERSAO].[ext]
```

**Formato**: `EST` (estático) · `CAR` (carrossel) · `VID` (vídeo feed) · `REEL` (reel/story)
**Ângulo**: `DOR` · `DESEJO` · `PROVA` · `URG` · `AUTOR` · `OFERTA` · `RMK`
**Versão**: `V1`, `V2`, `V3` — nunca sobrescrever, sempre incrementar

**Exemplos válidos**:
- `BELLA_EST_DOR_V1.jpg`
- `BELLA_REEL_PROVA_V2.mp4`
- `BELLA_CAR_DESEJO_V1/` (pasta com os cards)

## Especificações técnicas (Meta 2026)

### Estáticos

| Proporção | Resolução mínima | Uso recomendado           |
|-----------|------------------|---------------------------|
| 1:1       | 1080 × 1080      | Feed FB/IG                |
| 4:5       | 1080 × 1350      | Feed IG (ocupa mais tela) |
| 9:16      | 1080 × 1920      | Stories / Reels capa      |

- Formato: JPG ou PNG
- Peso: até 30 MB
- Texto na imagem: até ~20% da área (Meta não penaliza mais, mas afeta performance)

### Carrossel

- 2 a 10 cards
- Proporção única por carrossel (1:1 ou 4:5)
- Mesma resolução em todos os cards
- **Primeiro card** = hook; **último card** = CTA

### Vídeo / Reels

| Proporção | Resolução        | Duração ideal |
|-----------|------------------|---------------|
| 9:16      | 1080 × 1920      | 9 a 30s       |
| 1:1       | 1080 × 1080      | até 15s       |
| 4:5       | 1080 × 1350      | até 15s       |

- Codec: H.264, AAC áudio
- Peso máx: 4 GB (praticar < 100 MB)
- **Legenda queimada obrigatória** (85% assistem sem som)
- **Hook nos primeiros 3 segundos** — visual + texto
- Logo/marca presente até o 5º segundo

## Checklist por peça

Para cada criativo antes de mover para `entregas/`:

- [ ] Nomenclatura correta (`BELLA_FORMATO_ANGULO_Vx`)
- [ ] Resolução e proporção dentro das specs acima
- [ ] Safe zone respeitada (logo/texto não cortados)
- [ ] Hook claro nos primeiros 3s (vídeo) ou visualmente (estático)
- [ ] CTA presente e legível
- [ ] Logo Bella Imagem visível
- [ ] Paleta e fontes alinhadas ao briefing
- [ ] Revisão ortográfica
- [ ] Compliance do nicho respeitado (ex.: saúde/estética — sem promessas médicas)
- [ ] Copy correspondente identificada em `04-copies.csv`

## Referências visuais

Salvar em `referencias/` com o nome do concorrente e o ângulo explorado. Ex.: `concorrenteX_dor_v1.png`.

---

**Status geral da produção**: [ ] Em briefing  [ ] Em produção  [ ] Em revisão  [ ] Entregue
