// Gestion des infirmières remplaçantes
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

interface Remplacante {
  id: string
  name: string
  rpps: string
  phone: string
  email: string
  disponible: boolean
  taux_habituel: number
  missions_count: number
  derniere_mission: string
}

const mockRemplacantes: Remplacante[] = [
  { id: '1', name: 'Julie Morin',   rpps: '10012345', phone: '06 11 22 33 44', email: 'julie.morin@email.fr',   disponible: true,  taux_habituel: 70, missions_count: 5, derniere_mission: '2024-02-15' },
  { id: '2', name: 'Emma Petit',    rpps: '10023456', phone: '06 22 33 44 55', email: 'emma.petit@email.fr',    disponible: false, taux_habituel: 65, missions_count: 3, derniere_mission: '2024-03-17' },
  { id: '3', name: 'Clara Bernard', rpps: '10034567', phone: '07 33 44 55 66', email: 'clara.bernard@email.fr', disponible: true,  taux_habituel: 68, missions_count: 1, derniere_mission: '2024-01-20' },
]

export default function RemplacantesPage() {
  const [remplacantes] = useState(mockRemplacantes)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = remplacantes.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.rpps.includes(search)
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Remplaçantes"
        subtitle={`${remplacantes.length} infirmière${remplacantes.length > 1 ? 's' : ''} référencée${remplacantes.length > 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder="Rechercher par nom ou RPPS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          }
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune remplaçante"
          description="Ajoutez vos infirmières remplaçantes habituelles."
          action={{ label: 'Ajouter une remplaçante', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} variant="hover">
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-100 text-lg font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                    {r.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{r.name}</p>
                    <p className="text-xs text-gray-400">RPPS {r.rpps}</p>
                  </div>
                  <span className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    r.disponible
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}>
                    {r.disponible ? 'Disponible' : 'En mission'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    {r.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    <span className="truncate">{r.email}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Taux habituel</span>
                  <span className="font-semibold text-navy-700 dark:text-navy-300">{r.taux_habituel} %</span>
                </div>
                <p className="text-xs text-gray-400">
                  {r.missions_count} mission{r.missions_count > 1 ? 's' : ''} · Dernière : {new Intl.DateTimeFormat('fr-FR').format(new Date(r.derniere_mission))}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Ajouter une remplaçante">
        <div className="space-y-4">
          <Input label="Nom complet" placeholder="Prénom Nom" />
          <Input label="N° RPPS" placeholder="10 chiffres" />
          <Input label="Téléphone" placeholder="06 XX XX XX XX" />
          <Input label="Email" type="email" placeholder="email@exemple.fr" />
          <Input label="Taux de rétrocession habituel (%)" type="number" placeholder="70" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={() => setShowModal(false)}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
