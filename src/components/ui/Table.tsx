// Table réutilisable avec tri, loading skeleton, empty state, dark mode
import { useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Spinner } from './Spinner'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  render?: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

type SortDir = 'asc' | 'desc'

export function Table<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Aucun résultat',
  onRowClick,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const av = (a as Record<string, unknown>)[sortKey]
    const bv = (b as Record<string, unknown>)[sortKey]
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    const result = String(av).localeCompare(String(bv), 'fr', { numeric: true })
    return sortDir === 'asc' ? result : -result
  })

  return (
    <div className={clsx('w-full overflow-x-auto rounded-xl', className)}>
      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={clsx(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  !col.align && 'text-left',
                  col.sortable && 'cursor-pointer select-none hover:text-navy-700 dark:hover:text-navy-300'
                )}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="text-gray-300 dark:text-gray-600">
                      {sortKey === String(col.key) ? (
                        sortDir === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50 bg-white dark:divide-gray-800/50 dark:bg-gray-900">
          {loading ? (
            // Skeleton de chargement
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-navy-50 dark:hover:bg-navy-950/30'
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={clsx(
                      'whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
