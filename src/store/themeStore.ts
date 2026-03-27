import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light'
        applyTheme(next)
        set({ theme: next })
      },
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    { name: 'liberal-nurse-theme' }
  )
)

// Applique le thème dès le chargement (avant hydratation React)
export function initTheme() {
  const stored = localStorage.getItem('liberal-nurse-theme')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      applyTheme(state?.theme ?? 'light')
    } catch {
      applyTheme('light')
    }
  }
}
