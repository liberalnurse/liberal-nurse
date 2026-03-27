// Composant Toast avec auto-dismiss et progress bar
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { useUIStore, type Toast } from '@/store/uiStore'

// ─── Toast individuel ─────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const typeConfig = {
  success: {
    bg:       'bg-green-50 dark:bg-green-950',
    border:   'border-green-200 dark:border-green-800',
    icon:     'text-green-500',
    progress: 'bg-green-500',
    text:     'text-green-800 dark:text-green-200',
  },
  error: {
    bg:       'bg-red-50 dark:bg-red-950',
    border:   'border-red-200 dark:border-red-800',
    icon:     'text-red-500',
    progress: 'bg-red-500',
    text:     'text-red-800 dark:text-red-200',
  },
  info: {
    bg:       'bg-blue-50 dark:bg-blue-950',
    border:   'border-blue-200 dark:border-blue-800',
    icon:     'text-blue-500',
    progress: 'bg-blue-500',
    text:     'text-blue-800 dark:text-blue-200',
  },
  warning: {
    bg:       'bg-orange-50 dark:bg-orange-950',
    border:   'border-orange-200 dark:border-orange-800',
    icon:     'text-orange-500',
    progress: 'bg-orange-500',
    text:     'text-orange-800 dark:text-orange-200',
  },
}

const icons = {
  success: (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [progress, setProgress] = useState(100)
  const duration = toast.duration ?? 4000
  const config = typeConfig[toast.type]

  useEffect(() => {
    if (duration <= 0) return
    const interval = setInterval(() => {
      setProgress((p) => Math.max(0, p - (100 / (duration / 100))))
    }, 100)
    return () => clearInterval(interval)
  }, [duration])

  return (
    <div
      className={clsx(
        'pointer-events-auto relative flex w-80 overflow-hidden rounded-xl border shadow-lg',
        config.bg,
        config.border,
        'animate-in slide-in-from-right-5 duration-300'
      )}
      role="alert"
    >
      <div className="flex flex-1 items-start gap-3 p-4">
        <span className={config.icon}>{icons[toast.type]}</span>
        <p className={clsx('flex-1 text-sm font-medium', config.text)}>{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className={clsx('shrink-0 opacity-60 hover:opacity-100', config.icon)}
          aria-label="Fermer"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
      {/* Barre de progression */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5 dark:bg-white/10">
          <div
            className={clsx('h-full transition-all duration-100', config.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Conteneur global des toasts ─────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2 lg:bottom-6 lg:right-6"
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
