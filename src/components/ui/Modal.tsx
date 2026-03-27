// Modal réutilisable avec backdrop, animations, focus trap et dark mode
import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { clsx } from 'clsx'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: ReactNode
  /** Désactive la fermeture en cliquant sur l'overlay */
  preventClose?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

export function Modal({ open, onClose, title, size = 'md', children, preventClose = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // Fermeture avec Échap
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !preventClose) {
      onClose()
    }
  }

  // Focus trap : ramène le focus dans la modal
  useEffect(() => {
    if (open) {
      firstFocusRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-in fade-in duration-200'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={preventClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Contenu */}
      <div
        ref={dialogRef}
        className={clsx(
          'relative w-full rounded-2xl bg-white shadow-2xl',
          'dark:bg-gray-900 dark:shadow-black/50',
          'animate-in zoom-in-95 duration-200',
          sizeClasses[size]
        )}
      >
        {/* En-tête */}
        {(title !== undefined) && (
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h2
              id="modal-title"
              className="font-display text-lg font-semibold text-navy-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              ref={firstFocusRef}
              onClick={onClose}
              className={clsx(
                'rounded-lg p-1.5 text-gray-400 transition-colors',
                'hover:bg-gray-100 hover:text-gray-600',
                'dark:hover:bg-gray-800 dark:hover:text-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-navy-500'
              )}
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        )}

        {/* Corps */}
        <div className={clsx('overflow-y-auto', size === 'full' && 'max-h-[80vh]')}>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Section interne pour le corps de la modal */
export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>
}

/** Section interne pour le pied de la modal */
export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4',
        'dark:border-gray-800',
        className
      )}
    >
      {children}
    </div>
  )
}
