export type Role =
  | 'admin'
  | 'titulaire'
  | 'collaboratrice'
  | 'remplacante'
  | 'stagiaire'
  | 'coordinatrice_had'
  | 'secretaire'
  | 'medecin_partenaire'

export type Module =
  | 'dashboard'
  | 'patients'
  | 'planning'
  | 'itineraire'
  | 'soins'
  | 'transmissions'
  | 'sms'
  | 'messagerie'
  | 'contrats'
  | 'retrocessions'
  | 'remplacantes'
  | 'secretaire'
  | 'statistiques'
  | 'notifications'
  | 'securite'
  | 'stock'
  | 'fiches'
  | 'facturation'
  | 'admin'

type Permission = 'read' | 'write' | 'delete' | 'admin'

type PermissionMatrix = Record<Role, Partial<Record<Module, Permission[]>>>

export const PERMISSIONS: PermissionMatrix = {
  admin: {
    dashboard: ['read', 'write', 'delete', 'admin'],
    patients: ['read', 'write', 'delete', 'admin'],
    planning: ['read', 'write', 'delete', 'admin'],
    itineraire: ['read', 'write', 'delete', 'admin'],
    soins: ['read', 'write', 'delete', 'admin'],
    transmissions: ['read', 'write', 'delete', 'admin'],
    sms: ['read', 'write', 'delete', 'admin'],
    messagerie: ['read', 'write', 'delete', 'admin'],
    contrats: ['read', 'write', 'delete', 'admin'],
    retrocessions: ['read', 'write', 'delete', 'admin'],
    remplacantes: ['read', 'write', 'delete', 'admin'],
    secretaire: ['read', 'write', 'delete', 'admin'],
    statistiques: ['read', 'write', 'delete', 'admin'],
    notifications: ['read', 'write', 'delete', 'admin'],
    securite: ['read', 'write', 'delete', 'admin'],
    stock: ['read', 'write', 'delete', 'admin'],
    fiches: ['read', 'write', 'delete', 'admin'],
    facturation: ['read', 'write', 'delete', 'admin'],
    admin: ['read', 'write', 'delete', 'admin'],
  },
  titulaire: {
    dashboard: ['read', 'write'],
    patients: ['read', 'write', 'delete'],
    planning: ['read', 'write', 'delete'],
    itineraire: ['read', 'write'],
    soins: ['read', 'write', 'delete'],
    transmissions: ['read', 'write'],
    sms: ['read', 'write'],
    messagerie: ['read', 'write'],
    contrats: ['read', 'write', 'delete'],
    retrocessions: ['read', 'write'],
    remplacantes: ['read', 'write', 'delete'],
    secretaire: ['read', 'write'],
    statistiques: ['read'],
    notifications: ['read', 'write'],
    securite: ['read', 'write'],
    stock: ['read', 'write', 'delete'],
    fiches: ['read', 'write'],
    facturation: ['read', 'write'],
  },
  collaboratrice: {
    dashboard: ['read'],
    patients: ['read', 'write'],
    planning: ['read', 'write'],
    itineraire: ['read', 'write'],
    soins: ['read', 'write'],
    transmissions: ['read', 'write'],
    sms: ['read', 'write'],
    messagerie: ['read', 'write'],
    notifications: ['read'],
    stock: ['read', 'write'],
    fiches: ['read', 'write'],
  },
  remplacante: {
    dashboard: ['read'],
    patients: ['read'],
    planning: ['read'],
    itineraire: ['read', 'write'],
    soins: ['read', 'write'],
    transmissions: ['read', 'write'],
    messagerie: ['read', 'write'],
    notifications: ['read'],
    fiches: ['read', 'write'],
  },
  stagiaire: {
    dashboard: ['read'],
    patients: ['read'],
    planning: ['read'],
    itineraire: ['read'],
    soins: ['read'],
    transmissions: ['read'],
    notifications: ['read'],
    fiches: ['read'],
  },
  coordinatrice_had: {
    dashboard: ['read'],
    patients: ['read', 'write'],
    planning: ['read', 'write'],
    soins: ['read', 'write'],
    transmissions: ['read', 'write'],
    messagerie: ['read', 'write'],
    notifications: ['read'],
    fiches: ['read', 'write'],
  },
  secretaire: {
    dashboard: ['read'],
    patients: ['read', 'write'],
    planning: ['read', 'write'],
    sms: ['read', 'write'],
    messagerie: ['read', 'write'],
    secretaire: ['read', 'write'],
    notifications: ['read'],
  },
  medecin_partenaire: {
    patients: ['read'],
    soins: ['read'],
    transmissions: ['read'],
    fiches: ['read'],
  },
}

export function hasPermission(
  role: Role,
  module: Module,
  permission: Permission
): boolean {
  return PERMISSIONS[role]?.[module]?.includes(permission) ?? false
}

export function canAccess(role: Role, module: Module): boolean {
  return (PERMISSIONS[role]?.[module]?.length ?? 0) > 0
}

export const ROLE_LABELS: Record<Role, string> = {
  admin:              'Administrateur',
  titulaire:          'Infirmière titulaire',
  collaboratrice:     'Collaboratrice',
  remplacante:        'Remplaçante',
  stagiaire:          'Stagiaire',
  coordinatrice_had:  'Coordinatrice HAD',
  secretaire:         'Secrétaire',
  medecin_partenaire: 'Médecin partenaire',
}

export const ROLE_COLORS: Record<Role, string> = {
  admin:              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  titulaire:          'bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-200',
  collaboratrice:     'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  remplacante:        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  stagiaire:          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  coordinatrice_had:  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  secretaire:         'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medecin_partenaire: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
}
