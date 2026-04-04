export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { GeneratedImage } from '@/lib/types'
import { ImageIcon, Plus } from 'lucide-react'
import Link from 'next/link'
import { GaleriaCard } from '@/components/galeria-card'

const PAGE_SIZE = 30

export default async function GaleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    if (profile?.role === 'master') redirect('/master')
    redirect('/dashboard')
  }

  // #11 — Paginação com count
  const { data: images, count, error } = await admin
    .from('generated_images')
    .select('*', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) console.error('[galeria] erro ao buscar imagens:', error.message)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">Galeria</h1>
          <p className="text-bella-gray text-sm mt-1">
            {count ?? 0} imagens geradas pela sua conta.
          </p>
        </div>
        <Link href="/gerar" className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Nova geração</span>
        </Link>
      </div>

      {!images?.length ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: 'var(--main-bg-subtle)', border: '1px solid var(--main-border)' }}
        >
          <ImageIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-bella-gray">Nenhuma imagem gerada ainda.</p>
          <Link href="/gerar" className="inline-block mt-4 text-sm text-bella-gold hover:text-bella-gold-light transition-colors">
            Gerar primeira imagem
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(images as GeneratedImage[]).map((img) => (
            <GaleriaCard key={img.id} img={img} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/galeria?page=${page - 1}`}
              className="text-sm text-bella-gold hover:text-bella-gold-light transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}
            >
              Anterior
            </Link>
          )}
          <span className="text-sm text-bella-gray">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/galeria?page=${page + 1}`}
              className="text-sm text-bella-gold hover:text-bella-gold-light transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
