import { createAdminClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createAdminClient>

export async function getAffiliateProgramActive(admin: AdminClient): Promise<boolean> {
  const { data } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'affiliate_program_active')
    .single()
  // Falha segura: se a tabela ainda não existir, trata como ativo
  return data?.value !== 'false'
}
