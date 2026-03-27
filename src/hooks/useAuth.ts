import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

// Clear all Supabase/app session data and hard-redirect to /login.
// Called when auth is unrecoverable (timeout, corrupted token).
function clearSessionAndRedirect() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') || k.includes('supabase') || k.includes('liberal-nurse'))
      .forEach((k) => localStorage.removeItem(k))
    sessionStorage.clear()
  } catch {}
  window.location.replace('/login')
}

// Maximum time to wait for onAuthStateChange INITIAL_SESSION before giving up.
const AUTH_TIMEOUT_MS = 3000

export function useAuth() {
  const { user, cabinet, loading, setUser, setCabinet, setLoading, signOut } =
    useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let eventReceived = false

    // If onAuthStateChange never fires (frozen client / hanging token refresh),
    // clear the corrupted session and redirect to /login.
    const safetyTimer = setTimeout(() => {
      if (!eventReceived) {
        console.warn(`[useAuth] no auth event after ${AUTH_TIMEOUT_MS}ms — clearing session`)
        clearSessionAndRedirect()
      }
    }, AUTH_TIMEOUT_MS)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        eventReceived = true
        clearTimeout(safetyTimer)

        if (session?.user) {
          setLoading(true)
          try {
            await loadUserProfile(session.user.id)
          } catch {
            setUser(null)
            setCabinet(null)
          } finally {
            setLoading(false)
          }
        } else {
          setUser(null)
          setCabinet(null)
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*, cabinets(*)')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return // no row — new user, not fatal
      throw error
    }

    if (profile) {
      const { cabinets, ...userProfile } = profile as unknown as Record<string, unknown> & {
        cabinets: Parameters<typeof setCabinet>[0] | null
      }
      setUser(userProfile as unknown as User)
      if (cabinets) setCabinet(cabinets)
    }
  }

  return { user, cabinet, loading, signOut, isAuthenticated: !!user }
}
