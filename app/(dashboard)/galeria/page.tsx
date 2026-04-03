export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { GeneratedImage } from '@/lib/types'
import Image from 'next/image'
import { ImageIcon, Download, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function GaleriaPage() {
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

  const { data: images, error } = await admin
    .from('generated_images')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) console.error('[galeria] erro ao buscar imagens:', error.message)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-medium text-bella-white tracking-tight">Galeria</h1>
          <p className="text-bella-gray text-sm mt-1">Todas as imagens geradas pela sua conta.</p>
        </div>
        <Link href="/gerar" className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Nova geração</span>
        </Link>
      </div>

      {!images?.length ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <ImageIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-bella-gray">Nenhuma imagem gerada ainda.</p>
          <Link href="/gerar" className="inline-block mt-4 text-sm text-bella-gold hover:text-bella-gold-light transition-colors">
            Gerar primeira imagem
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(images as GeneratedImage[]).map((img) => {
            const displayUrl = img.selected_url ?? img.output_urls?.[0] ?? null
            return (
              <div
                key={img.id}
                className="group rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) => {
                  // handled via CSS group hover
                }}
              >
                <div className="aspect-[4/5] relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {displayUrl ? (
                    <Image
                      src={displayUrl}
                      alt="Imagem gerada"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </div>
                  )}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    {displayUrl && (
                      <a
                        href={displayUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-colors text-bella-white"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {(img.output_urls?.length ?? 0) > 1 && (
                      <span
                        className="text-[10px] text-bella-white px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                      >
                        {img.output_urls.length} variações
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-[11px] text-bella-gray">{formatDate(img.created_at)}</p>
                  {img.caption_generated && (
                    <p className="text-[11px] text-bella-gray-light mt-1 line-clamp-2">
                      {img.caption_generated}
                    </p>
                  )}
                  {img.instagram_permalink && (
                    <a
                      href={img.instagram_permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-bella-gold mt-1 block hover:text-bella-gold-light transition-colors"
                    >
                      Ver no Instagram
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
