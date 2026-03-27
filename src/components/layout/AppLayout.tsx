import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar navy */}
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenu */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={0}
        />

        {/* Scrollable — padding bottom pour BottomNav sur mobile */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile uniquement */}
      <BottomNav />
    </div>
  )
}
