// Composant Card avec variants et slots Header/Body/Footer
import { type ReactNode } from 'react'
import { clsx } from 'clsx'

type CardVariant = 'default' | 'hover' | 'clickable'

interface CardProps {
  variant?: CardVariant
  className?: string
  children: ReactNode
  onClick?: () => void
}

const variantClasses: Record<CardVariant, string> = {
  default:   'bg-white dark:bg-gray-900',
  hover:     'bg-white dark:bg-gray-900 transition-shadow hover:shadow-md',
  clickable: 'bg-white dark:bg-gray-900 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
}

export function Card({ variant = 'default', className, children, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-100 shadow-sm',
        'dark:border-gray-800',
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      {children}
    </div>
  )
}

/** En-tête de la card */
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between border-b border-gray-100 px-5 py-4',
        'dark:border-gray-800',
        className
      )}
    >
      {children}
    </div>
  )
}

/** Corps de la card */
export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>
}

/** Pied de la card */
export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'border-t border-gray-100 px-5 py-3',
        'dark:border-gray-800',
        className
      )}
    >
      {children}
    </div>
  )
}
