import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/store/authStore'
import { ROLE_LABELS } from '@/utils/roles'
import { NAV_ITEMS } from './navItems'
import { NavIcon } from './NavIcon'
import { ThemeToggle } from './ThemeToggle'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { canAccess, role } = useRole()
  const { user, signOut } = useAuthStore()
  const location = useLocation()

  // When role isn't loaded yet, show all items (profile loads async after hard redirect).
  // RLS on Supabase protects the actual data — showing the links is harmless.
  const visibleItems = NAV_ITEMS.filter((item) => !role || canAccess(item.module))

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — fond navy-800 en clair, navy-950 en sombre */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300',
          'bg-navy-800 dark:bg-navy-950',
          'lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[4.5rem]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex h-16 flex-shrink-0 items-center border-b border-navy-700 dark:border-navy-800',
          collapsed ? 'justify-center px-3' : 'justify-between px-4'
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold leading-none text-white">Liberal Nurse</p>
                <p className="mt-0.5 text-[10px] leading-none text-navy-300">Cabinet infirmier</p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Collapse toggle (desktop) */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-md p-1.5 text-navy-300 hover:bg-white/10 hover:text-white lg:flex"
              title={collapsed ? 'Agrandir' : 'Réduire'}
            >
              <NavIcon
                name="chevron-left"
                className={clsx('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')}
              />
            </button>
            {/* Fermeture mobile */}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-navy-300 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <NavIcon name="x-mark" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {visibleItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={clsx(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-navy-200 hover:bg-white/10 hover:text-white',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <NavIcon
                      name={item.icon}
                      className={clsx(
                        'h-5 w-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-navy-400 group-hover:text-white'
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {/* Indicateur actif */}
                    {isActive && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={clsx(
          'border-t border-navy-700 dark:border-navy-800 p-3',
          collapsed ? 'flex flex-col items-center gap-2' : 'space-y-1'
        )}>
          {/* Infos utilisateur */}
          {!collapsed && user && (
            <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                {user.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
                <p className="truncate text-xs text-navy-300">{role ? ROLE_LABELS[role] : ''}</p>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <div className={clsx(collapsed ? 'w-full flex justify-center' : '')}>
            <ThemeToggle compact={collapsed} />
          </div>

          {/* Déconnexion */}
          <button
            onClick={signOut}
            title="Déconnexion"
            className={clsx(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
              'text-navy-300 hover:bg-white/10 hover:text-white transition-colors',
              collapsed && 'justify-center px-2'
            )}
          >
            <NavIcon name="arrow-right-on-rectangle" className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
