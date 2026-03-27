// Administration du cabinet : infos, utilisateurs, paramètres
import { useState } from 'react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import type { User } from '@/types'
import type { Role } from '@/utils/roles'

// ─── Données mockées ─────────────────────────────────────────────────────────

const mockUsers: (User & { active: boolean })[] = [
  { id: '1', email: 'titulaire@cabinet.fr',    full_name: 'Sophie Laurent',   role: 'titulaire',    cabinet_id: 'c1', phone: '06 11 22 33 44', active: true,  created_at: '', updated_at: '' },
  { id: '2', email: 'collab@cabinet.fr',       full_name: 'Marie Carmier',    role: 'collaboratrice', cabinet_id: 'c1', phone: '06 55 66 77 88', active: true, created_at: '', updated_at: '' },
  { id: '3', email: 'rempl@email.fr',          full_name: 'Laura Petit',      role: 'remplacante',  cabinet_id: 'c1', active: true,  created_at: '', updated_at: '' },
  { id: '4', email: 'stagiaire@email.fr',      full_name: 'Emma Dubois',      role: 'stagiaire',    cabinet_id: 'c1', active: false, created_at: '', updated_at: '' },
]

const roleLabels: Record<Role, string> = {
  admin:              'Administrateur',
  titulaire:          'Titulaire',
  collaboratrice:     'Collaboratrice',
  remplacante:        'Remplaçante',
  stagiaire:          'Stagiaire',
  coordinatrice_had:  'Coordinatrice HAD',
  secretaire:         'Secrétaire',
  medecin_partenaire: 'Médecin partenaire',
}

const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }))

type Onglet = 'cabinet' | 'utilisateurs' | 'parametres' | 'danger'

export default function AdminPage() {
  const { cabinet } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const [onglet, setOnglet] = useState<Onglet>('cabinet')
  const [users, setUsers] = useState(mockUsers)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('collaboratrice')
  const [cabinetForm, setCabinetForm] = useState({
    name:    cabinet?.name    ?? 'Cabinet Infirmier Lyon Centre',
    address: cabinet?.address ?? '15 rue de la République, 69001 Lyon',
    phone:   cabinet?.phone   ?? '04 78 12 34 56',
    siret:   cabinet?.siret   ?? '123 456 789 00012',
    finess:  cabinet?.finess  ?? '690123456',
  })

  const onglets: { key: Onglet; label: string }[] = [
    { key: 'cabinet',      label: 'Infos cabinet' },
    { key: 'utilisateurs', label: 'Utilisateurs' },
    { key: 'parametres',   label: 'Paramètres' },
    { key: 'danger',       label: 'Zone dangereuse' },
  ]

  const handleInvite = () => {
    if (!inviteEmail) { addToast('E-mail obligatoire', 'error'); return }
    addToast(`Invitation envoyée à ${inviteEmail}`, 'success')
    setShowInvite(false)
    setInviteEmail('')
  }

  const handleToggleActive = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !u.active } : u))
    addToast('Utilisateur mis à jour', 'success')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Administration" subtitle="Gérez votre cabinet et vos utilisateurs" />

      {/* Onglets */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {onglets.map((o) => (
            <button
              key={o.key}
              onClick={() => setOnglet(o.key)}
              className={clsx(
                'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                onglet === o.key
                  ? 'border-navy-700 text-navy-700 dark:border-navy-400 dark:text-navy-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400',
                o.key === 'danger' && 'text-red-500 hover:text-red-600 dark:text-red-400'
              )}
            >
              {o.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Infos cabinet ──────────────────────────────────────────────── */}
      {onglet === 'cabinet' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-navy-900 dark:text-white">Informations du cabinet</h2></CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nom du cabinet" value={cabinetForm.name} onChange={(e) => setCabinetForm((f) => ({ ...f, name: e.target.value }))} className="sm:col-span-2" />
            <Input label="Adresse" value={cabinetForm.address} onChange={(e) => setCabinetForm((f) => ({ ...f, address: e.target.value }))} className="sm:col-span-2" />
            <Input label="Téléphone" value={cabinetForm.phone} onChange={(e) => setCabinetForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="SIRET" value={cabinetForm.siret} onChange={(e) => setCabinetForm((f) => ({ ...f, siret: e.target.value }))} />
            <Input label="N° FINESS" value={cabinetForm.finess} onChange={(e) => setCabinetForm((f) => ({ ...f, finess: e.target.value }))} />
            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={() => addToast('Modifications enregistrées', 'success')}>Enregistrer</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─── Utilisateurs ───────────────────────────────────────────────── */}
      {onglet === 'utilisateurs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowInvite(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Inviter un utilisateur
            </Button>
          </div>
          <Card>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                    {u.full_name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
                    {roleLabels[u.role as Role] ?? u.role}
                  </span>
                  <span className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    u.active ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}>
                    {u.active ? 'Actif' : 'Inactif'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(u.id)}
                    className="text-xs text-navy-600 hover:underline dark:text-navy-400"
                  >
                    {u.active ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─── Paramètres ────────────────────────────────────────────────── */}
      {onglet === 'parametres' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="font-semibold text-navy-900 dark:text-white">Notifications</h2></CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Notifications e-mail pour les transmissions urgentes', key: 'email_urgent' },
                { label: 'Résumé quotidien par e-mail', key: 'email_daily' },
                { label: 'Alertes stock par e-mail', key: 'email_stock' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-navy-700" />
                </label>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold text-navy-900 dark:text-white">Fuseau horaire</h2></CardHeader>
            <CardBody>
              <Select
                label="Fuseau horaire"
                options={[{ value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' }]}
                defaultValue="Europe/Paris"
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── Zone dangereuse ───────────────────────────────────────────── */}
      {onglet === 'danger' && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <h2 className="font-semibold text-red-600 dark:text-red-400">Zone dangereuse</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="font-semibold text-red-700 dark:text-red-400">Supprimer le cabinet</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                Cette action est irréversible. Toutes les données seront définitivement supprimées.
              </p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => addToast('Action désactivée en mode démo', 'warning')}>
                Supprimer le cabinet
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal invitation */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Inviter un utilisateur" size="sm">
        <ModalBody className="space-y-4">
          <Input label="E-mail" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <Select
            label="Rôle"
            options={roleOptions}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowInvite(false)}>Annuler</Button>
          <Button onClick={handleInvite}>Envoyer l'invitation</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
