# Bella Imagem — Auditoria de Segurança e Performance

## Correções Implementadas

Data: Abril 2026
Auditor: Claude (Analista Senior)

---

### ARQUIVOS NOVOS

| Arquivo | Propósito |
|---------|-----------|
| `lib/security/rate-limit.ts` | Rate limiting in-memory (swap por Upstash Redis em produção) |
| `lib/security/validation.ts` | Validação de inputs: base64, MIME, URL anti-SSRF, sanitização anti-prompt-injection, timing-safe compare |
| `app/api/health/route.ts` | Health check endpoint para monitoramento |
| `supabase/migrations/006_security_performance.sql` | Índices compostos, função atômica de quota, views otimizadas, cleanup de imagens |

### ARQUIVOS MODIFICADOS (28 arquivos)

---

## P0 — Crítico

### #1 — Race condition na cota (CORRIGIDO)
- **Antes:** `checkQuota` lê e `update quota_used = X + 1` separados → 50 requests simultâneos passam todos
- **Depois:** Nova RPC `check_and_increment_quota` usa `SELECT ... FOR UPDATE` para serializar
- **Arquivos:** `lib/workspace/index.ts`, `app/api/images/generate/route.ts`, `006_security_performance.sql`
- Rate limiting adicional: 10 req/min por tenant

### #2 — Payload sem limite de tamanho (CORRIGIDO)
- **Antes:** Aceita qualquer base64 sem validar tamanho → OOM no serverless
- **Depois:** Valida `Content-Length`, base64 ≤ 7MB (5MB decodificado), MIME type em allowlist
- **Arquivos:** `lib/security/validation.ts`, `app/api/images/generate/route.ts`

### #4 — Timing attack no webhook Asaas (CORRIGIDO)
- **Antes:** `token === expected` (comparação não-constante)
- **Depois:** `timingSafeEqual` via `crypto.timingSafeEqual` com padding para tamanhos diferentes
- **Arquivos:** `lib/security/validation.ts`, `lib/asaas/index.ts`, `app/api/asaas/webhook/route.ts`

### #5 — SSRF via selectedUrl (CORRIGIDO)
- **Antes:** Qualquer URL é aceita e gravada no banco
- **Depois:** Valida hostname (deve ser Supabase do projeto), protocol HTTPS, path no bucket `bella-images`, e confirma que a URL está nas `output_urls` da imagem
- **Arquivos:** `lib/security/validation.ts`, `app/api/images/select/route.ts`

---

## P1 — Alto

### #9 — MIME type sem validação real (CORRIGIDO)
- **Antes:** Aceita qualquer `mimeType` declarado (SVG malicioso possível)
- **Depois:** Allowlist: `image/jpeg`, `image/png`, `image/webp` apenas
- **Arquivos:** `lib/security/validation.ts`, `app/api/images/generate/route.ts`

### #10 — N+1 queries no painel master (CORRIGIDO)
- **Antes:** `select('*')` de todos os `usage_logs` de todos os tempos na memória
- **Depois:** Queries filtradas por tenant da página (paginação), view SQL `tenant_usage_summary` e `tenant_monthly_report` para relatórios
- **Arquivos:** `app/master/tenants/page.tsx`, `app/master/page.tsx`, `app/master/relatorios/page.tsx`, `006_security_performance.sql`

### #11 — Sem paginação (CORRIGIDO)
- **Antes:** Listas sem limite em master/tenants, relatórios, galeria
- **Depois:** Paginação server-side com `range()`, controles de navegação, `count: 'exact'`
- **Arquivos:** `app/master/tenants/page.tsx`, `app/(dashboard)/galeria/page.tsx`, `app/api/admin/tenants/route.ts`

### #13 — Uploads sequenciais (CORRIGIDO)
- **Antes:** Loop `for` sequencial para upload das variações
- **Depois:** `Promise.all` para uploads paralelos (3 uploads: 2 variações + peça)
- **Arquivos:** `app/api/images/generate/route.ts`

### #14 — Memória duplicada (CORRIGIDO)
- **Antes:** Base64 mantido no body + Buffer = 3 cópias na memória
- **Depois:** Limpa referências após upload (`body.clothingImageBase64 = ''`)
- **Arquivos:** `app/api/images/generate/route.ts`

