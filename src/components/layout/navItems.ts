import type { Module } from '@/utils/roles'

export interface NavItem {
  key: string
  label: string
  shortLabel?: string   // libellé court pour la BottomNav mobile
  path: string
  module: Module
  icon: string          // nom d'icône Heroicons (on les embed inline)
  mobileOrder?: number  // ordre dans BottomNav (1-6 = visible, undefined = masqué)
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',      label: 'Tableau de bord',  shortLabel: 'Accueil',   path: '/dashboard',      module: 'dashboard',      icon: 'home',                      mobileOrder: 1 },
  { key: 'patients',       label: 'Patients',                                   path: '/patients',       module: 'patients',       icon: 'users',                     mobileOrder: 2 },
  { key: 'transmissions',  label: 'Transmissions',    shortLabel: 'Transmis.', path: '/transmissions',  module: 'transmissions',  icon: 'chat-bubble-left-right',    mobileOrder: 3 },
  { key: 'itineraire',     label: 'Itinéraire',       shortLabel: 'Suivi',     path: '/itineraire',     module: 'itineraire',     icon: 'map',                       mobileOrder: 4 },
  { key: 'planning',       label: 'Planning',                                   path: '/planning',       module: 'planning',       icon: 'calendar',                  mobileOrder: 5 },
  { key: 'securite',       label: 'Sécurité',         shortLabel: 'Profil',    path: '/securite',       module: 'securite',       icon: 'shield-check',              mobileOrder: 6 },
  { key: 'soins',          label: 'Notes de soins',                             path: '/soins',          module: 'soins',          icon: 'clipboard' },
  { key: 'sms',            label: 'SMS',                                        path: '/sms',            module: 'sms',            icon: 'device-phone-mobile' },
  { key: 'messagerie',     label: 'Messagerie',                                 path: '/messagerie',     module: 'messagerie',     icon: 'envelope' },
  { key: 'contrats',       label: 'Contrats',                                   path: '/contrats',       module: 'contrats',       icon: 'document-text' },
  { key: 'retrocessions',  label: 'Rétrocessions',                              path: '/retrocessions',  module: 'retrocessions',  icon: 'banknotes' },
  { key: 'remplacantes',   label: 'Remplaçantes',                               path: '/remplacantes',   module: 'remplacantes',   icon: 'user-group' },
  { key: 'secretaire',     label: 'Secrétariat',                                path: '/secretaire',     module: 'secretaire',     icon: 'briefcase' },
  { key: 'statistiques',   label: 'Statistiques',                               path: '/statistiques',   module: 'statistiques',   icon: 'chart-bar' },
  { key: 'stock',          label: 'Stock matériel',                             path: '/stock',          module: 'stock',          icon: 'archive-box' },
  { key: 'fiches',         label: 'Fiches soins',                               path: '/fiches',         module: 'fiches',         icon: 'document-duplicate' },
  { key: 'facturation',    label: 'Facturation',                                path: '/facturation',    module: 'facturation',    icon: 'credit-card' },
  { key: 'notifications',  label: 'Notifications',                              path: '/notifications',  module: 'notifications',  icon: 'bell' },
  { key: 'admin',          label: 'Administration',                             path: '/admin',          module: 'admin',          icon: 'cog-6-tooth' },
]
