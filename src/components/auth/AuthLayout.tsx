import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

interface AuthLayoutProps {
  children: ReactNode
  /** Titre du panneau gauche */
  quote?: string
  quoteAuthor?: string
}

const STATS = [
  { value: '28', label: 'modules métier' },
  { value: '7',  label: 'rôles d\'accès' },
  { value: '∞',  label: 'patients suivis' },
]

export function AuthLayout({ children, quote, quoteAuthor }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Panneau gauche (desktop uniquement) ── */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between overflow-hidden bg-navy-800 px-12 py-10 dark:bg-navy-950">

        {/* Cercles décoratifs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-navy-700/40 dark:bg-navy-800/60" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-navy-900/50" />
        <div className="pointer-events-none absolute right-8 bottom-40 h-48 w-48 rounded-full bg-accent-500/10" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">Liberal Nurse</p>
            <p className="text-xs text-navy-300">Cabinet infirmier libéral</p>
          </div>
        </div>

        {/* Citation centrale */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="font-display text-3xl font-light italic leading-snug text-white">
              {quote ?? 'Simplifiez votre cabinet,\nconcentrez-vous sur\nvos patients.'}
            </p>
            {quoteAuthor && (
              <footer className="text-sm text-navy-300">— {quoteAuthor}</footer>
            )}
          </blockquote>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-semibold text-white">{s.value}</p>
                <p className="text-xs text-navy-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer gauche */}
        <p className="relative z-10 text-xs text-navy-400">
          © {new Date().getFullYear()} Liberal Nurse · Conforme RGPD · HDS
        </p>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="flex flex-1 flex-col">
        {/* Barre top mobile */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 dark:bg-navy-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="font-display text-base font-semibold text-navy-800 dark:text-white">Liberal Nurse</span>
          </div>
          <ThemeToggle compact />
        </div>

        {/* Formulaire centré */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Toggle thème desktop */}
        <div className="hidden lg:flex justify-end p-4">
          <ThemeToggle compact />
        </div>
      </div>
    </div>
  )
}
