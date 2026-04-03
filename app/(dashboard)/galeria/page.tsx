export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { GeneratedImage } from '@/lib/types'
import Image from 'next/image'
import { ImageIcon, Download } from 'lucide-react'
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

  if (!profile?.tenant_id) redirect('/dashboard')

  const { data: images } = await admin
    .from('generated_images')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(60)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-bella-charcoal">Galeria</h1>
          <p className="text-gray-500 mt-1">Todas as imagens geradas pela sua conta.</p>
        </div>
        <Link
          href="/gerar"
          className="flex items-center gap-2 bg-bella-rose text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-bella-rose-dark transition"
        >
          <ImageIcon className="w-4 h-4" />
          Nova geração
        </Link>
      </div>

      {!images?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma imagem gerada ainda.</p>
          <Link href="/gerar" className="inline-block mt-4 text-sm text-bella-rose hover:underline">
            Gerar primeira imagem
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(images as GeneratedImage[]).map((img) => {
            const displayUrl = img.selected_url ?? img.output_urls[0]
            return (
              <div
                key={img.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition"
              >
                <div className="aspect-[4/5] relative bg-gray-50">
                  {displayUrl ? (
                    <Image
                      src={displayUrl}
                      alt="Imagem gerada"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-3">
                    {displayUrl && (
                      <a
                        href={displayUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-bella-charcoal p-2 rounded-lg hover:bg-gray-100 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {img.output_urls.length > 1 && (
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-lg">
                        {img.output_urls.length} variações
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-xs text-gray-400">{formatDate(img.created_at)}</p>
                  {img.caption_generated && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {img.caption_generated}
                    </p>
                  )}
                  {img.instagram_permalink && (
                    <a
                      href={img.instagram_permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-bella-rose mt-1 block hover:underline"
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
