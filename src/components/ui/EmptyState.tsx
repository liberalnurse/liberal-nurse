// État vide avec icône, titre, description et action optionnelle
import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/** Icône par défaut (boîte vide) */
function DefaultIcon() {
  return (
    <svg
      className="h-12 w-12 text-gray-300 dark:text-gray-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4m4-3 4 3 4-3"
      />
    </svg>
  )
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 px-8 py-16',
        'dark:border-gray-700',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
        {icon ?? <DefaultIcon />}
      </div>

      <div className="text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>

      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
