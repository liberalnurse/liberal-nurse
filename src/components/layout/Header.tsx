import { useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { NavIcon } from './NavIcon'
import { ThemeToggle } from './ThemeToggle'
import { NAV_ITEMS } from './navItems'
import { useAuthStore } from '@/store/authStore'

interface HeaderProps {
  onMenuClick: () => void
  notificationCount?: number
}

export function Header({ onMenuClick, notificationCount = 0 }: HeaderProps) {
  const location = useLocation()
  const user    = useAuthStore((s) => s.user)
  const cabinet = useAuthStore((s) => s.cabinet)

  const currentItem = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path)
  )
  const pageTitle = currentItem?.label ?? 'Liberal Nurse'

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className={clsx(
      'flex h-16 flex-shrink-0 items-center justify-between px-4',
      'border-b border-gray-200 bg-white shadow-sm',
      'dark:border-gray-700 dark:bg-gray-900'
    )}>
      {/* Gauche : burger + titre page + nom cabinet */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden flex-shrink-0"
          aria-label="Menu"
        >
          <NavIcon name="menu" className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-navy-800 dark:text-white leading-none truncate">
            {pageTitle}
          </h1>
          {cabinet?.name && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 leading-none truncate">
              {cabinet.name}
            </p>
          )}
        </div>
      </div>

      {/* Droite : theme toggle + notifications + avatar */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Switch thème */}
        <ThemeToggle compact />

        {/* Séparateur */}
        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Cloche notifications */}
        <button
          className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <NavIcon name="bell" className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Séparateur */}
        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Avatar + nom */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-800 dark:bg-navy-600 text-xs font-bold text-white select-none overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {user?.full_name && (
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-none">{user.full_name}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
