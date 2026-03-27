import { useAuthStore } from '@/store/authStore'
import { hasPermission, canAccess } from '@/utils/roles'
import type { Module } from '@/utils/roles'

export function useRole() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  return {
    role,
    can: (module: Module, permission: 'read' | 'write' | 'delete' | 'admin') =>
      role ? hasPermission(role, module, permission) : false,
    canAccess: (module: Module) =>
      role ? canAccess(role, module) : false,
    isAdmin: role === 'admin',
    isTitulaire: role === 'titulaire',
  }
}
