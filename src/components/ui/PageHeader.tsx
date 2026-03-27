// En-tête de page avec titre, sous-titre, breadcrumb optionnel et actions
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumb?: BreadcrumbItem[]
  className?: string
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={clsx('mb-6', className)}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <span>/</span>}
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Titre + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-white lg:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
