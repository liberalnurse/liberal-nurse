import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Cabinet } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  cabinet: Cabinet | null
  loading: boolean
  setUser: (user: User | null) => void
  setCabinet: (cabinet: Cabinet | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      cabinet: null,
      loading: true,
      setUser: (user) => set({ user }),
      setCabinet: (cabinet) => set({ cabinet }),
      setLoading: (loading) => set({ loading }),
      signOut: async () => {
        // Clear localStorage first — reliable even if the Supabase client is frozen.
        try {
          Object.keys(localStorage)
            .filter((k) => k.startsWith('sb-') || k.includes('supabase') || k.includes('liberal-nurse'))
            .forEach((k) => localStorage.removeItem(k))
          sessionStorage.clear()
        } catch {}
        set({ user: null, cabinet: null })
        // Fire-and-forget — don't await in case the client is frozen.
        supabase.auth.signOut().catch(() => {})
      },
    }),
    {
      name: 'liberal-nurse-auth',
      partialize: (state) => ({ user: state.user, cabinet: state.cabinet }),
    }
  )
)
