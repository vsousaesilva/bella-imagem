import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60 // segundos — geração de artigo é lenta

const GEMINI_TEXT_MODEL = 'gemini-2.5-flash'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const TOPICS = [
  'tendências de moda para o próximo trimestre',
  'como a inteligência artificial está transformando o setor de moda',
  'dicas para aumentar as vendas em lojas de moda e acessórios',
  'moda sustentável: como lojas podem se adaptar à nova demanda',
  'como usar redes sociais para vender mais moda',
  'tendências de cores e estampas na moda atual',
  'como criar looks com peças-chave do guarda-roupa',
  'fotografias de moda com IA: o futuro do e-commerce de roupas',
  'como o Instagram e o TikTok estão mudando o varejo de moda',
  'capsule wardrobe: como ajudar seu cliente a montar um guarda-roupa cápsula',
  'moda inclusiva: por que lojas devem apostar na diversidade de tamanhos',
  'como precificar produtos de moda para maximizar lucro',
  'storytelling de marca para lojas de moda e acessórios',
  'fashion tech: tecnologias que estão reinventando a experiência de compra',
  'como usar o WhatsApp Business para vender mais roupas',
  'tendências de acessórios que estão dominando as passarelas',
  'vitrinismo digital: como criar fotos de produto que vendem',
  'sazonalidade na moda: como planejar coleções e estoque',
  'como montar um calendário de conteúdo para loja de moda',
  'upcycling e moda circular: oportunidade de negócio para lojas',
]

const SYSTEM_PROMPT = `Você é um especialista em marketing de conteúdo para o setor de moda, varejo têxtil e tecnologia aplicada à moda no Brasil.
Seu objetivo é gerar artigos de blog completos, informativos e envolventes para o blog da Bella Imagem — plataforma de geração de fotos profissionais de moda com IA para lojas e e-commerces.

REGRAS:
- Escreva em português do Brasil, tom profissional mas acessível
- O artigo deve ser útil para lojistas, empreendedores de moda e e-commerces
- Conteúdo original, sem plágio
- HTML limpo: use apenas as tags <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
- Não use <h1> (o título já é exibido separadamente)
- Sem markdown, sem asteriscos, apenas HTML puro
- O artigo deve ter entre 700 e 1000 palavras no corpo do conteúdo
- Estrutura recomendada: introdução, 3 a 5 seções com <h2>, conclusão com chamada para ação relacionada à Bella Imagem

RESPOSTA: Retorne APENAS um objeto JSON válido, sem texto adicional, sem code fences, no seguinte formato:
{
  "title": "Título do artigo (máx 80 chars)",
  "excerpt": "Resumo de 1 a 2 frases para a listagem do blog (máx 200 chars)",
  "content": "<p>Conteúdo HTML completo do artigo...</p>"
}`

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'master') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })

  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]

  const userPrompt = `Escreva um artigo completo sobre: ${topic}.

Lembre-se: a Bella Imagem é uma plataforma que usa IA para gerar fotos profissionais de moda para lojas e e-commerces. Sempre que fizer sentido, mencione como a tecnologia e a IA (como a Bella Imagem) podem ajudar lojistas nesse contexto.`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 4096,
    },
  }

  try {
    const res = await fetch(`${API_BASE}/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[blog/generate] Gemini error:', err)
      return NextResponse.json({ error: 'Falha ao chamar a IA. Tente novamente.' }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let parsed: { title: string; excerpt: string; content: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Tenta extrair JSON de bloco de código se o modelo ignorou responseMimeType
      const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/)
      if (match) {
        parsed = JSON.parse(match[1])
      } else {
        console.error('[blog/generate] JSON inválido do modelo:', raw.slice(0, 300))
        return NextResponse.json({ error: 'Resposta inválida da IA. Tente novamente.' }, { status: 502 })
      }
    }

    if (!parsed.title || !parsed.content) {
      return NextResponse.json({ error: 'A IA não gerou todos os campos. Tente novamente.' }, { status: 502 })
    }

    return NextResponse.json({
      title: parsed.title.trim().slice(0, 120),
      excerpt: (parsed.excerpt ?? '').trim().slice(0, 300),
      content: parsed.content.trim(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[blog/generate] Erro:', message)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
