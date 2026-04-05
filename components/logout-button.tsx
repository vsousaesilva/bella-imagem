'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs transition-colors"
      style={{ color: '#6b6b6b' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#fefefe')}
      onMouseLeave={e => (e.currentTarget.style.color = '#6b6b6b')}
      title="Sair"
    >
      <LogOut className="w-3.5 h-3.5" />
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  )
}
