// Spinner de chargement avec tailles sm/md/lg
import { clsx } from 'clsx'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
}

export function Spinner({ size = 'md', className, label = 'Chargement...' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <span
        className={clsx(
          'animate-spin rounded-full border-navy-200 border-t-navy-800',
          'dark:border-navy-700 dark:border-t-navy-300',
          sizeClasses[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Spinner centré dans un conteneur pleine hauteur */
export function FullPageSpinner({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  )
}