### #16 — Prompt injection (CORRIGIDO)
- **Antes:** `modelDescricaoLivre` e `backgroundCustom` inseridos direto no prompt
- **Depois:** Sanitização com detecção de padrões de injection (regex), remoção de caracteres de controle, escape de aspas, truncamento. Prompt do sistema inclui instrução anti-injection.
- **Arquivos:** `lib/security/validation.ts`, `lib/ai/imagen.ts`, `lib/ai/captions.ts`, `app/api/images/generate/route.ts`

---

## P2 — Médio

### #6 — Security headers (CORRIGIDO)
- **Antes:** Sem headers de segurança
- **Depois:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- **Arquivos:** `next.config.ts`, `middleware.ts`

### #8 — `unoptimized` em imagens (CORRIGIDO)
- **Antes:** Todas as imagens com `unoptimized` (sem otimização do Next.js)
- **Depois:** Removido `unoptimized`, adicionado `sizes` para responsive loading
- **Arquivos:** `components/galeria-card.tsx`, `app/(dashboard)/dashboard/page.tsx`

### #15 — Sem cache (PARCIALMENTE CORRIGIDO)
- Cache headers para assets estáticos em `next.config.ts`
- Dashboard master com queries limitadas temporalmente

### #17 — Senhas fracas (DOCUMENTADO)
- Requer configuração no Supabase Dashboard: Auth > Password Strength

### #18 — Logging (MELHORADO)
- Formato consistente `[bella-imagem]` em todas as rotas
- Error messages truncados a 500 chars para evitar log overflow

### #19 — `createClient()` no corpo do componente (CORRIGIDO)
- **Antes:** Recriava o Supabase client a cada render
- **Depois:** Singleton pattern com variável de módulo
- **Arquivos:** `lib/supabase/client.ts`

### #20 — Índices compostos ausentes (CORRIGIDO)
- 5 novos índices compostos para as queries mais frequentes
- Índice parcial (`WHERE success = true`, `WHERE status = 'completed'`, `WHERE active = true`)
- **Arquivos:** `006_security_performance.sql`

### #21 — `select('*')` em queries de tenant (CORRIGIDO)
- **Antes:** Trazia todos os campos incluindo `instagram_access_token`
- **Depois:** Select explícito dos campos necessários em cada rota
- **Arquivos:** Todas as rotas de API e server components

### #22 — Connection pooling (DOCUMENTADO)
- Adicionada documentação e timeout de 30s no `createAdminClient`
- **Arquivos:** `lib/supabase/server.ts`

---

## Baixo

### #23 — USD_TO_BRL hardcoded (CORRIGIDO)
- Movido para `NEXT_PUBLIC_USD_TO_BRL` com fallback 5.75
- **Arquivos:** `lib/utils.ts`, `.env.local.example`

### #24 — Health check endpoint (CORRIGIDO)
- `GET /api/health` — verifica variáveis de ambiente configuradas
- **Arquivos:** `app/api/health/route.ts`

### #25 — Storage indisponível (MELHORADO)
- Tratamento de erro com mensagem específica por arquivo no upload

### #26 — Usuários desativados operando (CORRIGIDO)
- **Antes:** Middleware não verificava `profile.active`
- **Depois:** Verificação em dashboard layout (faz logout se inativo) e em cada rota de API
- **Arquivos:** `app/(dashboard)/layout.tsx`, todas as rotas de API

### #27 — Política de limpeza do Storage (CORRIGIDO)
- Função `cleanup_failed_images()` para remover imagens com status `failed` após 7 dias
- **Arquivos:** `006_security_performance.sql`

---

## Instruções de Aplicação

### 1. Rodar a migration
```bash
supabase db push  # ou aplicar 006_security_performance.sql manualmente
```

### 2. Substituir os arquivos
Copiar todos os arquivos desta pasta para o projeto, substituindo os originais.

### 3. Variáveis de ambiente
Adicionar ao `.env.local`:
```
NEXT_PUBLIC_USD_TO_BRL=5.75
```

### 4. Configurar no Supabase Dashboard
- **Auth > Password Policy**: Mínimo 8 caracteres, maiúscula + número
- **Database > Connection Pooling**: Ativar PgBouncer (transaction mode)
- **Edge Functions ou Cron**: Agendar `SELECT cleanup_failed_images()` semanalmente

### 5. Para produção de alto tráfego
- Trocar `lib/security/rate-limit.ts` por Upstash Redis
- Configurar Vercel Edge Config ou KV para cache
- Monitorar com Sentry/Datadog
