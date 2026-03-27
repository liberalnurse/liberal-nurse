// Fiches de soins (ordonnances infirmières)
import { useState } from 'react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

interface FicheItem {
  id: string
  patient: string
  patient_id: string
  medecin: string
  actes: { code: string; libelle: string; qte: number }[]
  date_ordonnance: string
  valid_until: string
  active: boolean
}

const mockFiches: FicheItem[] = [
  {
    id: '1', patient: 'Marie Dupont', patient_id: '1',
    medecin: 'Dr. Leclerc',
    actes: [{ code: 'AMI2', libelle: 'Pansement complexe', qte: 14 }, { code: 'MAU', libelle: 'Majoration urgence', qte: 2 }],
    date_ordonnance: '2024-01-01', valid_until: '2024-03-31', active: true,
  },
  {
    id: '2', patient: 'Jean Martin', patient_id: '2',
    medecin: 'Dr. Rousseau',
    actes: [{ code: 'AIS1', libelle: 'Injection sous-cutanée', qte: 30 }],
    date_ordonnance: '2024-01-10', valid_until: '2024-04-10', active: true,
  },
  {
    id: '3', patient: 'Paulette Renard', patient_id: '3',
    medecin: 'Dr. Moreau',
    actes: [{ code: 'AMI3', libelle: 'Pansement très complexe', qte: 10 }, { code: 'IPA', libelle: 'Soins nursing lourds', qte: 10 }],
    date_ordonnance: '2023-10-01', valid_until: '2024-01-01', active: false,
  },
  {
    id: '4', patient: 'Henri Leblanc', patient_id: '4',
    medecin: 'Dr. Leclerc',
    actes: [{ code: 'AMI1', libelle: 'Pansement simple', qte: 7 }],
    date_ordonnance: '2024-01-15', valid_until: '2024-02-15', active: true,
  },
]

export default function FichesSoinsPage() {
  const navigate = useNavigate()
  const [fiches] = useState(mockFiches)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [showModal, setShowModal] = useState(false)

  const filtered = fiches.filter((f) => {
    const matchSearch = !search || f.patient.toLowerCase().includes(search.toLowerCase()) || f.medecin.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' && f.active) || (filter === 'expired' && !f.active)
    return matchSearch && matchFilter
  })

  const fmt = (d: string) => new Intl.DateTimeFormat('fr-FR').format(new Date(d))

  const isExpiringSoon = (d: string) => {
    const diff = new Date(d).getTime() - Date.now()
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fiches de soins"
        subtitle={`${fiches.filter((f) => f.active).length} fiche${fiches.filter((f) => f.active).length > 1 ? 's' : ''} active${fiches.filter((f) => f.active).length > 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle fiche
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par patient ou médecin..."
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
          {(['all', 'active', 'expired'] as const).map((f) => (
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
              {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'Expirées'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune fiche de soins"
          description="Créez une fiche de soins à partir d'une ordonnance."
          action={{ label: 'Nouvelle fiche', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((fiche) => {
            const expiring = fiche.active && isExpiringSoon(fiche.valid_until)
            return (
              <Card key={fiche.id} variant="hover" className={clsx(!fiche.active && 'opacity-70')}>
                <CardHeader>
                  <div>
                    <button
                      onClick={() => navigate(`/patients/${fiche.patient_id}`)}
                      className="font-semibold text-navy-900 hover:underline dark:text-white"
                    >
                      {fiche.patient}
                    </button>
                    <p className="text-xs text-gray-400">{fiche.medecin}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      fiche.active
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {fiche.active ? 'Active' : 'Expirée'}
                    </span>
                    {expiring && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                        Expire bientôt
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="space-y-1">
                    {fiche.actes.map((acte, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-800">
                        <span className="rounded bg-navy-100 px-1.5 py-0.5 text-xs font-mono font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                          {acte.code}
                        </span>
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{acte.libelle}</span>
                        <span className="text-xs text-gray-400">× {acte.qte}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Prescrit le {fmt(fiche.date_ordonnance)}</span>
                    <span>Valide jusqu'au {fmt(fiche.valid_until)}</span>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvelle fiche de soins">
        <div className="space-y-4">
          <Input label="Patient" placeholder="Nom du patient" />
          <Input label="Médecin prescripteur" placeholder="Dr. Nom" />
          <Input label="Date de l'ordonnance" type="date" />
          <Input label="Valide jusqu'au" type="date" />
          <Input label="N° ordonnance (optionnel)" placeholder="Référence ordonnance" />
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actes</p>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Code (ex: AMI2)" />
              <Input placeholder="Libellé" />
              <Input placeholder="Qté" type="number" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={() => setShowModal(false)}>Créer la fiche</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
