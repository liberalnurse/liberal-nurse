// Types complets pour l'application Liberal Nurse
// Exportation du type Role depuis utils/roles pour compatibilité
export type { Role } from '@/utils/roles'

// ─── Utilisateur ────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  role: import('@/utils/roles').Role
  cabinet_id: string
  rpps?: string
  phone?: string
  avatar_url?: string
  color?: string
  active: boolean
  created_at: string
  updated_at: string
}

// ─── Cabinet ────────────────────────────────────────────────────────────────

export interface Cabinet {
  id: string
  name: string
  address: string
  phone: string
  email?: string
  siret: string
  finess?: string
  plan: 'trial' | 'starter' | 'pro' | 'enterprise'
  plan_expires_at?: string
  settings?: Record<string, unknown>
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string
  cabinet_id: string
  last_name: string
  first_name: string
  birth_date?: string
  gender?: 'M' | 'F' | 'autre'
  address?: string
  city?: string
  postal_code?: string
  lat?: number
  lng?: number
  phone?: string
  phone_emergency?: string
  emergency_contact_name?: string
  nir?: string
  mutuelle?: string
  mutuelle_num?: string
  medecin_traitant?: string
  medecin_prescripteur?: string
  pathologies?: string[]
  allergies?: string[]
  notes?: string
  photo_url?: string
  active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ─── Visite / Tournée ────────────────────────────────────────────────────────

export interface Visit {
  id: string
  cabinet_id: string
  patient_id: string
  nurse_id: string
  date: string
  time_slot?: 'morning' | 'afternoon' | 'evening' | 'night'
  start_time?: string
  end_time?: string
  status: 'planned' | 'done' | 'cancelled' | 'absent'
  acte_codes?: string[]
  acte_labels?: string[]
  duration_minutes?: number
  notes?: string
  recurrence?: string
  created_at: string
  updated_at: string
}

// ─── Note de soins ───────────────────────────────────────────────────────────

export interface Constantes {
  tension_sys?: number
  tension_dia?: number
  pouls?: number
  temperature?: number
  spo2?: number
  glycemie?: number
  poids?: number
}

export interface SoinNote {
  id: string
  visit_id?: string
  patient_id: string
  cabinet_id: string
  nurse_id: string
  content: string
  constantes?: Constantes
  photos?: string[]
  signed_at?: string
  created_at: string
  updated_at: string
}

// ─── Transmission ────────────────────────────────────────────────────────────

export interface Transmission {
  id: string
  cabinet_id: string
  patient_id?: string
  author_id: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'general' | 'medical' | 'administrative' | 'urgent'
  read_by: string[]
  archived: boolean
  created_at: string
}

// ─── Message interne ─────────────────────────────────────────────────────────

export interface Message {
  id: string
  cabinet_id: string
  sender_id: string
  recipient_id?: string
  subject?: string
  content: string
  read: boolean
  read_at?: string
  created_at: string
}

// ─── Contrat de remplacement ─────────────────────────────────────────────────

export interface Contrat {
  id: string
  cabinet_id: string
  titulaire_id: string
  remplacante_id?: string
  remplacante_name?: string
  remplacante_rpps?: string
  date_debut: string
  date_fin: string
  retrocession: number
  honoraires_prevus?: number
  honoraires_realises?: number
  motif?: string
  statut: 'draft' | 'signed' | 'active' | 'terminated'
  document_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

// ─── Rétrocession ────────────────────────────────────────────────────────────

export interface Retrocession {
  id: string
  cabinet_id: string
  contrat_id?: string
  remplacante_id: string
  periode_debut: string
  periode_fin: string
  montant_brut: number
  montant_net: number
  taux: number
  statut: 'pending' | 'paid' | 'cancelled'
  reference_virement?: string
  paid_at?: string
  created_at: string
}

// ─── Stock ───────────────────────────────────────────────────────────────────

export interface StockItem {
  id: string
  cabinet_id: string
  name: string
  reference?: string
  barcode?: string
  category?: string
  quantity: number
  unit: string
  alert_threshold: number
  location?: string
  supplier?: string
  unit_price?: number
  qr_code?: string
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  cabinet_id: string
  item_id: string
  user_id?: string
  type: 'in' | 'out' | 'adjustment' | 'waste'
  quantity: number
  note?: string
  created_at: string
}

// ─── Fiche de soins ──────────────────────────────────────────────────────────

export interface Acte {
  code: string
  libelle: string
  qte: number
  side?: string
}

export interface FicheSoins {
  id: string
  cabinet_id: string
  patient_id: string
  created_by?: string
  actes: Acte[]
  medecin_prescripteur?: string
  ordonnance_date?: string
  valid_until?: string
  numero_ordonnance?: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  cabinet_id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  link?: string
  data?: Record<string, unknown>
  created_at: string
}

// ─── Plaie ───────────────────────────────────────────────────────────────────

export interface Plaie {
  id: string
  cabinet_id: string
  patient_id: string
  nurse_id: string
  localisation: string
  type_plaie?: string
  surface_cm2?: number
  profondeur?: number
  aspect?: string
  odeur?: string
  exsudat?: string
  photos?: string[]
  notes?: string
  statut: 'active' | 'healing' | 'closed'
  created_at: string
  updated_at: string
}

// ─── SMS ─────────────────────────────────────────────────────────────────────

export interface SMS {
  id: string
  cabinet_id: string
  patient_id?: string
  phone_number: string
  content: string
  status: 'pending' | 'sent' | 'failed'
  sent_at?: string
  created_at: string
}
