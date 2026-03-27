// Page transmissions — liste + création
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardBody } from '@/components/ui/Card'

type Priority = 'low' | 'normal' | 'high' | 'urgent'

interface TransmissionItem {
  id: string
  content: string
  priority: Priority
  category: string
  author: string
  patient?: string
  time: string
  read: boolean
}

const mockTransmissions: TransmissionItem[] = [
  { id: '1', content: 'Patient Dupont : pression artérielle très élevée ce matin, 165/95. À surveiller étroitement.', priority: 'urgent', category: 'medical', author: 'Sophie L.', patient: 'Marie Dupont', time: 'Il y a 1h', read: false },
  { id: '2', content: 'Renouvellement ordonnance à prévoir pour Henri Leblanc — ordonnance expire le 31/01.', priority: 'high', category: 'administrative', author: 'Marie D.', patient: 'Henri Leblanc', time: 'Il y a 3h', read: false },
  { id: '3', content: 'RAS pour la tournée du matin. Tous les patients vus, bonne humeur générale.', priority: 'normal', category: 'general', author: 'Sophie L.', time: 'Il y a 4h', read: true },
  { id: '4', content: 'Visite annulée : Colette Simon hospitalisée au CHU Lyon-Sud. Contact famille effectué.', priority: 'high', category: 'medical', author: 'Marie D.', patient: 'Colette Simon', time: 'Hier', read: true },
  { id: '5', content: 'Stock seringues 5mL presque épuisé (3 boîtes restantes). Commande à lancer.', priority: 'normal', category: 'general', author: 'Anne B.', time: 'Hier', read: true },
  { id: '6', content: 'Nouveau patient admis : Pierre Bernard, suivi diabète type 2 + HTA.', priority: 'normal', category: 'medical', author: 'Sophie L.', patient: 'Pierre Bernard', time: 'Il y a 2 jours', read: true },
]

const priorityConfig: Record<Priority, { label: string; badge: string }> = {
  urgent: { label: 'Urgent',  badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  high:   { label: 'Élevée', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  normal: { label: 'Normal', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  low:    { label: 'Basse',  badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export default function TransmissionsPage() {
  const [transmissions, setTransmissions] = useState(mockTransmissions)
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ content: '', priority: 'normal' as Priority, category: 'general', patient: '' })

  const filtered = transmissions.filter((t) => {
    if (filter === 'unread' && t.read) return false
    if (filter === 'urgent' && t.priority !== 'urgent') return false
    if (search && !t.content.toLowerCase().includes(search.toLowerCase()) && !t.patient?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const unreadCount = transmissions.filter((t) => !t.read).length

  const handleMarkRead = (id: string) => {
    setTransmissions((prev) => prev.map((t) => t.id === id ? { ...t, read: true } : t))
  }

  const handleMarkAllRead = () => {
    setTransmissions((prev) => prev.map((t) => ({ ...t, read: true })))
  }

  const handleSubmit = () => {
    const newT: TransmissionItem = {
      id: String(Date.now()),
      content: form.content,
      priority: form.priority,
      category: form.category,
      author: 'Moi',
      patient: form.patient || undefined,
      time: "À l'instant",
      read: false,
    }
    setTransmissions((prev) => [newT, ...prev])
    setShowModal(false)
    setForm({ content: '', priority: 'normal', category: 'general', patient: '' })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transmissions"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout lu'}
        actions={
          <>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                Tout marquer lu
              </Button>
            )}
            <Button onClick={() => setShowModal(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouvelle transmission
            </Button>
          </>
        }
      />

      {/* Filtres + recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            }
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'unread', 'urgent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium transition-colors dark:border-gray-700',
                filter === f
                  ? 'bg-navy-800 text-white dark:bg-navy-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {f === 'all' ? 'Toutes' : f === 'unread' ? 'Non lues' : 'Urgentes'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune transmission"
          description="Modifiez vos filtres ou créez une nouvelle transmission."
          action={{ label: 'Nouvelle transmission', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const pc = priorityConfig[t.priority]
            return (
              <Card key={t.id} className={clsx(!t.read && 'border-l-4 border-l-navy-500 dark:border-l-navy-400')}>
                <CardBody className="flex gap-3">
                  <span className={clsx('mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', pc.badge)}>
                    {pc.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={clsx('text-sm text-gray-700 dark:text-gray-300', !t.read && 'font-medium')}>{t.content}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                      <span>{t.author}</span>
                      {t.patient && <span>· {t.patient}</span>}
                      <span>· {t.time}</span>
                    </div>
                  </div>
                  {!t.read && (
                    <button
                      onClick={() => handleMarkRead(t.id)}
                      className="shrink-0 text-xs text-navy-600 hover:underline dark:text-navy-400"
                    >
                      Marquer lu
                    </button>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal nouvelle transmission */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nouvelle transmission"
      >
        <div className="space-y-4">
          <Textarea
            label="Contenu"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            placeholder="Décrivez la transmission..."
          />
          <Select
            label="Priorité"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            options={[
              { value: 'low', label: 'Basse' },
              { value: 'normal', label: 'Normale' },
              { value: 'high', label: 'Élevée' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
          <Select
            label="Catégorie"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: 'general', label: 'Général' },
              { value: 'medical', label: 'Médical' },
              { value: 'administrative', label: 'Administratif' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
          <Input
            label="Patient (optionnel)"
            value={form.patient}
            onChange={(e) => setForm({ ...form, patient: e.target.value })}
            placeholder="Nom du patient..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.content.trim()}>Envoyer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
