import type { ReactNode } from 'react'
import { useRole } from '@/hooks/useRole'
import type { Module } from '@/utils/roles'

interface RoleGuardProps {
  module: Module
  permission?: 'read' | 'write' | 'delete' | 'admin'
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGuard({
  module,
  permission = 'read',
  fallback = null,
  children,
}: RoleGuardProps) {
  const { can } = useRole()

  if (!can(module, permission)) return <>{fallback}</>
  return <>{children}</>
}
