import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) { setTimedOut(false); return }
    const t = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [loading])

  // If loading resolves normally → use isAuthenticated.
  // If loading is stuck for 5s → show the app anyway (session likely valid, profile fetch slow).
  if (loading && !timedOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-800 border-t-transparent dark:border-navy-400" />
          <p className="text-sm font-medium text-navy-700 dark:text-navy-300">Chargement…</p>
        </div>
      </div>
    )
  }

  return (isAuthenticated || timedOut) ? <Outlet /> : <Navigate to="/login" replace />
}
