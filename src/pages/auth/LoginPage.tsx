import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { User, Cabinet } from '@/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Clear only Supabase session tokens — keep Zustand auth cache for fast sidebar render.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
        .forEach((k) => localStorage.removeItem(k))
      sessionStorage.clear()
    } catch {}

    const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Pre-load user profile into Zustand so the sidebar renders immediately after redirect.
    if (signInData.session?.user) {
      try {
        const uid = signInData.session.user.id
        const { data: profile } = await supabase
          .from('users')
          .select('*, cabinets(*)')
          .eq('id', uid)
          .single()
        if (profile) {
          const { cabinets, ...userProfile } = profile as Record<string, unknown> & { cabinets: Cabinet | null }
          useAuthStore.getState().setUser(userProfile as unknown as User)
          if (cabinets) useAuthStore.getState().setCabinet(cabinets)
        }
      } catch {}
    }

    window.location.href = '/dashboard?' + Date.now()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ width: 360, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#0f2d5c' }}>Connexion</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Connectez-vous à votre espace infirmier</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="infirmiere@cabinet.fr"
              required
              autoComplete="email"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#93c5fd' : '#0f2d5c', color: 'white', fontSize: 15, fontWeight: 600,
            }}
          >
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
