import { NavLink, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { useRole } from '@/hooks/useRole'
import { NAV_ITEMS } from './navItems'
import { NavIcon } from './NavIcon'

export function BottomNav() {
  const { canAccess } = useRole()
  const location = useLocation()

  const mobileItems = NAV_ITEMS
    .filter((item) => item.mobileOrder !== undefined && canAccess(item.module))
    .sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99))
    .slice(0, 5)

  if (mobileItems.length === 0) return null

  return (
    <nav className={clsx(
      'fixed bottom-0 inset-x-0 z-20 lg:hidden pb-safe',
      'border-t border-gray-200 bg-white',
      'dark:border-gray-700 dark:bg-gray-900'
    )}>
      <ul className="flex h-16 items-stretch">
        {mobileItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <li key={item.key} className="flex flex-1">
              <NavLink
                to={item.path}
                className={clsx(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-navy-800 dark:text-accent-400'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                )}
              >
                {/* Indicateur actif au dessus */}
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-navy-800 dark:bg-accent-400" />
                )}
                <NavIcon
                  name={item.icon}
                  className={clsx(
                    'h-5 w-5',
                    isActive ? 'text-navy-800 dark:text-accent-400' : 'text-gray-400 dark:text-gray-500'
                  )}
                />
                <span className="leading-none truncate">{item.label.split(' ')[0]}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
